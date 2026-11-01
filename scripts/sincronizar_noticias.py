"""
«Noticias»: titulares de Marvel y DC recogidos de los RSS públicos de medios de cine y cómics.

- Solo se guarda el titular, un resumen corto (como mucho RESUMEN_MAX caracteres) y el enlace a la noticia
  original, como cualquier agregador: no se copia el texto completo ni las imágenes.
- Cada noticia se clasifica por universo (marvel, dc o ambos) con palabras clave; las que no hablan de ninguno
  se descartan.
- Versión española: fuentes en español; versión inglesa: fuentes en inglés.
- Se conservan las noticias de los últimos DIAS días (como mucho MAXIMO por idioma), aunque ya no estén en el RSS.

Lo ejecuta cada día GitHub Actions (.github/workflows/noticias.yml).
Uso:
    python scripts/sincronizar_noticias.py
Salida: datos/noticias.json
"""
import datetime
import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / 'datos' / 'noticias.json'
DIAS = 30
MAXIMO = 200
RESUMEN_MAX = 220
AGENTE = 'Mozilla/5.0 (compatible; HerotecaBot/1.0; +https://heroteca.vercel.app)'

FUENTES = {
    'es': {
        'CinemasComics': 'https://www.cinemascomics.com/feed/',
        'Espinof': 'https://www.espinof.com/index.xml',
        'Fotogramas': 'https://www.fotogramas.es/rss/all.xml/',
        'SensaCine': 'https://www.sensacine.com/rss/noticias-cine.xml',
        'La Casa de EL': 'https://www.lacasadeel.net/feed',
    },
    'en': {
        'ComicBook.com': 'https://comicbook.com/feed/rss/',
        'SuperHeroHype': 'https://www.superherohype.com/feed',
        'Collider': 'https://collider.com/feed/',
        'Screen Rant': 'https://screenrant.com/feed/',
    },
}

# Palabras clave de cada universo (sin distinguir mayúsculas; se buscan como palabras completas)
CLAVES = {
    'marvel': [
        'marvel', 'mcu', 'ucm', 'vengadores', 'avengers', 'x-men', 'spider-man', 'spiderman', 'spider-verse', 'deadpool',
        'wolverine', 'lobezno', 'iron man', 'thor', 'loki', 'hulk', 'she-hulk', 'daredevil', 'venom', 'capitán américa',
        'capitan america', 'captain america', 'black panther', 'pantera negra', 'doctor strange', 'fantastic four',
        'cuatro fantásticos', '4 fantásticos', 'thunderbolts', 'blade', 'punisher', 'castigador', 'kevin feige',
        'guardianes de la galaxia', 'guardians of the galaxy', 'wanda', 'visionquest', 'ironheart', 'wonder man',
        'moon knight', 'caballero luna', 'ms. marvel', 'capitana marvel', 'captain marvel', 'doctor doom', 'doctor muerte',
        'kang', 'thanos', 'secret wars', 'doomsday', 'agatha', 'eternals', 'shang-chi', 'ant-man', 'hawkeye', 'ojo de halcón',
        'kraven', 'morbius', 'madame web', 'mutantes', 'mutants',
    ],
    'dc': [
        'dc studios', 'dcu', 'dceu', 'dc comics', 'batman', 'superman', 'wonder woman', 'joker', 'aquaman', 'the flash',
        'green lantern', 'linterna verde', 'lanterns', 'supergirl', 'peacemaker', 'el pacificador', 'clayface',
        'harley quinn', 'gotham', 'the penguin', 'el pingüino', 'shazam', 'black adam', 'justice league',
        'liga de la justicia', 'constantine', 'man of tomorrow', 'hombre del mañana', 'the batman', 'robin', 'nightwing',
        'catwoman', 'lex luthor', 'creature commandos', 'suicide squad', 'escuadrón suicida', 'blue beetle', 'swamp thing',
        'la cosa del pantano', 'booster gold', 'sandman', 'dynamic duo', 'batgirl', 'krypto', 'brainiac', 'darkseid',
    ],
}
PATRONES = {u: re.compile(r'(?<![\w-])(' + '|'.join(re.escape(c) for c in claves) + r')(?![\w-])', re.I) for u, claves in CLAVES.items()}
# «DC» suelto solo cuenta en el titular y en mayúsculas (para no confundirlo con otras siglas)
DC_SUELTO = re.compile(r'(?<![\w-])DC(?![\w-])')


def texto_limpio(s):
    s = re.sub(r'<[^>]+>', ' ', s or '')
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()


# Coletillas que algunos RSS añaden al resumen
COLETILLAS = [
    re.compile(r'^\s*Esta noticia es una publicación original de \S+\s*', re.I),
    re.compile(r'\s*The post .*? appeared first on .*?\.?\s*$', re.I),
    re.compile(r'\s*La entrada .*? se publicó primero en .*?\.?\s*$', re.I),
    re.compile(r'\s*(Leer más|Read more|Continue reading).*$', re.I),
]


def sin_coletillas(s):
    for c in COLETILLAS:
        s = c.sub('', s)
    return s.strip()


def recortar(s, n=RESUMEN_MAX):
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0].rstrip(',;:.') + '…'


def fecha_iso(valor):
    if not valor:
        return None
    try:
        d = email.utils.parsedate_to_datetime(valor)
    except (TypeError, ValueError):
        try:
            d = datetime.datetime.fromisoformat(valor.replace('Z', '+00:00'))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=datetime.timezone.utc)
    return d.astimezone(datetime.timezone.utc).isoformat(timespec='minutes')


def leer_feed(url):
    peticion = urllib.request.Request(url, headers={'User-Agent': AGENTE})
    raiz = ET.fromstring(urllib.request.urlopen(peticion, timeout=20).read())
    items = []
    for it in raiz.iter():
        etiqueta = it.tag.split('}')[-1]
        if etiqueta not in ('item', 'entry'):
            continue
        campos = {c.tag.split('}')[-1]: c for c in it}
        titulo = texto_limpio(campos['title'].text if 'title' in campos else '')
        enlace = ''
        if 'link' in campos:
            enlace = (campos['link'].text or campos['link'].get('href') or '').strip()
        fecha = fecha_iso((campos.get('pubDate') if 'pubDate' in campos else campos.get('published') or campos.get('updated')).text
                          if any(k in campos for k in ('pubDate', 'published', 'updated')) else None)
        resumen = texto_limpio(campos['description'].text if 'description' in campos else (campos['summary'].text if 'summary' in campos else ''))
        if titulo and enlace.startswith('http'):
            items.append({'titulo': titulo, 'enlace': enlace, 'fecha': fecha, 'resumen': resumen})
    return items


def universos_de(titulo, resumen):
    """Universos de los que habla: por el titular, o por el resumen si lo menciona al menos dos veces."""
    salida = []
    for u, patron in PATRONES.items():
        en_titulo = bool(patron.search(titulo)) or (u == 'dc' and bool(DC_SUELTO.search(titulo)))
        if en_titulo or len(patron.findall(resumen)) >= 2:
            salida.append(u)
    return salida


def main():
    ahora = datetime.datetime.now(datetime.timezone.utc)
    limite = (ahora - datetime.timedelta(days=DIAS)).isoformat(timespec='minutes')
    previo = json.loads(DESTINO.read_text(encoding='utf-8')) if DESTINO.exists() else {}
    salida = {'fecha': ahora.isoformat(timespec='minutes')}
    for idioma, fuentes in FUENTES.items():
        por_enlace = {n['enlace']: {**n, 'resumen': recortar(sin_coletillas(n['resumen']))} for n in previo.get(idioma, [])}
        for nombre, url in fuentes.items():
            try:
                items = leer_feed(url)
            except Exception as e:  # una fuente caída no detiene el resto
                print(f'  {nombre}: no se pudo leer ({str(e)[:80]})', file=sys.stderr)
                continue
            nuevas = 0
            for it in items:
                universos = universos_de(it['titulo'], it['resumen'])
                if not universos or it['enlace'] in por_enlace:
                    continue
                por_enlace[it['enlace']] = {
                    'titulo': it['titulo'],
                    'enlace': it['enlace'],
                    'fuente': nombre,
                    'fecha': it['fecha'] or ahora.isoformat(timespec='minutes'),
                    'resumen': recortar(sin_coletillas(it['resumen'])),
                    'universos': universos,
                }
                nuevas += 1
            print(f'{idioma} · {nombre}: {len(items)} en el RSS, {nuevas} nuevas de Marvel/DC')
        lista = sorted((n for n in por_enlace.values() if n['fecha'] >= limite), key=lambda n: n['fecha'], reverse=True)[:MAXIMO]
        salida[idioma] = lista
        print(f'{idioma}: {len(lista)} noticias guardadas')
    DESTINO.write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()

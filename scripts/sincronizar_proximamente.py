"""
«Próximamente»: próximos estrenos de Marvel y DC (películas, series nuevas y temporadas nuevas)
y series en emisión con su próximo episodio, en español e inglés.

De dónde salen:
  - Películas y series con fecha futura de las productoras de cada universo (PRODUCTORAS).
  - Series que ya están en la colección y tienen un episodio programado (temporada nueva o en emisión).
Si un estreno ya tiene ficha en la colección, se enlaza con ella.
Cada estreno tiene su página en la web: su dirección (`ruta`) se fija la primera vez y no cambia aunque cambie el título.
Lo que deja de salir en la lista pasa a `archivo`, para que su página siga existiendo.

Se ejecuta cada semana desde GitHub Actions (.github/workflows/donde-ver.yml), junto con «Dónde ver».

Uso:
    .venv/Scripts/python.exe scripts/sincronizar_proximamente.py
Salida: datos/proximamente.json (también el archivo de los que ya no salen y las películas estrenadas en los últimos DIAS_EN_CINES días,
con su fecha de estreno en cines en España y EE. UU., para el bloque «En cines» de Novedades)
"""
import datetime
import json
import re
import sys
import unicodedata
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / 'datos' / 'proximamente.json'

# Productoras de TMDB de cada universo (/search/company). Añade aquí las que falten.
# Marvel Entertainment y Marvel Enterprises recogen las películas de Marvel de otros estudios (Sony: Spider-Verse, Venom…).
# No se incluyen Columbia ni Sony Pictures Animation: traerían muchas películas que no son de superhéroes.
PRODUCTORAS = {
    'marvel': {420: 'Marvel Studios', 13252: 'Marvel Animation', 38679: 'Marvel Television', 7505: 'Marvel Entertainment', 19551: 'Marvel Enterprises'},
    'dc': {184898: 'DC Studios', 9993: 'DC Entertainment', 128064: 'DC Films', 429: 'DC', 165407: 'DC Vertigo'},
}
IDIOMAS = {'es': 'es-ES', 'en': 'en-US'}
# Películas estrenadas hace poco que se siguen guardando (para «En cines» en Novedades)
DIAS_EN_CINES = 60
PAISES_CINE = ('ES', 'US')


def fechas_cine(id_):
    """Fecha de estreno en cines (tipos 2 y 3 de TMDB: limitado y general) en cada país, la más temprana."""
    datos = tmdb.get(f'/movie/{id_}/release_dates', refrescar=True, language=None) or {}
    salida = {}
    for r in datos.get('results') or []:
        if r.get('iso_3166_1') in PAISES_CINE:
            fechas = sorted(x['release_date'][:10] for x in r.get('release_dates') or [] if x.get('type') in (2, 3) and x.get('release_date'))
            if fechas:
                salida[r['iso_3166_1']] = fechas[0]
    return salida


def leer_ficha(archivo):
    m = re.match(r'^---\n(.*?)\n---', archivo.read_text(encoding='utf-8'), re.S)
    return yaml.safe_load(m.group(1)) if m else {}


def fichas_de_la_coleccion():
    """(tipo TMDB, id) → lista de (universo, id de ficha, temporada)."""
    fichas = {}
    for archivo in sorted((RAIZ / 'contenido' / 'titulos').glob('*/*/index.md')):
        d = leer_ficha(archivo)
        ref = d.get('tmdb')
        if ref:
            universo = archivo.parent.parent.name
            fichas.setdefault((ref['tipo'], ref['id']), []).append((universo, archivo.parent.name, d.get('temporada')))
    return fichas


def ficha_de(fichas, tipo, id_, temporada=None):
    """Ficha de la colección para ese título (y temporada, si es una serie)."""
    candidatas = fichas.get((tipo, id_), [])
    if temporada:
        exacta = [f for f in candidatas if f[2] == temporada]
        candidatas = exacta or [f for f in candidatas if not f[2]]
    return f'{candidatas[0][0]}/{candidatas[0][1]}' if candidatas else None


def trailer_de(tipo, id_, temporada, corto, idioma):
    """Tráiler o teaser oficial de YouTube, en ese idioma si lo hay. Solo oficiales: de lo no estrenado abundan los montajes de aficionados."""
    ruta = f'/tv/{id_}/season/{temporada}/videos' if temporada else f'/{tipo}/{id_}/videos'
    resultados = []
    for lengua in (idioma, None):
        resultados = (tmdb.get(ruta, refrescar=True, language=lengua) or {}).get('results') or []
        resultados = [v for v in resultados if v.get('site') == 'YouTube' and v.get('type') in ('Trailer', 'Teaser') and v.get('official')]
        if resultados:
            break
    resultados.sort(key=lambda v: (v.get('iso_639_1') != corto, v.get('type') != 'Trailer', v.get('published_at', '')))
    return resultados[0]['key'] if resultados else None


def textos_de(tipo, id_, temporada=None):
    """Título, sinopsis, imágenes y tráiler en cada idioma (la temporada, si tiene cartel propio)."""
    salida = {}
    for corto, idioma in IDIOMAS.items():
        x = tmdb.get(f'/{tipo}/{id_}', refrescar=True, language=idioma) or {}
        poster = x.get('poster_path')
        sinopsis = x.get('overview') or ''
        if temporada:
            t = next((s for s in x.get('seasons') or [] if s.get('season_number') == temporada), {})
            poster = t.get('poster_path') or poster
            sinopsis = t.get('overview') or sinopsis
        # TMDB deja a veces este relleno al final de la sinopsis
        sinopsis = re.sub(r'\s*Sinopsis desconocid[ao]\.?\s*$', '', sinopsis, flags=re.I)
        salida[corto] = {
            'titulo': x.get('title') or x.get('name') or '',
            'sinopsis': sinopsis,
            'poster': poster,
            'fondo': x.get('backdrop_path'),
            'trailer': trailer_de(tipo, id_, temporada, corto, idioma),
        }
    return salida


def slug(texto):
    """Igual que slug() de src/i18n/rutas.ts: «Vengadores: Doomsday» → vengadores-doomsday."""
    texto = unicodedata.normalize('NFKD', texto)
    texto = ''.join(c for c in texto if not unicodedata.combining(c)).lower()
    texto = texto.replace('.', '').replace('&', ' and ').replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', '-', texto).strip('-')


def asignar_rutas(lista, anteriores):
    """Dirección de cada estreno en cada idioma: la que ya tuviera o, si es nuevo, una libre a partir de su título."""
    usadas = {'es': set(), 'en': set()}
    for r in anteriores.values():
        for corto in usadas:
            usadas[corto].add(r[corto])
    for e in lista:
        if e['clave'] in anteriores:
            e['ruta'] = anteriores[e['clave']]
            continue
        e['ruta'] = {}
        for corto, sufijo in (('es', 'temporada'), ('en', 'season')):
            base = slug(e[corto]['titulo'] or e['es']['titulo'] or e['en']['titulo']) or e['clave']
            if (e.get('temporada') or 1) > 1:
                base += f"-{sufijo}-{e['temporada']}"
            ruta = base if base not in usadas[corto] else f"{base}-{e['tmdb']['id']}"
            usadas[corto].add(ruta)
            e['ruta'][corto] = ruta


def main():
    hoy = datetime.date.today().isoformat()
    previo = json.loads(DESTINO.read_text(encoding='utf-8')) if DESTINO.exists() else {}
    desde_cines = (datetime.date.today() - datetime.timedelta(days=DIAS_EN_CINES)).isoformat()
    fichas = fichas_de_la_coleccion()
    vistos, lista = set(), []

    def anadir(universo, tipo, id_, fecha, temporada=None, episodio=None):
        clave = f'{tipo}-{id_}' + (f'-t{temporada}' if temporada else '')
        # Series: solo lo que está por emitirse. Películas: también las estrenadas hace poco (siguen en cines)
        if clave in vistos or not fecha or fecha < (desde_cines if tipo == 'movie' else hoy):
            return
        cines = fechas_cine(id_) if tipo == 'movie' else {}
        # Lo ya estrenado solo cuenta si pasó por los cines (fuera cortos, especiales de plataforma, pódcasts…)
        if fecha < hoy and not cines:
            return
        vistos.add(clave)
        textos = textos_de(tipo, id_, temporada)
        # Películas: duración en minutos, en cuanto TMDB la conoce (sale de la misma petición de textos_de, ya en caché)
        duracion = (tmdb.get(f'/movie/{id_}', language=IDIOMAS['es']) or {}).get('runtime') if tipo == 'movie' else None
        lista.append({
            'clave': clave,
            'universo': universo,
            'tipo': 'pelicula' if tipo == 'movie' else 'serie',
            'tmdb': {'tipo': tipo, 'id': id_},
            'fecha': fecha,
            # Películas: estreno en cines en España y en Estados Unidos (puede diferir de la fecha mundial)
            **({'cines': cines} if cines else {}),
            **({'duracion': duracion} if duracion else {}),
            # Series: estreno de temporada (episodio 1) o en emisión (próximo episodio)
            **({'temporada': temporada, 'episodio': episodio} if tipo == 'tv' else {}),
            'ficha': ficha_de(fichas, tipo, id_, temporada),
            **textos,
        })

    def serie(universo, id_):
        x = tmdb.get(f'/tv/{id_}', refrescar=True) or {}
        n = x.get('next_episode_to_air')
        if n:
            anadir(universo, 'tv', id_, n.get('air_date'), n.get('season_number'), n.get('episode_number'))

    # 1. Estrenos de las productoras
    for universo, productoras in PRODUCTORAS.items():
        for compania in productoras:
            for pagina in (1, 2):
                d = tmdb.get('/discover/movie', refrescar=True, with_companies=compania, sort_by='primary_release_date.asc',
                             page=pagina, **{'primary_release_date.gte': desde_cines}) or {}
                for r in d.get('results') or []:
                    anadir(universo, 'movie', r['id'], r.get('release_date'))
                if pagina >= (d.get('total_pages') or 1):
                    break
            d = tmdb.get('/discover/tv', refrescar=True, with_companies=compania, **{'air_date.gte': hoy}) or {}
            for r in d.get('results') or []:
                serie(universo, r['id'])

    # 2. Series de la colección con episodios programados
    for (tipo, id_), lista_fichas in sorted(fichas.items(), key=lambda kv: str(kv[0])):
        if tipo == 'tv':
            serie(lista_fichas[0][0], id_)

    lista.sort(key=lambda e: (e['fecha'], e['clave']))

    # Lo que ya no sale se archiva con sus últimos datos, para que su página siga existiendo
    anteriores = previo.get('estrenos', []) + previo.get('archivo', [])
    archivo = {e['clave']: e for e in anteriores if e['clave'] not in vistos}
    for e in archivo.values():
        e['ficha'] = ficha_de(fichas, e['tmdb']['tipo'], e['tmdb']['id'], e.get('temporada'))
    asignar_rutas(lista + list(archivo.values()), {e['clave']: e['ruta'] for e in anteriores if e.get('ruta')})

    salida = {'fecha': hoy, 'fuente': 'TMDB', 'estrenos': lista, 'archivo': sorted(archivo.values(), key=lambda e: e['clave'])}
    DESTINO.write_text(json.dumps(salida, ensure_ascii=False, indent=1, sort_keys=True), encoding='utf-8', newline='\n')
    print(f'{len(lista)} próximos estrenos · ' + ' · '.join(f"{u}: {sum(1 for e in lista if e['universo'] == u)}" for u in PRODUCTORAS))


if __name__ == '__main__':
    main()

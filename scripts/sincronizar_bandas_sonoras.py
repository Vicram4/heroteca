"""
Busca el álbum de la banda sonora de cada ficha y lo guarda en datos/bandas-sonoras.json, que se sube al
repositorio. La web lo lee al compilar y ofrece escucharlo en Apple Music, Spotify y YouTube Music.

Uso:
    .venv/Scripts/python.exe scripts/sincronizar_bandas_sonoras.py [universo…] [--refrescar] [--solo id1,id2]

Cómo lo encuentra:
1. Apple Music: la búsqueda pública de iTunes (itunes.apple.com/search) con el título original y «soundtrack».
   Se acepta un álbum solo si su nombre, sin lo que va entre paréntesis, es el título (o el título seguido de «:»),
   dice que es banda sonora o partitura, y salió hasta un año antes o dos después del estreno. En las temporadas,
   si el álbum indica temporada, tiene que ser la misma.
   No pide clave. La ficha muestra el reproductor de Apple Music con ese álbum.
2. Spotify y YouTube Music: la ficha enlaza a su buscador con el nombre exacto del álbum y el artista.
   Si en .env hay SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET (gratis en developer.spotify.com), se busca además
   el id del álbum en Spotify y la ficha muestra también su reproductor. (song.link, que traducía el enlace de
   Apple Music a los demás servicios sin clave, cerró su API pública en 2026.)

- Las respuestas se guardan en cache/musica/ (no se sube); --refrescar las vuelve a pedir.
- Por ficha se guardan hasta dos álbumes: la banda sonora y, si sale aparte, la partitura («score»).
- Correcciones a mano en datos/bandas-sonoras-manual.yaml: `id: null` quita los álbumes de una ficha y
  `id: <enlace de Apple Music>` (o una lista de enlaces) fija los suyos, por ejemplo cuando el nombre no sigue la regla.
- Al terminar escribe en documentos/extraido/bandas-sonoras-revisar.txt lo que encontró y lo que no, para repasarlo.
"""
import base64
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from sincronizar_tmdb import leer_ficha  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / 'cache' / 'musica'
DESTINO = RAIZ / 'datos' / 'bandas-sonoras.json'
MANUAL = RAIZ / 'datos' / 'bandas-sonoras-manual.yaml'
REVISAR = RAIZ / 'documentos' / 'extraido' / 'bandas-sonoras-revisar.txt'
CABECERAS = {'User-Agent': 'Heroteca/1.0', 'accept': 'application/json'}
ES_BANDA_SONORA = re.compile(r'soundtrack|score|music from|banda sonora|songs from|awesome mix|original music', re.I)
EDICION = re.compile(r'(season|vol|awesome mix|original|the score|score|music|the album|songs|soundtrack|complete|deluxe|expanded)\b')
# Recopilatorios «inspirados en» que no son la música de la película
# Artistas que versionan bandas sonoras (piano, orquestas de homenaje…)
NO_ES_ARTISTA = re.compile(r'piano|geek music|music works|tribute|lullaby|karaoke|cover|epic version|8-bit', re.I)
NO_ES = re.compile(r'video ?game|\bgame\b|inspired by|karaoke|tribute|lullaby|piano versions?|covers?\b|8-bit|music box', re.I)


def get(url, servicio, refrescar=False):
    nombre = re.sub(r'[^\w.-]+', '_', url.split('//', 1)[1])[:180]
    archivo = CACHE / servicio / f'{nombre}.json'
    if archivo.exists() and not refrescar:
        return json.loads(archivo.read_text(encoding='utf-8'))
    time.sleep(3.2)  # iTunes admite unas 20 peticiones por minuto
    datos = None
    for intento in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=CABECERAS), timeout=30) as r:
                datos = json.loads(r.read().decode('utf-8'))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < 4:
                time.sleep(30 * (intento + 1))
                continue
            if e.code in (400, 404):
                break
            raise
        except (urllib.error.URLError, TimeoutError):
            if intento < 4:
                time.sleep(10)
                continue
            raise
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_text(json.dumps(datos, ensure_ascii=False), encoding='utf-8')
    return datos


def norm(texto):
    texto = unicodedata.normalize('NFKD', texto or '').encode('ascii', 'ignore').decode().lower()
    texto = texto.replace('&', ' and ')
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9: ]+', ' ', texto)).strip()


def base_album(nombre):
    """Nombre del álbum sin lo que va entre paréntesis o corchetes ni lo que sigue a « - »."""
    sin = re.sub(r'\([^)]*\)|\[[^\]]*\]', ' ', nombre)
    partes = re.split(r' [-–] ', sin, maxsplit=1)
    # «Thor - Legends of Valhalla» es otra obra; «Loki: Season 2 - Vol. 2» o «… - Main Theme», no
    if len(partes) > 1 and not re.match(r'\s*(season|vol|original|music|songs|score|soundtrack|main theme|theme|single|ep)\b', partes[1], re.I):
        return norm(sin)
    return norm(partes[0])


def temporada_del_album(nombre):
    m = re.search(r'(?:season|temporada|series)\s*(\d+)|(\d+)(?:st|nd|rd|th)?\s+season', nombre, re.I)
    return int(m.group(1) or m.group(2)) if m else None


def es_partitura(nombre):
    return bool(re.search(r'\bscore\b|partitura', nombre, re.I))


def puntuar(album, titulo, anio, temporada, compositores, serie=False):
    nombre = album.get('collectionName') or ''
    # Una serie no se queda con el álbum de una película del mismo nombre, ni al revés
    if serie and re.search(r'motion picture|\bmovie\b|\bfilm\b', nombre, re.I):
        return None
    if not serie and re.search(r'television|\btv\b|series', nombre, re.I):
        return None
    if NO_ES_ARTISTA.search(album.get('artistName') or ''):
        return None
    if not ES_BANDA_SONORA.search(nombre) or NO_ES.search(nombre) or re.search(r'- (single|ep)$', nombre, re.I):
        return None
    base, t = base_album(nombre), norm(titulo)
    sin_puntos = lambda x: re.sub(r'\s+', ' ', x.replace(':', ' ')).strip()  # noqa: E731
    if sin_puntos(base) == sin_puntos(t):  # «Birds of Prey: And the Fantabulous…» frente a «Birds of Prey (and the…)»
        base = t
    resto = base[len(t):].strip(' :') if base.startswith(t) else None
    # Tras el título solo se admite lo que indica la edición («: Awesome Mix Vol. 1», « Season 2»); así no se cuelan
    # otras obras que empiezan igual («Black Panther: Wakanda Forever», «Marvel's Daredevil: Born Again»)
    if resto is None or (resto and not EDICION.match(resto)):
        return None
    artista = norm(album.get('artistName'))
    del_compositor = any(norm(c) and norm(c) in artista for c in compositores)
    anio_album = int((album.get('releaseDate') or '0000')[:4] or 0)
    # Si se sabe quién compuso la música y el álbum no es del año del estreno, tiene que ser suyo (salvo los
    # recopilatorios de canciones). En el mismo año no se exige: TMDB escribe a veces el nombre de otra forma
    # (en árabe, o los miembros de un grupo en vez del grupo)
    recopilatorio = bool(re.search(r'vari(os|ous) artist', artista)) or bool(re.search(r'music from|songs|awesome mix', nombre, re.I))
    if compositores and not del_compositor and not recopilatorio and anio_album != anio:
        return None
    anio_album = int((album.get('releaseDate') or '0000')[:4] or 0)
    t_album = temporada_del_album(nombre)
    # Las ediciones digitales de bandas sonoras antiguas salen años después: entonces el artista tiene que ser el
    # compositor (o, en una temporada, el álbum tiene que decir que es de esa temporada)
    tardio = anio_album > anio and (del_compositor or (temporada and t_album == temporada))
    if anio and anio_album and not (anio - 1 <= anio_album <= anio + 2 or tardio):
        return None
    if temporada and t_album and t_album != temporada:
        return None
    # Temporada sin número en el álbum: tiene que ser del compositor o del mismo año
    if temporada and not t_album and not del_compositor and abs(anio_album - anio) > 1:
        return None
    if not temporada and t_album:
        return None
    puntos = 0
    if base == t:
        puntos += 3
    if temporada and t_album == temporada:
        puntos += 4
    if re.search(r'soundtrack|banda sonora', nombre, re.I):
        puntos += 2
    if del_compositor:
        puntos += 2
    if anio_album == anio:
        puntos += 1
    if re.search(r'deluxe|expanded|anniversary', nombre, re.I):
        puntos += 0.5
    puntos += min(album.get('trackCount') or 0, 30) / 100  # a igualdad, el más completo
    return puntos


def buscar_apple(titulo, anio, temporada, compositores, refrescar, serie=False):
    """Los mejores álbumes de la ficha: el de la banda sonora (canciones o música) y, si lo hay aparte, la partitura."""
    candidatos = {}
    consultas = [(titulo, 200), (f'{titulo} soundtrack', 50)] + ([(f'{titulo} season {temporada}', 50)] if temporada else [])
    consultas += [(f'{titulo} {c}', 50) for c in compositores[:1]]
    for q, limite in consultas:
        url = 'https://itunes.apple.com/search?' + urllib.parse.urlencode(
            {'term': q, 'entity': 'album', 'country': 'es', 'limit': limite})
        for a in (get(url, 'itunes', refrescar) or {}).get('results', []):
            p = puntuar(a, titulo, anio, temporada, compositores, serie)
            if p is not None:
                candidatos[a['collectionId']] = (p, a)
    orden = sorted(candidatos.values(), key=lambda c: -c[0])
    sonora = next((a for _, a in orden if not es_partitura(a['collectionName'])), None)
    partitura = next((a for _, a in orden if es_partitura(a['collectionName'])), None)
    return [a for a in (sonora, partitura) if a]


def album_apple(url, refrescar):
    """Datos de un álbum a partir de su enlace de Apple Music (para las correcciones a mano)."""
    ident = re.search(r'/(?:id)?(\d+)(?:\?|$)', url).group(1)
    datos = get(f'https://itunes.apple.com/lookup?id={ident}&country=es', 'itunes', refrescar) or {}
    return next(iter(datos.get('results') or []), None)


def _env(nombre):
    if (RAIZ / '.env').exists():
        for linea in (RAIZ / '.env').read_text(encoding='utf-8').splitlines():
            if linea.startswith(nombre + '='):
                return linea.split('=', 1)[1].strip()
    return os.environ.get(nombre, '').strip()


_token_spotify = {}


def _buscar_spotify(q, refrescar):
    cid, secreto = _env('SPOTIFY_CLIENT_ID'), _env('SPOTIFY_CLIENT_SECRET')
    url = 'https://api.spotify.com/v1/search?' + urllib.parse.urlencode({'q': q, 'type': 'album', 'market': 'ES', 'limit': 10})
    nombre = re.sub(r'[^\w.-]+', '_', url.split('//', 1)[1])[:180]
    archivo = CACHE / 'spotify' / f'{nombre}.json'
    if archivo.exists() and not refrescar:
        return json.loads(archivo.read_text(encoding='utf-8'))
    if 'token' not in _token_spotify:
        cuerpo = urllib.parse.urlencode({'grant_type': 'client_credentials'}).encode()
        credencial = base64.b64encode(f'{cid}:{secreto}'.encode()).decode()
        peticion = urllib.request.Request('https://accounts.spotify.com/api/token', data=cuerpo,
                                          headers={'Authorization': f'Basic {credencial}'})
        with urllib.request.urlopen(peticion, timeout=30) as r:
            _token_spotify['token'] = json.loads(r.read())['access_token']
    peticion = urllib.request.Request(url, headers={'Authorization': f"Bearer {_token_spotify['token']}"})
    for intento in range(4):
        try:
            with urllib.request.urlopen(peticion, timeout=30) as r:
                datos = json.loads(r.read())
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < 3:
                time.sleep(int(e.headers.get('Retry-After') or 5) + 1)
                continue
            raise
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_text(json.dumps(datos, ensure_ascii=False), encoding='utf-8')
    return datos


def spotify(album, artista, refrescar):
    """Id del mismo álbum en Spotify. Solo si hay SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env (gratis)."""
    if not (_env('SPOTIFY_CLIENT_ID') and _env('SPOTIFY_CLIENT_SECRET')):
        return None
    # Solo el primer artista («Hans Zimmer & Junkie XL» → «Hans Zimmer»); en los recopilatorios, ninguno
    primero = re.split(r'\s*(?:&|,| and | y )\s*', artista)[0].strip()
    recopilatorio = bool(re.match(r'vari(os|ous) artist', primero, re.I)) or not primero
    nombre_album = base_album(album).replace(':', ' ')
    # Los recopilatorios quedan tapados por versiones para piano: segunda consulta con «soundtrack»
    consultas = [f'album:{nombre_album}'] + [f'{nombre_album} soundtrack'] if recopilatorio else [f'album:{nombre_album} artist:{primero}']
    sin_puntos = lambda x: re.sub(r'\s+', ' ', x.replace(':', ' ')).strip()  # noqa: E731
    mio = sin_puntos(base_album(album))

    def mismo_artista(a):
        artistas = [norm(x['name']) for x in a.get('artists') or []]
        if recopilatorio:  # en Spotify tiene que figurar como «Various Artists», no una versión para piano
            return any(re.match(r'vari(os|ous) artist', x) for x in artistas)
        return any(norm(primero) in x for x in artistas)

    for q in consultas:
        datos = _buscar_spotify(q, refrescar)
        candidatos = [a for a in ((datos or {}).get('albums') or {}).get('items') or []
                      if a and a.get('album_type') != 'single' and mismo_artista(a)]
        for a in candidatos:
            if norm(a['name']) == norm(album):
                return a['id']
        for a in candidatos:
            if sin_puntos(base_album(a['name'])) == mio:
                return a['id']
        # «Black Panther The Album Music From And Inspired By» frente a «Black Panther: The Album»: vale si empieza igual
        for a in candidatos:
            if sin_puntos(base_album(a['name'])).startswith(mio + ' ') and EDICION.match(sin_puntos(base_album(a['name']))[len(mio):].strip()):
                return a['id']
    return None


def main(argv):
    refrescar = '--refrescar' in argv
    solo = set(argv[argv.index('--solo') + 1].split(',')) if '--solo' in argv else None
    libres = [a for i, a in enumerate(argv) if not a.startswith('--') and (i == 0 or argv[i - 1] != '--solo')]
    universos = libres or ['marvel', 'dc']
    manual = yaml.safe_load(MANUAL.read_text(encoding='utf-8')) if MANUAL.exists() else {}
    manual = manual or {}
    salida = json.loads(DESTINO.read_text(encoding='utf-8')) if DESTINO.exists() else {}
    informe_si, informe_no = [], []
    for universo in universos:
        tmdb_es = json.loads((RAIZ / 'datos' / 'tmdb' / f'{universo}.json').read_text(encoding='utf-8'))
        tmdb_en = json.loads((RAIZ / 'datos' / 'tmdb' / f'{universo}.en.json').read_text(encoding='utf-8'))
        carpeta = RAIZ / 'contenido' / 'titulos' / universo
        for archivo in sorted(carpeta.glob('*/index.md')) + sorted(carpeta.glob('*.md')):
            ident = archivo.parent.name if archivo.name == 'index.md' else archivo.stem
            if solo and ident not in solo:
                continue
            f = leer_ficha(archivo)
            es, en = tmdb_es.get(ident, {}), tmdb_en.get(ident, {})
            temporada = f.get('temporada')
            # En las temporadas el título inglés de TMDB es el de la serie; en el resto, el original de la ficha
            titulo = (en.get('titulo') if temporada else None) or f.get('tituloOriginal') or en.get('titulo') or f['titulo']
            anio = int((es.get('fecha') or str(f.get('anio') or ''))[:4] or 0)
            compositores = list(f.get('musica') or []) if isinstance(f.get('musica'), list) else [f['musica']] if f.get('musica') else []
            compositores += es.get('musica') or []
            clave = f'{universo}/{ident}'
            if ident in manual:
                enlaces = manual[ident] or []
                albumes = [x for x in (album_apple(u, refrescar) for u in ([enlaces] if isinstance(enlaces, str) else enlaces)) if x]
            else:
                albumes = buscar_apple(titulo, anio, temporada, compositores, refrescar, es.get('tipo') == 'tv')
            if not albumes:
                salida.pop(clave, None)
                informe_no.append(f'{clave}  «{titulo}» {anio}{f" T{temporada}" if temporada else ""}')
                continue
            lista = []
            for album in albumes:
                entrada = {
                    'album': album['collectionName'],
                    'artista': album.get('artistName'),
                    'anio': int(album['releaseDate'][:4]) if album.get('releaseDate') else None,
                    'apple': album['collectionViewUrl'].split('?')[0],
                    'spotify': spotify(album['collectionName'], album.get('artistName') or '', refrescar),
                    'partitura': es_partitura(album['collectionName']) or None,
                }
                lista.append({k: v for k, v in entrada.items() if v})
            salida[clave] = lista
            informe_si.append(f'{clave}  «{titulo}» {anio}{f" T{temporada}" if temporada else ""} → ' + ' + '.join(
                f'{x["album"]} · {x.get("artista")} ({x.get("anio")}){" · spotify" if x.get("spotify") else ""}' for x in lista))
            print(informe_si[-1], flush=True)
    DESTINO.write_text(json.dumps(dict(sorted(salida.items())), ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    REVISAR.parent.mkdir(parents=True, exist_ok=True)
    REVISAR.write_text(f'ENCONTRADAS ({len(informe_si)})\n' + '\n'.join(informe_si) +
                       f'\n\nSIN ÁLBUM ({len(informe_no)})\n' + '\n'.join(informe_no) + '\n', encoding='utf-8', newline='\n')
    print(f'{len(informe_si)} con banda sonora, {len(informe_no)} sin ella → {DESTINO.relative_to(RAIZ)}')


if __name__ == '__main__':
    main(sys.argv[1:])

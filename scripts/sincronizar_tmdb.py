"""
Descarga de TMDB los datos complementarios de cada ficha y los guarda en un archivo compacto
(datos/tmdb/<universo>.json) que se sube al repositorio. La web lo lee al compilar:
así nunca depende de TMDB al publicarse y Vercel no necesita la clave.

Uso:
    .venv/Scripts/python.exe scripts/sincronizar_tmdb.py [universo] [--refrescar] [--ingles]

Con --ingles pide los datos en inglés (título, cartel, sinopsis, capítulos, géneros y tráiler) para la
versión inglesa de la web y los guarda en datos/tmdb/<universo>.en.json.

- Solo se usa para RELLENAR lo que falte: lo de tus documentos siempre manda (se decide al compilar).
- Las respuestas de TMDB se guardan en cache/tmdb/ (no se sube); --refrescar las vuelve a pedir.
"""
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
MAX_REPARTO = 12
# Idioma de los vídeos preferido para el tráiler (se cambia con --ingles)
IDIOMA_VIDEO = 'es'


def leer_ficha(archivo):
    texto = archivo.read_text(encoding='utf-8')
    m = re.match(r'^---\n(.*?)\n---', texto, re.S)
    return yaml.safe_load(m.group(1)) if m else {}


def nombres(crew, *trabajos):
    return list(dict.fromkeys(c['name'] for c in crew or [] if c.get('job') in trabajos))


def trailer(videos):
    """El mejor tráiler de YouTube: en el idioma de la web primero, oficial antes que no oficial."""
    lista = [v for v in (videos or {}).get('results', []) if v.get('site') == 'YouTube' and v.get('type') in ('Trailer', 'Teaser')]
    lista.sort(key=lambda v: (v.get('iso_639_1') != IDIOMA_VIDEO, v.get('type') != 'Trailer', not v.get('official'), v.get('published_at', '')))
    return lista[0]['key'] if lista else None


def fecha_espana(d):
    for pais in (d.get('release_dates') or {}).get('results', []):
        if pais.get('iso_3166_1') == 'ES':
            fechas = sorted(r['release_date'][:10] for r in pais['release_dates'] if r.get('type') in (2, 3, 4) and r.get('release_date'))
            if fechas:
                return fechas[0]
    return None


# Palabras clave de TMDB que marcan escenas durante / después de los créditos
ESCENAS_CREDITOS = {'duringcreditsstinger': 'durante', 'aftercreditsstinger': 'despues'}


def escenas_creditos(id_, refrescar):
    claves = (tmdb.get(f'/movie/{id_}/keywords', refrescar=refrescar) or {}).get('keywords', [])
    nombres_kw = {k.get('name') for k in claves}
    return [v for k, v in ESCENAS_CREDITOS.items() if k in nombres_kw]


# Calificación por edades → edad mínima (España primero; si no hay, Estados Unidos)
EDADES = {
    'TP': 0, 'A': 0, 'Ai': 0, 'Infantil': 0, 'G': 0, 'TV-Y': 0, 'TV-G': 0,
    '7': 7, '7i': 7, 'PG': 7, 'TV-Y7': 7, 'TV-PG': 7,
    '12': 12, '13': 13, 'PG-13': 13, 'TV-14': 14,
    '16': 16, 'R': 17, 'TV-MA': 17,
    '18': 18, 'X': 18, 'NC-17': 18,
}


def edad_minima(certificaciones):
    """certificaciones: {'ES': ['12', ...], 'US': ['PG-13']} → edad (o None)."""
    for pais in ('ES', 'US'):
        edades = [EDADES[c] for c in certificaciones.get(pais, []) if c in EDADES]
        if edades:
            return max(edades)
    return None


def edad_pelicula(d):
    cert = {}
    for r in (d.get('release_dates') or {}).get('results', []):
        cert[r['iso_3166_1']] = [x.get('certification', '').strip() for x in r.get('release_dates', [])]
    return edad_minima(cert)


def edad_serie(id_, refrescar):
    datos = tmdb.get(f'/tv/{id_}/content_ratings', refrescar=refrescar, language=None) or {}
    return edad_minima({r['iso_3166_1']: [r.get('rating', '').strip()] for r in datos.get('results', [])})


def actor(c, personaje):
    """Entrada del reparto: nombre, personaje y, para las páginas de actores, su id y foto de TMDB."""
    return {'actor': c['name'], 'personaje': personaje or '', 'idTmdb': c.get('id'), 'foto': c.get('profile_path')}


def valoracion(d):
    """Nota media de TMDB (0-10) y número de votos; se usan para ordenar las recomendaciones."""
    votos = d.get('vote_count') or 0
    return {'nota': round(d['vote_average'], 1), 'votos': votos} if votos and d.get('vote_average') else {}


def datos_pelicula(d, refrescar):
    cred = d.get('credits') or {}
    return {
        'titulo': (d.get('title') or '').strip() or None,
        'escenasCreditos': escenas_creditos(d['id'], refrescar),
        'poster': d.get('poster_path'),
        'fondo': d.get('backdrop_path'),
        'fecha': d.get('release_date') or None,
        'fechaES': fecha_espana(d),
        'duracion': d.get('runtime') or None,
        'sinopsis': (d.get('overview') or '').strip() or None,
        'direccion': nombres(cred.get('crew'), 'Director'),
        'guion': nombres(cred.get('crew'), 'Screenplay', 'Writer', 'Story'),
        'reparto': [actor(c, c.get('character')) for c in (cred.get('cast') or [])[:MAX_REPARTO]],
        'trailer': trailer(d.get('videos')),
        'generos': [g['name'] for g in d.get('genres', [])],
        'edad': edad_pelicula(d),
        **valoracion(d),
    }


def datos_serie(d, temporada, refrescar):
    base = {
        'titulo': (d.get('name') or '').strip() or None,
        'poster': d.get('poster_path'),
        'fondo': d.get('backdrop_path'),
        'fecha': d.get('first_air_date') or None,
        'duracion': (d.get('episode_run_time') or [None])[0],
        'sinopsis': (d.get('overview') or '').strip() or None,
        'creadores': [c['name'] for c in d.get('created_by', [])],
        'trailer': trailer(d.get('videos')),
        'generos': [g['name'] for g in d.get('genres', [])],
        'edad': edad_serie(d['id'], refrescar),
        **valoracion(d),
    }
    agg = d.get('aggregate_credits') or {}
    reparto = [actor(c, ' / '.join(r.get('character', '') for r in c.get('roles', [])[:1]))
               for c in (agg.get('cast') or (d.get('credits') or {}).get('cast') or [])[:MAX_REPARTO]]
    base['reparto'] = reparto
    if not temporada:
        base['temporadas'] = d.get('number_of_seasons')
        return base
    s = tmdb.get(f"/tv/{d['id']}/season/{temporada}", refrescar=refrescar, append_to_response='credits,videos')
    if not s:
        return base
    if s.get('poster_path'):
        base['poster'] = s['poster_path']
    # Nota de la temporada (si TMDB la tiene); los votos siguen siendo los de la serie, que miden lo conocida que es
    if s.get('vote_average') and base.get('nota'):
        base['nota'] = round(s['vote_average'], 1)
    base['fecha'] = s.get('air_date') or base['fecha']
    if (s.get('overview') or '').strip():
        base['sinopsis'] = s['overview'].strip()
    reparto_t = [actor(c, c.get('character')) for c in ((s.get('credits') or {}).get('cast') or [])[:MAX_REPARTO]]
    if reparto_t:
        base['reparto'] = reparto_t
    base['trailer'] = trailer(s.get('videos')) or base['trailer']
    caps = []
    for ep in s.get('episodes', []):
        caps.append({
            'codigo': f"{temporada}x{ep['episode_number']:02d}",
            'titulo': (ep.get('name') or '').strip(),
            'sinopsis': (ep.get('overview') or '').strip() or None,
            'duracion': ep.get('runtime') or None,
            'fecha': ep.get('air_date') or None,
            'direccion': nombres(ep.get('crew'), 'Director'),
            'guion': nombres(ep.get('crew'), 'Writer', 'Screenplay', 'Teleplay', 'Story'),
        })
    base['capitulos'] = caps
    duraciones = [c['duracion'] for c in caps if c['duracion']]
    if duraciones and not base['duracion']:
        base['duracion'] = round(sum(duraciones) / len(duraciones))
    return base


def limpiar(obj):
    """Quita claves vacías para que el archivo sea pequeño."""
    if isinstance(obj, dict):
        return {k: limpiar(v) for k, v in obj.items() if v not in (None, [], '', {})}
    if isinstance(obj, list):
        return [limpiar(v) for v in obj]
    return obj


def main(argv):
    global IDIOMA_VIDEO
    universo = next((a for a in argv if not a.startswith('--')), 'marvel')
    refrescar = '--refrescar' in argv
    ingles = '--ingles' in argv
    if ingles:
        tmdb.IDIOMA = 'en-US'
        IDIOMA_VIDEO = 'en'
    carpeta = RAIZ / 'contenido' / 'titulos' / universo
    salida = {}
    sin_tmdb = []
    for archivo in sorted(carpeta.glob('*/index.md')) + sorted(carpeta.glob('*.md')):
        ident = archivo.parent.name if archivo.name == 'index.md' else archivo.stem
        f = leer_ficha(archivo)
        ref = f.get('tmdb')
        if not ref:
            sin_tmdb.append(ident)
            continue
        d = tmdb.get(f"/{ref['tipo']}/{ref['id']}", refrescar=refrescar,
                     append_to_response='credits,videos,release_dates' if ref['tipo'] == 'movie' else 'aggregate_credits,credits,videos',
                     include_video_language='en,es' if ingles else 'es,en')
        if not d:
            sin_tmdb.append(ident)
            continue
        datos = datos_pelicula(d, refrescar) if ref['tipo'] == 'movie' else datos_serie(d, f.get('temporada'), refrescar)
        salida[ident] = limpiar({'id': ref['id'], 'tipo': ref['tipo'], **datos})
    destino = RAIZ / 'datos' / 'tmdb' / (f'{universo}.en.json' if ingles else f'{universo}.json')
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(salida, ensure_ascii=False, separators=(',', ':'), sort_keys=True), encoding='utf-8', newline='\n')
    con = lambda k: sum(1 for v in salida.values() if v.get(k))  # noqa: E731
    print(f'{len(salida)} fichas con datos de TMDB → {destino.relative_to(RAIZ)} ({destino.stat().st_size // 1024} KB)')
    print(f"  carátula: {con('poster')} · sinopsis: {con('sinopsis')} · reparto: {con('reparto')} · tráiler: {con('trailer')} · capítulos: {con('capitulos')}")
    if sin_tmdb:
        print(f'  Sin TMDB ({len(sin_tmdb)}): {", ".join(sin_tmdb)}')


if __name__ == '__main__':
    main(sys.argv[1:])

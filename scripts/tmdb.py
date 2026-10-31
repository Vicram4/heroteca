"""
Cliente mínimo de la API de TMDB con caché en disco.

- El token se lee de la variable de entorno TMDB_API_TOKEN o del archivo .env.
- Cada respuesta se guarda en cache/tmdb/ (se sube al repositorio), así que la web
  se puede compilar sin conexión con TMDB. Usa `refrescar=True` para volver a pedirla.
- Nunca se usa desde el navegador: solo desde los scripts de este proyecto.
"""
import hashlib
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / 'cache' / 'tmdb'
API = 'https://api.themoviedb.org/3'
IDIOMA = 'es-ES'


def _token():
    token = os.environ.get('TMDB_API_TOKEN', '').strip()
    if not token and (RAIZ / '.env').exists():
        for linea in (RAIZ / '.env').read_text(encoding='utf-8').splitlines():
            if linea.startswith('TMDB_API_TOKEN='):
                token = linea.split('=', 1)[1].strip()
    if not token:
        raise SystemExit('Falta TMDB_API_TOKEN en .env')
    return token


def _ruta_cache(ruta, params):
    clave = ruta + '?' + urllib.parse.urlencode(sorted(params.items()))
    nombre = ruta.strip('/').replace('/', '_') + '_' + hashlib.sha1(clave.encode()).hexdigest()[:10]
    return CACHE / f'{nombre}.json'


def get(ruta, refrescar=False, **params):
    params.setdefault('language', IDIOMA)
    archivo = _ruta_cache(ruta, params)
    if archivo.exists() and not refrescar:
        return json.loads(archivo.read_text(encoding='utf-8'))
    url = f'{API}{ruta}?{urllib.parse.urlencode(params)}'
    peticion = urllib.request.Request(url, headers={'Authorization': f'Bearer {_token()}', 'accept': 'application/json'})
    for intento in range(4):
        try:
            with urllib.request.urlopen(peticion, timeout=20) as r:
                datos = json.loads(r.read().decode('utf-8'))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < 3:  # demasiadas peticiones: esperar y reintentar
                time.sleep(2 * (intento + 1))
                continue
            if e.code == 404:
                datos = None
                break
            raise
    CACHE.mkdir(parents=True, exist_ok=True)
    archivo.write_text(json.dumps(datos, ensure_ascii=False, sort_keys=True), encoding='utf-8')
    return datos


def buscar(tipo, texto, anio=None):
    """tipo: 'movie' o 'tv'. Devuelve la lista de resultados."""
    params = {'query': texto, 'include_adult': 'false'}
    if anio:
        params['primary_release_year' if tipo == 'movie' else 'first_air_date_year'] = anio
    datos = get(f'/search/{tipo}', **params)
    return (datos or {}).get('results', [])


def detalle(tipo, id_):
    """Ficha completa con créditos, títulos alternativos, vídeos y fechas de estreno."""
    extra = 'credits,alternative_titles,videos,release_dates' if tipo == 'movie' else 'aggregate_credits,credits,alternative_titles,videos'
    return get(f'/{tipo}/{id_}', append_to_response=extra, include_video_language='es,en')


def temporada(id_, numero):
    return get(f'/tv/{id_}/season/{numero}', append_to_response='credits')

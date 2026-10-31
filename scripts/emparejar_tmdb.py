"""
Une las fichas (fichas.json) con el catálogo (catalogo.json) y empareja cada título con TMDB.

Uso:
    .venv/Scripts/python.exe scripts/emparejar_tmdb.py <carpeta_extraido_marvel>

Genera en la carpeta:
    entradas.json         → un elemento por ficha final (película, temporada, especial…) con su `tmdb`
    revisar-tmdb.txt      → emparejamientos dudosos o no encontrados
Las correcciones a mano van en `datos/tmdb-manual.yaml` (clave de la entrada → id de TMDB).
"""
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
MANUAL = RAIZ / 'datos' / 'tmdb-manual.yaml'
UMBRAL = 0.72


def norm(t):
    t = unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode().lower()
    t = t.replace('&', ' and ').replace('´', "'")
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()


def slug(t):
    return norm(t).replace(' ', '-')


def titulo_busqueda(t):
    t = re.sub(r'\(.*?(\)|$)', '', t or '')          # "(Trilogía + corto)" / "(serie de películas"
    t = re.sub(r'\s*[-–]\s*(One-Shot|SlingShot)\.?$', '', t, flags=re.IGNORECASE)
    t = t.replace('´', "'").replace(' :', ':').strip(' .-')
    return re.sub(r'\s{2,}', ' ', t)


def parecido(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


# ---------------------------------------------------------------- unir fichas y catálogo
def unir(fichas, catalogo):
    """Una entrada por ficha final. Las fichas mandan; el catálogo añade lo que no tiene ficha."""
    entradas = []
    # Fichas: las temporadas troceadas se agrupan por (serie, temporada)
    grupos = {}
    for f in fichas:
        if f['tipo'] == 'serie':
            clave = (slug(f['titulo']), f['temporada'])
            if clave in grupos:
                grupos[clave]['partes'].append(f)
                continue
            grupos[clave] = {'partes': [f]}
            entradas.append(grupos[clave])
        else:
            entradas.append({'partes': [f]})
    for e in entradas:
        e['base'] = e['partes'][0]

    def cubre(e, c):
        b = e['base']
        if b['seccion'] != c['seccion']:
            return False
        if b['tipo'] == 'serie' and c['tipo'] == 'serie':
            if b['temporada'] != c.get('temporada'):
                return False
            mismo = slug(c['titulo']).startswith(slug(b['titulo'])) or parecido(b['titulo'], c['titulo']) > 0.85
            tramos = [tuple(p['tramo']) for p in e['partes'] if p.get('tramo')]
            numeros = [p.get('numero') for p in e['partes']]
            if c.get('numero') is not None:
                # El número debe coincidir (o el tramo, si la ficha tiene el número equivocado: SHIELD 022/025)
                return mismo and (c['numero'] in numeros or (c.get('tramo') and tuple(c['tramo']) in tramos))
            return mismo
        return c.get('numero') is not None and b.get('numero') == c['numero']

    sueltas = {}
    for c in catalogo:
        e = next((e for e in entradas if 'base' in e and cubre(e, c)), None)
        if e:
            e.setdefault('catalogo', []).append(c)
            continue
        if c['tipo'] == 'serie' and c.get('temporada'):
            clave = (c['seccion'], slug(c['titulo']).split('-')[0], c['temporada'])
            if clave in sueltas:
                sueltas[clave]['catalogo'].append(c)
                continue
            sueltas[clave] = {'catalogo': [c]}
            entradas.append(sueltas[clave])
        else:
            entradas.append({'catalogo': [c]})
    return entradas


def resumen(e):
    """Datos básicos de la entrada, venga de ficha o solo del catálogo."""
    b = e.get('base') or e['catalogo'][0]
    c0 = (e.get('catalogo') or [{}])[0]
    r = {
        'seccion': b['seccion'], 'tipo': b['tipo'], 'titulo': b['titulo'],
        'anio': b.get('anio') or c0.get('anio'), 'temporada': b.get('temporada') or c0.get('temporada'),
        'animada': bool(c0.get('animada') or b.get('animada')), 'conFicha': 'base' in e,
    }
    numeros = sorted({x['numero'] for x in e.get('catalogo', []) if x.get('numero') is not None})
    if not numeros and b.get('numero') is not None:
        numeros = [b['numero']]
    r['numeros'] = numeros
    return r


def clave(r):
    if r['numeros']:
        return f"{r['seccion']}-{r['numeros'][0]:03d}"
    return f"{r['seccion']}-{slug(titulo_busqueda(r['titulo']))}" + (f"-t{r['temporada']}" if r['temporada'] else f"-{r['anio']}")


# ---------------------------------------------------------------- emparejar con TMDB
def candidatos_titulo(e):
    vistos, salida = set(), []
    for t in [e.get('base', {}).get('titulo')] + [c['titulo'] for c in e.get('catalogo', [])]:
        q = titulo_busqueda(t or '')
        if q and q.lower() not in vistos:
            vistos.add(q.lower())
            salida.append(q)
    return salida


def emparejar(e, r, manual):
    k = clave(r)
    tipo_tmdb = 'tv' if r['tipo'] == 'serie' else 'movie'
    m = manual.get(k) or {}
    if m.get('id'):
        d = tmdb.detalle(m.get('tipo', tipo_tmdb), m['id'])
        return {'tipo': m.get('tipo', tipo_tmdb), 'id': m['id'], 'confianza': 1.0, 'manual': True,
                'encontrado': f"{d.get('title') or d.get('name')} ({(d.get('release_date') or d.get('first_air_date') or '')[:4]})"}
    if m.get('ninguno'):
        return None  # no está en TMDB
    tipo_tmdb = m.get('tipo', tipo_tmdb)
    consultas = [m['buscar']] if m.get('buscar') else candidatos_titulo(e)
    if m.get('anio'):
        r = {**r, 'anio': m['anio']}
    mejor = None
    for tipo in ([tipo_tmdb] + (['tv'] if tipo_tmdb == 'movie' else ['movie'])):
        for q in consultas:
            anio = r['anio'] if not (tipo == 'tv' and r['temporada'] and r['temporada'] > 1) else None
            resultados = tmdb.buscar(tipo, q, anio) or tmdb.buscar(tipo, q)
            for res in resultados[:8]:
                titulo_es = res.get('title') or res.get('name') or ''
                original = res.get('original_title') or res.get('original_name') or ''
                fecha = res.get('release_date') or res.get('first_air_date') or ''
                s = max(parecido(q, titulo_es), parecido(q, original))
                if r['anio'] and fecha[:4].isdigit():
                    dif = abs(int(fecha[:4]) - r['anio'])
                    s += 0.15 if dif == 0 else (0.05 if dif == 1 else (-0.1 if tipo == 'movie' and dif > 2 else 0))
                if tipo != tipo_tmdb:
                    s -= 0.1
                if mejor is None or s > mejor['confianza']:
                    mejor = {'tipo': tipo, 'id': res['id'], 'confianza': round(min(s, 1.0), 3),
                             'encontrado': f'{titulo_es} / {original} ({fecha[:4]})', 'busqueda': q}
        if mejor and mejor['confianza'] >= UMBRAL:
            break
    if mejor and m.get('buscar'):
        mejor['manual'] = True
    if mejor and m.get('aceptar'):
        mejor['confianza'] = max(mejor['confianza'], UMBRAL)  # revisado a mano: es correcto
    return mejor


def main(carpeta):
    carpeta = Path(carpeta)
    fichas = json.loads((carpeta / 'fichas.json').read_text(encoding='utf-8'))
    catalogo = json.loads((carpeta / 'catalogo.json').read_text(encoding='utf-8'))
    manual = yaml.safe_load(MANUAL.read_text(encoding='utf-8')) if MANUAL.exists() else {}
    manual = manual or {}
    entradas = unir(fichas, catalogo)
    salida, revisar = [], []
    for e in entradas:
        r = resumen(e)
        k = clave(r)
        m = emparejar(e, r, manual)
        salida.append({'clave': k, **r, 'tmdb': m, 'partes': e.get('partes', []), 'catalogo': e.get('catalogo', [])})
        if not m or m['confianza'] < UMBRAL:
            revisar.append(f"{k:42} | {r['titulo'][:40]:40} ({r['anio']}) → "
                           + (f"{m['encontrado']} [{m['confianza']}] tmdb:{m['tipo']}/{m['id']}" if m else 'NADA'))
    (carpeta / 'entradas.json').write_text(json.dumps(salida, ensure_ascii=False, indent=1), encoding='utf-8')
    (carpeta / 'revisar-tmdb.txt').write_text('\n'.join(revisar) + '\n', encoding='utf-8')
    claves = [s['clave'] for s in salida]
    repetidas = {k for k in claves if claves.count(k) > 1}
    print(f'{len(salida)} entradas · {len(salida) - len(revisar)} emparejadas con confianza · {len(revisar)} a revisar')
    if repetidas:
        print('Claves repetidas:', ', '.join(sorted(repetidas)))


if __name__ == '__main__':
    main(sys.argv[1])

"""
Genera las fichas, sagas y órdenes de visionado de DC a partir de catalogo.json (dc_catalogo.py).

Uso:
    .venv/Scripts/python.exe scripts/dc_generar.py documentos/extraido/dc contenido [--forzar] [--simular]

Sigue la organización del disco duro del usuario:
  - udc        «001 UDC»: películas clásicas, n.º de PRE-DCUE (orden de estreno)
  - dcdu       «002 DCDU»: universo extendido, n.º del disco (orden de la historia)
  - series     «UDC Series por orden»: carpetas 1-13 del RESUMEN; n.º = carpeta del disco (011 Smallville)
  - animacion  «animacion/Animación»: 001-036 por estreno, más las sueltas de DC
Lo de los documentos manda. TMDB da el título oficial en España y el original (el resto, al compilar).
Correcciones a mano: datos/tmdb-manual-dc.yaml. Revisión: documentos/extraido/dc/revisar.txt
"""
import json
import re
import shutil
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402
from emparejar_tmdb import UMBRAL, emparejar, norm, parecido  # noqa: E402
from generar_contenido import slug, volcar  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
UNIVERSO = 'dc'
MANUAL = RAIZ / 'datos' / 'tmdb-manual-dc.yaml'

# Nombres de las series tal como aparecen (abreviados o con erratas) → nombre y id
SERIES = {
    'smallville': ('Smallville', 'smallville'), 'gotham': ('Gotham', 'gotham'), 'arrow': ('Arrow', 'arrow'),
    'theflash': ('The Flash', 'the-flash'), 'flash': ('The Flash', 'the-flash'),
    'supergirl': ('Supergirl', 'supergirl'), 'legends': ('Legends of Tomorrow', 'legends-of-tomorrow'),
    'legendsoftomorrow': ('Legends of Tomorrow', 'legends-of-tomorrow'),
    'dcslegendsoftomorrow': ('Legends of Tomorrow', 'legends-of-tomorrow'),
    'vixen': ('Vixen', 'vixen'), 'cisco': ('Crónicas de Cisco', 'cronicas-de-cisco'),
    'cronicasdecisco': ('Crónicas de Cisco', 'cronicas-de-cisco'), 'theray': ('The Ray', 'the-ray'),
    'constantine': ('Constantine', 'constantine'), 'blacklight': ('Black Lightning', 'black-lightning'),
    'blacklighting': ('Black Lightning', 'black-lightning'), 'blacklightning': ('Black Lightning', 'black-lightning'),
    'titans': ('Titans', 'titans'), 'doompatrol': ('Doom Patrol', 'doom-patrol'),
    'swamthing': ('Swamp Thing', 'swamp-thing'), 'swampthing': ('Swamp Thing', 'swamp-thing'),
    'powerless': ('Powerless', 'powerless'), 'batwoman': ('Batwoman', 'batwoman'), 'krypton': ('Krypton', 'krypton'),
    'preacher': ('Preacher', 'preacher'), 'izombie': ('iZombie', 'izombie'), 'lucifer': ('Lucifer', 'lucifer'),
    'stargirl': ('Stargirl', 'stargirl'), 'elpacificador': ('El Pacificador', 'el-pacificador'),
    'theboys': ('The Boys', 'the-boys'), 'boys': ('The Boys', 'the-boys'), 'pennyworth': ('Pennyworth', 'pennyworth'),
    'watchmen': ('Watchmen', 'watchmen'), 'metropolis': ('Metropolis', 'metropolis'),
    'secretsix': ('Secret Six', 'secret-six'), 'ythelastman': ('Y: The Last Man', 'y-the-last-man'),
    'sweettooth': ('Sweet Tooth', 'sweet-tooth'), 'suvivorsclub': ("Survivors' Club", 'survivors-club'),
    'thesandman': ('The Sandman', 'the-sandman'), 'astrocity': ('Astro City', 'astro-city'),
}
ANIMADAS = {'vixen', 'the-ray'}
SELLOS = {'izombie': 'sello-vertigo', 'lucifer': 'sello-vertigo', 'preacher': 'sello-vertigo', 'the-boys': 'sello-wildstorm'}
ARROWVERSO = {'arrow', 'the-flash', 'supergirl', 'legends-of-tomorrow', 'vixen', 'cronicas-de-cisco', 'the-ray',
              'constantine', 'batwoman', 'black-lightning'}

# Películas sueltas de la carpeta de animación que no están entre las 36 numeradas (búsqueda en TMDB, año)
ANIMACION_SUELTAS = [
    ('Batman Unlimited: Animal Instincts', 2015, 'movie', 'Batman Unlimited - Animal Instincts (2015)'),
    ('Batman Unlimited: Monster Mayhem', 2015, 'movie', 'Batman unlimited Monstermania'),
    ('Batman vs. Two-Face', 2017, 'movie', 'Batman Vs. Dos Caras 2017'),
    ('Batman Ninja', 2018, 'movie', 'Batman.Ninja'),
    ('LEGO DC Comics Super Heroes: Justice League - Attack of the Legion of Doom!', 2015, 'movie',
     'La liga de la justicia - El ataque de la legion del mal'),
    ('LEGO DC Comics Super Heroes: Justice League vs. Bizarro League', 2015, 'movie',
     'La Liga de la Justicia contra la Liga de Bizarro'),
    ('Superman: Red Son', 2020, 'movie', 'Superman Hijo rojo'),
    ('Scooby-Doo! & Batman: The Brave and the Bold', 2018, 'movie', '¡Scooby-doo! y el intrepido Batman'),
    ('The New Adventures of Batman', 1977, 'tv', 'Las Nuevas Aventuras De Batman (1977) Serie Animada Completa'),
    ('Superman', 1988, 'tv', 'Superman (1988) - Serie Animada Completa'),
]

# Películas que solo están en las páginas «pelis solo» (telefilmes): van a UDC sin número
UDC_EXTRA = [
    ('udc-wonder-woman-1974', 'Wonder Woman', 1974, 'wonder-woman', 'word pelis solo Wonder Woman pag 1'),
    ('udc-the-new-original-wonder-woman', 'The New Original Wonder Woman', 1975, 'wonder-woman',
     'word pelis solo Wonder Woman pag 1'),
    ('udc-the-flash-1990', 'The Flash', 1990, 'flash', 'word pelis solo Flash pag 1'),
    ('udc-the-flash-2', 'The Flash 2: La venganza del Mago Asesino', 1991, 'flash', 'word pelis solo Flash pag 1'),
    ('udc-the-flash-3', 'The Flash 3: La sombra mortal', 1992, 'flash', 'word pelis solo Flash pag 1'),
    ('udc-marston', 'Wonder Woman y el profesor Marston', 2017, 'wonder-woman',
     'Disco: 001 UDC/Relacionadas'),
]

SAGAS = {
    'batman': ('Batman', 'multiverso', None, 1, 'word pelis solo batman pag 1-2'),
    'superman': ('Superman', 'multiverso', None, 2, 'word pelis solo superman pag 1-2'),
    'wonder-woman': ('Wonder Woman', 'multiverso', None, 3, 'word pelis solo Wonder Woman pag 1'),
    'flash': ('Flash', 'multiverso', None, 4, 'word pelis solo Flash pag 1'),
    'aquaman': ('Aquaman', 'multiverso', None, 5, 'word pelis solo aquaman pag 1'),
    'shazam': ('¡Shazam!', 'multiverso', None, 6, 'word pelis solo shazam pag 1'),
    'superman-cuatrilogia': ('Superman (cuatrilogía)', 'trilogia', 'superman', 1, 'PRE-DCUE: (Cuatrilogía)'),
    'trilogia-nolan': ('El caballero oscuro (trilogía)', 'trilogia', 'batman', 2, 'PRE-DCUE: (Trilogía)'),
    'joker': ('Joker (dulogía)', 'trilogia', 'batman', 3, 'PRE-DCUE: (Dulogía)'),
    'arrowverso': ('Arrowverso', 'saga', None, 10, 'RESUMEN de carpetas UDC (Crossover) · complementos/arrowverso.jpg'),
    'sello-vertigo': ('Sello Vertigo', 'saga', None, 11, 'Disco: UDC Series por orden/Sello Vertigo'),
    'sello-wildstorm': ('Sello Wildstorm', 'saga', None, 12, 'Disco: UDC Series por orden/Sello Wildstorm'),
}
CONTINUIDADES = {  # títulos de «Continuidades.docx» → saga
    'Películas autónomas': ('animacion-autonomas', 'Animación: películas autónomas'),
    'Superman/Batman': ('animacion-superman-batman', 'Animación: continuidad Superman/Batman'),
    'Justice League (JLA)': ('animacion-jla', 'Animación: continuidad Justice League (JLA)'),
    'The Dark Knight Returns': ('animacion-dark-knight-returns', 'Animación: continuidad The Dark Knight Returns'),
    'DC Animated Movie Universe': ('animacion-dcamu', 'DC Animated Movie Universe'),
    'Otros universos': ('animacion-otros-universos', 'Animación: otros universos'),
}

revisar = []


def clave_serie(nombre):
    k = re.sub(r'[^a-z]', '', norm(nombre))
    if k not in SERIES:
        revisar.append(f'Serie no reconocida: «{nombre}»')
        return nombre, slug(nombre)
    return SERIES[k]


def unir_titulo(e):
    t = (e.get('titulo') or '').strip().rstrip(':').strip()
    sub = (e.get('subtitulo') or '').strip(' .-')
    return f'{t}: {sub}' if sub else t


def codigo_cap(c):
    m = re.match(r'^(\d+)x(\d+)$', c or '')
    return f'{int(m.group(1))}x{int(m.group(2)):02d}' if m else None


# ---------------------------------------------------------------- entradas
def entradas_peliculas(cat):
    salida = []
    disco_udc = {d['numero']: d for d in cat['disco_udc'] if d.get('numero')}
    a_dcdu = {25, 26, 27}  # Joker, The Batman y Joker 2: en el disco van en 002 DCDU
    for e in cat['pre_dcue']:
        if e['numero'] in a_dcdu:
            continue
        notas, sagas = [], []
        for et in e['etiquetas']:
            if et.startswith('Cuatrilog'):
                sagas.append('superman-cuatrilogia')
            elif et.startswith('Trilog'):
                sagas.append('trilogia-nolan')
            elif et.startswith('+ versi'):
                notas.append('Tienes también otra versión (montaje alternativo).')
            elif et == 'B.S.O.':
                notas.append('Con la banda sonora (B.S.O.).')
        en_disco = e['numero'] in disco_udc or e['numero'] == 5  # Swamp Thing está suelta en la carpeta
        if not en_disco:
            notas.append('No está en la carpeta «001 UDC» del disco.')
        salida.append({
            'clave': f"udc-{e['numero']:03d}", 'seccion': 'udc', 'tipo': 'pelicula', 'titulo': unir_titulo(e),
            'anio': e.get('anio'), 'numero': e['numero'], 'calidad': e['calidad'], 'portada': e.get('portada'),
            'fuente': f"Archivador AZUL/{Path(e['pagina']).stem} · Disco: 001 UDC", 'notas': notas, 'sagas': sagas,
        })
    for clave, titulo, anio, saga, fuente in UDC_EXTRA:
        salida.append({'clave': clave, 'seccion': 'udc', 'tipo': 'pelicula', 'titulo': titulo, 'anio': anio,
                       'calidad': [], 'fuente': fuente, 'notas': [], 'sagas': [saga]})

    # DCDU: número y orden del disco; calidad y carátula de las páginas DCUE
    candidatos = cat['dcue'] + [e for e in cat['pre_dcue'] if e['numero'] in a_dcdu]
    for d in cat['disco_dcdu']:
        mejor = max(candidatos, key=lambda c: parecido(d['titulo'], unir_titulo(c)) + (0.3 if c.get('anio') == d['anio'] else 0))
        notas = []
        if mejor in cat['pre_dcue']:
            notas.append(f"En tus Word está en PRE-DCUE (n.º {mejor['numero']:03d}); en el disco, en 002 DCDU. Se sigue el disco.")
        salida.append({
            'clave': f"dcdu-{d['numero']:03d}", 'seccion': 'dcdu', 'tipo': 'pelicula', 'titulo': unir_titulo(mejor),
            'anio': d['anio'] or mejor.get('anio'), 'numero': d['numero'], 'calidad': mejor['calidad'],
            'portada': mejor.get('portada'), 'notas': notas, 'sagas': [],
            'fuente': f"Disco: 002 DCDU/{d['carpeta']} · Archivador AZUL/{Path(mejor['pagina']).stem}",
        })
    joker2 = next(e for e in cat['pre_dcue'] if e['numero'] == 27)
    salida.append({
        'clave': 'dcdu-joker-2', 'seccion': 'dcdu', 'tipo': 'pelicula', 'titulo': unir_titulo(joker2), 'anio': joker2['anio'],
        'calidad': joker2['calidad'], 'portada': joker2.get('portada'), 'sagas': ['joker'],
        'notas': ['No está en el disco. En tus Word es el n.º 027 de PRE-DCUE; va junto a Joker (2019), que el disco pone en 002 DCDU.'],
        'fuente': f"Archivador AZUL/{Path(joker2['pagina']).stem}",
    })
    return salida


def leer_carpetas(cat):
    """RESUMEN de carpetas UDC → lista de (carpeta, etapa, código, serie, temporada, extra) en orden."""
    filas = []
    for k in cat['resumen_carpetas']:
        bloque, i = None, 0
        for item in k['contenido']:
            m = re.match(r'^(\d+\.\d+)-\s*(.*)$', item)
            if m:
                codigo, resto = m.group(1), m.group(2).strip()
                bloque = codigo
                if not resto:
                    continue
            elif item.startswith(('-', '+')):
                codigo, resto = bloque, item.lstrip('-+ ').strip()
            else:  # carpeta 1: sin códigos (1.1 … 1.5, como en el disco)
                i += 1
                codigo, resto = f"{k['carpeta']}.{i}", item
            for parte in re.split(r'\s+\+\s*', resto):
                mt = re.match(r'^(.+?)\s*(\d+)ª\s*(.*)$', parte.strip())
                if mt:
                    filas.append({'carpeta': k['carpeta'], 'etapa': k['etapa'], 'codigo': codigo,
                                  'serie': mt.group(1).strip(), 'temporada': int(mt.group(2)), 'extra': mt.group(3).strip()})
                else:
                    filas.append({'carpeta': k['carpeta'], 'etapa': k['etapa'], 'codigo': codigo, 'serie': parte.strip(),
                                  'temporada': None, 'extra': ''})
    return filas


def etapa_bonita(t):
    t = t.replace('Crossower', 'Crossover').replace('Crosower', 'Crossover').replace('Megarossower', 'Megacrossover')
    return t.replace('Peli + ', 'Película + ')


def entradas_series(cat):
    salida, por_clave = [], {}
    numero_disco = {}
    for s in cat['disco_series']:
        if 'numero' in s:
            numero_disco[clave_serie(s['serie'])[1]] = s['numero']
    paginas = {}
    for b in cat['series_paginas']:
        if b['tipo'] == 'temporada':
            paginas[(clave_serie(b['serie'])[1], b['temporada'])] = b
    cruces = {}  # (serie, temporada) → capítulos y carátula sacados de los Crossover
    for b in cat['series_paginas']:
        if b['tipo'] != 'crossover' or 'haciendo' in b['pagina']:
            continue
        for s in b['series']:
            sid = clave_serie(s['serie'])[1]
            cruces.setdefault((sid, s['temporada']), {'capitulos': [], 'portada': s.get('portada'), 'pagina': b['pagina']})
        for o in b['orden']:
            c = codigo_cap(o.get('codigo'))
            if c:
                sid = clave_serie(o['serie'])[1]
                t = int(c.split('x')[0])
                caps = cruces.setdefault((sid, t), {'capitulos': [], 'portada': None, 'pagina': b['pagina']})['capitulos']
                if c not in {x['codigo'] for x in caps}:
                    caps.append({'codigo': c, 'titulo': o['titulo']})

    orden = 0
    for f in leer_carpetas(cat):
        orden += 1
        if f['serie'].startswith('Constantine (City'):
            e = {'clave': 'series-constantine-city-of-demons', 'seccion': 'series', 'tipo': 'pelicula', 'animada': True,
                 'titulo': 'Constantine: City of Demons', 'anio': 2018, 'calidad': [], 'sagas': ['arrowverso'],
                 'visionado': {'carpeta': f['carpeta'], 'codigo': f['codigo'], 'orden': orden}, 'notas': [],
                 'fuente': 'Archivador AZUL/RESUMEN de carpetas UDC · Disco: animacion/7.1 Constantine- City of Demons'}
            salida.append(e)
            continue
        nombre, sid = clave_serie(f['serie'])
        clave = f"series-{sid}-t{f['temporada']}"
        if clave in por_clave:  # Batwoman 1ª: mitad en la carpeta 9 y mitad en la 11
            por_clave[clave]['notas'].append(f"La segunda mitad de la temporada va en la carpeta {f['carpeta']} ({f['codigo']}).")
            continue
        pag = paginas.get((sid, f['temporada']))
        cr = cruces.get((sid, f['temporada']))
        caps = [{'codigo': codigo_cap(c['codigo']), 'titulo': c['titulo']} for c in (pag['capitulos'] if pag else [])]
        caps = [c for c in caps if c['codigo']] or (sorted(cr['capitulos'], key=lambda c: int(c['codigo'].split('x')[1])) if cr else [])
        notas = []
        if f['extra'] == '½':
            notas.append(f"Primera mitad de la temporada en la carpeta {f['carpeta']}.")
        if pag and pag['codigo'] != f['codigo']:
            notas.append(f"En tus páginas de series aparece como {pag['codigo']}; el RESUMEN de carpetas dice {f['codigo']} (se sigue el RESUMEN).")
        sagas = [s for s in ('arrowverso' if sid in ARROWVERSO else None, SELLOS.get(sid)) if s]
        e = {
            'clave': clave, 'seccion': 'series', 'tipo': 'serie', 'titulo': nombre, 'serie': sid, 'temporada': f['temporada'],
            'animada': sid in ANIMADAS, 'numero': numero_disco.get(sid), 'calidad': [],
            'visionado': {'carpeta': f['carpeta'], 'codigo': f['codigo'], 'orden': orden},
            'capitulos': caps, 'portada': (pag or {}).get('portada') or (cr or {}).get('portada'), 'notas': notas,
            'sagas': sagas,
            'fuente': 'Archivador AZUL/RESUMEN de carpetas UDC' + (f" · {Path(pag['pagina']).stem}" if pag else '')
                      + (f" · {Path(cr['pagina']).stem}" if cr and not pag else ''),
        }
        por_clave[clave] = e
        salida.append(e)

    # En espera: la lista del RESUMEN y lo que está en el disco pero aún no en las carpetas
    temporadas_disco = {'the-boys': [1, 2, 3], 'stargirl': [1], 'el-pacificador': [1], 'doom-patrol': [2],
                        'batwoman': [2], 'the-flash': [7]}
    lista = [n for n in cat['en_espera'] if not n.lower().startswith('sello')] + ['El Pacificador']
    vistos = set()
    for n in lista + ['Doom Patrol', 'Batwoman', 'The Flash']:
        nombre, sid = clave_serie(n)
        if sid in vistos:
            continue
        vistos.add(sid)
        en_lista = n in cat['en_espera']
        nota = 'En la lista «EN ESPERA» del RESUMEN de carpetas.' if en_lista else 'Está en el disco pero aún no en tus carpetas de visionado.'
        for t in temporadas_disco.get(sid, [None]):
            clave = f'series-{sid}' + (f'-t{t}' if t else '')
            if clave in por_clave:
                continue
            e = {'clave': clave, 'seccion': 'series', 'tipo': 'serie', 'titulo': nombre, 'serie': sid, 'temporada': t,
                 'numero': numero_disco.get(sid), 'calidad': [], 'enEspera': True, 'notas': [nota], 'capitulos': [],
                 'sagas': [s for s in ('arrowverso' if sid in ARROWVERSO else None, SELLOS.get(sid)) if s],
                 'fuente': 'Archivador AZUL/RESUMEN de carpetas UDC (EN ESPERA)' if en_lista else 'Disco: UDC Series por orden'}
            por_clave[clave] = e
            salida.append(e)
    return salida


def entradas_animacion(cat):
    salida = []
    for a in cat['animacion']:
        if a['titulo'] == 'Proyectos cancelados':
            revisar.append('Animación 036 «Proyectos cancelados»: no es una película; no se crea ficha.')
            continue
        titulo, notas = a['titulo'], []
        if titulo == 'Próximas películas':
            titulo = 'Reign of the Supermen'
            notas.append('Tu documento 032 se titula «Próximas películas» y habla de Reign of the Supermen (2019).')
        salida.append({'clave': f"animacion-{a['numero']:03d}", 'seccion': 'animacion', 'tipo': 'pelicula', 'animada': True,
                       'titulo': titulo, 'anio': a['anio'], 'numero': a['numero'], 'calidad': [], 'notas': notas, 'sagas': [],
                       'fuente': f"animacion/Animación/{a['numero']:03d}/{a['archivo']}"})
    for busq, anio, tipo, archivo in ANIMACION_SUELTAS:
        salida.append({'clave': f'animacion-{slug(busq)}', 'seccion': 'animacion', 'tipo': 'serie' if tipo == 'tv' else 'pelicula',
                       'animada': True, 'titulo': busq, 'anio': anio, 'calidad': [], 'notas': [], 'sagas': [],
                       'buscar': busq, 'fuente': f'Disco: animacion/Animación/{archivo}'})
    return salida


# ---------------------------------------------------------------- TMDB
def con_tmdb(e, manual):
    r = {'seccion': e['seccion'], 'numeros': [e['numero']] if e.get('numero') and e['seccion'] != 'series' else [],
         'titulo': e['titulo'], 'anio': e.get('anio'), 'temporada': e.get('temporada'), 'tipo': e['tipo']}
    m = dict(manual.get(e['clave']) or {})
    if e.get('buscar') and not m.get('buscar') and not m.get('id'):
        m['buscar'] = e['buscar']
    # emparejar() busca la clave con su propio formato: se le pasa la corrección ya resuelta
    from emparejar_tmdb import clave as clave_emp
    res = emparejar({'catalogo': [{'titulo': e['titulo']}]}, r, {clave_emp(r): m} if m else {})
    if not res or res['confianza'] < UMBRAL:
        revisar.append(f"{e['clave']:44} {e['titulo'][:40]:40} ({e.get('anio')}) → "
                       + (f"{res['encontrado']} [{res['confianza']}] {res['tipo']}/{res['id']}" if res else 'NADA'))
        if not res or not m.get('aceptar'):
            return None
    return res


def titulo_es(res):
    d = tmdb.detalle(res['tipo'], res['id'])
    es = (d.get('title') or d.get('name') or '').strip()
    original = (d.get('original_title') or d.get('original_name') or '').strip()
    fecha = d.get('release_date') or d.get('first_air_date') or ''
    return es, original, int(fecha[:4]) if fecha[:4].isdigit() else None


# ---------------------------------------------------------------- escribir
def main(argv):
    extraido, contenido = Path(argv[0]), Path(argv[1])
    forzar, simular = '--forzar' in argv, '--simular' in argv
    cat = json.loads((extraido / 'catalogo.json').read_text(encoding='utf-8'))
    manual = yaml.safe_load(MANUAL.read_text(encoding='utf-8')) if MANUAL.exists() else {}
    manual = manual or {}

    entradas = entradas_peliculas(cat) + entradas_series(cat) + entradas_animacion(cat)
    ids_marvel = {p.name for p in (contenido / 'titulos' / 'marvel').iterdir()}
    reservados = {'sagas', 'personajes', 'cronologia', 'buscar', 'carpetas', 'udc', 'dcdu', 'series', 'animacion'}
    usados, fichas, cambios = set(), [], []

    # Saga de cada título según las páginas «pelis solo» y las continuidades de animación
    por_heroe = {'batman': 'batman', 'superman': 'superman', 'wonder woman': 'wonder-woman', 'flash': 'flash',
                 'aquaman': 'aquaman', 'shazam': 'shazam'}
    peliculas = [e for e in entradas if e['tipo'] == 'pelicula' and e['seccion'] in ('udc', 'dcdu')]
    for heroe, lista in cat['pelis_solo'].items():
        for p in lista:
            if not p.get('anio'):
                continue
            cand = [e for e in peliculas if e.get('anio') == p['anio']]
            if cand:
                mejor = max(cand, key=lambda e: parecido(unir_titulo(p), e['titulo']))
                if parecido(unir_titulo(p), mejor['titulo']) > 0.35 or len(cand) == 1:
                    mejor['sagas'].append(por_heroe[heroe])
    for e in peliculas:
        if 'trilogia-nolan' in e['sagas'] or e['clave'] in ('dcdu-013',):
            e['sagas'].append('batman')
        if 'superman-cuatrilogia' in e['sagas']:
            e['sagas'].append('superman')
        if e['titulo'].startswith('Joker'):
            e['sagas'].append('joker')
    continuidad, actual = {}, None
    for linea in (extraido / 'texto' / 'animacion' / 'Animación' / 'otras cosas' / 'Continuidades.docx.txt').read_text(encoding='utf-8').splitlines():
        texto = re.sub(r'^\[[^\]]*\]\s*', '', linea).replace('[editar]', '').strip()
        if texto in CONTINUIDADES:
            actual = CONTINUIDADES[texto][0]
        elif actual and texto and not texto.startswith(('Esta', 'Este', 'Estas')):
            continuidad[norm(re.sub(r'\s*\(.*\)$', '', texto))] = actual
    for e in entradas:
        if e['seccion'] == 'animacion' and norm(e['titulo']) in continuidad:
            e['sagas'].append(continuidad[norm(e['titulo'])])

    for e in entradas:
        res = con_tmdb(e, manual)
        m = manual.get(e['clave']) or {}
        titulo_usuario = e['titulo']
        titulo, original, anio_tmdb = (titulo_usuario, None, None)
        if res:
            es, original, anio_tmdb = titulo_es(res)
            titulo = es or titulo_usuario
        titulo = re.sub(r'\s{2,}', ' ', m.get('titulo', titulo)).strip()
        anio = e.get('anio') or anio_tmdb
        if not anio:
            revisar.append(f"{e['clave']}: sin año ni datos de TMDB; no se crea ficha")
            continue
        if e['tipo'] == 'serie' and e.get('temporada') and anio_tmdb and res:
            anio = None  # el año de la temporada lo pone TMDB abajo
        datos = {'titulo': titulo}
        if original and original != titulo:
            datos['tituloOriginal'] = original
        otros = [t for t in [titulo_usuario] if norm(t) not in {norm(titulo), norm(original or '')}]
        if e['seccion'] == 'udc':
            otros.append('PRE-DCUE')
        elif e['seccion'] == 'dcdu':
            otros.append('DCUE')
        if otros:
            datos['otrosTitulos'] = otros
        datos['tipo'] = e['tipo']
        if e.get('animada'):
            datos['animada'] = True
        datos['universo'] = UNIVERSO
        datos['seccion'] = e['seccion']
        if e.get('numero') is not None:
            datos['numero'] = e['numero']
        if e.get('visionado'):
            datos['visionado'] = e['visionado']
        if e.get('enEspera'):
            datos['enEspera'] = True
        if e['calidad']:
            datos['calidad'] = e['calidad']
        if e.get('serie'):
            datos['serie'] = e['serie']
        if e.get('temporada'):
            datos['temporada'] = e['temporada']
        datos['fichaPropia'] = False
        if e['sagas']:
            datos['sagas'] = list(dict.fromkeys(e['sagas']))
        if e['tipo'] == 'serie' and e.get('temporada') and res:
            try:
                temp = tmdb.temporada(res['id'], e['temporada'])
                f = temp.get('air_date') or ''
                anio = int(f[:4]) if f[:4].isdigit() else (anio_tmdb or e.get('anio'))
            except Exception:
                anio = anio_tmdb or e.get('anio')
        datos['anio'] = anio or e.get('anio') or anio_tmdb
        if e.get('anio') and anio_tmdb and e['tipo'] == 'pelicula' and abs(e['anio'] - anio_tmdb) > 1:
            cambios.append(f"{e['clave']}: año {e['anio']} en tus documentos; TMDB dice {anio_tmdb} (se deja el tuyo)")
        if e.get('capitulos'):
            datos['capitulos'] = e['capitulos']
        if res:
            datos['tmdb'] = {'id': res['id'], 'tipo': res['tipo']}
        notas = e['notas'] + ([m['nota']] if m.get('nota') else [])
        if notas:
            datos['notas'] = ' '.join(notas)
        datos['fuente'] = e['fuente']

        ident = m.get('id_ficha') or (slug(titulo) + (f"-t{e['temporada']}" if e.get('temporada') else ''))
        if not ident:
            ident = slug(titulo_usuario)
        if ident in usados or ident in ids_marvel or ident in reservados:
            ident = f"{ident}-{datos['anio']}"
        if ident in usados or ident in ids_marvel:
            ident = f'{ident}-dc'
        usados.add(ident)
        e['id'] = ident
        if titulo != titulo_usuario:
            cambios.append(f"{e['clave']}: «{titulo_usuario}» → «{titulo}»")
        fichas.append((ident, datos, e.get('portada')))

    destino = contenido / 'titulos' / UNIVERSO
    escritas = 0
    if not simular:
        for ident, datos, portada in fichas:
            carpeta = destino / ident
            if carpeta.exists():
                if not forzar:
                    continue
                shutil.rmtree(carpeta)
            carpeta.mkdir(parents=True)
            if portada and Path(portada).exists():
                ext = Path(portada).suffix.lower().replace('jpeg', 'jpg')
                shutil.copyfile(portada, carpeta / f'portada{ext}')
                datos['imagenes'] = [{'src': f'./portada{ext}', 'rol': 'portada'}]
            (carpeta / 'index.md').write_text(f'---\n{volcar(datos)}---\n', encoding='utf-8', newline='\n')
            escritas += 1

        # Sagas
        dsagas = contenido / 'sagas' / UNIVERSO
        dsagas.mkdir(parents=True, exist_ok=True)
        for sid, (nombre, tipo, padre, orden, fuente) in SAGAS.items():
            s = {'nombre': nombre, 'universo': UNIVERSO, 'tipo': tipo}
            if padre:
                s['padre'] = padre
            s.update({'orden': orden, 'fuente': fuente})
            (dsagas / f'{sid}.yaml').write_text(volcar(s), encoding='utf-8', newline='\n')
        for i, (titulo_doc, (sid, nombre)) in enumerate(CONTINUIDADES.items()):
            s = {'nombre': nombre, 'universo': UNIVERSO, 'tipo': 'saga', 'orden': 200 + i,
                 'descripcion': f'Continuidad «{titulo_doc}» de las películas de animación.',
                 'fuente': 'animacion/Animación/otras cosas/Continuidades.docx'}
            (dsagas / f'{sid}.yaml').write_text(volcar(s), encoding='utf-8', newline='\n')

        # Órdenes capítulo a capítulo (Crossover)
        escribir_visionados(cat, entradas, contenido)

    (extraido / 'revisar.txt').write_text('\n'.join(revisar) + '\n', encoding='utf-8', newline='\n')
    (extraido / 'cambios.txt').write_text('\n'.join(cambios) + '\n', encoding='utf-8', newline='\n')
    print(f'{len(fichas)} fichas ({escritas} escritas) · {len(revisar)} a revisar · {len(cambios)} cambios')


def escribir_visionados(cat, entradas, contenido):
    por_serie = {(e.get('serie'), e.get('temporada')): e for e in entradas if e.get('visionado') and e.get('id')}
    destino = contenido / 'visionados' / UNIVERSO
    destino.mkdir(parents=True, exist_ok=True)
    for b in cat['series_paginas']:
        if b['tipo'] != 'crossover':
            continue
        borrador = 'haciendo' in b['pagina']
        # La carpeta: la de la primera temporada con código de capítulo
        carpeta, codigo = None, None
        for o in b['orden']:
            c = codigo_cap(o.get('codigo'))
            if c:
                e = por_serie.get((clave_serie(o['serie'])[1], int(c.split('x')[0])))
                if e:
                    carpeta, codigo = e['visionado']['carpeta'], e['visionado']['codigo']
                    break
        if carpeta is None:
            revisar.append(f"Crossover de {b['pagina']}: no encuentro su carpeta")
            continue
        temporadas_carpeta = {e.get('serie'): e for e in entradas if e.get('visionado', {}).get('carpeta') == carpeta}
        orden = []
        for o in b['orden']:
            sid = clave_serie(o['serie'])[1]
            c = codigo_cap(o.get('codigo'))
            e = por_serie.get((sid, int(c.split('x')[0]))) if c else temporadas_carpeta.get(sid)
            if not e:
                revisar.append(f"Crossover carpeta {carpeta}: «{o['serie']} {o.get('codigo') or ''}» sin ficha")
                continue
            x = {}
            if o.get('n') is not None:
                x['n'] = o['n']
            x['titulo'] = e['id']
            if c:
                x['codigo'] = c
                x['capitulo'] = o['titulo']
            elif o.get('animada'):
                x['nota'] = 'Temporada completa (animación).'
            if o.get('megacrossover'):
                x['megacrossover'] = True
            orden.append(x)
        nombre = f'Carpeta {carpeta}: orden capítulo a capítulo'
        v = {'nombre': nombre, 'universo': UNIVERSO, 'seccion': 'series', 'carpeta': carpeta, 'codigo': codigo}
        if borrador:
            v['borrador'] = True
            v['notas'] = ('Página «series pagina 009 haciendo»: a medio hacer, con los títulos en inglés y sin numerar. '
                          'Su cabecera es una copia de la plantilla.')
        v['orden'] = orden
        v['fuente'] = f"Archivador AZUL/{Path(b['pagina']).stem}"
        (destino / f'carpeta-{carpeta:02d}.yaml').write_text(volcar(v), encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main(sys.argv[1:])

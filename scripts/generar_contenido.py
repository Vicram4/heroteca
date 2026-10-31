"""
Convierte las entradas emparejadas (entradas.json) en fichas de la web.

Uso:
    .venv/Scripts/python.exe scripts/generar_contenido.py <carpeta_extraido> <carpeta_contenido> [--solo clave1,clave2] [--forzar]

Por cada entrada crea `<contenido>/titulos/marvel/<id>/index.md` con sus imágenes al lado,
y `<contenido>/sagas/marvel/<saga>.yaml` a partir de datos/agrupaciones-marvel.yaml.

Reglas:
- Lo que viene de tus documentos manda. TMDB solo se usa aquí para el título oficial en España,
  el título original y para comprobar erratas evidentes (cada cambio queda anotado en `notas`
  y en cambios.txt). El resto de datos de TMDB se añade al compilar la web (Fase 5).
- Nunca sobrescribe una ficha que ya existe (usa --forzar para regenerarla).
"""
import difflib
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
UNIVERSO = 'marvel'
DISTRIBUIDORAS = ['Columbia Pictures', 'Walt Disney Studios', 'Paramount Pictures', 'Universal Pictures',
                  '20th Century Fox', 'Sony Pictures', 'Warner Bros.', 'New Line Cinema', 'Lionsgate']


# ---------------------------------------------------------------- utilidades de texto
def slug(texto):
    t = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode().lower()
    t = re.sub(r'(?<=\b[a-z])\.(?=[a-z]\b)', '', t).replace('.', '')  # S.H.I.E.L.D. → shield
    t = t.replace('&', ' y ')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def titulo_limpio(texto):
    """Solo arreglos de puntuación: punto final, espacios antes de ':' y dobles espacios."""
    t = re.sub(r'\s+:', ':', texto or '')
    t = re.sub(r'\s*\((Trilogía|Dulogía|Cuatrilogía)[^)]*\)?', '', t)
    t = re.sub(r'\s{2,}', ' ', t).strip()
    return t[:-1].rstrip() if t.endswith('.') and not t.endswith('..') else t


def titulo_oficial(texto):
    """'Marvel - Daredevil' → 'Daredevil'; 'Marvel One-Shot: El consultor' → 'El consultor'."""
    t = re.sub(r"^(Marvel\s*-\s*|Marvel One-Shot:\s*|Marvel's\s+|Marvel\s+(?=Agentes))", '', texto or '').strip()
    return t[:1].upper() + t[1:] if t else t


def personaje_limpio(texto):
    return re.sub(r'(\s*/\s*)+', ' / ', texto or '').strip(' /')


def parrafos(texto):
    """Une las líneas cortadas a mitad de frase por el ancho de la diapositiva."""
    resultado = []
    for linea in (l.strip() for l in (texto or '').split('\n')):
        if not linea:
            continue
        if resultado and not re.search(r'[.!?:;»"”)…]$', resultado[-1]):
            resultado[-1] += ' ' + linea
        else:
            resultado.append(linea)
    return '\n\n'.join(resultado)


def norm(t):
    return unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode().lower().strip()


# ---------------------------------------------------------------- erratas
class Corrector:
    """Compara nombres con los de TMDB y corrige solo las erratas evidentes."""

    def __init__(self):
        self.cambios = []
        self.revisar = []

    @staticmethod
    def nucleo(t):
        """Sin iniciales, puntuación ni apóstrofos: 'S. J. Clarkson' y 'SJ Clarkson' quedan iguales."""
        t = norm(t).replace('’', "'").replace("'", '').replace('-', ' ')
        t = re.sub(r'[.,]', ' ', t)
        palabras = [p for p in t.split() if len(p) > 1 or not p.isalpha()]
        return ' '.join(palabras)

    def nombre(self, valor, candidatos, campo, ficha):
        if not valor or not candidatos:
            return valor
        sin_iniciales = lambda t: ' '.join(p for p in self.nucleo(t).split() if len(p) > 2)  # noqa: E731
        if any(self.nucleo(valor) == self.nucleo(c) for c in candidatos) or \
                any(self.nucleo(valor).replace(' ', '') == self.nucleo(c).replace(' ', '') for c in candidatos) or \
                any(sin_iniciales(valor) == sin_iniciales(c) and len(valor.split()) > 1 for c in candidatos):
            return valor  # solo cambian mayúsculas, iniciales, puntuación o apóstrofos: se respeta el tuyo
        r = lambda a, b: difflib.SequenceMatcher(None, self.nucleo(a), self.nucleo(b)).ratio()  # noqa: E731
        mejor = max(candidatos, key=lambda c: r(valor, c))
        # Nombre cortado ("Elizabeth" → "Elizabeth Henstridge"): un único candidato que empieza igual
        empiezan = [c for c in candidatos if self.nucleo(c).startswith(self.nucleo(valor) + ' ')]
        if len(valor.split()) == 1 and len(empiezan) == 1:
            self.cambios.append((ficha, campo, valor, empiezan[0]))
            return empiezan[0]
        if r(valor, mejor) < 0.8:
            return valor
        a, b = self.nucleo(valor).split(), self.nucleo(mejor).split()
        if a and b and a[-1] == b[-1] and a[0] != b[0]:
            # Mismo apellido, distinto nombre de pila
            if a[0].startswith(b[0]) or b[0].startswith(a[0]):
                return valor  # forma corta del mismo nombre (Doug / Douglas): no es errata
            if difflib.SequenceMatcher(None, a[0], b[0]).ratio() < 0.75:
                self.revisar.append((ficha, campo, valor, mejor))  # ¿Joe o Josh? lo decide el usuario
                return valor
        elif r(valor, mejor) < 0.86 or abs(len(valor) - len(mejor)) > 4:
            return valor
        self.cambios.append((ficha, campo, valor, mejor))
        return mejor

    def lista(self, valores, candidatos, campo, ficha):
        salida = []
        for v in valores:
            # Dos nombres pegados: "Maurissa TancharoenJeffrey Bell"
            pegado = re.search(r'[a-zá-ú][A-ZÁ-Ú]', v)
            if pegado and not any(norm(v) == norm(c) for c in candidatos):
                a, b = v[:pegado.start() + 1], v[pegado.start() + 1:]
                if any(norm(a) == norm(c) for c in candidatos) or any(norm(b) == norm(c) for c in candidatos):
                    self.cambios.append((ficha, campo, v, f'{a} · {b}'))
                    salida += [self.nombre(a, candidatos, campo, ficha), self.nombre(b, candidatos, campo, ficha)]
                    continue
            salida.append(self.nombre(v, candidatos, campo, ficha))
        return list(dict.fromkeys(salida))


# ---------------------------------------------------------------- imágenes
def huella_visual(ruta):
    from PIL import Image
    with Image.open(ruta) as im:
        pixeles = list(im.convert('L').resize((8, 8)).tobytes())
    media = sum(pixeles) / len(pixeles)
    return sum(1 << i for i, p in enumerate(pixeles) if p > media)


def rol_imagen(im, ya):
    x, y = im['pos']
    if x is not None and x < 4 and y is not None and 3 <= y < 7 and 'portada' not in ya:
        return 'portada'
    if x is not None and x < 4 and y is not None and 8 <= y < 12 and 'contraportada' not in ya:
        return 'contraportada'
    return 'imagen'


# ---------------------------------------------------------------- construir una ficha
def construir(e, corrector, manual):
    partes, catalogo = e['partes'], e['catalogo']
    base = partes[0] if partes else catalogo[0]
    clave = e['clave']
    m = manual.get(clave) or {}
    d = tmdb.detalle(e['tmdb']['tipo'], e['tmdb']['id']) if e.get('tmdb') else None
    notas = [a for p in partes for a in p.get('avisos', [])]

    tu_titulo = titulo_limpio(base['titulo'])
    original = ((d.get('original_title') or d.get('original_name')) if d else '') or None
    oficial = titulo_oficial((d.get('title') or d.get('name')) if d else '') or tu_titulo
    if not slug(oficial):  # sin traducción en TMDB (p. ej. solo en japonés): se usa el tuyo
        oficial = tu_titulo
    # En España muchas se estrenan con el título original (WandaVision, Men in Black): si el tuyo
    # coincide con el original, se queda el tuyo. En Animación no, porque allí copiaste los títulos en inglés.
    elif (e['seccion'] != 'animacion' and not base.get('fuente', '').startswith('EL INDICE')
          and original and norm(tu_titulo) == norm(titulo_oficial(original))):
        oficial = titulo_oficial(original)
    if m.get('titulo'):  # revisado a mano
        oficial = m['titulo']
    datos = {'titulo': oficial}
    if original and norm(original) != norm(oficial):
        datos['tituloOriginal'] = original
    otros = [t for t in dict.fromkeys([tu_titulo] + [titulo_limpio(c['titulo']) for c in catalogo])
             if norm(t) not in (norm(oficial), norm(original or ''))]
    if otros:
        datos['otrosTitulos'] = otros

    datos['tipo'] = base['tipo'] if base['tipo'] != 'corto' else 'especial'
    if e.get('animada') or e['seccion'] == 'animacion':
        datos['animada'] = True
    datos['universo'] = UNIVERSO
    datos['seccion'] = e['seccion']
    if not e['conFicha']:
        datos['fichaPropia'] = False

    # Temporada
    temporada = m.get('temporada') or e.get('temporada')
    if base['tipo'] == 'serie' and temporada:
        if m.get('temporada') and m['temporada'] != e.get('temporada'):
            notas.append(f"En los documentos de la colección: temporada {e.get('temporada')}")
        datos['serie'] = slug(oficial)
        datos['temporada'] = temporada
    elif base['tipo'] == 'serie':
        t = max([c.get('temporadas') or 0 for c in catalogo] + [0])
        if t:
            datos['temporadas'] = t

    # Números: los del índice mandan; los tramos de la ficha aportan los capítulos
    numeros = e['numeros']
    if numeros:
        datos['numero'] = numeros[0]
    tramos = []
    for c in sorted(catalogo, key=lambda c: c.get('numero') or 0):
        if c.get('tramo') and c.get('numero') is not None:
            tramo = next((p['tramo'] for p in partes if p.get('tramo') and (p.get('numero') == c['numero'] or p['tramo'] == c['tramo'])), c['tramo'])
            tramos.append({'numero': c['numero'], 'desde': f"{temporada}x{tramo[0]:02d}", 'hasta': f"{temporada}x{tramo[1]:02d}"})
    if len(tramos) > 1:
        datos['tramos'] = tramos
    for p in partes:
        if p.get('numero') is not None and p['numero'] not in numeros:
            notas.append(f"La ficha dice número {p['numero']:03d}; tu índice dice {', '.join(f'{n:03d}' for n in numeros)}")

    if base.get('paginaArchivador'):
        datos['paginaArchivador'] = base['paginaArchivador']
    calidad = list(dict.fromkeys(c for p in partes for c in p.get('calidad', [])))
    if calidad:
        datos['calidad'] = calidad

    # Año: tus documentos; si difiere en más de un año del estreno real, es una errata
    anio = base.get('anio') or next((c.get('anio') for c in catalogo if c.get('anio')), None)
    fecha_tmdb = ''
    if d:
        fecha_tmdb = d.get('release_date') or d.get('first_air_date') or ''
        if base['tipo'] == 'serie' and temporada:
            s = tmdb.temporada(e['tmdb']['id'], m.get('temporadaTmdb', temporada)) if e['tmdb']['tipo'] == 'tv' else None
            fecha_tmdb = (s or {}).get('air_date') or fecha_tmdb
    anio_tmdb = int(fecha_tmdb[:4]) if fecha_tmdb[:4].isdigit() else None
    if anio and anio_tmdb and abs(anio - anio_tmdb) > 1 and e['tmdb']['tipo'] == 'movie':
        corrector.cambios.append((clave, 'anio', str(anio), str(anio_tmdb)))
        notas.append(f'En los documentos de la colección el año era {anio}')
        anio = anio_tmdb
    datos['anio'] = anio or anio_tmdb
    anios = sorted({p['anio'] for p in partes if p.get('anio')} | {c['anioFin'] for c in catalogo if c.get('anioFin')})
    if anios and anios[-1] > datos['anio']:
        datos['anioFin'] = anios[-1]

    # Créditos y empresas (con comprobación de erratas)
    cred = (d or {}).get('credits') or {}
    agg = (d or {}).get('aggregate_credits') or {}
    equipo = [c['name'] for c in cred.get('crew', [])] + [c['name'] for c in agg.get('crew', [])]
    for c in (d or {}).get('created_by', []):
        equipo.append(c['name'])
    actores = [c['name'] for c in cred.get('cast', [])] + [c['name'] for c in agg.get('cast', [])]
    personajes = [c.get('character', '') for c in cred.get('cast', [])] + \
                 [r.get('character', '') for c in agg.get('cast', []) for r in c.get('roles', [])]
    empresas = [c['name'] for c in (d or {}).get('production_companies', [])]

    if base.get('nacionalidad'):
        datos['nacionalidad'] = base['nacionalidad']
    if base.get('duracion'):
        datos['duracion'] = base['duracion']
    for campo, candidatos in (('direccion', equipo), ('guion', equipo), ('productora', empresas),
                              ('distribuidora', empresas + DISTRIBUIDORAS)):
        if base.get(campo):
            v = corrector.lista(base[campo], candidatos, campo, clave)
            datos[campo] = v[0] if len(v) == 1 else v
    if base.get('argumento'):
        datos['argumento'] = parrafos(base['argumento'])
    if base.get('reparto'):
        reparto = []
        for r in base['reparto']:
            fila = {'actor': corrector.nombre(r['actor'], actores, 'actor', clave)}
            if r.get('personaje'):
                fila['personaje'] = personaje_limpio(r['personaje'])
            reparto.append(fila)
        datos['reparto'] = reparto

    # Capítulos (solo de tus fichas; los de TMDB se añaden al compilar)
    if base['tipo'] == 'serie' and partes:
        s = tmdb.temporada(e['tmdb']['id'], m.get('temporadaTmdb', temporada)) if d and e['tmdb']['tipo'] == 'tv' and temporada else {}
        equipo_cap = equipo + [c['name'] for ep in (s or {}).get('episodes', []) for c in ep.get('crew', [])]
        detalle = {c['codigo']: c for p in partes for c in p['capitulos']}
        lista = {c['codigo']: c for p in partes for c in p.get('listaCapitulos', [])}
        argumentos_vistos = {}
        capitulos = []
        for codigo in sorted(set(detalle) | set(lista), key=lambda c: int(c.split('x')[1])):
            c = dict(detalle.get(codigo) or lista[codigo])
            c['titulo'] = titulo_limpio(c.get('titulo') or lista.get(codigo, {}).get('titulo', ''))
            if c.get('argumento'):
                c['argumento'] = parrafos(c['argumento'])
                if c['argumento'] in argumentos_vistos:  # copiado del capítulo anterior por error
                    notas.append(f"El argumento de {codigo} era el mismo que el de {argumentos_vistos[c['argumento']]}; se ha dejado vacío")
                    del c['argumento']
                else:
                    argumentos_vistos[c['argumento']] = codigo
            for campo in ('direccion', 'guion'):
                if c.get(campo):
                    v = corrector.lista(c[campo], equipo_cap, campo, f'{clave} {codigo}')
                    c[campo] = v[0] if len(v) == 1 else v
            capitulos.append({k: v for k, v in c.items() if v})
        if capitulos:
            datos['capitulos'] = capitulos
            dur = {c.get('duracion') for c in capitulos if c.get('duracion')}
            if len(dur) == 1 and 'duracion' not in datos:
                datos['duracion'] = dur.pop()

    if e.get('tmdb'):
        datos['tmdb'] = {'id': e['tmdb']['id'], 'tipo': e['tmdb']['tipo']}
    if m.get('nota'):
        notas.append(m['nota'])
    if notas:
        datos['notas'] = ' · '.join(dict.fromkeys(notas))
    datos['fuente'] = '; '.join(dict.fromkeys([p['fuente'] for p in partes] + [c['fuente'] for c in catalogo]))
    imagenes = [im for p in partes for im in p['imagenes']]
    return datos, imagenes


# ---------------------------------------------------------------- escritura
class Volcador(yaml.SafeDumper):
    pass


def _str(dumper, valor):
    estilo = '|' if '\n' in valor else ('"' if re.fullmatch(r'[\d\s.,:+\-]+', valor) else None)
    return dumper.represent_scalar('tag:yaml.org,2002:str', valor, style=estilo)


Volcador.add_representer(str, _str)


def volcar(datos):
    return yaml.dump(datos, Dumper=Volcador, allow_unicode=True, sort_keys=False, width=1000)


def escribir(ident, datos, imagenes, origen_img, destino, forzar):
    carpeta = destino / ident
    if carpeta.exists():
        if not forzar:
            return False
        shutil.rmtree(carpeta)
    carpeta.mkdir(parents=True)
    lista, ya, n, huellas = [], set(), 0, []
    for im in imagenes:
        huella = huella_visual(origen_img / im['archivo'])
        if any(bin(huella ^ h).count('1') <= 4 for h in huellas):
            continue  # la misma imagen guardada dos veces
        huellas.append(huella)
        rol = rol_imagen(im, ya)
        ya.add(rol)
        ext = Path(im['archivo']).suffix.lower().replace('jpeg', 'jpg')
        if rol == 'imagen':
            n += 1
            nombre = f'imagen-{n}{ext}'
        else:
            nombre = f'{rol}{ext}'
        shutil.copyfile(origen_img / im['archivo'], carpeta / nombre)
        lista.append({'src': f'./{nombre}', 'rol': rol})
    if lista:
        datos['imagenes'] = lista
    (carpeta / 'index.md').write_text(f'---\n{volcar(datos)}---\n', encoding='utf-8', newline='\n')
    return True


def main(argv):
    extraido, contenido = Path(argv[0]), Path(argv[1])
    solo = set(argv[argv.index('--solo') + 1].split(',')) if '--solo' in argv else None
    forzar = '--forzar' in argv
    entradas = json.loads((extraido / 'entradas.json').read_text(encoding='utf-8'))
    manual = yaml.safe_load((RAIZ / 'datos' / 'tmdb-manual.yaml').read_text(encoding='utf-8')) or {}
    agrup = yaml.safe_load((RAIZ / 'datos' / f'agrupaciones-{UNIVERSO}.yaml').read_text(encoding='utf-8'))['sagas']
    corrector = Corrector()

    # 1) Construir todas las fichas y decidir ids únicos
    fichas, omitidas = [], []
    for e in entradas:
        if (manual.get(e['clave']) or {}).get('omitir'):
            omitidas.append(f"{e['clave']}: {manual[e['clave']].get('nota', '')}")
            continue
        datos, imagenes = construir(e, corrector, manual)
        ident = (f"{datos['serie']}-t{datos['temporada']}" if datos.get('temporada') else slug(datos['titulo']))
        fichas.append([e['clave'], ident, datos, imagenes, e])
    usados = {}
    for f in fichas:
        usados.setdefault(f[1], []).append(f)
    for ident, grupo in usados.items():
        if len(grupo) > 1:  # mismo título en distintos años (Spider-Man 1977 / 2002)
            for f in grupo:
                f[1] = f"{ident}-{f[2]['anio']}"
                if f[2].get('serie'):
                    f[2]['serie'] = f"{f[2]['serie']}-{f[2]['anio']}"
    vistos = {}
    for f in fichas:  # mismo título y año: película y serie distintas (El increíble Hulk 1977)
        if f[1] in vistos and f[2]['tipo'] == 'serie':
            f[1] = f'{f[1]}-serie'
        elif f[1] in vistos:
            otro = vistos[f[1]]
            otro[1] = f'{otro[1]}-serie'
        vistos[f[1]] = f

    # 2) Sagas: de agrupaciones + LEGO automático
    por_clave = {f[0]: f for f in fichas}
    for clave, f in por_clave.items():
        if any(c.get('grupoIndice') == 'LEGO' for c in f[4]['catalogo']):
            agrup['lego']['fichas'].append(clave)
    for saga_id, s in agrup.items():
        for clave in s.get('fichas', []):
            if clave in por_clave:
                por_clave[clave][2].setdefault('sagas', []).append(saga_id)
            else:
                print(f'Aviso: la saga {saga_id} menciona {clave}, que no existe')
    for f in fichas:  # colocar "sagas" detrás de "seccion"/"numero" para que se lea mejor
        if 'sagas' in f[2]:
            sagas = f[2].pop('sagas')
            orden = list(f[2].items())
            pos = next(i for i, (k, _) in enumerate(orden) if k == 'anio')
            f[2] = dict(orden[:pos] + [('sagas', sagas)] + orden[pos:])

    carpeta_sagas = contenido / 'sagas' / UNIVERSO
    carpeta_sagas.mkdir(parents=True, exist_ok=True)
    for saga_id, s in agrup.items():
        datos = {'nombre': s['nombre'], 'universo': UNIVERSO, 'tipo': s['tipo']}
        for k in ('padre', 'orden', 'descripcion', 'notas', 'fuente'):
            if s.get(k) is not None:
                datos[k] = s[k]
        (carpeta_sagas / f'{saga_id}.yaml').write_text(volcar(datos), encoding='utf-8', newline='\n')

    # 3) Escribir fichas
    destino = contenido / 'titulos' / UNIVERSO
    creadas, existentes = [], []
    for clave, ident, datos, imagenes, e in fichas:
        if solo and clave not in solo and ident not in solo:
            continue
        ok = escribir(ident, datos, imagenes, extraido / 'imagenes', destino, forzar)
        (creadas if ok else existentes).append(ident)
        if not ok:
            print(f'  Ya existía: {ident} ({clave})')

    # 4) Informe de cambios
    lineas = [f'{f:28} {campo:13} {antes!r} → {despues!r}' for f, campo, antes, despues in corrector.cambios]
    titulos = [f"{f[0]:28} {titulo_limpio((f[4]['partes'] or f[4]['catalogo'])[0]['titulo'])!r} → {f[2]['titulo']!r}"
               for f in fichas if norm(titulo_limpio((f[4]['partes'] or f[4]['catalogo'])[0]['titulo'])) != norm(f[2]['titulo'])]
    dudosas = sorted({f'{f:28} {campo:13} {antes!r} → ¿{despues!r}?' for f, campo, antes, despues in corrector.revisar})
    (extraido / 'cambios.txt').write_text('ERRATAS CORREGIDAS\n' + '\n'.join(lineas)
                                          + '\n\nPOSIBLES ERRATAS (no corregidas, revisar)\n' + '\n'.join(dudosas)
                                          + '\n\nTÍTULOS (tu título → título oficial)\n' + '\n'.join(titulos) + '\n', encoding='utf-8')
    if omitidas:
        print('Omitidas (duplicados):', *omitidas, sep='\n  ')
    print(f'Fichas creadas: {len(creadas)} · ya existían (no tocadas): {len(existentes)} · sagas: {len(agrup)}')
    print(f'Posibles erratas para revisar: {len(dudosas)}')
    print(f'Erratas corregidas: {len(lineas)} · títulos cambiados: {len(titulos)} (ver cambios.txt)')


if __name__ == '__main__':
    main(sys.argv[1:])

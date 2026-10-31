"""
Convierte las fichas extraídas (fichas.json) en archivos de contenido de la web.

Uso:
    .venv/Scripts/python.exe scripts/generar_contenido.py <carpeta_extraido> <carpeta_titulos> [--solo id1,id2]

Por cada ficha crea `<carpeta_titulos>/<id>/index.md` con sus imágenes al lado
(portada.jpg, contraportada.jpg…). Las temporadas repartidas en varios números
de la cronología (Agentes de SHIELD) se unen en una sola ficha con `tramos`.
Nunca sobrescribe una ficha que ya existe, para no perder cambios hechos a mano
(usa --forzar para regenerarla).
"""
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

import yaml


def slug(texto):
    t = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode().lower()
    t = t.replace('&', ' y ')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def titulo_limpio(texto):
    """Solo arreglos de puntuación: punto final, espacios antes de ':' y dobles espacios."""
    t = re.sub(r'\s+:', ':', texto or '')
    t = re.sub(r'\s{2,}', ' ', t).strip()
    return t[:-1].rstrip() if t.endswith('.') and not t.endswith('..') else t


def personaje_limpio(texto):
    """'Steve Rogers / / Capitán América' → 'Steve Rogers / Capitán América'."""
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


def huella_visual(ruta):
    """Huella media 8x8: dos copias de la misma imagen dan la misma huella aunque el archivo difiera."""
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


def unir_temporadas(fichas):
    """Agrupa las fichas de serie por (título, temporada); las películas quedan igual."""
    salida, grupos = [], {}
    for f in fichas:
        if f['tipo'] != 'serie':
            salida.append(f)
            continue
        clave = (slug(f['titulo']), f['temporada'])
        if clave in grupos:
            grupos[clave].append(f)
        else:
            grupos[clave] = [f]
            salida.append(grupos[clave])
    return salida


def ficha_a_datos(grupo):
    partes = grupo if isinstance(grupo, list) else [grupo]
    base = partes[0]
    titulo = titulo_limpio(base['titulo'])
    datos = {'titulo': titulo, 'tipo': base['tipo'], 'universo': 'marvel', 'seccion': base['seccion']}
    avisos = [a for p in partes for a in p['avisos']]

    if base['tipo'] == 'serie':
        serie = slug(titulo)
        t = base['temporada']
        ident = f'{serie}-t{t}'
        datos['serie'] = serie
        datos['temporada'] = t
        tramos = [p for p in partes if p.get('tramo')]
        if tramos:
            datos['numero'] = tramos[0]['numero']
            datos['tramos'] = [{'numero': p['numero'], 'desde': f"{t}x{p['tramo'][0]:02d}",
                                'hasta': f"{t}x{p['tramo'][1]:02d}"} for p in tramos]
        else:
            datos['numero'] = base['numero']
    else:
        # En Pre-UMC se repiten títulos (Spider-Man 1977 y 2002): el año los distingue.
        ident = slug(titulo) if base['seccion'] == 'umc' else f"{slug(titulo)}-{base.get('anio', '')}".strip('-')
        if base.get('numero') is not None:
            datos['numero'] = base['numero']

    if base.get('paginaArchivador'):
        datos['paginaArchivador'] = base['paginaArchivador']
    datos['anio'] = base.get('anio')
    anios = sorted({p['anio'] for p in partes if p.get('anio')})
    if len(anios) > 1:
        datos['anioFin'] = anios[-1]
    for campo in ('nacionalidad', 'duracion', 'direccion', 'guion', 'productora', 'distribuidora'):
        if base.get(campo):
            v = base[campo]
            datos[campo] = v[0] if isinstance(v, list) and len(v) == 1 else v
    calidad = list(dict.fromkeys(c for p in partes for c in p.get('calidad', [])))
    if calidad:
        datos['calidad'] = calidad
    if base.get('argumento'):
        datos['argumento'] = parrafos(base['argumento'])
    if base.get('reparto'):
        datos['reparto'] = [{k: (personaje_limpio(v) if k == 'personaje' else v) for k, v in r.items() if v}
                            for r in base['reparto']]

    if base['tipo'] == 'serie':
        detalle = {c['codigo']: c for p in partes for c in p['capitulos']}
        lista = {c['codigo']: c for p in partes for c in p.get('listaCapitulos', [])}
        capitulos = []
        for codigo in sorted(set(detalle) | set(lista), key=lambda c: int(c.split('x')[1])):
            c = dict(detalle.get(codigo) or lista[codigo])
            c['titulo'] = titulo_limpio(c.get('titulo') or lista.get(codigo, {}).get('titulo', ''))
            if c.get('argumento'):
                c['argumento'] = parrafos(c['argumento'])
            for campo in ('direccion', 'guion'):
                if campo in c and len(c[campo]) == 1:
                    c[campo] = c[campo][0]
            capitulos.append({k: v for k, v in c.items() if v})
        if capitulos:
            datos['capitulos'] = capitulos
        duraciones = {c.get('duracion') for c in capitulos if c.get('duracion')}
        if len(duraciones) == 1 and 'duracion' not in datos:
            datos['duracion'] = duraciones.pop()

    if avisos:
        datos['notas'] = ' · '.join(dict.fromkeys(avisos))
    fuentes = [p['fuente'] for p in partes]
    datos['fuente'] = '; '.join(fuentes)
    return ident, datos, [im for p in partes for im in p['imagenes']]


class Volcador(yaml.SafeDumper):
    pass


def _str(dumper, valor):
    # Textos que parecen números o fechas ("084", "1x01") van entre comillas para no cambiar de tipo.
    estilo = '|' if '\n' in valor else ('"' if re.fullmatch(r'[\d\s.,:+\-]+', valor) else None)
    return dumper.represent_scalar('tag:yaml.org,2002:str', valor, style=estilo)


Volcador.add_representer(str, _str)


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
            continue  # la misma imagen guardada dos veces (p. ej. en cada parte de una temporada)
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
    cabecera = yaml.dump(datos, Dumper=Volcador, allow_unicode=True, sort_keys=False, width=1000)
    (carpeta / 'index.md').write_text(f'---\n{cabecera}---\n', encoding='utf-8')
    return True


def main(argv):
    extraido, destino = Path(argv[0]), Path(argv[1])
    solo = set(argv[argv.index('--solo') + 1].split(',')) if '--solo' in argv else None
    forzar = '--forzar' in argv
    fichas = json.loads((extraido / 'fichas.json').read_text(encoding='utf-8'))
    creadas, existentes = [], []
    for grupo in unir_temporadas(fichas):
        ident, datos, imagenes = ficha_a_datos(grupo)
        if solo and ident not in solo:
            continue
        (creadas if escribir(ident, datos, imagenes, extraido / 'imagenes', destino, forzar) else existentes).append(ident)
    print(f'Creadas: {len(creadas)}  ·  Ya existían (no tocadas): {len(existentes)}')
    for i in creadas:
        print('  +', i)


if __name__ == '__main__':
    main(sys.argv[1:])

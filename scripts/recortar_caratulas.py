"""
Recorta los márgenes blancos (o transparentes) que traen algunas carátulas de los documentos,
para que la caja ocupe toda la imagen en la estantería y en la ficha.

Uso:
    .venv/Scripts/python.exe scripts/recortar_caratulas.py contenido/titulos            # solo informa
    .venv/Scripts/python.exe scripts/recortar_caratulas.py contenido/titulos --aplicar  # recorta

Trabaja sobre las imágenes de contenido/ (copias); los documentos originales no se tocan.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

UMBRAL_COLOR = 28      # diferencia con el blanco a partir de la cual un píxel es «contenido»
MARGEN_MINIMO = 0.04   # solo se recorta si algún borde vacío supera el 4 % del lado
HOLGURA = 2            # píxeles que se dejan alrededor del contenido


def caja_contenido(im):
    """Rectángulo con contenido, ignorando el blanco y lo transparente."""
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        rgba = im.convert('RGBA')
        fondo = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
        rgb = Image.alpha_composite(fondo, rgba).convert('RGB')
    else:
        rgb = im.convert('RGB')
    diferencia = ImageChops.difference(rgb, Image.new('RGB', rgb.size, (255, 255, 255))).convert('L')
    mascara = diferencia.point(lambda p: 255 if p > UMBRAL_COLOR else 0)
    return mascara.getbbox()


def analizar(ruta):
    with Image.open(ruta) as im:
        im.load()
        w, h = im.size
        caja = caja_contenido(im)
    if not caja:
        return None
    x0, y0, x1, y1 = caja
    margenes = (x0 / w, y0 / h, (w - x1) / w, (h - y1) / h)
    if max(margenes) < MARGEN_MINIMO:
        return None
    caja = (max(0, x0 - HOLGURA), max(0, y0 - HOLGURA), min(w, x1 + HOLGURA), min(h, y1 + HOLGURA))
    return (w, h), caja, margenes


def main(carpeta, aplicar):
    carpeta = Path(carpeta)
    rutas = sorted(p for p in carpeta.rglob('*') if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')
                   and p.stem in ('portada', 'contraportada'))
    hallados = 0
    for ruta in rutas:
        r = analizar(ruta)
        if not r:
            continue
        hallados += 1
        (w, h), caja, m = r
        nuevo = (caja[2] - caja[0], caja[3] - caja[1])
        print(f"{ruta.relative_to(carpeta)}  {w}x{h} → {nuevo[0]}x{nuevo[1]}  "
              f"(márgenes izq {m[0]:.0%} arr {m[1]:.0%} der {m[2]:.0%} abj {m[3]:.0%})")
        if aplicar:
            with Image.open(ruta) as im:
                recorte = im.crop(caja)
                opciones = {'quality': 92} if ruta.suffix.lower() in ('.jpg', '.jpeg', '.webp') else {}
                if recorte.mode in ('RGBA', 'P') and ruta.suffix.lower() in ('.jpg', '.jpeg'):
                    recorte = recorte.convert('RGB')
                recorte.save(ruta, **opciones)
    print(f'\n{hallados} de {len(rutas)} imágenes con márgenes' + (' (recortadas)' if aplicar else ' (sin tocar; usa --aplicar)'))


if __name__ == '__main__':
    main(sys.argv[1], '--aplicar' in sys.argv)

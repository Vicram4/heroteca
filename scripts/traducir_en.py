"""
Añade los textos en inglés de la versión /en/: notas de las fichas (notasEn), nombres de sagas
(nombreEn, descripcionEn) y de personajes (nombreEn). No toca lo que ya tenga traducción.

Uso:
    .venv/Scripts/python.exe scripts/traducir_en.py

Las notas se traducen con reglas (abajo). Si aparece una nota que ninguna regla entiende, el script
la muestra y no la traduce: basta con añadir su regla y volver a ejecutarlo.
"""
import re
import sys
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent
CONTENIDO = RAIZ / 'contenido'

# ---------------------------------------------------------------- notas (frases sueltas, unidas por « · »)
REGLAS = [
    (r'En la lista «EN ESPERA» del RESUMEN de carpetas\.', 'On the “ON HOLD” list in the collection’s folder summary.'),
    (r'No está en la carpeta «001 UDC» del disco\.', 'Not in the “001 UDC” folder of the drive.'),
    (r'Está en el disco pero aún no en las carpetas de visionado\.', 'On the drive but not yet in the viewing folders.'),
    (r'La colección incluye también otra versión \(montaje alternativo\)\.', 'The collection also includes an alternate cut.'),
    (r'Son dos partes \((\d+) y (\d+)\); los datos de TMDB son de la primera\.', r'It comes in two parts (\1 and \2); TMDB data is for the first one.'),
    (r'Primera mitad de la temporada en la carpeta (\d+)\. La segunda mitad de la temporada va en la carpeta (\d+) \(([\d.]+)\)\.',
     r'First half of the season in folder \1. The second half goes in folder \2 (\3).'),
    (r'Oficialmente es un especial del UMC \(Fase (\d+)\); en los documentos de la colección está en Pre-UMC',
     r'Officially an MCU special (Phase \1); the collection documents place it in Pre-MCU.'),
    (r'No está en el disco\. En los Word de la colección es el n\.º (\d+) de PRE-DCUE; va junto a Joker \((\d+)\), que el disco pone en 002 DCDU\.',
     r'Not on the drive. In the collection’s Word files it is no. \1 of PRE-DCUE; it sits next to Joker (\2), which the drive places in 002 DCDU.'),
    (r'En los documentos de la colección es la temporada (\d+) de Daredevil \(Born Again es su continuación\)',
     r'The collection documents list it as season \1 of Daredevil (Born Again is its continuation).'),
    (r'En los documentos de la colección el año era (\d+)', r'The collection documents gave the year as \1.'),
    (r'En los Word de la colección está en PRE-DCUE \(n\.º (\d+)\); en el disco, en 002 DCDU\. Se sigue el disco\.',
     r'The collection’s Word files place it in PRE-DCUE (no. \1); the drive places it in 002 DCDU. The drive is followed.'),
    (r'En las páginas de series de la colección aparece como ([\d.]+); el RESUMEN de carpetas dice ([\d.]+) \(se sigue el RESUMEN\)\.',
     r'The collection’s series pages list it as \1; the folder summary says \2 (the summary is followed).'),
    (r'En España también se editó como «(.+?)» \(no confundir con la (\d+), de (\d+)\)\.',
     r'In Spain it was also released as “\1” (not to be confused with no. \2, from \3).'),
    (r'El documento (\d+) de la colección se titula «Próximas películas» y habla de (.+?) \((\d+)\)\.',
     r'Collection document \1 is titled “Próximas películas” (Upcoming films) and covers \2 (\3).'),
    (r'El argumento de (\S+) era el mismo que el de (\S+); se ha dejado vacío', r'The plot of \1 was the same as that of \2, so it has been left empty.'),
    (r'Con la banda sonora \(B\.S\.O\.\)\.', 'Includes the soundtrack (OST).'),
    (r'En los documentos de la colección: temporada (\d+)', r'In the collection documents: season \1'),
    (r'En los documentos de la colección ponía «(.+?)» \(errata corregida: (.+?)\)', r'The collection documents said “\1” (typo corrected: \2).'),
    (r'Corregido: la lista de capítulos usaba códigos 1x en la temporada 2', 'Corrected: the episode list used 1x codes for season 2.'),
    (r'Capítulos en la lista sin página de detalle: (.+)', r'Episodes in the list without a detail page: \1'),
    (r'Capítulos con página pero no en la lista: (.+)', r'Episodes with a page but not in the list: \1'),
]


def traducir_nota(nota):
    salida, pendientes = [], []
    for frase in [f.strip() for f in nota.split(' · ') if f.strip()]:
        for patron, ingles in REGLAS:
            if re.fullmatch(patron, frase):
                salida.append(re.sub(patron, ingles, frase))
                break
        else:
            pendientes.append(frase)
    return ' · '.join(salida), pendientes


# ---------------------------------------------------------------- sagas y personajes
SAGAS = {
    'animacion-autonomas': ('Animation: standalone films', 'The “standalone films” continuity of the animated films.'),
    'animacion-dark-knight-returns': ('Animation: The Dark Knight Returns continuity', 'The “The Dark Knight Returns” continuity of the animated films.'),
    'animacion-dcamu': ('DC Animated Movie Universe', 'The “DC Animated Movie Universe” continuity of the animated films.'),
    'animacion-jla': ('Animation: Justice League (JLA) continuity', 'The “Justice League (JLA)” continuity of the animated films.'),
    'animacion-otros-universos': ('Animation: other universes', 'The “other universes” continuity of the animated films.'),
    'animacion-superman-batman': ('Animation: Superman/Batman continuity', 'The “Superman/Batman” continuity of the animated films.'),
    'arrowverso': ('Arrowverse', None),
    'joker': ('Joker (duology)', None),
    'sello-vertigo': ('Vertigo imprint', None),
    'sello-wildstorm': ('Wildstorm imprint', None),
    'shazam': ('Shazam!', None),
    'superman-cuatrilogia': ('Superman (quadrilogy)', None),
    'trilogia-nolan': ('The Dark Knight trilogy', None),
    '4-fantasticos-2005': ('Fantastic Four (2005–2007)', None),
    '4-fantasticos': ('Fantastic Four', 'Films and series.'),
    'blade': (None, 'Trilogy.'),
    'capitan-america-1979': ('Captain America (1979)', 'Duology.'),
    'deadpool': (None, 'Trilogy + short + alternate cut.'),
    **{f'fase-{n}': (f'Phase {n}', None) for n in range(1, 7)},
    'ghost-rider': (None, 'Duology.'),
    'hulk-telefilmes': ('The Incredible Hulk (TV films)', 'Quadrilogy.'),
    'kick-ass': (None, 'Duology.'),
    'kingsman': (None, 'Trilogy.'),
    'men-in-black': (None, 'Quadrilogy.'),
    'saga-infinito': ('Infinity Saga', None),
    'saga-multiverso': ('Multiverse Saga', None),
    'spider-man-raimi': ('Spider-Man (Sam Raimi trilogy)', None),
    'spider-man': (None, 'Multiverse related to the MCU.'),
    'venom': (None, 'Trilogy.'),
    'x-men': (None, 'Films in release order.'),
}
PERSONAJES = {
    # DC
    'chico-bestia': 'Beast Boy', 'dos-caras': 'Two-Face', 'el-pacificador': 'Peacemaker', 'enigma': 'The Riddler',
    'espantapajaros': 'Scarecrow', 'flash-reverso': 'Reverse-Flash', 'flecha-verde': 'Green Arrow', 'hiedra-venenosa': 'Poison Ivy',
    'linterna-verde': 'Green Lantern', 'martian-manhunter': 'Martian Manhunter', 'mr-frio': 'Mr. Freeze', 'patriota': 'Homelander',
    'pinguino': 'The Penguin', 'shazam': 'Shazam!', 'swamp-thing': 'Swamp Thing',
    # Marvel
    'antorcha-humana': 'Human Torch', 'avispa': 'The Wasp', 'bestia': 'Beast', 'bruja-escarlata': 'Scarlet Witch',
    'caballero-luna': 'Moon Knight', 'capitan-america': 'Captain America', 'capitana-marvel': 'Captain Marvel', 'ciclope': 'Cyclops',
    'duende-verde': 'Green Goblin', 'howard-el-pato': 'Howard the Duck', 'la-cosa': 'The Thing', 'lobezno': 'Wolverine',
    'maquina-de-guerra': 'War Machine', 'mercurio': 'Quicksilver', 'mistica': 'Mystique', 'mr-fantastico': 'Mister Fantastic',
    'mujer-invisible': 'Invisible Woman', 'ojo-de-halcon': 'Hawkeye', 'picara': 'Rogue', 'profesor-x': 'Professor X',
    'red-skull': 'Red Skull', 'soldado-de-invierno': 'Winter Soldier', 'tia-may': 'Aunt May', 'tormenta': 'Storm',
    'ultron': 'Ultron', 'vision': 'Vision', 'viuda-negra': 'Black Widow',
}


def volcar_valor(v):
    return yaml.safe_dump(v, allow_unicode=True, width=1000).strip().removesuffix('...').strip()


def insertar_tras(texto, clave, nueva, valor):
    """Añade «nueva: valor» justo después de la línea «clave: …» (si no existe ya)."""
    if re.search(rf'^{nueva}:', texto, re.M):
        return texto
    m = re.search(rf'^{clave}:.*$', texto, re.M)
    linea = f'{nueva}: {volcar_valor(valor)}'
    if not m:
        return texto.rstrip('\n') + '\n' + linea + '\n'
    return texto[: m.end()] + '\n' + linea + texto[m.end():]


def main():
    pendientes, notas, sagas, personajes = [], 0, 0, 0
    for f in sorted(CONTENIDO.glob('titulos/*/*/index.md')):
        texto = f.read_text(encoding='utf-8')
        cab, fm, cuerpo = texto.split('---', 2)
        datos = yaml.safe_load(fm) or {}
        if not datos.get('notas') or datos.get('notasEn'):
            continue
        ingles, faltan = traducir_nota(datos['notas'])
        pendientes += [f'{f.parent.name}: {x}' for x in faltan]
        if ingles and not faltan:
            fm = insertar_tras(fm, 'notas', 'notasEn', ingles)
            f.write_text(cab + '---' + fm + '---' + cuerpo, encoding='utf-8', newline='\n')
            notas += 1
    for f in sorted(CONTENIDO.glob('sagas/*/*.yaml')):
        nombre, desc = SAGAS.get(f.stem, (None, None))
        texto = original = f.read_text(encoding='utf-8')
        if nombre:
            texto = insertar_tras(texto, 'nombre', 'nombreEn', nombre)
        if desc:
            texto = insertar_tras(texto, 'descripcion', 'descripcionEn', desc)
        if texto != original:
            f.write_text(texto, encoding='utf-8', newline='\n')
            sagas += 1
    for f in sorted(CONTENIDO.glob('personajes/*/*.md')):
        if f.stem not in PERSONAJES:
            continue
        texto = f.read_text(encoding='utf-8')
        cab, fm, cuerpo = texto.split('---', 2)
        nuevo = insertar_tras(fm, 'nombre', 'nombreEn', PERSONAJES[f.stem])
        if nuevo != fm:
            f.write_text(cab + '---' + nuevo + '---' + cuerpo, encoding='utf-8', newline='\n')
            personajes += 1
    print(f'Notas traducidas: {notas} · sagas: {sagas} · personajes: {personajes}')
    if pendientes:
        print('Sin regla de traducción (añádela en REGLAS):\n  ' + '\n  '.join(pendientes))
        sys.exit(1)


if __name__ == '__main__':
    main()

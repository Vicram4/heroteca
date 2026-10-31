"""
Añade a las fichas de DC las carátulas de la carpeta «complementos» del disco (portadas y contraportadas).

Uso:
    .venv/Scripts/python.exe scripts/dc_caratulas.py documentos/originales/dc/complementos contenido/titulos/dc

- Portada: se queda la de más resolución (la de tus índices de Word o la de complementos).
- Contraportada: se añade la «trasera» si existe.
Se puede ejecutar varias veces: no duplica imágenes.
"""
import re
import shutil
import sys
from pathlib import Path

import yaml
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from generar_contenido import volcar  # noqa: E402

C = 'Carátulas UDC'
Z = f'{C}/The Ray'  # las carátulas de las «pelis solo» están dentro de esta carpeta
N = f'{C}/Nueva carpeta'
P = f'{C}/pre dcue'

# ficha → (portadas candidatas, contraportadas candidatas)
CARATULAS = {
    # Series
    **{f'arrow-t{i}': ([f'{C}/Arrow/arrow {i}.jpg'], []) for i in range(1, 9)},
    **{f'the-flash-t{i}': ([f'{C}/Flash/flash {i}.jpg'], []) for i in range(1, 6)},
    **{f'gotham-t{i}': ([f'{C}/Gotham/gotham {i}.jpg'], []) for i in range(1, 6)},
    **{f'dc-s-legends-of-tomorrow-t{i}': ([f'{C}/Legends/Legends {i}.jpg'], []) for i in range(1, 5)},
    **{f'smallville-t{i}': ([f'{C}/Smallville/{i}.jpg'], []) for i in range(1, 11)},
    **{f'supergirl-t{i}': ([f'{C}/Supergirl/Supergirl {i}.jpg'], []) for i in range(1, 5)},
    **{f'titans-t{i}': ([f'{C}/Titans/Titans {i}.jpg'], []) for i in range(1, 3)},
    **{f'black-lightning-t{i}': ([f'{C}/Black Light/Black {i}.jpg'], []) for i in range(1, 4)},
    'vixen-t1': ([f'{C}/Vixen/vixen 1.jpg'], []),
    'the-flash-chronicles-of-cisco-t1': ([f'{C}/Cisco/Cisco 1.jpg'], []),
    'constantine-t1': ([f'{C}/Constantine/constantine-serie.jpg'], []),
    'constantine-ciudad-de-demonios': ([f'{C}/Constantine/Constantine City of Demons.jpg'], []),
    'doom-patrol-t1': ([f'{C}/Doom patrol/Doom Patrol.jpg'], []),
    'powerless-t1': ([f'{C}/Powerless/Powerless.jpg'], []),
    'swamp-thing-t1': ([f'{C}/Swam thing/Swam thing.jpg'], []),
    'the-ray-t1': ([f'{C}/The Ray/the Ray.jpg'], []),
    # DCDU (la «Nueva carpeta» va numerada como tus páginas DCUE, por estreno)
    'el-hombre-de-acero': ([f'{N}/001 man of steel frontal.jpg', f'{Z}/z caratulas super/07 el hombre de acero.jpeg'],
                           [f'{N}/001 man of steel trasera.jpg', f'{Z}/z caratulas super/07 trasera.jpeg']),
    'batman-vs-superman-el-amanecer-de-la-justicia': ([f'{N}/002 bat vs super frontal.jpeg'], [f'{N}/002 bat vs super trasera.jpeg']),
    'escuadron-suicida': ([f'{N}/003 suicide squad frontal.jpeg'], [f'{N}/003 suicide squad trasera.jpeg']),
    'wonder-woman-2017': ([f'{N}/004 WW frontal.jpeg', f'{Z}/z caratulas WW/03 WW (2017).jpeg'], [f'{N}/004 WW trasera.jpeg']),
    'liga-de-la-justicia': ([f'{N}/005 justice league frontal.jpeg'], [f'{N}/005 justice league trasera.jpeg']),
    'aquaman': ([f'{N}/006 aquaman fonal.jpeg', f'{Z}/z caratulas aquaman/01 aquaman.jpeg'], [f'{N}/006 aquaman trasera.jpeg']),
    'shazam': ([f'{N}/007 shazam frontal.jpeg', f'{Z}/shazam/01 shazam.jpeg'], [f'{N}/007 shazam trasera.jpeg']),
    'aves-de-presa-y-la-fantabulosa-emancipacion-de-harley-quinn': ([f'{N}/008 birds of prey frontal.jpeg'], [f'{N}/008 birds of prey trasera.jpeg']),
    'wonder-woman-1984': ([f'{N}/009 ww 1984 frontal.jpeg', f'{Z}/z caratulas WW/04 WW 1984 (2020).jpeg'],
                          [f'{N}/009 ww 1984 trasera.jpeg', f'{Z}/z caratulas WW/04 trasera.jpeg']),
    'la-liga-de-la-justicia-de-zack-snyder': ([f'{N}/010 JL Zach frontal.jpeg'], [f'{N}/010 JL zach trasera.jpeg']),
    'el-escuadron-suicida': ([f'{N}/011 the suicide squad frontal.jpeg'], [f'{N}/011 the suicide squad trasera.jpeg']),
    'black-adam': ([f'{N}/012 black adam frontal.jpeg'], [f'{N}/012 black adam trasera.jpeg']),
    'shazam-la-furia-de-los-dioses': ([f'{N}/013 shazam 2 frontal.jpeg', f'{Z}/shazam/02 shazam furia.jpeg'],
                                      [f'{N}/013 shazam 2 trasera.jpeg', f'{Z}/shazam/02 trasera.jpeg']),
    'flash': ([f'{N}/014 the flash frontal.jpeg', f'{Z}/z caratulas flash/04 flash.jpeg'],
              [f'{N}/014 the flash tasera.jpeg', f'{Z}/z caratulas flash/04 trasera.jpeg']),
    'blue-beetle': ([f'{N}/015 blue beatle frontal.jpeg'], [f'{N}/015 blue beatle trasera.jpeg']),
    'aquaman-y-el-reino-perdido': ([f'{N}/016 aquaman 2 fronal.jpeg', f'{Z}/z caratulas aquaman/02 aquaman reino.jpeg'],
                                   [f'{N}/016 aquaman 2 trasera.jpeg', f'{Z}/z caratulas aquaman/02 trasera.jpeg']),
    'joker': ([f'{N}/joker frontal.jpeg'], [f'{N}/joker trasera.png']),
    'joker-folie-a-deux': ([f'{N}/jpker 2.jpeg'], []),
    'the-batman': ([f'{N}/the batman frontal.jpeg', f'{Z}/z caratulas/09 the Batman.jpeg'],
                   [f'{N}/the batman trasera.png', f'{Z}/z caratulas/09 trasera.jpeg']),
    # UDC (numeradas como tus páginas PRE-DCUE)
    'la-cosa-del-pantano': ([f'{P}/05 Swamp Thing frontal.jpg'], [f'{P}/05 Swamp Thing trasera.jfif']),
    'supergirl': ([f'{P}/07 supergirl frontal.jpg'], [f'{P}/07 supergirl trasera.jfif']),
    'el-regreso-de-la-cosa-del-pantano': ([f'{P}/09 Swamp Thing frontal.jfif'], [f'{P}/09 Swamp Thing trasera.jfif']),
    'steel-un-heroe-de-acero': ([f'{P}/14 Stel frontal.jfif'], [f'{P}/14 steel trasera.jfif']),
    'catwoman': ([f'{P}/15 Catwoman frontal.jpg'], [f'{P}/15 catwoman trasera.jpg']),
    'constantine': ([f'{P}/16 constantine frontal.jfif'], [f'{P}/16 constantine trasera.jpg']),
    'v-de-vendetta': ([f'{P}/018 v de vendeta frontal.jpeg'], [f'{P}/018 v de vendta trasera.jpeg']),
    'superman-returns': ([f'{P}/019 superman returns frontal.jpeg', f'{Z}/z caratulas super/06 superman.jpg'],
                         [f'{P}/019 superman returns trasera.jpeg', f'{Z}/z caratulas super/06 trasera.jpeg']),
    'el-caballero-oscuro': ([f'{P}/020 dark nigth frontal.jpeg', f'{Z}/z caratulas/07 caballero oscuro.jpeg'], []),
    'watchmen': ([f'{P}/021 watchmen frontal.jpeg'], [f'{P}/021 watcmen trasera.jpeg']),
    'jonah-hex': ([f'{P}/022 jonah hex frontal.jpeg'], [f'{P}/022 jonah hex trasea.jpeg']),
    'linterna-verde': ([f'{P}/023 green lantern frontal.jpeg'], [f'{P}/023 green lantern trasera.jpeg']),
    'el-caballero-oscuro-la-leyenda-renace': ([f'{P}/024 dark knigt rises.jpeg', f'{Z}/z caratulas/08 renace.jpeg'],
                                              [f'{Z}/z caratulas/08 trasera.jpeg']),
    # Páginas «pelis solo»
    'wonder-woman': ([f'{Z}/z caratulas WW/01 Wonder Woman (1974).jpg'], [f'{Z}/z caratulas WW/01 trasera.jpeg']),
    'the-new-original-wonder-woman': ([f'{Z}/z caratulas WW/02 Wonder Woman (1975).jpg'], [f'{Z}/z caratulas WW/02 trasera.jpg']),
    'the-flash': ([f'{Z}/z caratulas flash/01 The Flash (1990).jpg'], []),
    'the-flash-ii-la-venganza-del-mago-asesino': ([f'{Z}/z caratulas flash/02 The Flash 2 (1991).jpg'], []),
    'the-flash-iii-la-sombra-mortal': ([f'{Z}/z caratulas flash/03 The Flash 3 (1992).jpg'], [f'{Z}/z caratulas flash/03 trasera.jpeg']),
    'superman-y-los-hombres-topo': ([f'{Z}/z caratulas super/01 superman.jpg'], [f'{Z}/z caratulas super/01 trasera.jfif']),
    'superman': ([f'{Z}/z caratulas super/02 superman 1.jpg'], []),
    'superman-ii-la-aventura-continua': ([f'{Z}/z caratulas super/03 superman 2.jpg'], []),
    'superman-iii': ([f'{Z}/z caratulas super/04 superman 3.jpg'], []),
    'superman-iv-en-busca-de-la-paz': ([f'{Z}/z caratulas super/05 superman 4.jpg'], [f'{Z}/z caratulas super/05 trasera.jpg']),
    'batman': ([f'{Z}/z caratulas/01 BATMAN.jpg'], [f'{Z}/z caratulas/01 trasera.jfif']),
    'batman-1989': ([f'{Z}/z caratulas/02 batman.jfif'], []),
    'batman-vuelve': ([f'{Z}/z caratulas/03 batman return.jpg'], []),
    'batman-forever': ([f'{Z}/z caratulas/04 Batman Forever.jpg'], []),
    'batman-y-robin': ([f'{Z}/z caratulas/05 Batman y Robin.jpg'], [f'{Z}/z caratulas/05 Batman trasera.jfif']),
    'batman-begins': ([f'{Z}/z caratulas/06 begins.jpeg'], []),
}


def pixeles(ruta):
    try:
        with Image.open(ruta) as im:
            return im.width * im.height
    except Exception:
        return 0


def mayor(rutas):
    validas = [r for r in rutas if r.exists() and pixeles(r)]
    return max(validas, key=pixeles) if validas else None


def extension(ruta):
    """Formato real de la imagen (las .jfif son JPEG; Astro no acepta esa extensión)."""
    with Image.open(ruta) as im:
        return {'JPEG': '.jpg', 'PNG': '.png', 'WEBP': '.webp', 'GIF': '.gif'}.get(im.format, '.jpg')


def main(origen, destino):
    origen, destino = Path(origen), Path(destino)
    cambios, faltan = [], []
    for ident, (frontales, traseras) in CARATULAS.items():
        carpeta = destino / ident
        archivo = carpeta / 'index.md'
        if not archivo.exists():
            faltan.append(f'ficha inexistente: {ident}')
            continue
        texto = archivo.read_text(encoding='utf-8')
        m = re.match(r'^---\n(.*?)\n---\n?(.*)$', texto, re.S)
        datos, cuerpo = yaml.safe_load(m.group(1)), m.group(2)
        imagenes = datos.get('imagenes', [])
        hecho = []
        for rol, candidatas in (('portada', frontales), ('contraportada', traseras)):
            rutas = [origen / c for c in candidatas]
            for r in rutas:
                if not r.exists():
                    faltan.append(f'{ident}: no existe {r.relative_to(origen)}')
            nueva = mayor(rutas)
            if not nueva:
                continue
            actual = next((i for i in imagenes if i['rol'] == rol), None)
            ruta_actual = carpeta / actual['src'] if actual else None
            if ruta_actual and ruta_actual.exists() and pixeles(ruta_actual) >= pixeles(nueva):
                continue
            nombre = f'{rol}{extension(nueva)}'
            if ruta_actual and ruta_actual.exists() and ruta_actual.name != nombre:
                ruta_actual.unlink()
            shutil.copyfile(nueva, carpeta / nombre)
            imagenes = [i for i in imagenes if i['rol'] != rol] + [{'src': f'./{nombre}', 'rol': rol}]
            hecho.append(f"{rol} ← {nueva.relative_to(origen)}")
        if hecho:
            imagenes.sort(key=lambda i: ['portada', 'contraportada', 'imagen'].index(i['rol']))
            datos['imagenes'] = imagenes
            fuente = datos.get('fuente', '')
            if 'complementos' not in fuente:
                datos['fuente'] = f'{fuente} · Carátulas: complementos/{C}'.strip(' ·')
            archivo.write_text(f'---\n{volcar(datos)}---\n{cuerpo}', encoding='utf-8', newline='\n')
            cambios.append(f"{ident}: " + '; '.join(hecho))
    print('\n'.join(cambios))
    print(f'\n{len(cambios)} fichas actualizadas')
    if faltan:
        print('Avisos:\n  ' + '\n  '.join(faltan))


if __name__ == '__main__':
    main(*sys.argv[1:3])

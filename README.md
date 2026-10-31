# Heroteca

Enciclopedia personal de películas, series, animación y especiales de superhéroes de Marvel y DC.
Es un proyecto de fans, sin ánimo de lucro y no oficial.

Está hecha con [Astro](https://astro.build) (web 100 % estática) y se publica en Vercel.

## Puesta en marcha

```bash
npm install
npm run dev      # servidor local en http://localhost:4321
npm run build    # genera la web en dist/ y valida todos los datos
```

## Cambiar el nombre o el lema

Edita [`src/config/site.ts`](src/config/site.ts). Se actualizan en toda la web.

## Dónde están los datos

```
contenido/
  universos/<id>.yaml               Marvel, DC, Otros… con sus secciones (UMC, Pre-UMC, Animación…)
  sagas/<universo>/<id>.yaml        "Relacionadas": Spider-Man, X-Men, 4 Fantásticos…
  personajes/<universo>/<id>.md
  titulos/<universo>/<id>/index.md  una ficha (película, temporada, One-Shot…) con sus imágenes al lado
```

- El **id** de cada ficha es el **nombre de su carpeta** (`capitan-america-el-primer-vengador`).
  Usa solo minúsculas, números y guiones. El id también forma la URL.
- También vale un archivo suelto (`titulos/marvel/mi-pelicula.md`) si la ficha no tiene imágenes.
- Las subcarpetas `marvel/` y `dc/` solo sirven para ordenar. Lo que cuenta es el campo `universo`.
- Para hacer referencia a otra entrada (una saga, un personaje, otra ficha), escribe su id.

## Añadir o editar una ficha

1. Crea la carpeta `contenido/titulos/marvel/mi-pelicula/` con un `index.md` dentro (puedes copiar uno existente).
2. Pon las imágenes en la misma carpeta (`portada.jpg`, `contraportada.jpg`…).
3. Rellena los datos entre las líneas `---`. Debajo puedes escribir texto libre en Markdown.
4. Ejecuta `npm run build`. Si algo está mal, el error te dirá qué archivo y qué campo revisar.

### Película

```yaml
---
titulo: "Capitán América: El primer Vengador"   # título en España (obligatorio)
tituloOriginal: "Captain America: The First Avenger"
otrosTitulos: []               # otros títulos que también encontrará el buscador
tipo: pelicula                 # pelicula | serie | one-shot | especial | corto | documental
animada: false                 # true si es de animación
universo: marvel
seccion: umc                   # umc | pre-umc | animacion (las de contenido/universos/marvel.yaml)
numero: 1                      # tu número: en UMC el cronológico, en Pre-UMC el de estreno
paginaArchivador: 1            # página de tu Archivador ROJO
calidad: [1080p, 4k]           # 720p | 1080p | 4k | webm
anio: 2011                     # obligatorio
nacionalidad: E.E.U.U.
duracion: 125                  # minutos
direccion: Joe Johnston        # uno o varios: [Nombre 1, Nombre 2]
guion: Christopher Markus
productora: MARVEL Studios
distribuidora: Paramount Pictures
argumento: |
  Texto del argumento. Deja una línea en blanco
  para separar párrafos.
reparto:
  - { actor: Chris Evans, personaje: Steve Rogers / Capitán América }
sagas: []                      # ids de "Relacionadas"
imagenes:
  - { src: ./portada.jpg, rol: portada }
  - { src: ./contraportada.jpg, rol: contraportada }
trailer: JerVrbLldXw           # id de YouTube
conexiones:
  verAntes: []
  verDespues: []
  postCreditos:
    - "Texto de la escena (se oculta como spoiler)"
notas: "Cualquier cosa que no encaje en otro campo"
---
```

### Temporada de una serie

Cada temporada es una ficha propia. `serie` agrupa las temporadas de la misma serie.

```yaml
---
titulo: Agentes SHIELD
tipo: serie
universo: marvel
seccion: umc
serie: agentes-shield
temporada: 1
numero: 15
tramos:                        # solo si la temporada está repartida en la cronología
  - { numero: 15, desde: 1x01, hasta: 1x07 }
  - { numero: 18, desde: 1x08, hasta: 1x15 }
  - { numero: 20, desde: 1x16, hasta: 1x22 }
anio: 2013
anioFin: 2014
capitulos:
  - codigo: 1x01
    titulo: Piloto
    argumento: "…"
    direccion: Joss Whedon
    guion: [Joss Whedon, Jed Whedon]
    duracion: 40
---
```

Los datos de TMDB (reparto, carteles, sinopsis…) **solo rellenan los campos vacíos**. Lo que venga de tus documentos o escribas tú siempre tiene prioridad.

## Regenerar las fichas desde los documentos

Los scripts de `scripts/` leen las copias de `documentos/originales/` (nunca las modifican):

```bash
.venv/Scripts/python.exe scripts/inspeccionar.py documentos/originales/marvel documentos/extraido/marvel/texto
.venv/Scripts/python.exe scripts/extraer_fichas.py "documentos/originales/marvel/UMC MARVEL/Los Power Point juntos" documentos/extraido/marvel
.venv/Scripts/python.exe scripts/generar_contenido.py documentos/extraido/marvel contenido/titulos/marvel
```

`generar_contenido.py` **no sobrescribe** las fichas que ya existen, así no se pierden los cambios hechos a mano.

## Añadir un personaje

`contenido/personajes/marvel/thor.md`:

```yaml
---
nombre: Thor
identidad: Thor Odinson
alias: [Dios del Trueno]
universo: marvel
---
Texto opcional sobre el personaje.
```

La página del personaje muestra automáticamente todos los títulos en los que aparece.

## Añadir una saga o "Relacionada"

`contenido/sagas/marvel/spider-man.yaml`:

```yaml
nombre: Spider-Man
universo: marvel
tipo: multiverso      # multiverso | saga | fase | trilogia | otro
orden: 1
```

## Añadir un universo nuevo (p. ej. "Otros")

`contenido/universos/otros.yaml` ya existe con `activo: false`. Para mostrarlo:

1. Cambia `activo: true` y añade sus `secciones`.
2. Crea las carpetas `contenido/titulos/otros/`, `contenido/personajes/otros/`, etc.

La portada, la navegación y las rutas se generan solas.

## Aviso legal

Proyecto de fans sin ánimo de lucro y no oficial. No tiene relación con Marvel, DC, Disney ni Warner Bros.
This product uses the TMDB API but is not endorsed or certified by TMDB.

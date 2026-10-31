# Heroteca

Enciclopedia personal de películas, series, animación y especiales de superhéroes de Marvel y DC.
Es un proyecto de fans, sin ánimo de lucro y no oficial.

Está hecha con [Astro](https://astro.build) (web 100 % estática) y se publica en Vercel.

## Puesta en marcha

```bash
npm install
npm run dev      # servidor local en http://localhost:4321 (se actualiza al guardar)
npm run build    # genera la web en dist/ y valida todos los datos
npm run preview  # sirve la web ya generada, igual que en Vercel
npm run check    # revisa los tipos del código
```

Para ver la web en tu ordenador: abre una terminal en la carpeta del proyecto, escribe `npm run dev`
y abre http://localhost:4321 en el navegador.

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

## Datos de TMDB (carátulas, sinopsis, reparto, tráileres)

TMDB **solo rellena lo que falta**: si tu ficha tiene argumento, reparto o carátula, se usa lo tuyo.
En la ficha, lo que viene de TMDB se indica con «de TMDB» o con una ᵀ.

Los datos se guardan en `datos/tmdb/marvel.json`, que **sí se sube** a GitHub: la web lo lee al compilar
y nunca contacta con TMDB al publicarse (Vercel no necesita la clave).

Para actualizarlos (por ejemplo, tras añadir fichas nuevas), en tu ordenador:

```bash
.venv/Scripts/python.exe scripts/sincronizar_tmdb.py marvel             # usa lo ya descargado
.venv/Scripts/python.exe scripts/sincronizar_tmdb.py marvel --refrescar # vuelve a pedirlo todo a TMDB
```

Para que una ficha nueva reciba datos de TMDB, añade su id: `tmdb: { id: 12345, tipo: movie }`
(`tipo: tv` para series). El id es el número de la dirección de la ficha en themoviedb.org.

La clave de TMDB va en el archivo `.env` (no se sube a GitHub): `TMDB_API_TOKEN=…`

## Regenerar las fichas desde los documentos

Los scripts de `scripts/` leen las copias de `documentos/originales/` (nunca las modifican).
Necesitan Python con `python-docx`, `python-pptx` y `pyyaml` (en `.venv`) y la clave de TMDB en `.env`.

```bash
# 1. Volcar los documentos a texto (solo para consultarlos)
.venv/Scripts/python.exe scripts/inspeccionar.py documentos/originales/marvel documentos/extraido/marvel/texto
# 2. Fichas de los PowerPoint → fichas.json
.venv/Scripts/python.exe scripts/extraer_fichas.py "documentos/originales/marvel/UMC MARVEL/Los Power Point juntos" documentos/extraido/marvel
# 3. Catálogo completo (índice + videoteca + EL INDICE) → catalogo.json
.venv/Scripts/python.exe scripts/catalogo.py documentos/originales/marvel documentos/extraido/marvel
# 4. Unir y emparejar con TMDB → entradas.json y revisar-tmdb.txt
.venv/Scripts/python.exe scripts/emparejar_tmdb.py documentos/extraido/marvel
# 5. Escribir las fichas y las sagas en contenido/ → cambios.txt con todo lo corregido
.venv/Scripts/python.exe scripts/generar_contenido.py documentos/extraido/marvel contenido
```

- `datos/tmdb-manual.yaml`: correcciones a mano del emparejamiento con TMDB, títulos revisados y notas.
- `datos/agrupaciones-marvel.yaml`: qué fichas forman cada saga, "Relacionada" o fase.
- `generar_contenido.py` **no sobrescribe** las fichas que ya existen, así no se pierden los cambios hechos a mano
  (con `--forzar` las regenera).

### DC

DC sigue la organización de tu disco duro: «001 UDC», «002 DCDU», «UDC Series por orden» (con las 13 carpetas
del RESUMEN de carpetas UDC) y «animacion/Animación».

```bash
# 1. Catálogo de DC (Word del Archivador AZUL + árbol del disco) → catalogo.json y carátulas
.venv/Scripts/python.exe scripts/dc_catalogo.py documentos/originales/dc documentos/extraido/dc
# 2. Fichas, sagas y órdenes capítulo a capítulo → revisar.txt y cambios.txt
.venv/Scripts/python.exe scripts/dc_generar.py documentos/extraido/dc contenido
# 3. Carátulas de «complementos» (portadas de más calidad y contraportadas)
.venv/Scripts/python.exe scripts/dc_caratulas.py documentos/originales/dc/complementos contenido/titulos/dc
# 4. Datos de TMDB
.venv/Scripts/python.exe scripts/sincronizar_tmdb.py dc
```

- `datos/tmdb-manual-dc.yaml`: correcciones a mano del emparejamiento con TMDB y títulos en España.
- `contenido/visionados/dc/carpeta-NN.yaml`: tu orden capítulo a capítulo de cada bloque Crossover.
- En la sección Series, cada ficha lleva `visionado: { carpeta, codigo, orden }` (tu código 2.3, 5.1…)
  y `numero` es el de la carpeta del disco (011 Smallville). `enEspera: true` la pone al final, en «En espera».

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

**Cómo se asigna un personaje a una ficha:** se compara cada línea del `reparto` de la ficha
("Steve Rogers / Capitán América") con el `nombre`, la `identidad` y los `alias` de cada personaje.
- Se compara cada parte completa (separadas por `/`): "She-Hulk" no cuenta como "Hulk".
- Manda la identidad: "Miles Morales / Spider-Man" se asigna a Miles Morales, no a Peter Parker.
- Si un personaje no aparece en una ficha donde sí sale, añade su nombre a `alias`, o escríbelo en la ficha:
  `personajes: [thor, loki]`.

## Spoilers

- En el texto libre de una ficha (debajo de las líneas `---`), escribe `||texto||` y se mostrará
  difuminado hasta que se pulse: `Al final ||muere alguien importante||.`
- Las escenas post-créditos (`conexiones.postCreditos`) y los cameos se ocultan siempre como spoiler
  (salvo que pongas `spoiler: false`).
- Si no has escrito la escena, la ficha avisa de que la hay (sin contar nada) cuando TMDB la marca.
- «Ver antes / ver después»: si la ficha no los tiene, se ponen solos con sus vecinas en tus trilogías y dulogías.

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

## Publicar en Vercel

La web está en **https://heroteca.vercel.app** (plan Hobby, gratuito).

- Cada `git push` a la rama `main` vuelve a publicarla sola en 1-2 minutos.
- Vercel no necesita ninguna variable de entorno: los datos de TMDB ya van en `datos/tmdb/marvel.json`.
  No subas el `.env` a Vercel.
- Si algún día cambias la dirección, actualiza `url` en [`src/config/site.ts`](src/config/site.ts).

## Aviso legal

Proyecto de fans sin ánimo de lucro y no oficial. No tiene relación con Marvel, DC, Disney ni Warner Bros.
This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.

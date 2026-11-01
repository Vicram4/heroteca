# Heroteca · Manual de uso

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

Edita [`src/config/site.ts`](../src/config/site.ts). Se actualizan en toda la web.

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

## Imagen principal de cada título

`caratulaPrincipal` en `src/config/site.ts` decide qué imagen se ve en estanterías, fichas y portada:

- `'cartel'` (web pública): el cartel oficial de TMDB (español en la versión española, inglés en la inglesa).
  La carátula de la edición de la colección aparece debajo, en la ficha, como «Edición de la colección»,
  y solo es la principal si TMDB no tiene cartel.
- `'coleccion'`: las carátulas de la colección siempre que existan. Pensado para una versión personal de la web
  (por ejemplo, otro proyecto de Vercel con este ajuste y su propia dirección).

La dedicatoria escondida usa siempre las carátulas de la colección.

## Carátulas con márgenes blancos

Algunas carátulas de los documentos traen márgenes blancos alrededor de la caja. Para recortarlos
(por ejemplo, después de añadir fichas nuevas):

```bash
.venv/Scripts/python.exe scripts/recortar_caratulas.py contenido/titulos            # solo muestra cuáles
.venv/Scripts/python.exe scripts/recortar_caratulas.py contenido/titulos --aplicar  # las recorta
```

## Dónde ver (plataformas)

Las fichas muestran dónde ver cada título en España (suscripción, gratis, alquiler y compra), con datos de
JustWatch que da TMDB. Se guardan en `datos/donde-ver.json`.

- **Se actualizan solos cada lunes** con GitHub Actions (`.github/workflows/donde-ver.yml`), que sube el archivo
  nuevo y hace que Vercel vuelva a publicar la web. Necesita el secreto `TMDB_API_TOKEN` en GitHub
  (Settings → Secrets and variables → Actions).
- Para lanzarlo a mano: pestaña **Actions** del repositorio → «Actualizar «Dónde ver» y «Próximamente»» → **Run workflow**.
- En local: `.venv/Scripts/python.exe scripts/sincronizar_donde_ver.py`
- **Historial de llegadas y salidas** (para la futura sección «Novedades»): cada semana se compara con la anterior y
  se apunta en `datos/novedades-plataformas.json` qué títulos llegan o se van de cada plataforma (suscripción o gratis),
  por país. Se guardan los últimos 120 días.

## Próximamente (próximos estrenos)

Página `/proximamente/` (en inglés, `/en/coming-soon/`), enlazada desde el pie y con una franja de los 4 próximos
estrenos en la portada. Los datos están en `datos/proximamente.json` y los genera
`scripts/sincronizar_proximamente.py` con dos fuentes de TMDB:

- Películas y series con fecha futura de las **productoras** de cada universo (lista `PRODUCTORAS` del script:
  Marvel Studios, Marvel Animation, DC Studios…). Si falta alguna, se busca su número en TMDB y se añade ahí.
- **Series de la colección** con un episodio programado (temporada nueva o en emisión).

Arriba salen las series **en emisión** (próximo episodio) y debajo los **estrenos por año**. Si el estreno ya tiene ficha
en la colección, la tarjeta lleva a la ficha; si no, a TMDB. La cuenta atrás se calcula en el navegador, que además oculta
lo que ya se haya estrenado desde la última actualización.

- **Se actualiza sola cada lunes** con la misma tarea de GitHub Actions que «Dónde ver».
- En local: `.venv/Scripts/python.exe scripts/sincronizar_proximamente.py`
- Textos de la página: apartado `proximos` de `src/i18n/textos.ts`.

## ¿Qué veo? (recomendaciones)

Página `/recomendaciones/` (`/en/recommendations/`), enlazada desde la portada («¿No sabes qué ver?») y el pie. Hace
7 preguntas, de una en una y todas opcionales: universo, cuánto tiempo hay (película, algo corto, serie corta o larga),
tono (se pueden marcar varios), imagen real o animación, plataformas, personaje favorito y cuánto conoces los universos.

Cómo decide (`src/lib/recomendar.ts`, en el navegador):

1. **Filtra** por universo, formato, estilo y plataformas, y quita lo marcado como visto en «Mi progreso».
2. **Puntúa** con la nota media de TMDB ponderada por número de votos (con pocos votos cuenta menos), más puntos por
   tono, personaje y nivel («Estoy empezando» favorece películas y primeras temporadas; «Ya he visto bastante», joyas
   con buena nota y pocos votos).
3. Si quedan menos de 6, **suelta filtros** (primero plataformas, luego formato, estilo y universo) y lo avisa.
4. De cada serie propone **una sola temporada**: la primera que no hayas visto.

Los **tonos** salen de los géneros de TMDB y de la **calificación por edades**: «Oscuro y adulto» = +16, terror o
thriller criminal; «Para ver en familia» = género familiar/infantil o calificación para todos o +7. Para ajustarlos,
función `tonosDe` de `src/pages/[...idioma]/[recomendaciones].astro`.

La nota, los votos y la edad están en `datos/tmdb/<universo>.json` (campos `nota`, `votos` y `edad`), que genera
`scripts/sincronizar_tmdb.py`. Textos: apartado `recomendar` de `src/i18n/textos.ts`.

## Por dónde empezar (guías de rutas)

Cada universo tiene una guía «Por dónde empezar» (`/marvel/guias/por-donde-empezar/`, en inglés
`/en/marvel/guides/where-to-start/`), la primera de su lista de guías. Es de tipo `rutas` en `src/config/guias.ts`:
cada ruta tiene título, texto (con su versión `en`) y los **ids de las fichas** en el orden recomendado.

- Las tarjetas muestran carátula, número de paso, año, tipo, duración y nota de TMDB, y se marcan con la ✓ de
  «Mi progreso»; cada ruta tiene su barra «Has visto 3 de 10».
- Al final, la llamada al test «¿Qué veo?».
- Si un id está mal escrito, **la compilación falla** con un mensaje que dice qué ficha no existe.
- Para cambiar una selección basta con editar la lista `ids` de la ruta.

## Cronológico frente a estreno (guías)

En las guías, cada sección con orden de la historia (UMC, DCEU) tiene un apartado «cronológico frente a estreno»
(componente `ComparaOrden.astro`):

- **Gráfico de pendientes** (en pantallas anchas): a la izquierda el puesto de cada título en el orden de la historia,
  a la derecha en el de estreno, unidos por una línea. En el color del universo, los 6 que más cambian; al pasar el
  ratón se resalta una línea.
- **Los que más cambian**, en tarjetas («5.º en la historia · 50.º en estreno»), visibles también en el móvil.
- **Tabla** con todos los títulos, sus dos puestos y el cambio.

Los tramos de una misma temporada cuentan una sola vez, en su primera aparición. Se genera solo con las fichas.

## Actores y actrices

Índice en `/actores/` (`/en/actors/`, con buscador por nombre o personaje) y una página por intérprete en
`/actores/<nombre>/` (el nombre no se traduce). Se generan solas con `src/lib/actores.ts`:

- **Quién tiene página:** quien aparece en al menos **3 obras distintas** (`MIN_OBRAS`; las temporadas de una serie
  cuentan como una sola obra). Con 2 había más de 300 páginas casi vacías, que no aportan y restan en buscadores.
- **De dónde salen los papeles:** el reparto de TMDB (`datos/tmdb/`, que ahora guarda también el id y la foto de cada
  intérprete) y el reparto escrito en las fichas. El mismo nombre con otra escritura (tildes, mayúsculas) cuenta igual.
- **Personajes:** se limpian las anotaciones de TMDB («(voice)», «(archive footage)»…) y se quitan los papeles
  genéricos («Additional Voices», «Himself»). En inglés se usa el reparto inglés.
- **Enlaces:** en cada ficha, el nombre del intérprete enlaza a su página si la tiene; también el gráfico de actores
  de las estadísticas.
- **Buscador:** los actores con página salen en la búsqueda (por nombre y, con menos prioridad, por sus personajes).

## Estadísticas

Página `/estadisticas/` (`/en/stats/`), enlazada en el pie. Todo se calcula al compilar con las fichas y
`datos/tmdb/`, así que se actualiza sola al añadir títulos:

- **Cifras:** horas para verlo todo (suma de la duración de cada película y de cada capítulo), títulos, maratón de la
  primera sección (el UMC) y películas con escena poscréditos.
- **Gráficos:** horas por sección, estrenos por década, los 10 personajes que más aparecen y los 10 actores con más
  papeles (repartidos por universo). Componentes `GraficoBarras.astro` y `GraficoColumnas.astro`: cada uno lleva
  leyenda, aviso al pasar el ratón y la misma información en una tabla («Ver los datos en una tabla»).
- **Colores:** el acento de cada universo (rojo Marvel, azul DC), comprobados con el validador de paletas para
  daltonismo y contraste en modo claro y oscuro. Si se añade un universo, conviene volver a comprobarlos.
- **Récords:** película más larga y más corta, temporada con más capítulos, mejor y peor valorada en TMDB (con al menos
  500 votos) y título más antiguo.

## Mi progreso (vistos)

Cada ficha tiene un botón **«Marcar como visto»**. Lo marcado se ve en toda la web:

- **Estanterías:** marca verde ✓ en la carátula, barra «Has visto 12 de 90» y filtro «Vistos y sin ver / Solo sin ver /
  Solo vistos» (junto a los demás desplegables).
- **Guías:** ✓ junto a cada título visto.
- **Página `/mi-progreso/`** (`/en/my-progress/`, enlazada en el pie y en cada barra): avance por universo y sección y el
  **siguiente** título sin ver en el orden de la colección. Tiene **copia de seguridad** (descargar y cargar un archivo
  JSON) y **Borrar todo**. No se indexa en buscadores ni va en el mapa del sitio.

Cómo funciona: los ids de las fichas vistas se guardan en `localStorage` (clave `heroteca:vistos`), solo en ese navegador;
no hay cuentas ni servidor. Son los mismos en español e inglés. El código está en `src/lib/vistos.ts`: cualquier elemento
con `data-titulo="<id>"` recibe `data-visto` si está visto, los botones `data-alternar-visto` marcan y desmarcan y las barras
son el componente `Progreso.astro`. Textos: apartado `progreso` de `src/i18n/textos.ts`.

## Versión en inglés (/en/)

- Todas las páginas están en `src/pages/[...idioma]/` y generan su versión española y la inglesa.
- Los textos fijos de la web están en `src/i18n/textos.ts` (español e inglés, con las mismas claves).
- **Direcciones en inglés:** se calculan solas a partir de los datos (`src/i18n/rutas.ts`), sin tabla que mantener:
  la ficha usa su título en inglés (`/en/marvel/captain-america-the-first-avenger/`), las secciones su `idEn`
  (`/en/marvel/mcu/`), personajes y sagas su `nombreEn`, las guías su `idEn`, y las palabras fijas se traducen
  (`characters`, `folders`, `guides`, `about`, `privacy`). Si dos coinciden, se añade el año.
- En el código, los enlaces se escriben en español (`/marvel/umc/`): al compilar, los de las páginas inglesas pasan a su
  dirección inglesa automáticamente (integración en `astro.config.mjs`). Por eso en `npm run dev` los enlaces de las
  páginas inglesas llevan a las españolas; para revisarlas, usa `npm run build` y `npm run preview`.
- **Datos en inglés:** títulos, carteles, sinopsis, capítulos, géneros, reparto y tráileres salen de TMDB en inglés
  (`datos/tmdb/<universo>.en.json`). Para actualizarlos: `.venv/Scripts/python.exe scripts/sincronizar_tmdb.py marvel --ingles`
  (y lo mismo con `dc`). En inglés, la portada principal es el cartel inglés y la carátula de la colección se muestra aparte.
- **Nombres en inglés:** `nombreEn`, `descripcionEn`, `tituloSeoEn` y `etapaEn` en `contenido/universos/*.yaml`;
  `nombreEn` en sagas y personajes; `notasEn` en las fichas. `scripts/traducir_en.py` traduce las notas nuevas y
  añade los nombres que falten (avisa si una nota no tiene regla de traducción).
- **Dónde ver en inglés:** datos de Estados Unidos (`datos/donde-ver-us.json`), que se actualizan con la tarea semanal.
- Con `inglesPublicado: true` en `src/config/site.ts` (activado), la versión inglesa se indexa, está en el mapa del sitio
  y cada página enlaza con su traducción (hreflang). Si se pone a `false`, las páginas inglesas no se indexan, no están en el
  mapa del sitio y el botón de idioma solo aparece en ellas.

## Guías de visionado

Las guías (/marvel/guias/…, /dc/guias/…) se definen en [`src/config/guias.ts`](../src/config/guias.ts):
título, textos de introducción y qué secciones o carpetas muestran. Las listas se generan solas a partir
de las fichas, así que se actualizan al añadir títulos. Para crear una guía nueva basta con añadir un
elemento a esa lista.

## Textos para buscadores

- Cada universo y cada sección de `contenido/universos/*.yaml` admite `tituloSeo` (el título que muestra Google).
- Los grupos de la página «Relacionadas y sagas» se definen en `gruposSagas` del mismo archivo.

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
- Si algún día cambias la dirección, actualiza `url` en [`src/config/site.ts`](../src/config/site.ts).

## Aviso legal

Proyecto de fans sin ánimo de lucro y no oficial. No tiene relación con Marvel, DC, Disney ni Warner Bros.
This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.

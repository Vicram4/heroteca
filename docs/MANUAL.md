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


**Huecos que se rellenan solos o a mano:**
- **Sinopsis traducidas:** si TMDB solo tiene la sinopsis en inglés, se usa la traducción de
  `datos/sinopsis-traducidas.json` (clave = id de la ficha) y la ficha lo indica («Sinopsis de TMDB traducida del inglés»).
  Si TMDB añade la española, manda la de TMDB.
- **Tráileres:** si no hay en español ni en inglés, se busca cualquier tráiler o teaser de YouTube en TMDB. Unas 50 fichas
  (sobre todo animación antigua y cortos) no tienen ninguno en TMDB.
- **Duración de series completas** (sin temporadas detalladas): la media de los capítulos de su primera temporada. Se
  muestra como «capítulos de unos 22 min» y no cuenta en las horas totales de las estadísticas.

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
  se apunta en `datos/novedades-plataformas.json` qué títulos llegan o se van de cada plataforma, por país y en dos
  modos: `plataforma` (suscripción o gratis) y `digital` (alquiler o compra). Se guardan los últimos 120 días.

## Noticias

Página `/noticias/` (`/en/news/`), con filtro por universo, y una por universo en `/marvel/noticias/` (pestaña
«Noticias» del menú de cada universo). La portada y el inicio de cada universo muestran las 4 últimas.

- **De dónde salen:** los RSS públicos de medios especializados (lista `FUENTES` de `scripts/sincronizar_noticias.py`).
  En español: CinemasComics, Espinof, Fotogramas, SensaCine y La Casa de EL; en inglés: ComicBook.com, SuperHeroHype,
  Collider y Screen Rant. Cada versión de la web usa las fuentes de su idioma.
- **Qué se guarda:** solo el titular, un resumen breve (sin coletillas tipo «publicación original de…») y el enlace a la
  noticia original, que se abre en una pestaña nueva. No se copian textos completos ni imágenes.
- **Clasificación:** por palabras clave de cada universo (`CLAVES`): si el titular las menciona, o el resumen al menos
  dos veces. Una noticia puede ser de los dos universos; las que no hablan de ninguno se descartan.
- **Actualización:** cada día a las 06:30 UTC con GitHub Actions (`.github/workflows/noticias.yml`), que sube
  `datos/noticias.json` y hace que Vercel vuelva a publicar la web. Se guardan los últimos 30 días (máximo 200 por
  idioma). Si una fuente falla, las demás siguen. Para lanzarlo a mano: Actions → «Actualizar «Noticias»» → Run workflow.

## Próximamente (próximos estrenos)

Página `/proximamente/` (en inglés, `/en/coming-soon/`), enlazada desde el pie y con una franja de los 4 próximos
estrenos en la portada. Los datos están en `datos/proximamente.json` y los genera
`scripts/sincronizar_proximamente.py` con dos fuentes de TMDB:

- Películas y series con fecha futura de las **productoras** de cada universo (lista `PRODUCTORAS` del script:
  Marvel Studios, Marvel Animation, DC Studios…). Si falta alguna, se busca su número en TMDB y se añade ahí.
- **Series de la colección** con un episodio programado (temporada nueva o en emisión).

Las películas guardan su **fecha de estreno en cines en España y en EE. UU.** (campo `cines`): la versión española
usa la de España y la inglesa la de EE. UU. (si no se conoce, la fecha mundial). El archivo conserva además las
películas **estrenadas en cines en los últimos 60 días** (solo las que pasaron por cines; fuera cortos y pódcasts),
que Próximamente no muestra y servirán para el bloque «En cines» de Novedades.

Arriba, un **contador grande** del próximo estreno de cine (días, horas, minutos y segundos en directo, con el cartel de
fondo; componente `CuentaAtras.astro`, también en la portada). Cada tarjeta lleva un **anillo** con los días que faltan,
que se cierra a medida que se acerca el estreno (y brilla el día del estreno). Las animaciones se desactivan si el
sistema pide reducir el movimiento. Luego salen las series **en emisión** (próximo episodio) y debajo los **estrenos por año**. Si el estreno ya tiene ficha
en la colección, la tarjeta lleva a la ficha; si no, a TMDB. La cuenta atrás se calcula en el navegador, que además oculta
lo que ya se haya estrenado desde la última actualización.

- **Se actualiza sola cada lunes** con la misma tarea de GitHub Actions que «Dónde ver».
- En local: `.venv/Scripts/python.exe scripts/sincronizar_proximamente.py`
- Textos de la página: apartado `proximos` de `src/i18n/textos.ts`.

## Botón «Volver»

Fichas, personajes, sagas, actores, carpetas y guías tienen el botón **«← Volver»** junto a la miga de pan (componente
`BotonVolver.astro`). Si se llega desde otra página de Heroteca en el mismo idioma, vuelve a ella; si no (Google, enlace
directo o recién cambiado de idioma), lleva a la lista a la que pertenece la página.

## Órdenes de las estanterías

Todas las estanterías (secciones, sagas y personajes) tienen estos órdenes; en el móvil van en un desplegable:

- **El propio de la sección** («Orden de la historia» o «Por carpetas»), solo en las secciones que lo tienen.
- **Orden de estreno**, del más antiguo al más reciente.
- **Más recientes**: el de estreno al revés.
- **Mejor valoradas**: por la nota media de TMDB, que se muestra en cada caja («★ 7,6»). Solo cuentan las notas con al
  menos 50 votos (`VOTOS_MIN` en `Caja.astro`); el resto va al final. En las series se usa la nota de cada temporada.

Fuera del orden propio, cada título sale una sola vez (sin repetir los tramos de una temporada), se ocultan las
cabeceras de carpeta y se ve el número de la colección, como ya pasaba en el orden de estreno. El orden elegido se
recuerda al volver desde una ficha.

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

## Línea temporal del UMC (años de la historia)

Guía `/marvel/guias/linea-temporal/` (`/en/marvel/guides/mcu-timeline/`), de tipo `linea` en `src/config/guias.ts`:
cada título del UMC colocado en el año en que transcurre, de 1943 a 2028, con saltos por año, ✓ de «Mi progreso» y,
al final, los títulos sin año oficial. En cada ficha del UMC aparece el chip **«Transcurre en 1995»**, que enlaza a
su año en la línea temporal.

- **El dato** es el campo `epoca` de cada ficha: un año (`'2016'`), un intervalo (`'2013–2014'`) o `'sin fecha'`
  si la cronología oficial no da año (Agentes de S.H.I.E.L.D., Loki, Runaways…). El orden de la colección no cambia.
- **Fuente:** la cronología oficial de Marvel Studios (libro de 2023) tal como la recoge la Wikipedia
  («Marvel Cinematic Universe timeline»), comprobada en noviembre de 2026.
- **Casos discutidos** (Iron Man, Black Panther, Infinity War…) llevan una nota: lista `NOTAS` de
  `src/lib/lineaTemporal.ts`.
- **Al añadir un título al UMC hay que ponerle `epoca`.** Si falta, el build muestra un aviso (sin detenerse) y el
  resumen semanal por correo lo incluye en «Pendientes». Mientras tanto, el título no sale en la línea temporal.

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

## Pasatiempos

Página `/pasatiempos/` (`/en/games/`), enlazada en el pie y junto a la llamada al test de la portada, con tres juegos
(demos) que funcionan en el navegador con los datos de la web:

- **Adivina el personaje** (`JuegoAdivina.astro`): 5 rondas con personajes que salen en al menos 4 títulos. Pistas que se
  desvelan una a una (universo y número de títulos, primera aparición, un título, intérpretes, identidad) y cuatro
  opciones del mismo universo. Puntos: 5 menos las pistas extra usadas.
- **¿Qué héroe eres?** (`JuegoQuienEres.astro`): 6 preguntas; cada respuesta suma puntos a varios héroes. Preguntas,
  respuestas y resultados (ES/EN) en `src/config/quien-eres.ts`, redactados en neutro porque describen a quien juega.
- **¿Cuál se estrenó antes?** (`JuegoCualAntes.astro`): dos títulos de años distintos; la mejor racha se guarda en el
  navegador.

La lista de juegos está en `src/config/juegos.ts`, con las **ideas para más adelante** que se muestran en la página
(Heroedle, cartel pixelado, ordenar la cronología, conectar actores, trivia diaria…).

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

## Aviso semanal por correo

Cada lunes, después de actualizar los datos, la tarea de GitHub Actions ejecuta `scripts/resumen_semanal.py`.
Si hay algo relevante, publica un **issue** «Resumen semanal de Heroteca» en el repositorio y **GitHub lo manda por
correo** (y a la app de GitHub). Si no hay nada que contar, no se crea.

Qué incluye:

- **Estrenos anunciados nuevos**, **cambios de fecha** y estrenos que **ya no aparecen** en TMDB (comparando
  `datos/proximamente.json` con el de la semana anterior). Próximamente ya los muestra solo.
- **Ya estrenado y sin ficha en la colección**: la pista para decidir si se añade (y dónde).
- **Cambios en plataformas y en digital** en España (del historial de `datos/novedades-plataformas.json`).
- **Pendientes de la colección** (fichas sin TMDB; títulos del UMC sin año para la línea temporal), solo junto a otras
  novedades para no repetir el mismo aviso cada semana.

Las productoras vigiladas están en `PRODUCTORAS` de `scripts/sincronizar_proximamente.py` (incluye Marvel
Entertainment, que recoge las películas de Marvel de Sony). Cuando llegue el aviso, basta con contárselo a Claude en el
proyecto; el issue se puede cerrar al revisarlo. Si un lunes no llega nada, puede ser que no hubiera novedades (se
puede comprobar en la pestaña Actions) o que las notificaciones por correo de GitHub estén desactivadas
(github.com → Settings → Notifications).

**Probar que llegan los correos:** pestaña **Actions** del repositorio → «Actualizar «Dónde ver» y «Próximamente»» →
**Run workflow** → marcar «Mandar un aviso de prueba» → **Run workflow**. En un par de minutos llega el correo.

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


### Textos generados para buscadores

- **Título de las fichas:** «Capitana Marvel (2019): dónde ver, reparto y orden» (temporadas: «…: dónde ver, capítulos y
  reparto»), para encajar con lo que la gente busca. Textos `tituloSeo` en el apartado `ficha` de `src/i18n/textos.ts`.
- **«En resumen»** en cada ficha: un párrafo propio con el puesto en el orden, el año en que transcurre, los títulos de
  antes y después (enlazados), la duración o los capítulos, si tiene poscréditos, dónde verla y la nota de TMDB. Así cada
  ficha tiene texto único además de la sinopsis de TMDB (que comparten muchas webs). Se genera en `Ficha.astro`.
- **Preguntas frecuentes** al final de las guías con orden de la historia (UMC, DCEU): cuántos títulos hay, el primero,
  el más reciente, cuánto se tarda y por dónde empezar. Las respuestas se calculan con los datos.
- **Guías en la portada:** bloque «Guías para empezar» con todas las guías salvo las de carpetas.
- No se usa `lastmod` en el mapa del sitio: solo podría poner la fecha de cada publicación en todas las páginas, y Google
  ignora las fechas que no son fiables.

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


**Alias en español:** los alias que solo existen en español («Dios del Trueno», «La Masa», «Hombre Araña») van en
`aliasEs`, no en `alias`. En la versión española se ven todos; en la inglesa, solo `alias` (y el buscador inglés sigue
encontrando los españoles). Los dos sirven para reconocer al personaje en el reparto de las fichas.

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


**Comprobar que una saga está completa:** las colecciones de TMDB indican qué películas forman cada saga. En la revisión
de noviembre de 2026 se añadieron tres fichas que no estaban en los documentos (su campo `fuente` lo indica):
*Venom: El último baile* (la trilogía de Venom tenía 2) y, para completar el primer arco del DC Animated Movie Universe
(16 películas, 2013-2020, según la Wikipedia), *Jóvenes Titanes: El contrato de Judas* y *Liga de la Justicia Oscura:
La Guerra Apokolips*. Otras cuatro fichas existentes se añadieron a esa continuidad, y *El regreso del Caballero Oscuro*
a la suya. Las fichas añadidas no llevan número de la colección: se colocan por año.

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

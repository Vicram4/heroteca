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
  universos/<id>.yaml          Marvel, DC, Otros… (con sus subuniversos)
  sagas/<universo>/<id>.yaml   sagas, fases, trilogías
  personajes/<universo>/<id>.md
  titulos/<universo>/<id>.md   una película o serie por archivo
```

- El **id** de cada entrada es el **nombre del archivo** sin extensión (`vengadores-endgame.md` → `vengadores-endgame`).
  Usa solo minúsculas, números y guiones. El id también forma la URL: `/marvel/vengadores-endgame`.
- Las subcarpetas (`marvel/`, `dc/`) solo sirven para ordenar los archivos. Lo que cuenta es el campo `universo`.
- Para hacer referencia a otra entrada (una saga, un personaje, otro título), escribe su id.

## Añadir o editar un título

1. Crea `contenido/titulos/marvel/mi-pelicula.md` (puedes copiar uno existente).
2. Rellena los datos entre las líneas `---`. Debajo, escribe tu texto libre en Markdown.
3. Ejecuta `npm run build`. Si algo está mal, el error te dirá qué archivo y qué campo revisar.

```yaml
---
titulo: "Vengadores: Endgame"        # título en España (obligatorio)
tituloOriginal: "Avengers: Endgame"
otrosTitulos: []                      # otros títulos que también encontrará el buscador
tipo: pelicula                        # pelicula | serie | animacion | documental | especial
universo: marvel
subuniverso: mcu                      # uno de los definidos en contenido/universos/marvel.yaml
sagas: [mcu-fase-3, saga-infinito]
anio: 2019                            # obligatorio
fechaEstreno: 2019-04-26
ordenCronologico: 22                  # orden dentro de la historia; admite decimales (22.5)
epoca: "2018–2023"
duracion: 181                         # minutos
personajes:
  - iron-man                          # forma corta
  - { personaje: capitan-america, actor: Chris Evans, papel: protagonista }
trailer: TcMBFSGVi1c                  # id de YouTube
conexiones:
  verAntes: [vengadores-infinity-war]
  verDespues: []
  relacionados: []
  postCreditos:
    - "Texto de la escena (se oculta como spoiler)"
  cameos:
    - { descripcion: "Aparición de…", personaje: iron-man }
notas: "Cualquier cosa que no encaje en otro campo"
---

Tu información sobre la película, en **Markdown**.
```

Para series, añade `anioFin`, `temporadas` y `episodios`. Los valores de `papel` son:
`protagonista`, `principal`, `secundario`, `cameo`, `voz` y `mencion`.

Los datos de TMDB (pósters, reparto, sinopsis…) **solo rellenan los campos vacíos**. Lo que escribas tú siempre tiene prioridad.

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

## Añadir una saga o fase

`contenido/sagas/marvel/mcu-fase-4.yaml`:

```yaml
nombre: Fase 4
universo: marvel
subuniverso: mcu
tipo: fase            # saga | fase | trilogia | continuidad | otro
padre: saga-multiverso
orden: 4
```

## Añadir un universo nuevo (p. ej. "Otros")

`contenido/universos/otros.yaml` ya existe con `activo: false`. Para mostrarlo:

1. Cambia `activo: true` y añade sus `subuniversos`.
2. Crea las carpetas `contenido/titulos/otros/`, `contenido/personajes/otros/`, etc.

La portada, la navegación y las rutas se generan solas.

## Aviso legal

Proyecto de fans sin ánimo de lucro y no oficial. No tiene relación con Marvel, DC, Disney ni Warner Bros.
This product uses the TMDB API but is not endorsed or certified by TMDB.

/**
 * Esquema de datos de Heroteca.
 *
 * Todo el contenido vive en la carpeta `contenido/`:
 *   contenido/universos/<id>.yaml             → Marvel, DC, Otros… con sus secciones (UMC, Pre-UMC…)
 *   contenido/sagas/<universo>/<id>.yaml      → "Relacionadas": multiversos, sagas, trilogías…
 *   contenido/titulos/<universo>/<id>/index.md → una ficha (película, temporada, One-Shot…) con sus imágenes al lado
 *   contenido/personajes/<universo>/<id>.md
 *   contenido/visionados/<universo>/<id>.yaml   → órdenes capítulo a capítulo entre series (Crossover de DC)
 *
 * El identificador de cada entrada es el nombre del archivo, o el de la carpeta
 * si el archivo se llama `index.md` (p. ej. `iron-man`). También es el final de su URL.
 *
 * Si un archivo no cumple el esquema, `npm run build` falla e indica
 * qué archivo y qué campo están mal.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CALIDADES, CLAVES_TIPO, ORDENES_SECCION, PAPELES, TIPOS_SAGA } from './config/tipos';

/** El id es el nombre del archivo (o de su carpeta si es index.md), sin extensión. */
const idPorNombreDeArchivo = ({ entry }: { entry: string }) => {
  const partes = entry.replace(/\.(md|ya?ml|json)$/i, '').split('/');
  const ultimo = partes.pop()!;
  return ultimo === 'index' ? partes.pop()! : ultimo;
};

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa solo minúsculas, números y guiones (ej. "umc", "pre-umc")');

/** Acepta un texto o una lista de textos y siempre devuelve una lista. */
const unoOVarios = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : [v]))
  .default([]);

/** Texto que puede ocultarse como spoiler. Admite texto simple o { texto, spoiler }. */
const textoConSpoiler = z.union([
  z.string().transform((texto) => ({ texto, spoiler: true })),
  z.object({ texto: z.string(), spoiler: z.boolean().default(true) }),
]);

/* ------------------------------------------------------------------ */
/* Universos y sus secciones                                           */
/* ------------------------------------------------------------------ */
const universos = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: './contenido/universos', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    nombre: z.string(),
    /** Orden en la portada y en la navegación. */
    orden: z.number().int(),
    /** Si es false, el universo no aparece en la web (útil para preparar "Otros"). */
    activo: z.boolean().default(true),
    /** Si no está activo pero es true, aparece en la portada como «Próximamente». */
    proximamente: z.boolean().default(false),
    descripcion: z.string().optional(),
    /** Título para buscadores de la página del universo (si falta, se usa el nombre). */
    tituloSeo: z.string().optional(),
    /** Versión inglesa (/en/) de la descripción y del título para buscadores. */
    descripcionEn: z.string().optional(),
    tituloSeoEn: z.string().optional(),
    /**
     * Bloques en los que se organiza el universo (en Marvel: UMC, Pre-UMC, Animación).
     * `orden` indica qué significa el número de cada ficha en esa sección.
     */
    secciones: z
      .array(
        z.object({
          id: slug,
          nombre: z.string(),
          orden: z.enum(ORDENES_SECCION),
          descripcion: z.string().optional(),
          /** Título para buscadores de la estantería (si falta, se usa el nombre). */
          tituloSeo: z.string().optional(),
          /** Versión inglesa (/en/): nombre (UMC → MCU), descripción y título para buscadores. */
          nombreEn: z.string().optional(),
          descripcionEn: z.string().optional(),
          tituloSeoEn: z.string().optional(),
          /** Solo con `orden: carpetas`: las carpetas de visionado y su etapa (Pre-Crossover, Crossover…). */
          carpetas: z
            .array(
              z.object({
                numero: z.number().int(),
                etapa: z.string(),
                etapaEn: z.string().optional(),
                descripcion: z.string().optional(),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
    /** Grupos de la página «Relacionadas y sagas», por el `orden` de cada saga (desde ≤ orden < hasta). */
    gruposSagas: z
      .array(
        z.object({
          titulo: z.string(),
          texto: z.string().optional(),
          tituloEn: z.string().optional(),
          textoEn: z.string().optional(),
          desde: z.number(),
          hasta: z.number(),
        }),
      )
      .default([]),
    /** Ambiente visual: acento y su versión para texto en modo claro y oscuro. */
    tema: z.record(z.string(), z.string()).default({}),
  }),
});

/* ------------------------------------------------------------------ */
/* Relacionadas: multiversos, sagas, trilogías…                        */
/* ------------------------------------------------------------------ */
const sagas = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './contenido/sagas', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    nombre: z.string(),
    universo: reference('universos'),
    tipo: z.enum(TIPOS_SAGA).default('saga'),
    /** Saga que la contiene (p. ej. "Fase 3" está dentro de "Saga del Infinito"). */
    padre: reference('sagas').optional(),
    orden: z.number().default(0),
    descripcion: z.string().optional(),
    /** Versión inglesa (/en/) del nombre y la descripción. */
    nombreEn: z.string().optional(),
    descripcionEn: z.string().optional(),
    notas: z.string().optional(),
    fuente: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------ */
/* Personajes                                                        */
/* ------------------------------------------------------------------ */
const personajes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contenido/personajes', generateId: idPorNombreDeArchivo }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      /** Nombre en la versión inglesa (/en/): «Capitán América» → «Captain America». */
      nombreEn: z.string().optional(),
      /** Otros nombres por los que se le conoce (también sirven para el buscador). */
      alias: z.array(z.string()).default([]),
      identidad: z.string().optional(),
      universo: reference('universos'),
      imagen: image().optional(),
      notas: z.string().optional(),
    }),
});

/* ------------------------------------------------------------------ */
/* Títulos: una ficha por película, temporada, One-Shot, especial…     */
/* ------------------------------------------------------------------ */
const apariciones = z.union([
  // Forma corta: solo el id → `- thor`
  reference('personajes').transform((p) => ({ personaje: p, papel: undefined, actor: undefined, notas: undefined })),
  // Forma larga: `- { personaje: thor, actor: Chris Hemsworth, papel: protagonista }`
  z.object({
    personaje: reference('personajes'),
    actor: z.string().optional(),
    papel: z.enum(PAPELES).optional(),
    notas: z.string().optional(),
  }),
]);

/** Código de capítulo: "1x01". */
const codigoCapitulo = z.string().regex(/^\d+x\d{2,3}$/, 'Usa el formato temporadaxcapítulo, ej. "1x01"');

const titulos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contenido/titulos', generateId: idPorNombreDeArchivo }),
  schema: ({ image }) =>
    z.object({
      /** Título en España (principal). */
      titulo: z.string(),
      /** Título original (se muestra debajo). */
      tituloOriginal: z.string().optional(),
      /** Otros títulos (Latinoamérica, provisionales…). El buscador también los usa. */
      otrosTitulos: z.array(z.string()).default([]),

      tipo: z.enum(CLAVES_TIPO),
      /** De animación (película animada, serie animada…). Se filtra aparte del tipo. */
      animada: z.boolean().default(false),
      universo: reference('universos'),
      /** Id de una sección del universo: umc, pre-umc, animacion… */
      seccion: slug,
      /** Tu número dentro de la sección (001 → 1). En UMC es el orden cronológico; en Pre-UMC, el de estreno. */
      numero: z.number().optional(),
      /**
       * Si la ficha ocupa varios números (una temporada repartida en la cronología),
       * cada tramo indica su número y qué capítulos abarca.
       */
      tramos: z
        .array(z.object({ numero: z.number(), desde: codigoCapitulo, hasta: codigoCapitulo }))
        .default([]),
      /** Página de tu Archivador ROJO donde está la ficha impresa. */
      paginaArchivador: z.number().int().optional(),
      /** Calidad de tu copia (las insignias de las fichas). */
      calidad: z.array(z.enum(CALIDADES)).default([]),
      /**
       * En secciones ordenadas por carpetas: en qué carpeta va, su código de visionado ("2.3")
       * y su posición dentro de la carpeta. En ellas, `numero` es el de la carpeta del disco (011 Smallville).
       */
      visionado: z
        .object({ carpeta: z.number().int(), codigo: z.string().optional(), orden: z.number() })
        .optional(),
      /** Pendiente de ver o de colocar (la lista «EN ESPERA» de tus documentos). */
      enEspera: z.boolean().default(false),

      /** Para temporadas: id común de la serie (agrupa sus temporadas) y número de temporada. */
      serie: slug.optional(),
      temporada: z.number().int().positive().optional(),
      /** Para series en una sola ficha (sin desglose por temporadas): cuántas tiene. */
      temporadas: z.number().int().positive().optional(),
      /** false si el título está en tu índice o videoteca pero aún no tiene ficha en tus documentos. */
      fichaPropia: z.boolean().default(true),

      sagas: z.array(reference('sagas')).default([]),

      anio: z.number().int().min(1900).max(2100),
      anioFin: z.number().int().optional(),
      fechaEstreno: z.coerce.date().optional(),
      fechaEstrenoEspana: z.coerce.date().optional(),
      /** Cuándo transcurre, en texto libre: "1943–1945", "años 90". */
      epoca: z.string().optional(),

      nacionalidad: z.string().optional(),
      /** Minutos (en series, duración aproximada por capítulo). */
      duracion: z.number().int().positive().optional(),
      direccion: unoOVarios,
      guion: unoOVarios,
      productora: unoOVarios,
      distribuidora: unoOVarios,

      argumento: z.string().optional(),
      reparto: z.array(z.object({ actor: z.string(), personaje: z.string().optional() })).default([]),
      personajes: z.array(apariciones).default([]),

      capitulos: z
        .array(
          z.object({
            codigo: codigoCapitulo,
            titulo: z.string(),
            argumento: z.string().optional(),
            direccion: unoOVarios,
            guion: unoOVarios,
            duracion: z.number().int().positive().optional(),
          }),
        )
        .default([]),

      /** Imágenes de la ficha: portada y contraportada de tu edición, y otras. */
      imagenes: z
        .array(
          z.object({
            src: image(),
            rol: z.enum(['portada', 'contraportada', 'imagen']).default('imagen'),
            alt: z.string().optional(),
          }),
        )
        .default([]),
      /** Id del vídeo de YouTube (lo que va tras `v=`). */
      trailer: z.string().regex(/^[\w-]{11}$/, 'Debe ser el id de 11 caracteres de YouTube').optional(),
      tmdb: z.object({ id: z.number().int(), tipo: z.enum(['movie', 'tv']) }).optional(),

      conexiones: z
        .object({
          verAntes: z.array(reference('titulos')).default([]),
          verDespues: z.array(reference('titulos')).default([]),
          relacionados: z.array(reference('titulos')).default([]),
          postCreditos: z.array(textoConSpoiler).default([]),
          cameos: z
            .array(
              z.object({
                descripcion: z.string(),
                personaje: reference('personajes').optional(),
                titulo: reference('titulos').optional(),
                spoiler: z.boolean().default(true),
              }),
            )
            .default([]),
        })
        .default({ verAntes: [], verDespues: [], relacionados: [], postCreditos: [], cameos: [] }),

      /** Información que no encaja en ningún campo, o dudosa. Nunca se descarta. */
      notas: z.string().optional(),
      /** Las notas en inglés, para la versión inglesa (/en/). */
      notasEn: z.string().optional(),
      /** De qué documento y diapositiva salió la información (para trazabilidad). */
      fuente: z.string().optional(),
    }),
});

/* ------------------------------------------------------------------ */
/* Visionados: orden capítulo a capítulo entre varias series           */
/* ------------------------------------------------------------------ */
const visionados = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './contenido/visionados', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    nombre: z.string(),
    universo: reference('universos'),
    seccion: slug,
    /** Carpeta de visionado a la que pertenece (sección con `orden: carpetas`). */
    carpeta: z.number().int(),
    /** Código del bloque en tus documentos ("5.1", "7.2"). */
    codigo: z.string().optional(),
    /** Página de tus documentos todavía a medio hacer. */
    borrador: z.boolean().default(false),
    orden: z.array(
      z.object({
        /** Tu número de orden (01, 02…). */
        n: z.number().int().optional(),
        /** Ficha de la temporada. */
        titulo: reference('titulos'),
        /** Capítulo ("2x08"). Sin código: la temporada entera va en ese punto. */
        codigo: codigoCapitulo.optional(),
        capitulo: z.string().optional(),
        megacrossover: z.boolean().default(false),
        nota: z.string().optional(),
      }),
    ),
    notas: z.string().optional(),
    fuente: z.string().optional(),
  }),
});

export const collections = { universos, sagas, personajes, titulos, visionados };

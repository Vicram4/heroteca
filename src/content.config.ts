/**
 * Esquema de datos de Heroteca.
 *
 * Todo el contenido vive en la carpeta `contenido/`:
 *   contenido/universos/<id>.yaml        → Marvel, DC, Otros…
 *   contenido/sagas/<universo>/<id>.yaml → sagas, fases, trilogías…
 *   contenido/titulos/<universo>/<id>.md → una película/serie por archivo
 *   contenido/personajes/<universo>/<id>.md
 *
 * El identificador de cada entrada es el nombre del archivo sin extensión
 * (p. ej. `vengadores-endgame`), y también es el trozo final de su URL.
 * Las subcarpetas solo sirven para ordenar; no forman parte del id.
 *
 * Si un archivo no cumple el esquema, `npm run build` falla e indica
 * qué archivo y qué campo están mal.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CLAVES_TIPO, PAPELES, TIPOS_SAGA } from './config/tipos';

/** El id es el nombre del archivo, sin carpetas ni extensión. */
const idPorNombreDeArchivo = ({ entry }: { entry: string }) =>
  entry.split('/').pop()!.replace(/\.(md|ya?ml|json)$/i, '');

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa solo minúsculas, números y guiones (ej. "mcu", "dc-animated")');

/** Texto que puede ocultarse como spoiler. Admite texto simple o { texto, spoiler }. */
const textoConSpoiler = z.union([
  z.string().transform((texto) => ({ texto, spoiler: true })),
  z.object({ texto: z.string(), spoiler: z.boolean().default(true) }),
]);

/* ------------------------------------------------------------------ */
/* Universos                                                           */
/* ------------------------------------------------------------------ */
const universos = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: './contenido/universos', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    nombre: z.string(),
    /** Orden en la portada y en la navegación. */
    orden: z.number().int(),
    /** Si es false, el universo no aparece en la web (útil para preparar "Otros"). */
    activo: z.boolean().default(true),
    descripcion: z.string().optional(),
    subuniversos: z
      .array(
        z.object({
          id: slug,
          nombre: z.string(),
          descripcion: z.string().optional(),
        }),
      )
      .default([]),
    /** Ambiente visual. Los valores definitivos se decidirán en la Fase 3. */
    tema: z.record(z.string(), z.string()).default({}),
  }),
});

/* ------------------------------------------------------------------ */
/* Sagas y fases                                                       */
/* ------------------------------------------------------------------ */
const sagas = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './contenido/sagas', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    nombre: z.string(),
    universo: reference('universos'),
    subuniverso: slug.optional(),
    tipo: z.enum(TIPOS_SAGA).default('saga'),
    /** Saga que la contiene (p. ej. "Fase 3" está dentro de "Saga del Infinito"). */
    padre: reference('sagas').optional(),
    orden: z.number().default(0),
    descripcion: z.string().optional(),
    notas: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------ */
/* Personajes                                                          */
/* ------------------------------------------------------------------ */
const personajes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contenido/personajes', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    nombre: z.string(),
    /** Otros nombres por los que se le conoce (también sirven para el buscador). */
    alias: z.array(z.string()).default([]),
    identidad: z.string().optional(),
    universo: reference('universos'),
    imagen: z.string().optional(),
    notas: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------ */
/* Títulos (películas, series, animación, documentales, especiales)    */
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

const titulos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contenido/titulos', generateId: idPorNombreDeArchivo }),
  schema: z.object({
    /** Título en España (principal). */
    titulo: z.string(),
    /** Título original (se muestra debajo). */
    tituloOriginal: z.string().optional(),
    /** Otros títulos (Latinoamérica, provisionales…). El buscador también los usa. */
    otrosTitulos: z.array(z.string()).default([]),

    tipo: z.enum(CLAVES_TIPO),
    /** Si es de animación (película animada, serie animada…). Se filtra aparte del tipo. */
    animada: z.boolean().default(false),
    universo: reference('universos'),
    /** Id de un subuniverso definido en el archivo del universo (mcu, sony, dceu…). */
    subuniverso: slug.optional(),
    sagas: z.array(reference('sagas')).default([]),

    anio: z.number().int().min(1900).max(2100),
    /** Año de fin (series). */
    anioFin: z.number().int().optional(),
    fechaEstreno: z.coerce.date().optional(),
    fechaEstrenoEspana: z.coerce.date().optional(),
    /**
     * Posición en el orden interno de la historia (in-universe).
     * Se admiten decimales para intercalar títulos sin renumerar (ej. 4.5).
     */
    ordenCronologico: z.number().optional(),
    /** Cuándo transcurre, en texto libre: "1943–1945", "2023". */
    epoca: z.string().optional(),

    duracion: z.number().int().positive().optional(),
    temporadas: z.number().int().positive().optional(),
    episodios: z.number().int().positive().optional(),

    sinopsis: z.string().optional(),
    personajes: z.array(apariciones).default([]),
    reparto: z.array(z.object({ actor: z.string(), personaje: z.string().optional() })).default([]),

    /** Id del vídeo de YouTube (lo que va tras `v=`). */
    trailer: z.string().regex(/^[\w-]{11}$/, 'Debe ser el id de 11 caracteres de YouTube').optional(),
    poster: z.string().optional(),
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
    /** De qué documento salió la información (para trazabilidad). */
    fuente: z.string().optional(),
  }),
});

export const collections = { universos, sagas, personajes, titulos };

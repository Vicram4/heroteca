/**
 * Tipos de título. La clave es la que se escribe en los archivos de datos
 * (`tipo: pelicula`); el valor es lo que se muestra en la web.
 * Los nombres siguen los de las fichas originales ("PELÍCULA", "SERIE", "One-Shot"…).
 */
export const TIPOS = {
  pelicula: { nombre: 'Película', plural: 'Películas' },
  serie: { nombre: 'Serie', plural: 'Series' },
  'one-shot': { nombre: 'One-Shot', plural: 'One-Shots' },
  especial: { nombre: 'Especial', plural: 'Especiales' },
  corto: { nombre: 'Corto', plural: 'Cortos' },
  documental: { nombre: 'Documental', plural: 'Documentales' },
} as const;

export type TipoTitulo = keyof typeof TIPOS;
export const CLAVES_TIPO = Object.keys(TIPOS) as [TipoTitulo, ...TipoTitulo[]];

/**
 * Cómo se ordena y numera una sección: por orden interno de la historia, por estreno,
 * o por las carpetas de visionado del usuario (las series de DC: 1.1, 2.3…).
 */
export const ORDENES_SECCION = ['cronologico', 'estreno', 'carpetas'] as const;

/** Calidad de la copia del usuario (las insignias de sus documentos). */
export const CALIDADES = ['720p', '1080p', '4k', 'webm', 'avi'] as const;

/** Tipos de agrupación para "Relacionadas", sagas, fases, trilogías… */
export const TIPOS_SAGA = ['multiverso', 'saga', 'fase', 'trilogia', 'otro'] as const;

/** Importancia de un personaje dentro de un título. */
export const PAPELES = ['protagonista', 'principal', 'secundario', 'cameo', 'voz', 'mencion'] as const;

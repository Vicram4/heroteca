/**
 * Tipos de título. La clave es la que se escribe en los archivos de datos
 * (`tipo: pelicula`); el valor es lo que se muestra en la web.
 */
export const TIPOS = {
  pelicula: { nombre: 'Película', plural: 'Películas' },
  serie: { nombre: 'Serie', plural: 'Series' },
  animacion: { nombre: 'Animación', plural: 'Animación' },
  documental: { nombre: 'Documental', plural: 'Documentales' },
  especial: { nombre: 'Especial', plural: 'Especiales' },
} as const;

export type TipoTitulo = keyof typeof TIPOS;
export const CLAVES_TIPO = Object.keys(TIPOS) as [TipoTitulo, ...TipoTitulo[]];

/** Tipos de agrupación para sagas, fases, trilogías… */
export const TIPOS_SAGA = ['saga', 'fase', 'trilogia', 'continuidad', 'otro'] as const;

/** Importancia de un personaje dentro de un título. */
export const PAPELES = ['protagonista', 'principal', 'secundario', 'cameo', 'voz', 'mencion'] as const;

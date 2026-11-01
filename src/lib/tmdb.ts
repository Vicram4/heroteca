/**
 * Datos complementarios de TMDB, leídos del archivo compacto datos/tmdb/<universo>.json
 * (lo genera scripts/sincronizar_tmdb.py). Al compilar no se contacta con TMDB.
 */
export interface CapituloTmdb {
  codigo: string;
  titulo?: string;
  sinopsis?: string;
  duracion?: number;
  fecha?: string;
  direccion?: string[];
  guion?: string[];
}
export interface DatosTmdb {
  id: number;
  /** Título en el idioma del archivo (en los .en.json, el título en inglés) */
  titulo?: string;
  tipo: 'movie' | 'tv';
  poster?: string;
  fondo?: string;
  fecha?: string;
  fechaES?: string;
  duracion?: number;
  sinopsis?: string;
  direccion?: string[];
  guion?: string[];
  creadores?: string[];
  /** Reparto; idTmdb y foto, para las páginas de actores */
  reparto?: { actor: string; personaje?: string; idTmdb?: number; foto?: string }[];
  trailer?: string;
  generos?: string[];
  temporadas?: number;
  capitulos?: CapituloTmdb[];
  /** Nota media de TMDB (0-10) y número de votos (para el recomendador) */
  nota?: number;
  votos?: number;
  /** Edad mínima según la calificación por edades (España; si no hay, Estados Unidos) */
  edad?: number;
  /** Escenas durante / después de los créditos (palabras clave de TMDB) */
  escenasCreditos?: ('durante' | 'despues')[];
}

const archivos = import.meta.glob<Record<string, DatosTmdb>>('../../datos/tmdb/*.json', { eager: true, import: 'default' });
const porUniverso = new Map(
  Object.entries(archivos).map(([ruta, datos]) => [ruta.split('/').pop()!.replace('.json', ''), datos]),
);

/** Datos de TMDB de una ficha; con idioma 'en', los de la versión inglesa (datos/tmdb/<universo>.en.json). */
export function datosTmdb(universo: string, id: string, idioma: 'es' | 'en' = 'es'): DatosTmdb | undefined {
  return porUniverso.get(idioma === 'en' ? `${universo}.en` : universo)?.[id];
}

/** URL de una imagen del CDN de TMDB. Tamaños: w92, w154, w185, w342, w500, w780, original. */
export const imagenTmdb = (ruta: string, tamano: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' = 'w342') =>
  `https://image.tmdb.org/t/p/${tamano}${ruta}`;

/** srcset para carátulas servidas desde TMDB */
export const srcsetPoster = (ruta: string) =>
  [`${imagenTmdb(ruta, 'w185')} 185w`, `${imagenTmdb(ruta, 'w342')} 342w`, `${imagenTmdb(ruta, 'w500')} 500w`].join(', ');

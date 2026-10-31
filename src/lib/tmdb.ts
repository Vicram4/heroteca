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
  reparto?: { actor: string; personaje?: string }[];
  trailer?: string;
  generos?: string[];
  temporadas?: number;
  capitulos?: CapituloTmdb[];
}

const archivos = import.meta.glob<Record<string, DatosTmdb>>('../../datos/tmdb/*.json', { eager: true, import: 'default' });
const porUniverso = new Map(
  Object.entries(archivos).map(([ruta, datos]) => [ruta.split('/').pop()!.replace('.json', ''), datos]),
);

export function datosTmdb(universo: string, id: string): DatosTmdb | undefined {
  return porUniverso.get(universo)?.[id];
}

/** URL de una imagen del CDN de TMDB. Tamaños: w92, w154, w185, w342, w500, w780, original. */
export const imagenTmdb = (ruta: string, tamano: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' = 'w342') =>
  `https://image.tmdb.org/t/p/${tamano}${ruta}`;

/** srcset para carátulas servidas desde TMDB */
export const srcsetPoster = (ruta: string) =>
  [`${imagenTmdb(ruta, 'w185')} 185w`, `${imagenTmdb(ruta, 'w342')} 342w`, `${imagenTmdb(ruta, 'w500')} 500w`].join(', ');

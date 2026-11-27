/**
 * Datos de vídeo (schema.org VideoObject) del tráiler de YouTube de una ficha o de un estreno, para que Google pueda
 * mostrar la miniatura en los resultados. Google exige la fecha de subida: sale de datos/trailers-fechas.json
 * (scripts/fechas_trailers.mjs). Sin fecha no se publica nada.
 */
import fechas from '../../datos/trailers-fechas.json';

const FECHAS = fechas as Record<string, string>;

export function datosTrailer(clave: string | null | undefined, nombre: string, descripcion: string) {
  if (!clave || !FECHAS[clave]) return undefined;
  return {
    '@type': 'VideoObject',
    name: nombre,
    description: descripcion,
    thumbnailUrl: `https://i.ytimg.com/vi/${clave}/hqdefault.jpg`,
    uploadDate: FECHAS[clave],
    embedUrl: `https://www.youtube-nocookie.com/embed/${clave}`,
  };
}

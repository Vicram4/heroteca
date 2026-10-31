/**
 * Configuración general del sitio.
 *
 * Este es el ÚNICO lugar donde se definen el nombre y el lema.
 * Cámbialos aquí y se actualizarán en toda la web (cabecera, título
 * de las pestañas, metadatos, footer…).
 */
export const SITE = {
  nombre: 'Heroteca',
  lema: 'Todo el multiverso, en un solo lugar',
  descripcion:
    'Enciclopedia personal de películas, series, animación y especiales de superhéroes.',
  idioma: 'es-ES',
  /** URL pública. Se rellenará al publicar en Vercel (Fase 7). */
  url: 'https://heroteca.vercel.app',
  github: 'https://github.com/Vicram4',
} as const;

/** Textos legales obligatorios del footer. */
export const AVISOS = {
  fans:
    'Proyecto de fans sin ánimo de lucro y no oficial. No tiene relación con Marvel, DC, Disney ni Warner Bros. Todos los personajes y marcas pertenecen a sus respectivos propietarios.',
  tmdb: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
} as const;

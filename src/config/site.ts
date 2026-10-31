/**
 * Configuración general del sitio.
 *
 * Este es el ÚNICO lugar donde se definen el nombre y el lema.
 * Cámbialos aquí y se actualizarán en toda la web (cabecera, título
 * de las pestañas, metadatos, footer…).
 */
export const SITE = {
  nombre: 'Heroteca',
  /**
   * Cómo se pinta el nombre en la cabecera: la segunda parte va en color de acento.
   * Si cambias `nombre`, cambia también esto (si no coinciden, se muestra el nombre sin partir).
   */
  marca: ['Hero', 'teca'],
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
  /** Texto exigido por las condiciones de uso de la API de TMDB (apartado 3, versión de octubre de 2023). */
  tmdb: 'This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.',
} as const;

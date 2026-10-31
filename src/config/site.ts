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
  /** URL pública en Vercel. Si cambia la dirección, actualízala aquí (enlaces canónicos y vista previa al compartir). */
  url: 'https://heroteca.vercel.app',
  github: 'https://github.com/Vicram4',
  /** Repositorio del proyecto (para avisar de errores). */
  repositorio: 'https://github.com/Vicram4/heroteca',
  /**
   * Token de Cloudflare Web Analytics (estadísticas sin cookies). Vacío = desactivadas.
   * Si se activan, la página de privacidad lo explica automáticamente.
   */
  cloudflareAnalytics: '1a854bd5a89245afa7a452e8d3f75476',
  /** Código de verificación de Google Search Console (es público; no identifica a nadie). */
  googleVerificacion: 'd9udc0hSfl5WRRV432HhCeZPJ4Asyi5yJrZT4uV5kcM',
} as const;

/**
 * Easter egg: código Konami (↑ ↑ ↓ ↓ ← → ← → B A) en ordenador,
 * o 7 toques seguidos sobre la parte de color del nombre en el móvil.
 */
export const DEDICATORIA = {
  mensaje: 'Dedicado a papá',
  firma: SITE.nombre,
} as const;

/** Textos legales obligatorios del footer. */
export const AVISOS = {
  fans:
    'Proyecto de fans sin ánimo de lucro y no oficial. No tiene relación con Marvel, DC, Disney ni Warner Bros. Todos los personajes y marcas pertenecen a sus respectivos propietarios.',
  /** Texto exigido por las condiciones de uso de la API de TMDB (apartado 3, versión de octubre de 2023). */
  tmdb: 'This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.',
} as const;

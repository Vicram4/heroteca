/**
 * Idiomas de la web: español (por defecto, sin prefijo) e inglés (/en/…).
 *
 * - Cada página vive en src/pages/[...idioma]/ y genera las dos versiones: getStaticPaths
 *   duplica sus rutas con `conIdiomas()`.
 * - Los textos fijos están en ./textos.ts; los componentes los obtienen con `textos(Astro.url)`.
 * - En las páginas inglesas, los enlaces internos se reescriben al compilar para que apunten a /en/…
 *   (integración de astro.config.mjs), así que en el código se escriben siempre sin prefijo.
 */
import { ES, EN, type Textos } from './textos';
import { TIPOS, type TipoTitulo } from '../config/tipos';

export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** Código de idioma y región para HTML, fechas y Open Graph. */
export const LOCALE: Record<Idioma, string> = { es: 'es-ES', en: 'en-US' };

export const idiomaDe = (url: URL): Idioma => (url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'es');

/** Ruta de la misma página en el otro idioma: «/marvel/umc/» ⇄ «/en/marvel/umc/». */
export const sinIdioma = (ruta: string) => ruta.replace(/^\/en(?=\/|$)/, '') || '/';
export const enIdioma = (idioma: Idioma, ruta: string) => (idioma === 'en' ? `/en${ruta === '/' ? '/' : ruta}` : ruta);

/**
 * Duplica las rutas de getStaticPaths para los dos idiomas (params.idioma: undefined = español).
 * `enIngles` devuelve los parámetros que cambian en la dirección inglesa (slugs y palabras traducidas).
 */
export function conIdiomas<P extends Record<string, string | undefined>, R>(
  rutas: { params: P; props?: R }[],
  enIngles?: (r: { params: P; props?: R }) => Partial<P>,
) {
  return IDIOMAS.flatMap((idioma) =>
    rutas.map((r) => ({
      params: { ...r.params, ...(idioma === 'en' ? enIngles?.(r) : {}), idioma: idioma === 'es' ? undefined : idioma },
      props: r.props,
    })),
  );
}

export function textos(url: URL): Textos {
  return idiomaDe(url) === 'en' ? EN : ES;
}
export const textosDe = (idioma: Idioma): Textos => (idioma === 'en' ? EN : ES);

/** «Película» / «Film», en singular o plural. */
export function nombreTipo(tipo: TipoTitulo, idioma: Idioma, plural = false) {
  const t = TIPOS[tipo];
  return idioma === 'en' ? (plural ? t.pluralEn : t.nombreEn) : plural ? t.plural : t.nombre;
}

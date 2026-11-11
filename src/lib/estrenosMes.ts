/**
 * Páginas «Estrenos de Marvel y DC en <mes>» (/estrenos/diciembre-2026/, en inglés /en/releases/december-2026/),
 * a partir de datos/proximamente.json: películas (fecha de cines del país) y series o temporadas nuevas (episodio 1).
 * No entran los episodios sueltos de series en emisión ni lo archivado con fecha futura (ya no es de fiar).
 * Los meses pasados siguen existiendo mientras sus estrenos estén en el archivo.
 */
import { todosLosEstrenos, fechaDe, enEmision, estadoEstreno, type Estreno } from './proximamente';
import type { Idioma } from '../i18n';

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const paisDeIdioma = (idioma: Idioma) => (idioma === 'en' ? 'US' : 'ES');

/** «2026-12» → «diciembre-2026» / «december-2026» */
export const rutaMes = (mes: string, idioma: Idioma) => {
  const [a, m] = mes.split('-').map(Number);
  return `${(idioma === 'en' ? MESES_EN : MESES_ES)[m - 1]}-${a}`;
};

/** «2026-12» → «diciembre de 2026» / «December 2026» */
export const nombreMes = (mes: string, idioma: Idioma) =>
  new Date(`${mes}-01T00:00:00Z`).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const cuenta = (e: Estreno, pais: 'ES' | 'US') => !enEmision(e) && estadoEstreno(e, pais) !== 'sinFecha';

/** Meses con algún estreno en España o en EE. UU., en orden (los mismos en los dos idiomas, para emparejar páginas). */
export function mesesConEstrenos(): string[] {
  const meses = new Set<string>();
  for (const e of todosLosEstrenos())
    for (const pais of ['ES', 'US'] as const) if (cuenta(e, pais)) meses.add(fechaDe(e, pais).slice(0, 7));
  return [...meses].sort();
}

/** Estrenos de un mes en el país del idioma, por fecha. */
export function estrenosDelMes(mes: string, idioma: Idioma): Estreno[] {
  const pais = paisDeIdioma(idioma);
  const vistos = new Set<string>();
  return todosLosEstrenos()
    .filter((e) => cuenta(e, pais) && fechaDe(e, pais).startsWith(mes) && !vistos.has(e.clave) && vistos.add(e.clave))
    .sort((a, b) => fechaDe(a, pais).localeCompare(fechaDe(b, pais)));
}

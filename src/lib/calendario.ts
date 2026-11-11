/**
 * Calendario de estrenos en formato iCalendar (.ics) para suscribirse desde Google Calendar, Apple Calendar u Outlook.
 * Es la forma gratuita y sin servidor de «avisar de los estrenos»: la app de calendario de cada persona lo recarga
 * sola (Heroteca lo vuelve a generar cada semana con los datos de Próximamente) y avisa el día antes.
 * También genera el enlace «Añadir a Google Calendar» de un estreno suelto.
 */
import { SITE } from '../config/site';
import { textosDe, type Idioma } from '../i18n';
import { rutaEnIdioma } from '../i18n/rutas';
import { enEmision, enlaceEstreno, fechaDe, fechaProximamente, textosEstreno, todosLosEstrenos, estadoEstreno, type Estreno } from './proximamente';
import { paisDe } from './dondever';

/** Días hacia atrás que se conservan los ya estrenados (si desaparecen del archivo, desaparecen del calendario) */
const DIAS_ATRAS = 90;

export const rutaCalendario = (idioma: Idioma) => (idioma === 'en' ? '/en/calendar.ics' : '/calendario.ics');
/** Dirección de suscripción: webcal:// hace que el sistema abra la app de calendario */
export const suscripcionCalendario = (idioma: Idioma) => new URL(rutaCalendario(idioma), SITE.url).href.replace(/^https?:/, 'webcal:');
export const googleSuscripcion = (idioma: Idioma) =>
  `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(suscripcionCalendario(idioma))}`;

/** Título del evento: «Vengadores: Doomsday», «Loki · Temporada 3», «Daredevil · T2 · episodio 5» */
export function tituloEvento(e: Estreno, idioma: Idioma) {
  const p = textosDe(idioma).proximos;
  const t = textosEstreno(e, idioma).titulo;
  if (e.tipo === 'pelicula') return t;
  if (enEmision(e)) return `${t} · T${e.temporada ?? 1} · ${p.unidadEpisodio} ${e.episodio}`;
  return `${t} · ${(e.temporada ?? 1) > 1 ? p.temporadaNueva(e.temporada ?? 1) : p.serieNueva}`;
}

const diaSiguiente = (dia: string) => new Date(Date.parse(`${dia}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
const compacta = (dia: string) => dia.replaceAll('-', '');

/** Enlace «Añadir a Google Calendar» de un estreno (evento de día completo) */
export async function enlaceGoogle(e: Estreno, idioma: Idioma) {
  const dia = fechaDe(e, paisDe(idioma));
  const url = new URL(await rutaEnIdioma(enlaceEstreno(e), idioma), SITE.url).href;
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: tituloEvento(e, idioma),
    dates: `${compacta(dia)}/${compacta(diaSiguiente(dia))}`,
    details: url,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Texto escapado según RFC 5545 */
const escapar = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Parte las líneas de más de 75 octetos (RFC 5545), sin cortar caracteres UTF-8 */
function plegar(linea: string) {
  const partes: string[] = [];
  let actual = '';
  let bytes = 0;
  for (const c of linea) {
    const n = new TextEncoder().encode(c).length;
    if (bytes + n > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = '';
      bytes = 0;
    }
    actual += c;
    bytes += n;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

export async function calendarioIcs(idioma: Idioma) {
  const tx = textosDe(idioma);
  const p = tx.proximos;
  const pais = paisDe(idioma);
  const desde = new Date(Date.now() - DIAS_ATRAS * 86400000).toISOString().slice(0, 10);
  const sello = `${compacta(fechaProximamente().toISOString().slice(0, 10))}T000000Z`;
  const estrenos = todosLosEstrenos()
    .filter((e) => estadoEstreno(e, pais) !== 'sinFecha' && fechaDe(e, pais) >= desde)
    .sort((a, b) => fechaDe(a, pais).localeCompare(fechaDe(b, pais)));

  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${SITE.nombre}//${idioma.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapar(p.calendarioNombre)}`,
    `X-WR-CALDESC:${escapar(p.calendarioDesc)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
  ];
  for (const e of estrenos) {
    const dia = fechaDe(e, pais);
    const url = new URL(await rutaEnIdioma(enlaceEstreno(e), idioma), SITE.url).href;
    const sinopsis = textosEstreno(e, idioma).sinopsis;
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${e.clave}-${idioma}@heroteca`,
      `DTSTAMP:${sello}`,
      `DTSTART;VALUE=DATE:${compacta(dia)}`,
      `DTEND;VALUE=DATE:${compacta(diaSiguiente(dia))}`,
      `SUMMARY:${escapar(tituloEvento(e, idioma))}`,
      `DESCRIPTION:${escapar([e.tipo === 'pelicula' ? p.calendarioCines : '', sinopsis, url].filter(Boolean).join('\n\n'))}`,
      `URL:${url}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapar(tituloEvento(e, idioma))}`,
      'TRIGGER:-PT12H',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lineas.push('END:VCALENDAR');
  return lineas.map(plegar).join('\r\n') + '\r\n';
}

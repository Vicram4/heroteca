import { conIdiomas, type Idioma } from '../../i18n';
export function getStaticPaths() {
  return conIdiomas([{ params: { calendario: 'calendario' } }], () => ({ calendario: 'calendar' }));
}
/**
 * Calendario de próximos estrenos para suscribirse (/calendario.ics y /en/calendar.ics). Ver src/lib/calendario.ts.
 */
import { calendarioIcs } from '../../lib/calendario';

export async function GET({ params }: { params: { idioma?: string } }) {
  const idioma: Idioma = params.idioma === 'en' ? 'en' : 'es';
  return new Response(await calendarioIcs(idioma), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
}

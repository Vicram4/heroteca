/**
 * Datos del easter egg. Se descargan solo cuando alguien lo descubre,
 * así el mensaje no aparece en el HTML de las páginas.
 */
import { getImage } from 'astro:assets';
import { DEDICATORIA } from '../config/site';
import { todosLosTitulos } from '../lib/datos';

export async function GET() {
  // Carátulas de tus propias ediciones (las de tu archivo), en tu orden
  const tuyas = (await todosLosTitulos())
    .filter((t) => (t.portada ?? t.portadaColeccion) && t.d.seccion === 'umc')
    .sort((a, b) => (a.d.numero ?? 999) - (b.d.numero ?? 999))
    .slice(0, 14);
  const caratulas = await Promise.all(tuyas.map(async (t) => (await getImage({ src: (t.portada ?? t.portadaColeccion)!, width: 220, format: 'webp' })).src));
  return new Response(JSON.stringify({ ...DEDICATORIA, caratulas }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

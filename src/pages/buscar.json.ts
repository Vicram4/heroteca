/**
 * Índice del buscador. Se genera al compilar y el navegador lo descarga
 * solo al abrir la búsqueda. Incluye título de España, original y otros títulos.
 */
import { getImage } from 'astro:assets';
import { todosLosTitulos, universosActivos, numeroTexto } from '../lib/datos';
import { personajesDe } from '../lib/personajes';
import { imagenTmdb } from '../lib/tmdb';

export async function GET() {
  const activos = new Map((await universosActivos()).map((u) => [u.id, u]));
  const titulos = (await todosLosTitulos()).filter((t) => activos.has(t.universo));
  const items = await Promise.all(
    titulos.map(async (t) => {
      const u = activos.get(t.universo)!;
      const seccion = u.data.secciones.find((s) => s.id === t.d.seccion)?.nombre ?? '';
      const img = t.portada
        ? (await getImage({ src: t.portada, width: 64, format: 'webp' })).src
        : t.m.posterTmdb
          ? imagenTmdb(t.m.posterTmdb, 'w92')
          : undefined;
      return {
        t: t.d.titulo + (t.d.temporada ? ` · Temporada ${t.d.temporada}` : ''),
        o: t.d.tituloOriginal ?? '',
        a: t.d.otrosTitulos,
        r: t.m.reparto.map((r) => [r.actor, r.personaje].filter(Boolean).join(' ')).join(' · '),
        u: t.url,
        y: t.d.anio,
        k: t.tipoNombre,
        c: t.tipo,
        n: numeroTexto(t.d.numero),
        s: `${u.data.nombre} · ${seccion}`,
        i: img,
      };
    }),
  );
  const personajes = (
    await Promise.all(
      [...activos.values()].map(async (u) =>
        (await personajesDe(u.id)).map(({ p, apariciones }) => ({
          t: p.data.nombre,
          o: p.data.identidad ?? '',
          a: p.data.alias,
          r: '',
          u: `/${u.id}/personajes/${p.id}/`,
          y: 0,
          k: 'Personaje',
          c: 'personaje',
          n: '',
          s: `${u.data.nombre} · ${apariciones.length} títulos`,
        })),
      ),
    )
  ).flat();
  return new Response(JSON.stringify([...personajes, ...items]), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

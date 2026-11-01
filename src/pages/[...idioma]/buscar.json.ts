import { conIdiomas } from '../../i18n';
export function getStaticPaths() {
  return conIdiomas([{ params: {} }]);
}
/**
 * Índice del buscador. Se genera al compilar y el navegador lo descarga
 * solo al abrir la búsqueda. Incluye título de España, original y otros títulos.
 */
import { getImage } from 'astro:assets';
import { todosLosTitulos, universosActivos, numeroTexto } from '../../lib/datos';
import { personajesDe } from '../../lib/personajes';
import { actores, limpiarPersonaje } from '../../lib/actores';
import { imagenTmdb } from '../../lib/tmdb';
import { nombreTipo, textosDe, type Idioma } from '../../i18n';
import { rutaEnIdioma } from '../../i18n/rutas';
import { seccionLoc, personajeLoc } from '../../i18n/datos';

export async function GET({ params }: { params: { idioma?: string } }) {
  const idioma: Idioma = params.idioma === 'en' ? 'en' : 'es';
  const tx = textosDe(idioma);
  const activos = new Map((await universosActivos()).map((u) => [u.id, u]));
  const titulos = (await todosLosTitulos(idioma)).filter((t) => activos.has(t.universo));
  const items = await Promise.all(
    titulos.map(async (t) => {
      const u = activos.get(t.universo)!;
      const s = u.data.secciones.find((x) => x.id === t.d.seccion);
      const seccion = s ? seccionLoc(s, idioma).nombre : '';
      const img = t.portada
        ? (await getImage({ src: t.portada, width: 64, format: 'webp' })).src
        : t.m.posterTmdb
          ? imagenTmdb(t.m.posterTmdb, 'w92')
          : undefined;
      return {
        t: t.d.titulo + (t.d.temporada ? ` · ${tx.general.temporada(t.d.temporada)}` : ''),
        o: t.d.tituloOriginal ?? '',
        a: t.d.otrosTitulos,
        r: t.m.reparto.map((r) => [r.actor, r.personaje].filter(Boolean).join(' ')).join(' · '),
        u: await rutaEnIdioma(t.url, idioma),
        y: t.d.anio,
        k: nombreTipo(t.tipo, idioma),
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
        Promise.all((await personajesDe(u.id)).map(({ p: original, apariciones }) => ({ p: personajeLoc(original, idioma), apariciones })).map(async ({ p, apariciones }) => ({
          t: p.data.nombre,
          o: p.data.identidad ?? '',
          a: [...p.data.alias, ...p.data.aliasEs],
          r: '',
          u: await rutaEnIdioma(`/${u.id}/personajes/${p.id}/`, idioma),
          y: 0,
          k: idioma === 'en' ? 'Character' : 'Personaje',
          c: 'personaje',
          n: '',
          s: `${u.data.nombre} · ${tx.general.titulos(apariciones.length)}`,
        }))),
      ),
    )
  ).flat();
  // Actores y actrices con página: se encuentran por nombre (y por sus personajes, con menos prioridad)
  const interpretes = await Promise.all(
    (await actores()).map(async (a) => ({
      t: a.nombre,
      o: '',
      a: [],
      r: [...new Set(a.papeles.map((p) => limpiarPersonaje(p.personaje)).filter(Boolean))].join(' · '),
      u: await rutaEnIdioma(`/actores/${a.id}/`, idioma),
      y: 0,
      k: tx.actores.tipo,
      c: 'actor',
      n: '',
      s: tx.general.titulos(a.papeles.length),
      i: a.foto ? imagenTmdb(a.foto, 'w92') : undefined,
    })),
  );
  return new Response(JSON.stringify([...personajes, ...interpretes, ...items]), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

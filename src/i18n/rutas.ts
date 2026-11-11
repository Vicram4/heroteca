/**
 * Direcciones de la versión inglesa. Se calculan solas a partir de los datos, así que no hay tabla que mantener:
 *   /marvel/capitan-america-el-primer-vengador/ → /en/marvel/captain-america-the-first-avenger/
 *   /marvel/umc/ → /en/marvel/mcu/ · /marvel/personajes/capitan-america/ → /en/marvel/characters/captain-america/
 *   /marvel/guias/orden-umc/ → /en/marvel/guides/mcu-watch-order/ · /acerca/ → /en/about/
 * Las fichas usan su título en inglés (de TMDB); las secciones, su `idEn`; personajes y sagas, su `nombreEn`.
 * Si dos direcciones coinciden, se añade el año (o el universo) para que no se repitan.
 */
import { getCollection } from 'astro:content';
import { GUIAS } from '../config/guias';
import { PLATAFORMAS } from '../config/plataformas';
import { mesesConEstrenos, rutaMes } from '../lib/estrenosMes';
import { todosLosTitulos, universosActivos } from '../lib/datos';
import { actores } from '../lib/actores';
import { JUEGOS } from '../config/juegos';
import { todosLosEstrenos } from '../lib/proximamente';

/** Palabras fijas de las direcciones. */
export const SEGMENTOS = { personajes: 'characters', carpetas: 'folders', guias: 'guides', acerca: 'about', privacidad: 'privacy', proximamente: 'coming-soon', miProgreso: 'my-progress', miAno: 'my-year',recomendaciones: 'recommendations', estadisticas: 'stats', actores: 'actors', noticias: 'news', pasatiempos: 'games', maraton: 'marathon', rankings: 'rankings', poscreditos: 'post-credits', wiki: 'wiki', dondeVer: 'where-to-watch', estrenos: 'releases', insertar: 'embed' } as const;
export type Segmento = keyof typeof SEGMENTOS;
export const segmento = (s: Segmento, idioma: 'es' | 'en') => (idioma === 'en' ? SEGMENTOS[s] : s);

export function slug(texto: string) {
  return texto
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(?<=\b[a-z])\.(?=[a-z]\b)/g, '') // S.H.I.E.L.D. → shield
    .replace(/\./g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface Tablas {
  fichas: Map<string, string>;
  secciones: Map<string, string>; // "universo/id" → idEn
  personajes: Map<string, string>;
  wiki: Map<string, string>;
  sagas: Map<string, string>;
  guias: Map<string, string>;
  /** Dirección española completa → inglesa, y al revés */
  aIngles: Map<string, string>;
  aEspanol: Map<string, string>;
}

let cache: Promise<Tablas> | undefined;
export function tablasEn() {
  cache ??= calcular();
  return cache;
}

/** Elige un slug libre dentro de un grupo, probando alternativas en orden. */
function libre(usados: Set<string>, opciones: string[]) {
  for (const o of opciones) if (o && !usados.has(o)) return usados.add(o), o;
  let n = 2;
  while (usados.has(`${opciones[0]}-${n}`)) n++;
  const o = `${opciones[0]}-${n}`;
  usados.add(o);
  return o;
}

async function calcular(): Promise<Tablas> {
  const universos = await universosActivos();
  const activos = new Set(universos.map((u) => u.id));
  const secciones = new Map<string, string>();
  const reservados = new Map<string, Set<string>>(); // por universo: secciones y palabras fijas
  for (const u of universos) {
    const r = new Set<string>(['sagas', 'buscar', ...Object.values(SEGMENTOS)]);
    for (const s of u.data.secciones) {
      const id = s.idEn ?? s.id;
      secciones.set(`${u.id}/${s.id}`, id);
      r.add(id);
    }
    reservados.set(u.id, r);
  }

  // Fichas: por universo, en orden estable (por id) para que el resultado no cambie entre compilaciones
  const fichas = new Map<string, string>();
  const titulosEn = (await todosLosTitulos('en')).filter((t) => activos.has(t.universo)).sort((a, b) => a.id.localeCompare(b.id));
  for (const u of activos) {
    const usados = new Set(reservados.get(u));
    for (const t of titulosEn.filter((x) => x.universo === u)) {
      const base = slug(t.d.titulo) + (t.d.temporada ? `-season-${t.d.temporada}` : '');
      fichas.set(t.id, libre(usados, [base || t.id, `${base}-${t.d.anio}`, t.id]));
    }
  }

  // Personajes y sagas: el id es global (entre universos), así que se evita repetir en todos
  const personajes = new Map<string, string>();
  const usadosP = new Set<string>();
  for (const p of (await getCollection('personajes')).sort((a, b) => a.id.localeCompare(b.id))) {
    const base = slug(p.data.nombreEn ?? p.data.nombre);
    personajes.set(p.id, libre(usadosP, [base, `${base}-${p.data.universo.id}`, p.id]));
  }
  const wiki = new Map<string, string>();
  const usadosW = new Set<string>();
  for (const e of (await getCollection('wiki')).sort((a, b) => a.id.localeCompare(b.id))) {
    const base = slug(e.data.nombreEn ?? e.data.nombre);
    wiki.set(e.id, libre(usadosW, [base, `${base}-${e.data.universo.id}`, e.id]));
  }
  const sagas = new Map<string, string>();
  const usadosS = new Set<string>();
  for (const s of (await getCollection('sagas')).sort((a, b) => a.id.localeCompare(b.id))) {
    const base = slug(s.data.nombreEn ?? s.data.nombre);
    sagas.set(s.id, libre(usadosS, [base, `${base}-${s.data.universo.id}`, s.id]));
  }
  const guias = new Map(GUIAS.map((g) => [g.id, g.idEn ?? g.id]));

  // Direcciones completas
  const aIngles = new Map<string, string>([
    ['/', '/en/'],
    ['/acerca/', `/en/${SEGMENTOS.acerca}/`],
    ['/privacidad/', `/en/${SEGMENTOS.privacidad}/`],
    ['/proximamente/', `/en/${SEGMENTOS.proximamente}/`],
    ['/mi-progreso/', `/en/${SEGMENTOS.miProgreso}/`],
    ['/mi-ano/', `/en/${SEGMENTOS.miAno}/`],
    ['/recomendaciones/', `/en/${SEGMENTOS.recomendaciones}/`],
    ['/estadisticas/', `/en/${SEGMENTOS.estadisticas}/`],
    ['/actores/', `/en/${SEGMENTOS.actores}/`],
    ['/noticias/', `/en/${SEGMENTOS.noticias}/`],
    ['/pasatiempos/', `/en/${SEGMENTOS.pasatiempos}/`],
    ['/maraton/', `/en/${SEGMENTOS.maraton}/`],
    ['/rankings/', `/en/${SEGMENTOS.rankings}/`],
    ['/poscreditos/', `/en/${SEGMENTOS.poscreditos}/`],
    ['/donde-ver/', `/en/${SEGMENTOS.dondeVer}/`],
  ]);
  for (const m of mesesConEstrenos()) aIngles.set(`/estrenos/${rutaMes(m, 'es')}/`, `/en/${SEGMENTOS.estrenos}/${rutaMes(m, 'en')}/`);
  for (const p of PLATAFORMAS) aIngles.set(`/donde-ver/${p.id}/`, `/en/${SEGMENTOS.dondeVer}/${p.id}/`);
  for (const e of todosLosEstrenos()) aIngles.set(`/proximamente/${e.ruta.es}/`, `/en/${SEGMENTOS.proximamente}/${e.ruta.en}/`);
  for (const a of await actores()) aIngles.set(`/actores/${a.id}/`, `/en/${SEGMENTOS.actores}/${a.id}/`);
  for (const j of JUEGOS) aIngles.set(`/pasatiempos/${j.id}/`, `/en/${SEGMENTOS.pasatiempos}/${j.idEn}/`);
  for (const u of universos) {
    const U = u.id;
    aIngles.set(`/${U}/`, `/en/${U}/`);
    for (const s of u.data.secciones) aIngles.set(`/${U}/${s.id}/`, `/en/${U}/${secciones.get(`${U}/${s.id}`)}/`);
    for (const t of titulosEn.filter((x) => x.universo === U)) aIngles.set(`/${U}/${t.id}/`, `/en/${U}/${fichas.get(t.id)}/`);
    aIngles.set(`/${U}/sagas/`, `/en/${U}/sagas/`);
    aIngles.set(`/${U}/personajes/`, `/en/${U}/${SEGMENTOS.personajes}/`);
    aIngles.set(`/${U}/noticias/`, `/en/${U}/${SEGMENTOS.noticias}/`);
    aIngles.set(`/${U}/guias/`, `/en/${U}/${SEGMENTOS.guias}/`);
    aIngles.set(`/${U}/wiki/`, `/en/${U}/${SEGMENTOS.wiki}/`);
    for (const s of u.data.secciones) for (const c of s.carpetas) aIngles.set(`/${U}/carpetas/${c.numero}/`, `/en/${U}/${SEGMENTOS.carpetas}/${c.numero}/`);
  }
  for (const p of await getCollection('personajes')) {
    if (activos.has(p.data.universo.id))
      aIngles.set(`/${p.data.universo.id}/personajes/${p.id}/`, `/en/${p.data.universo.id}/${SEGMENTOS.personajes}/${personajes.get(p.id)}/`);
  }
  for (const e of await getCollection('wiki')) {
    if (activos.has(e.data.universo.id)) aIngles.set(`/${e.data.universo.id}/wiki/${e.id}/`, `/en/${e.data.universo.id}/${SEGMENTOS.wiki}/${wiki.get(e.id)}/`);
  }
  for (const s of await getCollection('sagas')) {
    if (activos.has(s.data.universo.id)) aIngles.set(`/${s.data.universo.id}/sagas/${s.id}/`, `/en/${s.data.universo.id}/sagas/${sagas.get(s.id)}/`);
  }
  for (const g of GUIAS) aIngles.set(`/${g.universo}/guias/${g.id}/`, `/en/${g.universo}/${SEGMENTOS.guias}/${guias.get(g.id)}/`);
  const aEspanol = new Map([...aIngles].map(([es, en]) => [en, es]));
  return { fichas, secciones, personajes, wiki, sagas, guias, aIngles, aEspanol };
}

/** Dirección inglesa de una dirección española (si no está en las tablas, se le pone /en delante). */
export async function rutaEn(rutaEs: string) {
  return (await tablasEn()).aIngles.get(rutaEs) ?? (rutaEs === '/' ? '/en/' : `/en${rutaEs}`);
}

/** Dirección española de una inglesa. */
export async function rutaEs(rutaEnIngles: string) {
  return (await tablasEn()).aEspanol.get(rutaEnIngles) ?? (rutaEnIngles.replace(/^\/en(?=\/|$)/, '') || '/');
}

/** Dirección de una página española en el idioma pedido. */
export const rutaEnIdioma = (ruta: string, idioma: 'es' | 'en') => (idioma === 'en' ? rutaEn(ruta) : Promise.resolve(ruta));

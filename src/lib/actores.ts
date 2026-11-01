/**
 * Actores y actrices: sus papeles en la colección, a partir del reparto de TMDB y del escrito en las fichas.
 * Tienen página los que aparecen en al menos MIN_OBRAS obras distintas (las temporadas de una serie cuentan
 * como una sola obra), para no llenar la web de páginas casi vacías.
 */
import { todosLosTitulos, universosActivos, type Titulo } from './datos';
import { datosTmdb } from './tmdb';
import { slug } from '../i18n/rutas';

export const MIN_OBRAS = 3;

export interface Papel {
  t: Titulo;
  personaje?: string;
}
export interface Actor {
  /** Final de la URL: /actores/<id>/ (igual en inglés) */
  id: string;
  nombre: string;
  foto?: string;
  idTmdb?: number;
  /** Papeles ordenados por año */
  papeles: Papel[];
  /** Obras distintas (una serie cuenta una vez) */
  obras: number;
  /** Títulos por universo */
  porUniverso: Record<string, number>;
}

/** Clave para reconocer al mismo actor escrito de formas ligeramente distintas. */
export const claveActor = (nombre: string) =>
  nombre
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Personaje sin las anotaciones de TMDB: «Hulk (voice)» → «Hulk», «Captain America (archive footage)» → «Captain America».
 * Los papeles genéricos («Additional Voices», «Himself»…) se descartan.
 */
export function limpiarPersonaje(p?: string) {
  const partes = (p ?? '')
    .split(/\s+\/\s+/)
    .map((x) =>
      x
        .replace(/\s*\((voice|voz|archive footage|uncredited|sin acreditar|imágenes de archivo|cameo|credit only)\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((x) => x && !/^(additional voices?|voces adicionales|himself|herself|self|narrator|various|voices?)$/i.test(x));
  return partes.join(' / ') || undefined;
}

/** Para no repetir el mismo personaje: «The Hulk» y «hulk» cuentan como uno. */
export const mismoPersonaje = (a: string, b: string) => {
  const n = (x: string) => x.toLowerCase().replace(/^the\s+/, '');
  return n(a) === n(b);
};

/** Obra a la que pertenece un título: la serie (si es una temporada) o el propio título. */
export const obraDe = (t: Titulo) => (t.tipo === 'serie' && t.d.serie ? `serie:${t.d.serie}` : t.id);

let cache: Promise<Actor[]> | undefined;
export function actores() {
  cache ??= calcular();
  return cache;
}

async function calcular(): Promise<Actor[]> {
  const activos = new Set((await universosActivos()).map((u) => u.id));
  const titulos = (await todosLosTitulos('es')).filter((t) => activos.has(t.universo));
  const porClave = new Map<string, { nombre: string; foto?: string; idTmdb?: number; papeles: Map<string, Papel> }>();
  for (const t of titulos) {
    const tmdb = datosTmdb(t.universo, t.id, 'es')?.reparto ?? [];
    for (const r of [...tmdb, ...t.m.reparto] as { actor: string; personaje?: string; foto?: string; idTmdb?: number }[]) {
      const clave = claveActor(r.actor);
      if (!clave) continue;
      const a = porClave.get(clave) ?? porClave.set(clave, { nombre: r.actor, papeles: new Map() }).get(clave)!;
      a.foto ??= r.foto;
      a.idTmdb ??= r.idTmdb;
      const previo = a.papeles.get(t.id);
      const personaje = limpiarPersonaje(r.personaje);
      if (!previo) a.papeles.set(t.id, { t, personaje });
      else if (!previo.personaje && personaje) previo.personaje = personaje;
    }
  }
  const lista = [...porClave.values()]
    .map((a) => {
      const papeles = [...a.papeles.values()].sort((x, y) => x.t.d.anio - y.t.d.anio || (x.t.d.temporada ?? 0) - (y.t.d.temporada ?? 0));
      const porUniverso: Record<string, number> = {};
      for (const p of papeles) porUniverso[p.t.universo] = (porUniverso[p.t.universo] ?? 0) + 1;
      return { nombre: a.nombre, foto: a.foto, idTmdb: a.idTmdb, papeles, obras: new Set(papeles.map((p) => obraDe(p.t))).size, porUniverso };
    })
    .filter((a) => a.obras >= MIN_OBRAS)
    .sort((a, b) => b.obras - a.obras || b.papeles.length - a.papeles.length || a.nombre.localeCompare(b.nombre, 'es'));
  // Direcciones únicas (por orden alfabético, para que no cambien entre compilaciones)
  const usados = new Set<string>();
  const ids = new Map<string, string>();
  for (const a of [...lista].sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'))) {
    const base = slug(a.nombre) || 'actor';
    let id = base;
    for (let i = 2; usados.has(id); i++) id = `${base}-${i}`;
    usados.add(id);
    ids.set(a.nombre, id);
  }
  return lista.map((a) => ({ ...a, id: ids.get(a.nombre)! }));
}

/** Nombre del actor (en cualquier escritura) → id de su página, para enlazar desde las fichas. */
let cacheMapa: Promise<Map<string, string>> | undefined;
export function paginaDeActor() {
  cacheMapa ??= actores().then((l) => new Map(l.map((a) => [claveActor(a.nombre), a.id])));
  return cacheMapa;
}

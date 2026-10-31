/**
 * Acceso a los datos ya preparados para las páginas.
 * Todo funciona para cualquier universo: añadir uno nuevo es solo añadir datos.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { TIPOS, type TipoTitulo } from '../config/tipos';
import { datosTmdb, type DatosTmdb } from './tmdb';

export type Universo = CollectionEntry<'universos'>;
export type Saga = CollectionEntry<'sagas'>;
export type TituloEntrada = CollectionEntry<'titulos'>;
export type Seccion = Universo['data']['secciones'][number];

/** Ids de página reservados dentro de un universo (no pueden usarse como id de ficha). */
export const RUTAS_RESERVADAS = ['sagas', 'personajes', 'cronologia', 'buscar', 'carpetas'];

export interface Capitulo {
  codigo: string;
  titulo: string;
  argumento?: string;
  duracion?: number;
  direccion: string[];
  guion: string[];
  fecha?: string;
}

/**
 * Vista combinada de un título: lo de tus documentos manda; TMDB solo rellena lo que falta.
 * `deTmdb` lista los campos que vienen de TMDB (para indicarlo en la ficha).
 */
export interface Mezcla {
  argumento?: string;
  reparto: { actor: string; personaje?: string }[];
  duracion?: number;
  direccion: string[];
  guion: string[];
  creadores: string[];
  fecha?: Date;
  fechaEspana?: Date;
  capitulos: Capitulo[];
  trailer?: string;
  posterTmdb?: string;
  fondoTmdb?: string;
  temporadas?: number;
  generos: string[];
  deTmdb: Set<string>;
}

export interface Titulo {
  id: string;
  entrada: TituloEntrada;
  d: TituloEntrada['data'];
  universo: string;
  url: string;
  tipo: TipoTitulo;
  tipoNombre: string;
  portada?: ImageMetadata;
  contraportada?: ImageMetadata;
  /** "Temporada 2", "Película"… para mostrar bajo el título */
  subtitulo: string;
  /** Nombre corto para la estantería: "Agente Carter · T1" */
  corto: string;
  /** Datos combinados (tuyos + TMDB) */
  m: Mezcla;
  tmdb?: DatosTmdb;
}

/** Un hueco en la estantería. Una temporada repartida en varios tramos ocupa varios huecos. */
export interface Hueco {
  clave: string;
  titulo: Titulo;
  numero?: number;
  tramo?: { desde: string; hasta: string };
  /** Posición en orden de la historia y en orden de estreno */
  ordenHistoria: number;
  ordenEstreno: number;
  /** Es un tramo repetido: en orden de estreno se oculta (la temporada ya aparece una vez) */
  repetido: boolean;
  /** Secciones por carpetas: carpeta de visionado y código ("2.3") que se muestra en orden de la historia */
  carpeta?: number;
  codigo?: string;
}

/** Cabecera de una carpeta de visionado en la estantería (solo en orden de la historia). */
export interface CabeceraCarpeta {
  carpeta: number;
  etapa: string;
  descripcion?: string;
  /** Posición en orden de la historia (justo antes de su primera caja) */
  ordenHistoria: number;
  /** Página con el orden capítulo a capítulo, si la carpeta la tiene */
  visionado?: string;
}

export const numeroTexto = (n?: number) => (n === undefined ? '' : String(n).padStart(3, '0'));

let cacheUniversos: Universo[] | undefined;
export async function universosActivos() {
  cacheUniversos ??= (await getCollection('universos', (u) => u.data.activo)).sort((a, b) => a.data.orden - b.data.orden);
  return cacheUniversos;
}
export async function todosLosUniversos() {
  return (await getCollection('universos')).sort((a, b) => a.data.orden - b.data.orden);
}

const urlTitulo = (universo: string, id: string) => `/${universo}/${id}/`;

function mezclar(d: TituloEntrada['data'], x?: DatosTmdb): Mezcla {
  const deTmdb = new Set<string>();
  const elegir = <T,>(campo: string, tuyo: T | undefined, suyo: T | undefined, vacio = (v: T) => v === undefined || (Array.isArray(v) && v.length === 0)) => {
    if (tuyo !== undefined && !vacio(tuyo)) return tuyo;
    if (suyo !== undefined && !vacio(suyo)) deTmdb.add(campo);
    return suyo;
  };
  const fecha = (s?: string) => (s ? new Date(`${s}T00:00:00Z`) : undefined);
  const capsTuyos: Capitulo[] = d.capitulos.map((c) => ({ ...c }));
  const capsSuyos: Capitulo[] = (x?.capitulos ?? []).map((c) => ({
    codigo: c.codigo,
    titulo: c.titulo ?? '',
    argumento: c.sinopsis,
    duracion: c.duracion,
    direccion: c.direccion ?? [],
    guion: c.guion ?? [],
    fecha: c.fecha,
  }));
  // Capítulos: los tuyos mandan; TMDB añade fecha y rellena argumento/duración de los que no lo tengan
  let capitulos = capsTuyos;
  if (capsTuyos.length && capsSuyos.length) {
    const suyo = new Map(capsSuyos.map((c) => [c.codigo, c]));
    capitulos = capsTuyos.map((c) => {
      const s = suyo.get(c.codigo);
      return s ? { ...c, argumento: c.argumento ?? s.argumento, duracion: c.duracion ?? s.duracion, fecha: s.fecha } : c;
    });
  } else if (!capsTuyos.length && capsSuyos.length) {
    capitulos = capsSuyos;
    deTmdb.add('capitulos');
  }
  return {
    argumento: elegir('argumento', d.argumento, x?.sinopsis),
    reparto: elegir('reparto', d.reparto, x?.reparto) ?? [],
    duracion: elegir('duracion', d.duracion, x?.duracion),
    direccion: elegir('direccion', d.direccion, x?.direccion) ?? [],
    guion: elegir('guion', d.guion, x?.guion) ?? [],
    creadores: x?.creadores ?? [],
    fecha: d.fechaEstreno ?? fecha(x?.fecha),
    fechaEspana: d.fechaEstrenoEspana ?? fecha(x?.fechaES),
    capitulos,
    trailer: elegir('trailer', d.trailer, x?.trailer),
    posterTmdb: x?.poster,
    fondoTmdb: x?.fondo,
    temporadas: d.temporadas ?? x?.temporadas,
    generos: x?.generos ?? [],
    deTmdb,
  };
}

function preparar(t: TituloEntrada): Titulo {
  const d = t.data;
  const tmdb = datosTmdb(d.universo.id, t.id);
  const portada = d.imagenes.find((i) => i.rol === 'portada')?.src ?? d.imagenes[0]?.src;
  const contraportada = d.imagenes.find((i) => i.rol === 'contraportada')?.src;
  const temporada = d.temporada ? `Temporada ${d.temporada}` : '';
  return {
    id: t.id,
    entrada: t,
    d,
    universo: d.universo.id,
    url: urlTitulo(d.universo.id, t.id),
    tipo: d.tipo,
    tipoNombre: TIPOS[d.tipo].nombre,
    portada,
    contraportada,
    subtitulo: [TIPOS[d.tipo].nombre + (d.animada ? ' de animación' : ''), temporada].filter(Boolean).join(' · '),
    corto: d.temporada ? `${d.titulo} · T${d.temporada}` : d.titulo,
    m: mezclar(d, tmdb),
    tmdb,
  };
}

let cacheTitulos: Titulo[] | undefined;
export async function todosLosTitulos() {
  cacheTitulos ??= (await getCollection('titulos')).map(preparar);
  return cacheTitulos;
}
export async function titulosDe(universo: string) {
  return (await todosLosTitulos()).filter((t) => t.universo === universo);
}

export type Visionado = CollectionEntry<'visionados'>;
export async function visionadosDe(universo: string) {
  return (await getCollection('visionados', (v) => v.data.universo.id === universo)).sort((a, b) => a.data.carpeta - b.data.carpeta);
}
export const urlCarpeta = (universo: string, carpeta: number) => `/${universo}/carpetas/${carpeta}/`;

export async function sagasDe(universo: string) {
  return (await getCollection('sagas', (s) => s.data.universo.id === universo)).sort((a, b) => a.data.orden - b.data.orden);
}

/** Fecha comparable: fecha de estreno si la hay; si no, el año. */
const claveFecha = (t: Titulo) => (t.m.fecha ? t.m.fecha.getTime() : Date.UTC(t.d.anio, 0, 1));

/**
 * Huecos de una sección, con su posición en los dos órdenes.
 * - Orden de la historia: tu numeración (secciones cronológicas); los tramos de una temporada
 *   ocupan cada uno su número.
 * - Orden de estreno: por fecha; en secciones "por estreno" manda tu numeración y los títulos
 *   sin número se intercalan por año.
 */
export function huecosDeSeccion(titulos: Titulo[], seccion: Seccion): Hueco[] {
  if (seccion.orden === 'carpetas') return huecosPorCarpetas(titulos).huecos;
  const huecos: Hueco[] = [];
  for (const t of titulos) {
    if (t.d.tramos.length > 1) {
      t.d.tramos.forEach((tr, i) =>
        huecos.push({ clave: `${t.id}-${tr.numero}`, titulo: t, numero: tr.numero, tramo: { desde: tr.desde, hasta: tr.hasta }, ordenHistoria: 0, ordenEstreno: 0, repetido: i > 0 }),
      );
    } else {
      huecos.push({ clave: t.id, titulo: t, numero: t.d.numero, ordenHistoria: 0, ordenEstreno: 0, repetido: false });
    }
  }
  const SIN = Number.MAX_SAFE_INTEGER;
  const porHistoria = [...huecos].sort(
    (a, b) => (a.numero ?? SIN) - (b.numero ?? SIN) || claveFecha(a.titulo) - claveFecha(b.titulo),
  );
  const porEstreno =
    seccion.orden === 'estreno'
      ? [...huecos].sort((a, b) => a.titulo.d.anio - b.titulo.d.anio || (a.numero ?? SIN) - (b.numero ?? SIN) || a.titulo.d.titulo.localeCompare(b.titulo.d.titulo))
      : [...huecos].sort((a, b) => claveFecha(a.titulo) - claveFecha(b.titulo) || (a.numero ?? SIN) - (b.numero ?? SIN));
  porHistoria.forEach((h, i) => (h.ordenHistoria = i + 1));
  porEstreno.forEach((h, i) => (h.ordenEstreno = i + 1));
  return seccion.orden === 'cronologico' ? porHistoria : porEstreno;
}

/** Carpeta de las fichas «En espera» (van al final, tras todas las carpetas). */
export const CARPETA_EN_ESPERA = 9999;

/**
 * Secciones ordenadas por carpetas (las series de DC):
 * - Orden de la historia: carpeta → posición dentro de la carpeta; las «En espera», al final.
 * - Orden de estreno: número de carpeta del disco (011 Smallville…) y temporada.
 * Devuelve también una cabecera por carpeta para la estantería.
 */
export function huecosPorCarpetas(titulos: Titulo[], seccion?: Seccion, visionados: { carpeta: number; url: string }[] = []) {
  const SIN = Number.MAX_SAFE_INTEGER;
  const huecos: Hueco[] = titulos.map((t) => ({
    clave: t.id,
    titulo: t,
    numero: t.d.numero,
    carpeta: t.d.visionado?.carpeta ?? (t.d.enEspera ? CARPETA_EN_ESPERA : undefined),
    codigo: t.d.visionado?.codigo,
    ordenHistoria: 0,
    ordenEstreno: 0,
    repetido: false,
  }));
  const porHistoria = [...huecos].sort(
    (a, b) =>
      (a.carpeta ?? SIN) - (b.carpeta ?? SIN) ||
      (a.titulo.d.visionado?.orden ?? SIN) - (b.titulo.d.visionado?.orden ?? SIN) ||
      claveFecha(a.titulo) - claveFecha(b.titulo),
  );
  const porEstreno = [...huecos].sort(
    (a, b) =>
      (a.numero ?? SIN) - (b.numero ?? SIN) ||
      (a.titulo.d.serie ?? '').localeCompare(b.titulo.d.serie ?? '') ||
      (a.titulo.d.temporada ?? 0) - (b.titulo.d.temporada ?? 0) ||
      claveFecha(a.titulo) - claveFecha(b.titulo),
  );
  // En orden de la historia, cada carpeta abre con su cabecera (que ocupa una posición)
  const cabeceras: CabeceraCarpeta[] = [];
  let pos = 0;
  let actual: number | undefined;
  for (const h of porHistoria) {
    if (h.carpeta !== undefined && h.carpeta !== actual) {
      actual = h.carpeta;
      const def = seccion?.carpetas.find((c) => c.numero === h.carpeta);
      cabeceras.push({
        carpeta: h.carpeta,
        etapa: h.carpeta === CARPETA_EN_ESPERA ? 'En espera' : (def?.etapa ?? ''),
        descripcion: def?.descripcion,
        ordenHistoria: ++pos,
        visionado: visionados.find((v) => v.carpeta === h.carpeta)?.url,
      });
    }
    h.ordenHistoria = ++pos;
  }
  porEstreno.forEach((h, i) => (h.ordenEstreno = i + 1));
  return { huecos: porHistoria, cabeceras };
}

/** Título de la temporada/tramo para el pie de la caja: "1x01–1x07". */
export const textoTramo = (h: Hueco) => (h.tramo ? `${h.tramo.desde}–${h.tramo.hasta}` : '');

export function seccionDe(universo: Universo, id: string) {
  return universo.data.secciones.find((s) => s.id === id);
}

/** Estilo en línea con los colores del universo (campo `tema` de su archivo). */
export function estiloUniverso(u?: Universo) {
  const t = u?.data.tema ?? {};
  return [
    t.acento && `--acento:${t.acento}`,
    t.textoClaro && `--u-txt-claro:${t.textoClaro}`,
    t.textoOscuro && `--u-txt-oscuro:${t.textoOscuro}`,
  ]
    .filter(Boolean)
    .join(';');
}

/**
 * Acceso a los datos ya preparados para las páginas.
 * Todo funciona para cualquier universo: añadir uno nuevo es solo añadir datos.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { TIPOS, type TipoTitulo } from '../config/tipos';

export type Universo = CollectionEntry<'universos'>;
export type Saga = CollectionEntry<'sagas'>;
export type TituloEntrada = CollectionEntry<'titulos'>;
export type Seccion = Universo['data']['secciones'][number];

/** Ids de página reservados dentro de un universo (no pueden usarse como id de ficha). */
export const RUTAS_RESERVADAS = ['sagas', 'personajes', 'cronologia', 'buscar'];

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

function preparar(t: TituloEntrada): Titulo {
  const d = t.data;
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

export async function sagasDe(universo: string) {
  return (await getCollection('sagas', (s) => s.data.universo.id === universo)).sort((a, b) => a.data.orden - b.data.orden);
}

/** Fecha comparable: fecha de estreno si la hay; si no, el año. */
const claveFecha = (t: Titulo) => (t.d.fechaEstreno ? t.d.fechaEstreno.getTime() : Date.UTC(t.d.anio, 0, 1));

/**
 * Huecos de una sección, con su posición en los dos órdenes.
 * - Orden de la historia: tu numeración (secciones cronológicas); los tramos de una temporada
 *   ocupan cada uno su número.
 * - Orden de estreno: por fecha; en secciones "por estreno" manda tu numeración y los títulos
 *   sin número se intercalan por año.
 */
export function huecosDeSeccion(titulos: Titulo[], seccion: Seccion): Hueco[] {
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

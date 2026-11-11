/**
 * Páginas «Marvel y DC en <año>» (/estrenos/2027/, en inglés /en/releases/2027/): todo lo que se estrena (o se estrenó)
 * ese año, mes a mes. Junta dos fuentes:
 *  - las fichas de la colección (fecha de TMDB; en la versión en español, la de España si la hay);
 *  - datos/proximamente.json para lo que aún no tiene ficha (fecha de cines o del episodio 1 en el país del idioma).
 * Solo hay página para los años con al menos MIN_TITULOS títulos (en algún idioma), para no publicar páginas casi vacías.
 */
import { todosLosTitulos, universosActivos } from './datos';
import { todosLosEstrenos, fechaDe, enEmision, estadoEstreno, textosEstreno, enlaceEstreno } from './proximamente';
import { imagenTmdb } from './tmdb';
import type { Idioma } from '../i18n';
import type { TipoTitulo } from '../config/tipos';

export const MIN_TITULOS = 3;

export interface EntradaAnio {
  /** «AAAA-MM-DD», o «AAAA» si solo se sabe el año */
  dia: string;
  titulo: string;
  url: string;
  poster?: string;
  universo: string;
  /** Tipo de la ficha, o del estreno (película / serie) */
  tipo: TipoTitulo;
  /** Temporada nueva (solo estrenos sin ficha) */
  temporada?: number;
  /** Aún no tiene ficha: viene de Próximamente */
  proximo: boolean;
}

const cache = new Map<Idioma, EntradaAnio[]>();

async function entradas(idioma: Idioma): Promise<EntradaAnio[]> {
  const hecho = cache.get(idioma);
  if (hecho) return hecho;
  const activos = new Set((await universosActivos()).map((u) => u.id));
  const lista: EntradaAnio[] = [];
  // Para las temporadas nuevas: serie de cada ficha («universo/id») y temporadas que ya tienen ficha propia
  const serieDe = new Map<string, string>();
  const temporadasConFicha = new Set<string>();
  for (const t of await todosLosTitulos(idioma)) {
    if (!activos.has(t.universo)) continue;
    const serie = t.d.serie ?? t.id;
    serieDe.set(`${t.universo}/${t.id}`, serie);
    temporadasConFicha.add(`${serie}|${t.d.temporada ?? 1}`);
    const f = (idioma === 'es' ? t.m.fechaEspana ?? t.m.fecha : t.m.fecha)?.toISOString().slice(0, 10);
    lista.push({
      dia: f ?? String(t.d.anio),
      titulo: t.corto,
      url: t.url,
      poster: t.m.posterTmdb ? imagenTmdb(t.m.posterTmdb, 'w92') : undefined,
      universo: t.universo,
      tipo: t.d.tipo as TipoTitulo,
      proximo: false,
    });
  }
  const pais = idioma === 'en' ? 'US' : 'ES';
  const vistos = new Set<string>();
  for (const e of todosLosEstrenos()) {
    // Lo que ya tiene ficha sale por la ficha (una temporada nueva enlaza a la ficha de la serie: cuenta si esa temporada
    // aún no tiene ficha propia); los episodios sueltos y lo que no tiene fecha, no cuentan
    const conFicha = e.ficha && (e.tipo !== 'serie' || temporadasConFicha.has(`${serieDe.get(e.ficha) ?? e.ficha}|${e.temporada ?? 1}`));
    if (conFicha || !activos.has(e.universo) || enEmision(e) || estadoEstreno(e, pais) === 'sinFecha' || vistos.has(e.clave)) continue;
    vistos.add(e.clave);
    const x = textosEstreno(e, idioma);
    lista.push({
      dia: fechaDe(e, pais),
      titulo: x.titulo,
      url: enlaceEstreno(e),
      poster: x.poster ? imagenTmdb(x.poster, 'w92') : undefined,
      universo: e.universo,
      tipo: e.tipo as TipoTitulo,
      temporada: e.tipo === 'serie' && (e.temporada ?? 1) > 1 ? (e.temporada ?? undefined) : undefined,
      proximo: true,
    });
  }
  lista.sort((a, b) => a.dia.localeCompare(b.dia) || a.titulo.localeCompare(b.titulo, idioma));
  cache.set(idioma, lista);
  return lista;
}

/** Títulos de un año en el idioma dado, por fecha (los que solo tienen año, al final). */
export async function estrenosDelAnio(anio: string, idioma: Idioma): Promise<EntradaAnio[]> {
  const delAnio = (await entradas(idioma)).filter((x) => x.dia.startsWith(anio));
  return [...delAnio.filter((x) => x.dia.length > 4), ...delAnio.filter((x) => x.dia.length === 4)];
}

/** Años con página (los mismos en los dos idiomas, para emparejarlas), de más antiguo a más reciente. */
export async function aniosConEstrenos(): Promise<string[]> {
  const cuenta = new Map<string, number>();
  for (const idioma of ['es', 'en'] as const) {
    const porAnio = new Map<string, number>();
    for (const x of await entradas(idioma)) porAnio.set(x.dia.slice(0, 4), (porAnio.get(x.dia.slice(0, 4)) ?? 0) + 1);
    for (const [a, n] of porAnio) cuenta.set(a, Math.max(cuenta.get(a) ?? 0, n));
  }
  return [...cuenta].filter(([, n]) => n >= MIN_TITULOS).map(([a]) => a).sort();
}

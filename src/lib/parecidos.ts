/**
 * «Fichas parecidas»: para cada título, los del mismo universo que más se le parecen.
 * Sirve al visitante (qué ver después) y a los buscadores (enlaces internos entre fichas cercanas).
 *
 * Puntuación de cada candidato:
 *  - Personajes en común, pesados por rareza (IDF): compartir a Kamala Khan pesa más que compartir a Nick Fury,
 *    que sale en muchas. Como mucho cuentan los 4 que más pesan, y pesan menos si el candidato tiene un reparto enorme.
 *  - Saga en común (+3 cada una) y misma dirección (+2 por persona).
 *  - Mismo formato (+1), misma técnica (imagen real o animación: +1, distinta: −1), géneros en común (+0,5 cada uno).
 *  - Cercanía en el tiempo: −0,05 por año de diferencia.
 * Se excluyen el propio título y las demás temporadas de su serie; de cada otra serie solo queda la temporada
 * que más puntúa. Hace falta un mínimo de puntuación para no proponer títulos sin relación.
 */
import { todosLosTitulos, type Titulo } from './datos';
import { apariciones } from './personajes';

export interface Parecido {
  id: string;
  /** Por qué se propone: personajes en común (ids, los de más peso primero), sagas en común y dirección */
  personajes: string[];
  sagas: string[];
  direccion: string[];
}

const CUANTOS = 6;
const MINIMO = 3;
/** Personajes a partir de los cuales un reparto se considera «de grupo» y sus coincidencias pesan menos */
const GRUPO = 8;

let cache: Promise<Map<string, Parecido[]>> | undefined;
export function parecidos() {
  cache ??= calcular();
  return cache;
}

async function calcular() {
  const titulos = await todosLosTitulos('es');
  const { porTitulo } = await apariciones();
  // Frecuencia de cada personaje para el IDF
  const frecuencia = new Map<string, number>();
  for (const pjs of porTitulo.values()) for (const p of pjs) frecuencia.set(p, (frecuencia.get(p) ?? 0) + 1);
  const idf = (p: string) => Math.log((titulos.length + 1) / (frecuencia.get(p) ?? 1));
  const serieDe = (x: Titulo) => x.d.serie ?? x.id;

  const resultado = new Map<string, Parecido[]>();
  for (const t of titulos) {
    const pjT = porTitulo.get(t.id) ?? new Set<string>();
    const sagasT = new Set(t.d.sagas.map((s) => s.id));
    const dirT = new Set(t.m.direccion);
    const genT = new Set(t.m.generos);
    const mejorPorSerie = new Map<string, { p: Parecido; puntos: number; temp: number }>();
    for (const c of titulos) {
      if (c.universo !== t.universo || serieDe(c) === serieDe(t)) continue;
      const comunes = [...(porTitulo.get(c.id) ?? [])].filter((p) => pjT.has(p)).sort((a, b) => idf(b) - idf(a));
      const sagas = c.d.sagas.map((s) => s.id).filter((s) => sagasT.has(s));
      const direccion = c.m.direccion.filter((x) => dirT.has(x));
      // Repartos enormes (series de equipo con decenas de personajes) coinciden con casi todo: pesan menos
      const tamano = porTitulo.get(c.id)?.size ?? 0;
      const pesoReparto = Math.min(1, Math.sqrt(GRUPO / Math.max(tamano, 1)));
      let puntos = comunes.slice(0, 4).reduce((s, p) => s + idf(p), 0) * pesoReparto + sagas.length * 3 + direccion.length * 2;
      if (puntos === 0) continue;
      puntos += (c.tipo === t.tipo ? 1 : 0) + (c.d.animada === t.d.animada ? 1 : -1);
      puntos += c.m.generos.filter((g) => genT.has(g)).length * 0.5;
      puntos -= Math.abs(c.d.anio - t.d.anio) * 0.05;
      if (puntos < MINIMO) continue;
      const clave = serieDe(c);
      const previo = mejorPorSerie.get(clave);
      const temp = c.d.temporada ?? 0;
      if (!previo || puntos > previo.puntos || (puntos === previo.puntos && temp < previo.temp)) {
        mejorPorSerie.set(clave, { p: { id: c.id, personajes: comunes, sagas, direccion }, puntos, temp });
      }
    }
    resultado.set(
      t.id,
      [...mejorPorSerie.values()]
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, CUANTOS * 2)
        .map((x) => x.p),
    );
  }
  return resultado;
}

/** Los parecidos de un título, sin los que ya enlaza la ficha en «Conexiones» */
export async function parecidosDe(id: string, yaEnlazados: Set<string>) {
  return ((await parecidos()).get(id) ?? []).filter((p) => !yaEnlazados.has(p.id)).slice(0, CUANTOS);
}

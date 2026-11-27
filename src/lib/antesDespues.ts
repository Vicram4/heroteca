/**
 * «Qué ver antes» y «Qué ver después» calculados para cada ficha que no tiene los suyos escritos a mano
 * (conexiones.verAntes / verDespues) ni vecinos en una trilogía o dulogía.
 *
 * Solo se busca dentro de la misma sección del universo:
 *  1. La temporada anterior (o siguiente) de la misma serie.
 *  2. Solo en las secciones que son una sola historia (CONTINUIDADES: UMC y DCDU): por cada protagonista de la ficha
 *     (los PROTAGONISTAS primeros del reparto), el último título anterior (o el primero posterior) en el que también es
 *     protagonista. Así un cameo no cuenta: tiene que estar arriba del reparto en las dos fichas. Se compara el actor (o
 *     el personaje, si la línea no tiene actor): el mismo personaje con otro actor suele ser otra historia (el Joker de
 *     Joaquin Phoenix no sigue Escuadrón Suicida), y un mismo papel puede estar enlazado a dos personajes (Sam Wilson
 *     es Falcon y luego Capitán América). En Pre-UMC, UDC, animación o las series de DC conviven historias distintas (reinicios,
 *     películas sueltas), y ahí el mismo héroe no significa que la historia siga.
 * Los documentales y resúmenes (género «Documental», como LEYENDAS de Marvel Studios) no se proponen ni reciben propuestas.
 * El orden es el de estreno. Como mucho salen CUANTOS títulos por lado.
 */
import { todosLosTitulos, type Titulo } from './datos';
import { apariciones } from './personajes';

const PROTAGONISTAS = 4;
const CONTINUIDADES = new Set(['marvel/umc', 'dc/dcdu']);
const CUANTOS = 3;

export interface AntesDespues {
  antes: string[];
  despues: string[];
}

let cache: Promise<Map<string, AntesDespues>> | undefined;
export function antesDespues() {
  cache ??= calcular();
  return cache;
}

const fechaDe = (x: Titulo) => (x.m.fecha ? x.m.fecha.getTime() : Date.UTC(x.d.anio, 0, 1));
const serieDe = (x: Titulo) => x.d.serie ?? x.id;

async function calcular() {
  const titulos = (await todosLosTitulos('es')).filter((t) => !t.d.enEspera && !t.m.generos.includes('Documental'));
  const { enlaceReparto, porTitulo } = await apariciones();
  /** Protagonistas de cada ficha, por orden de reparto */
  const protas = new Map<string, string[]>();
  for (const t of titulos) {
    const lista: string[] = [];
    t.m.reparto.slice(0, PROTAGONISTAS).forEach((r, i) => {
      const pid = enlaceReparto.get(`${t.id}|${i}`);
      const clave = r.actor ? `actor:${r.actor}` : pid;
      if (clave && !lista.includes(clave)) lista.push(clave);
    });
    // Sin reparto enlazado: los personajes escritos a mano en la ficha
    if (!lista.length && t.d.personajes.length) lista.push(...t.d.personajes.slice(0, 2).map((p) => p.personaje.id).filter((p) => porTitulo.get(t.id)?.has(p)));
    protas.set(t.id, lista);
  }
  const resultado = new Map<string, AntesDespues>();
  const grupos = new Map<string, Titulo[]>();
  for (const t of titulos) {
    const clave = `${t.universo}/${t.d.seccion}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), t]);
  }
  for (const [clave, grupo] of grupos) {
    const continuidad = CONTINUIDADES.has(clave);
    grupo.sort((a, b) => fechaDe(a) - fechaDe(b) || (a.d.temporada ?? 0) - (b.d.temporada ?? 0));
    grupo.forEach((t, i) => {
      const buscar = (lado: -1 | 1) => {
        const elegidos: Titulo[] = [];
        const candidatos = lado < 0 ? grupo.slice(0, i).reverse() : grupo.slice(i + 1);
        // 1. Temporada contigua de la misma serie
        const temporada = candidatos.find((c) => serieDe(c) === serieDe(t) && c.d.temporada !== undefined);
        if (temporada && t.d.temporada !== undefined) elegidos.push(temporada);
        // 2. Cada protagonista, en su entrega más cercana (de otra serie)
        for (const pid of continuidad ? (protas.get(t.id) ?? []) : []) {
          if (elegidos.length >= CUANTOS) break;
          const c = candidatos.find((c) => serieDe(c) !== serieDe(t) && protas.get(c.id)?.includes(pid));
          if (c && !elegidos.some((e) => serieDe(e) === serieDe(c))) elegidos.push(c);
        }
        return elegidos.sort((a, b) => fechaDe(a) - fechaDe(b)).map((x) => x.id);
      };
      resultado.set(t.id, { antes: buscar(-1), despues: buscar(1) });
    });
  }
  return resultado;
}

/**
 * Planificador de maratones: reparte una lista de títulos en sesiones y lee y escribe el plan en la dirección.
 * Sin dependencias del navegador ni de los datos: la página (src/pages/[...idioma]/[maraton].astro) le pasa la lista.
 *
 * Reglas del reparto:
 * - Las películas no se parten; las temporadas se pueden partir entre capítulos.
 * - Si un título no cabe en la sesión empezada, pasa a la siguiente. Uno más largo que la sesión entera ocupa una él solo.
 * - El descanso se cuenta entre títulos distintos, no entre capítulos de una misma temporada.
 * - Los títulos sin duración conocida no se reparten: la página avisa de cuántos son.
 */
export interface ItemMaraton {
  id: string;
  /** Duración de cada capítulo, o una sola para una película. Vacío: duración desconocida. */
  partes: number[];
}

export interface Opciones {
  /** Duración máxima de una sesión, en horas */
  horas: number;
  /** Descanso entre títulos, en minutos */
  pausa: number;
  /** Sesiones por día */
  porDia: number;
}

export const OPCIONES_INICIALES: Opciones = { horas: 4, pausa: 15, porDia: 1 };
const LIMITES: Record<keyof Opciones, [number, number]> = { horas: [1, 12], pausa: [0, 60], porDia: [1, 4] };

/** Un trozo de sesión: un título entero o un tramo de sus capítulos (desde y hasta cuentan desde 1). */
export interface Bloque {
  id: string;
  desde: number;
  hasta: number;
  total: number;
  minutos: number;
}

export interface Sesion {
  dia: number;
  bloques: Bloque[];
  /** Minutos de la sesión contando los descansos */
  minutos: number;
}

export function repartir(items: ItemMaraton[], o: Opciones) {
  const maximo = o.horas * 60;
  const sesiones: Sesion[] = [];
  let actual: Sesion | undefined;
  let visionado = 0;

  const nueva = () => {
    actual = { dia: Math.floor(sesiones.length / o.porDia) + 1, bloques: [], minutos: 0 };
    sesiones.push(actual);
    return actual;
  };

  for (const item of items) {
    item.partes.forEach((minutos, i) => {
      visionado += minutos;
      const ultimo = actual?.bloques.at(-1);
      const mismoTitulo = ultimo?.id === item.id;
      const coste = minutos + (actual?.bloques.length && !mismoTitulo ? o.pausa : 0);
      const sesion: Sesion = !actual || (actual.bloques.length > 0 && actual.minutos + coste > maximo) ? nueva() : actual;
      const seguido = sesion === actual && sesion.bloques.at(-1)?.id === item.id;
      if (seguido) {
        const b = sesion.bloques.at(-1)!;
        b.hasta = i + 1;
        b.minutos += minutos;
      } else {
        sesion.bloques.push({ id: item.id, desde: i + 1, hasta: i + 1, total: item.partes.length, minutos });
      }
      sesion.minutos += sesion.bloques.length > 1 && !seguido ? minutos + o.pausa : minutos;
    });
  }

  return { sesiones, visionado, conPausas: sesiones.reduce((n, s) => n + s.minutos, 0), dias: sesiones.at(-1)?.dia ?? 0 };
}

/** «3 h 20 min», igual en los dos idiomas. */
export function textoDuracion(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}

/** Plan → parte final de la dirección: #t=id1,id2&h=4&p=15&d=1. Los ids son los mismos en español e inglés. */
export function aDireccion(ids: string[], o: Opciones) {
  return `#t=${ids.map(encodeURIComponent).join(',')}&h=${o.horas}&p=${o.pausa}&d=${o.porDia}`;
}

/** Lee un plan de la dirección. Cualquier dato raro (enlace retocado o cortado) se cambia por el valor inicial. */
export function deDireccion(hash: string) {
  const datos = new Map(
    hash
      .replace(/^#/, '')
      .split('&')
      .map((par) => {
        const i = par.indexOf('=');
        return [par.slice(0, i), par.slice(i + 1)] as const;
      }),
  );
  const numero = (clave: string, campo: keyof Opciones) => {
    const n = Number(datos.get(clave) || NaN);
    const [min, max] = LIMITES[campo];
    return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : OPCIONES_INICIALES[campo];
  };
  const ids = (datos.get('t') ?? '').split(',').filter(Boolean).flatMap((x) => {
    try {
      return [decodeURIComponent(x)];
    } catch {
      return [];
    }
  });
  return { ids, opciones: { horas: numero('h', 'horas'), pausa: numero('p', 'pausa'), porDia: numero('d', 'porDia') } as Opciones };
}

/**
 * «Mi año»: resumen de lo visto en un año, a partir de los días guardados en heroteca:vistos-fechas.
 * Sin dependencias del navegador ni de los datos: la página (src/pages/[...idioma]/[miAno].astro) le pasa todo.
 *
 * Reglas:
 * - Solo cuenta lo que sigue marcado como visto y tiene fecha; lo marcado antes de existir las fechas no se inventa.
 * - El día es aquel en que se marcó, no necesariamente en que se vio: la página lo avisa.
 * - Las horas son un mínimo: los títulos sin duración conocida no suman.
 */
export interface ItemWrapped {
  id: string;
  /** Universo */
  u: string;
  n: string;
  url: string;
  img?: string;
  tipo: string;
  /** Año de estreno */
  a: number;
  /** Minutos en total (una temporada, todos sus capítulos); 0 si no se sabe */
  min: number;
  /** Personajes que aparecen */
  pj: string[];
}

export interface VistoWrapped {
  item: ItemWrapped;
  dia: string;
}

export interface ResumenWrapped {
  anio: number;
  /** Del primero al último marcado */
  vistos: VistoWrapped[];
  minutos: number;
  sinDuracion: number;
  porTipo: Record<string, number>;
  porUniverso: Record<string, number>;
  /** Títulos por mes, de enero a diciembre */
  porMes: number[];
  mesTop: number;
  diaTop: { dia: string; n: number };
  /** Días seguidos marcando algo, como máximo */
  racha: number;
  personajeTop?: { id: string; n: number };
  /** El estrenado hace más tiempo */
  masAntiguo: ItemWrapped;
}

/** Días de cada título visto que existe en el catálogo, con la fecha ya validada. */
function conFecha(items: ItemWrapped[], vistos: Set<string>, fechas: Map<string, string>): VistoWrapped[] {
  return items.filter((i) => vistos.has(i.id) && fechas.has(i.id)).map((item) => ({ item, dia: fechas.get(item.id)! }));
}

/** Años con algo marcado, del más reciente al más antiguo. */
export function aniosConDatos(items: ItemWrapped[], vistos: Set<string>, fechas: Map<string, string>) {
  return [...new Set(conFecha(items, vistos, fechas).map((v) => Number(v.dia.slice(0, 4))))].sort((a, b) => b - a);
}

/** Vistos sin fecha: quedan fuera de todos los resúmenes y la página avisa de cuántos son. */
export function sinFecha(items: ItemWrapped[], vistos: Set<string>, fechas: Map<string, string>) {
  return items.filter((i) => vistos.has(i.id) && !fechas.has(i.id)).length;
}

const sumar = (mapa: Record<string, number>, clave: string) => {
  mapa[clave] = (mapa[clave] ?? 0) + 1;
};

/** Mayor número de días consecutivos. Se calcula en UTC porque los días no tienen hora: así no le afecta el cambio de hora. */
function rachaMaxima(dias: string[]) {
  const ordenados = [...new Set(dias)].sort().map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)));
  let mejor = 0;
  let actual = 0;
  ordenados.forEach((d, i) => {
    actual = i > 0 && d - ordenados[i - 1] === 86_400_000 ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
  });
  return mejor;
}

/** Devuelve undefined si ese año no hay nada marcado. Los empates se resuelven por lo primero en verse. */
export function resumirAnio(anio: number, items: ItemWrapped[], vistos: Set<string>, fechas: Map<string, string>): ResumenWrapped | undefined {
  const lista = conFecha(items, vistos, fechas)
    .filter((v) => v.dia.startsWith(`${anio}-`))
    .sort((x, y) => (x.dia < y.dia ? -1 : x.dia > y.dia ? 1 : x.item.n.localeCompare(y.item.n)));
  if (!lista.length) return undefined;

  const porTipo: Record<string, number> = {};
  const porUniverso: Record<string, number> = {};
  const porDia: Record<string, number> = {};
  const porPersonaje: Record<string, number> = {};
  const porMes = Array<number>(12).fill(0);
  for (const { item, dia } of lista) {
    sumar(porTipo, item.tipo);
    sumar(porUniverso, item.u);
    sumar(porDia, dia);
    item.pj.forEach((p) => sumar(porPersonaje, p));
    porMes[Number(dia.slice(5, 7)) - 1]++;
  }
  const mayor = (mapa: Record<string, number>) => Object.entries(mapa).reduce((m, e) => (e[1] > m[1] ? e : m));
  const [diaMax, nDia] = mayor(porDia);
  const hayPersonajes = Object.keys(porPersonaje).length > 0;
  const [pj, nPj] = hayPersonajes ? mayor(porPersonaje) : ['', 0];
  return {
    anio,
    vistos: lista,
    minutos: lista.reduce((s, v) => s + v.item.min, 0),
    sinDuracion: lista.filter((v) => !v.item.min).length,
    porTipo,
    porUniverso,
    porMes,
    mesTop: porMes.indexOf(Math.max(...porMes)),
    diaTop: { dia: diaMax, n: nDia },
    racha: rachaMaxima(lista.map((v) => v.dia)),
    personajeTop: hayPersonajes ? { id: pj, n: nPj } : undefined,
    masAntiguo: lista.reduce((m, v) => (v.item.a < m.a ? v.item : m), lista[0].item),
  };
}

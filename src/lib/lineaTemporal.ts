/**
 * Línea temporal del UMC: cuándo transcurre cada título (campo `epoca` de la ficha).
 *
 * - Valores: un año («2016»), un intervalo («2013–2014») o «sin fecha» si la cronología oficial no da año.
 * - Fuente: la cronología oficial de Marvel Studios (libro de 2023) tal como la recoge Wikipedia
 *   («Marvel Cinematic Universe timeline»), comprobada el 1-11-2026.
 * - El orden de la colección no cambia: la época es un dato más.
 * Al añadir un título del UMC hay que ponerle `epoca`; si falta, el build avisa (sin detenerse).
 */
export const LINEA_TEMPORAL = { universo: 'marvel', seccion: 'umc' } as const;
export const SIN_FECHA = 'sin fecha';

export interface Epoca {
  desde: number;
  hasta: number;
  /** Texto tal cual («2013–2014») */
  texto: string;
}

/** «2013–2014» → { desde: 2013, hasta: 2014 }; «sin fecha» o vacío → undefined. */
export function leerEpoca(epoca?: string): Epoca | undefined {
  if (!epoca || epoca.trim().toLowerCase() === SIN_FECHA) return undefined;
  const anios = [...epoca.matchAll(/\d{4}/g)].map((m) => Number(m[0]));
  if (!anios.length) return undefined;
  return { desde: Math.min(...anios), hasta: Math.max(...anios), texto: epoca.trim() };
}

/** ¿Este título debería tener época? (los del UMC) */
export const llevaEpoca = (universo: string, seccion: string) => universo === LINEA_TEMPORAL.universo && seccion === LINEA_TEMPORAL.seccion;

/** Casos discutidos o especiales, para una nota junto al título en la línea temporal. */
export const NOTAS: Record<string, { es: string; en: string }> = {
  'iron-man-2008': { es: 'La cronología de 2018 la situaba en 2010.', en: 'The 2018 timeline placed it in 2010.' },
  'black-panther': { es: 'La cronología de 2018 la situaba en 2017.', en: 'The 2018 timeline placed it in 2017.' },
  'vengadores-infinity-war': { es: 'La cronología de 2018 la situaba en 2017.', en: 'The 2018 timeline placed it in 2017.' },
  'vengadores-endgame': { es: 'Empieza en 2018 y salta cinco años, hasta 2023.', en: 'Starts in 2018 and jumps five years ahead, to 2023.' },
  'thor-love-and-thunder': { es: 'Hay quien la sitúa a finales de 2024.', en: 'Some place it in late 2024.' },
  'guardianes-de-la-galaxia-volumen-3': { es: 'Año según el diagrama de la cronología: el texto solo dice que es posterior al especial de Navidad.', en: 'Year from the timeline diagram: the text only says it follows the Holiday Special.' },
  'los-cuatro-fantasticos-primeros-pasos': { es: 'En otro universo (Tierra-828).', en: 'In another universe (Earth-828).' },
  'deadpool-y-wolverine': { es: 'Sobre todo en otro universo (Tierra-10005) y en el Vacío.', en: 'Mostly in another universe (Earth-10005) and the Void.' },
  'daredevil-born-again-t1': { es: 'Prólogo a finales de 2025; el resto, de finales de 2026 a principios de 2027.', en: 'Prologue in late 2025; the rest from late 2026 to early 2027.' },
};

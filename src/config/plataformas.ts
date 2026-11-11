/**
 * Plataformas con página propia en «Dónde ver» (/donde-ver/<id>/, en inglés /en/where-to-watch/<id>/).
 * Cada página lista los títulos incluidos en la suscripción (o gratis) en esa plataforma: en España para la versión en
 * español y en Estados Unidos para la inglesa (datos de JustWatch vía TMDB, ver src/lib/dondever.ts).
 *
 * `nombres`: cómo aparece la plataforma en los datos (puede cambiar de nombre, como HBO Max ↔ Max).
 * Solo van plataformas que existen en los dos países, para que cada página tenga su pareja en el otro idioma.
 */
export interface PlataformaPagina {
  id: string;
  nombre: string;
  nombres: string[];
}

export const PLATAFORMAS: PlataformaPagina[] = [
  { id: 'disney-plus', nombre: 'Disney+', nombres: ['Disney+'] },
  { id: 'hbo-max', nombre: 'HBO Max', nombres: ['HBO Max', 'Max'] },
  { id: 'netflix', nombre: 'Netflix', nombres: ['Netflix'] },
  { id: 'prime-video', nombre: 'Prime Video', nombres: ['Prime Video', 'Amazon Prime Video'] },
];

/** La página de plataforma que corresponde a un nombre de los datos («Max» → HBO Max), si la hay. */
export const plataformaDeNombre = (nombre: string) => PLATAFORMAS.find((p) => p.nombres.includes(nombre));

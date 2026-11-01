/**
 * Recomendador de «¿Qué veo?». Se ejecuta en el navegador con los datos que la página trae incrustados
 * (los prepara src/pages/[...idioma]/[recomendaciones].astro). Sin servidor ni cuentas.
 *
 * Cómo decide:
 *  1. Filtros: universo, formato (película, algo corto, serie corta o larga), imagen real / animación, plataformas.
 *     Se quitan los títulos marcados como vistos en «Mi progreso».
 *  2. Puntuación: nota de TMDB ponderada por número de votos, más puntos por tono (géneros y calificación por
 *     edades), personaje favorito y nivel.
 *  3. Si quedan menos de MINIMO, se van soltando filtros (primero plataformas, luego formato, estilo y universo).
 *  4. De cada serie solo se propone una temporada: la primera que no hayas visto.
 */
export type Tono = 'accion' | 'humor' | 'oscuro' | 'misterio' | 'fantasia' | 'familia';
export type Formato = 'pelicula' | 'corto' | 'serieCorta' | 'serieLarga';

export interface Item {
  id: string;
  /** Universo */
  u: string;
  /** Nombre corto («Loki · T1») */
  n: string;
  url: string;
  img?: string;
  tipo: string;
  anio: number;
  animada: boolean;
  /** Minutos (películas y especiales) */
  dur?: number;
  /** Capítulos (series) */
  caps?: number;
  /** Serie a la que pertenece y temporada (para no proponer varias temporadas de la misma) */
  serie?: string;
  temp?: number;
  tonos: Tono[];
  /** Plataformas incluidas (suscripción o gratis) en el país del idioma */
  pl: string[];
  /** Personajes que aparecen */
  pj: string[];
  nota?: number;
  votos?: number;
}

export interface Respuestas {
  universo?: string;
  formato?: Formato;
  tonos: Tono[];
  estilo?: 'real' | 'animacion';
  plataformas: string[];
  personaje?: string;
  nivel?: 'empezando' | 'veterano';
}

export interface Recomendacion {
  item: Item;
  puntos: number;
  /** Por qué se recomienda: claves que la página convierte en texto */
  motivos: { tipo: 'plataforma' | 'personaje' | 'tono' | 'empezar' | 'joya'; valor?: string }[];
}

const MINIMO = 6;
// Nota «bayesiana»: con pocos votos, la nota se acerca a la media general
const VOTOS_MIN = 300;
const NOTA_MEDIA = 6.3;

export const esCorto = (i: Item) => i.tipo !== 'serie' && ((i.dur !== undefined && i.dur < 60) || ['one-shot', 'corto'].includes(i.tipo));

function cumpleFormato(i: Item, f: Formato) {
  if (f === 'pelicula') return i.tipo === 'pelicula' && !esCorto(i);
  if (f === 'corto') return esCorto(i);
  if (i.tipo !== 'serie') return false;
  // Sin número de capítulos conocido, vale para las dos
  if (!i.caps) return true;
  return f === 'serieCorta' ? i.caps <= 10 : i.caps > 10;
}

const calidad = (i: Item) => {
  const v = i.votos ?? 0;
  return ((i.nota ?? NOTA_MEDIA) * v + NOTA_MEDIA * VOTOS_MIN) / (v + VOTOS_MIN);
};

export function recomendar(items: Item[], r: Respuestas, vistos: Set<string>, azar = Math.random) {
  const filtros: [string, (i: Item) => boolean][] = [
    ['universo', (i) => !r.universo || i.u === r.universo],
    ['estilo', (i) => !r.estilo || i.animada === (r.estilo === 'animacion')],
    ['formato', (i) => !r.formato || cumpleFormato(i, r.formato)],
    ['plataformas', (i) => !r.plataformas.length || i.pl.some((p) => r.plataformas.includes(p))],
  ];
  const sinVer = items.filter((i) => !vistos.has(i.id));
  const quitadosVistos = items.length - sinVer.length;

  // Se sueltan filtros desde el final de la lista hasta tener suficientes
  let activos = filtros.length;
  let candidatos = sinVer.filter((i) => filtros.every(([, f]) => f(i)));
  while (candidatos.length < MINIMO && activos > 0) {
    activos--;
    candidatos = sinVer.filter((i) => filtros.slice(0, activos).every(([, f]) => f(i)));
  }

  const puntuados: Recomendacion[] = candidatos.map((i) => {
    const motivos: Recomendacion['motivos'] = [];
    let puntos = calidad(i);
    const enPlataforma = i.pl.find((p) => r.plataformas.includes(p));
    if (enPlataforma) motivos.push({ tipo: 'plataforma', valor: enPlataforma });
    if (r.personaje && i.pj.includes(r.personaje)) {
      puntos += 5;
      motivos.push({ tipo: 'personaje', valor: r.personaje });
    }
    if (r.tonos.length) {
      const comunes = r.tonos.filter((t) => i.tonos.includes(t));
      puntos += comunes.length ? comunes.length * 2.5 : -1.5;
      comunes.forEach((t) => motivos.push({ tipo: 'tono', valor: t }));
    }
    if (r.nivel === 'empezando') {
      if ((i.temp ?? 1) > 1) puntos -= 4;
      else if (i.tipo === 'pelicula' || i.tipo === 'serie') {
        puntos += 1.5;
        motivos.push({ tipo: 'empezar' });
      } else puntos -= 1.5;
    } else if (r.nivel === 'veterano' && (i.votos ?? 0) < 3000 && (i.nota ?? 0) >= 6.8) {
      puntos += 1.5;
      motivos.push({ tipo: 'joya' });
    }
    // Un poco de azar para que «Volver a empezar» no dé siempre lo mismo
    return { item: i, puntos: puntos + azar() * 0.6, motivos };
  });

  // Una sola temporada por serie: la primera sin ver, con la mejor puntuación del grupo
  const porSerie = new Map<string, Recomendacion[]>();
  for (const p of puntuados) {
    // (una película puede llamarse igual que una serie: solo se agrupan las series)
    const clave = p.item.tipo === 'serie' && p.item.serie ? `serie:${p.item.serie}` : `id:${p.item.id}`;
    (porSerie.get(clave) ?? porSerie.set(clave, []).get(clave)!).push(p);
  }
  const lista = [...porSerie.values()].map((grupo) => {
    const mejor = Math.max(...grupo.map((g) => g.puntos));
    const primera = [...grupo].sort((a, b) => (a.item.temp ?? 0) - (b.item.temp ?? 0))[0];
    return { ...primera, puntos: mejor };
  });
  lista.sort((a, b) => b.puntos - a.puntos);
  return { lista, ampliado: activos < filtros.length, quitadosVistos };
}

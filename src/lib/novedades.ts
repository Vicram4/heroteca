/**
 * «Novedades» (/novedades/, /en/whats-new/): lo que acaba de llegar.
 *  - Recién estrenado: películas estrenadas en cines (del país de la página) y series o temporadas que han empezado en
 *    los últimos DIAS_ESTRENO días, de datos/proximamente.json (sin las series en emisión, que salen en Próximamente).
 *  - Los cambios se agrupan por semana (de lunes a domingo).
 *  - Cambios en plataformas, semana a semana, de datos/novedades-plataformas.json (lo apunta cada lunes
 *    scripts/sincronizar_donde_ver.py): llega a una plataforma de suscripción o gratis, llega en digital
 *    (alquiler o compra) o se va de una plataforma.
 * Solo se muestra lo que sigue siendo cierto: si un título llega a una plataforma y una semana después se va (o se va y
 * vuelve), se descartan los dos movimientos. Los datos de JustWatch tienen idas y venidas de un día para otro, y así
 * la página no se llena de ruido.
 */
import historial from '../../datos/novedades-plataformas.json';
import { todosLosTitulos, localizar, type Titulo } from './datos';
import { todosLosEstrenos, fechaDe, enEmision, type Estreno } from './proximamente';
import { paisDe } from './dondever';
import { plataformaDeNombre } from '../config/plataformas';

export const DIAS_ESTRENO = 60;

/** Lunes de la semana de una fecha AAAA-MM-DD (las comprobaciones extra de otro día van con su semana). */
const lunesDe = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

type Evento = { fecha: string; id: string; plataforma: string; modo: 'plataforma' | 'digital' };
type Historial = Record<'ES' | 'US', { llegadas: Evento[]; salidas: Evento[] }>;

export type TipoCambio = 'llega' | 'digital' | 'sale';

export interface Cambio {
  t: Titulo;
  /** Nombre para la tarjeta (las temporadas, con su número) */
  nombre: string;
  tipo: TipoCambio;
  plataformas: string[];
  /** Id de la página de la plataforma en «Dónde ver» (si tiene) de cada plataforma, para el filtro */
  claves: string[];
}

export interface Semana {
  fecha: string;
  cambios: Cambio[];
}

/** Eventos vigentes: los que no se deshicieron después (misma obra, plataforma y modo). */
function vigentes(pais: 'ES' | 'US') {
  const h = (historial as unknown as Historial)[pais];
  const todos = [
    ...h.llegadas.map((e) => ({ ...e, sentido: 'llega' as const })),
    ...h.salidas.map((e) => ({ ...e, sentido: 'sale' as const })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimo = new Map<string, (typeof todos)[number]>();
  const primero = new Map<string, (typeof todos)[number]>();
  for (const e of todos) {
    const clave = `${e.id}|${e.plataforma}|${e.modo}`;
    if (!primero.has(clave)) primero.set(clave, e);
    ultimo.set(clave, e);
  }
  // Si el primer y el último movimiento van en sentidos distintos, el estado final es el mismo que al principio
  return [...ultimo.entries()].filter(([clave, e]) => primero.get(clave)!.sentido === e.sentido).map(([, e]) => e);
}

export async function cambiosPorSemana(idioma: 'es' | 'en'): Promise<Semana[]> {
  const pais = paisDe(idioma);
  const titulos = new Map((await todosLosTitulos('es')).map((t) => [t.id, t]));
  const grupos = new Map<string, Cambio>();
  for (const e of vigentes(pais)) {
    const original = titulos.get(e.id);
    if (!original) continue;
    const tipo: TipoCambio = e.sentido === 'sale' ? 'sale' : e.modo === 'digital' ? 'digital' : 'llega';
    const clave = `${lunesDe(e.fecha)}|${e.id}|${tipo}`;
    let c = grupos.get(clave);
    if (!c) {
      const t = localizar(original, idioma);
      c = { t, nombre: t.corto, tipo, plataformas: [], claves: [] };
      grupos.set(clave, c);
    }
    if (!c.plataformas.includes(e.plataforma)) c.plataformas.push(e.plataforma);
    const p = plataformaDeNombre(e.plataforma)?.id ?? 'otras';
    if (!c.claves.includes(p)) c.claves.push(p);
  }
  const semanas = new Map<string, Cambio[]>();
  for (const [clave, c] of grupos) {
    const fecha = clave.split('|')[0];
    (semanas.get(fecha) ?? semanas.set(fecha, []).get(fecha)!).push(c);
  }
  const ORDEN: TipoCambio[] = ['llega', 'digital', 'sale'];
  return [...semanas.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([fecha, cambios]) => ({
      fecha,
      cambios: cambios.sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo) || b.t.d.anio - a.t.d.anio || a.nombre.localeCompare(b.nombre)),
    }));
}

/** Películas en cines y series o temporadas estrenadas hace menos de DIAS_ESTRENO días, de la más reciente a la más antigua. */
export function recienEstrenados(idioma: 'es' | 'en'): Estreno[] {
  const pais = paisDe(idioma);
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = new Date(Date.now() - DIAS_ESTRENO * 864e5).toISOString().slice(0, 10);
  const vistos = new Set<string>();
  return todosLosEstrenos()
    .filter((e) => {
      const f = fechaDe(e, pais);
      // Las series en emisión (próximo episodio) ya salen en Próximamente: aquí solo estrenos y temporadas nuevas
      if (f >= hoy || f < desde || enEmision(e) || vistos.has(e.clave)) return false;
      vistos.add(e.clave);
      return true;
    })
    .sort((a, b) => fechaDe(b, pais).localeCompare(fechaDe(a, pais)));
}

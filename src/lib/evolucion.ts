/**
 * Evolución de un personaje: quién lo ha interpretado y cuándo, separando imagen real y animación
 * (mezcladas, las voces de animación partirían en trozos las etapas de imagen real).
 *
 * Las imágenes de archivo se muestran, pero no alargan la etapa de un intérprete ni cuentan como
 * primera o última aparición: en ellas el actor no ha vuelto al papel.
 */
import type { Titulo } from './datos';
import type { Aparicion } from './personajes';
import { claveActor, obraDe } from './actores';

export interface ObraEtapa {
  /** Primer título de la obra, para enlazarla */
  t: Titulo;
  nombre: string;
  anios: string;
  voz: boolean;
  archivo: boolean;
}

export interface PuntoEtapa {
  anio: number;
  /** Títulos de ese año, para la ayuda al pasar el ratón */
  nombres: string;
  archivo: boolean;
}

export interface Etapa {
  actor: string;
  desde: number;
  hasta: number;
  obras: ObraEtapa[];
  puntos: PuntoEtapa[];
}

export interface Evolucion {
  real: Etapa[];
  animacion: Etapa[];
  desde: number;
  hasta: number;
  /** Años que se rotulan en el eje */
  marcas: number[];
  /** Intérpretes distintos, sumando imagen real y animación */
  interpretes: number;
  debut?: Titulo;
  ultima?: Titulo;
  /** Solo si ha tenido más de un intérprete */
  principal?: { actor: string; obras: number };
  /** Títulos en los que aparece sin que conste quién lo interpreta */
  sinInterprete: number;
}

const VOZ = /\((voice|voz)\)/i;
const ARCHIVO = /\((archive footage|imágenes de archivo)\)/i;

const fechaDe = (t: Titulo) => (t.m.fecha ? t.m.fecha.getTime() : Date.UTC(t.d.anio, 0, 1));
const rango = (anios: number[]) => (Math.min(...anios) === Math.max(...anios) ? String(anios[0]) : `${Math.min(...anios)}–${Math.max(...anios)}`);

/** Cada 10 años si la carrera es larga; con pocos años, cada uno para que el eje no se quede vacío. */
function marcasEje(desde: number, hasta: number) {
  const paso = hasta - desde <= 6 ? 1 : hasta - desde <= 20 ? 5 : 10;
  const marcas: number[] = [];
  for (let a = Math.ceil(desde / paso) * paso; a <= hasta; a += paso) marcas.push(a);
  return marcas;
}

interface Paso {
  t: Titulo;
  voz: boolean;
  archivo: boolean;
}

function crearEtapa(actor: string, pasos: Paso[]): Etapa {
  const orden = [...pasos].sort((x, y) => fechaDe(x.t) - fechaDe(y.t) || (x.t.d.temporada ?? 0) - (y.t.d.temporada ?? 0));
  const porObra = new Map<string, Paso[]>();
  for (const p of orden) porObra.set(obraDe(p.t), [...(porObra.get(obraDe(p.t)) ?? []), p]);
  const obras = [...porObra.values()].map((g) => ({
    t: g[0].t,
    nombre: g.length > 1 || g[0].t.d.temporada ? g[0].t.d.titulo : g[0].t.corto,
    anios: rango(g.map((p) => p.t.d.anio)),
    voz: g.every((p) => p.voz),
    archivo: g.every((p) => p.archivo),
  }));
  const porAnio = new Map<number, Paso[]>();
  for (const p of orden) porAnio.set(p.t.d.anio, [...(porAnio.get(p.t.d.anio) ?? []), p]);
  const puntos = [...porAnio].map(([anio, g]) => ({
    anio,
    nombres: `${g.map((p) => p.t.corto).join(', ')} (${anio})`,
    archivo: g.every((p) => p.archivo),
  }));
  const validos = orden.filter((p) => !p.archivo);
  const anios = (validos.length ? validos : orden).map((p) => p.t.d.anio);
  return { actor, desde: Math.min(...anios), hasta: Math.max(...anios), obras, puntos };
}

export function evolucionDe(apariciones: Aparicion[]): Evolucion {
  const real = new Map<string, { actor: string; pasos: Map<string, Paso> }>();
  const animacion = new Map<string, { actor: string; pasos: Map<string, Paso> }>();
  for (const { titulo: t, interpretes } of apariciones) {
    const grupo = t.d.animada ? animacion : real;
    for (const { actor, como } of interpretes) {
      const clave = claveActor(actor);
      if (!clave) continue;
      const etapa = grupo.get(clave) ?? grupo.set(clave, { actor, pasos: new Map() }).get(clave)!;
      // El mismo actor puede venir de tu reparto (sin anotar) y del de TMDB: vale la anotación que haya
      const previo = etapa.pasos.get(t.id);
      etapa.pasos.set(t.id, {
        t,
        voz: !!previo?.voz || VOZ.test(como ?? ''),
        archivo: !!previo?.archivo || ARCHIVO.test(como ?? ''),
      });
    }
  }

  const ordenar = (mapa: typeof real) =>
    [...mapa.values()]
      .map((e) => crearEtapa(e.actor, [...e.pasos.values()]))
      .sort((x, y) => x.desde - y.desde || y.obras.length - x.obras.length || x.actor.localeCompare(y.actor, 'es'));
  const etapasReal = ordenar(real);
  const etapasAnimacion = ordenar(animacion);

  // Primera y última aparición: las de archivo no cuentan
  const pasos = [...real.values(), ...animacion.values()].flatMap((e) => [...e.pasos.values()]);
  const presentes = pasos.filter((p) => !p.archivo).map((p) => p.t);
  const conActor = new Set(apariciones.filter((a) => a.interpretes.length).map((a) => a.titulo.id));
  const fechas = [...new Map((presentes.length ? presentes : pasos.map((p) => p.t)).map((t) => [t.id, t])).values()].sort((x, y) => fechaDe(x) - fechaDe(y));

  const anios = [...etapasReal, ...etapasAnimacion].flatMap((e) => e.puntos.map((p) => p.anio));
  const desde = anios.length ? Math.min(...anios) : 0;
  const hasta = anios.length ? Math.max(...anios) : 0;
  // Obras de cada intérprete, sumando imagen real y animación; las de archivo no cuentan como interpretarlo
  const obrasPorActor = new Map<string, { actor: string; obras: Set<string> }>();
  for (const [clave, e] of [...real, ...animacion]) {
    const total = obrasPorActor.get(clave) ?? obrasPorActor.set(clave, { actor: e.actor, obras: new Set() }).get(clave)!;
    for (const p of e.pasos.values()) if (!p.archivo) total.obras.add(obraDe(p.t));
  }
  const masObras = [...obrasPorActor.values()].sort((x, y) => y.obras.size - x.obras.size)[0];

  return {
    real: etapasReal,
    animacion: etapasAnimacion,
    desde,
    hasta,
    marcas: anios.length ? marcasEje(desde, hasta) : [],
    interpretes: obrasPorActor.size,
    debut: fechas[0],
    ultima: fechas.at(-1),
    principal: obrasPorActor.size > 1 ? { actor: masObras.actor, obras: masObras.obras.size } : undefined,
    sinInterprete: apariciones.length - conActor.size,
  };
}

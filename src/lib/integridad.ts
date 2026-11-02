/**
 * Comprobaciones entre archivos que el esquema por sí solo no puede hacer:
 * que las referencias apunten a algo que existe, que cada sección pertenezca
 * a su universo y que no haya dos fichas con el mismo número en una sección.
 * Se ejecuta durante el build; si algo falla, el build se detiene con la
 * lista completa de errores.
 */
import { getCollection } from 'astro:content';
import { llevaEpoca } from './lineaTemporal';

let resultado: Promise<void> | undefined;

export function comprobarIntegridad() {
  resultado ??= ejecutar();
  return resultado;
}

async function ejecutar() {
  const [universos, sagas, personajes, titulos, visionados, wiki, textosEn] = await Promise.all([
    getCollection('universos'),
    getCollection('sagas'),
    getCollection('personajes'),
    getCollection('titulos'),
    getCollection('visionados'),
    getCollection('wiki'),
    getCollection('textosEn'),
  ]);

  const ids = {
    universos: new Set(universos.map((u) => u.id)),
    sagas: new Set(sagas.map((s) => s.id)),
    personajes: new Set(personajes.map((p) => p.id)),
    titulos: new Set(titulos.map((t) => t.id)),
    wiki: new Set(wiki.map((e) => e.id)),
  };
  const secciones = new Map(universos.map((u) => [u.id, new Set(u.data.secciones.map((s) => s.id))]));
  const porCarpetas = new Set(universos.flatMap((u) => u.data.secciones.filter((s) => s.orden === 'carpetas').map((s) => `${u.id}/${s.id}`)));
  const errores: string[] = [];

  const existe = (donde: string, coleccion: keyof typeof ids, ref?: { id: string }) => {
    if (ref && !ids[coleccion].has(ref.id)) errores.push(`${donde}: no existe "${ref.id}" en ${coleccion}`);
  };

  for (const s of sagas) {
    existe(`sagas/${s.id}`, 'universos', s.data.universo);
    existe(`sagas/${s.id}`, 'sagas', s.data.padre);
  }

  for (const p of personajes) existe(`personajes/${p.id}`, 'universos', p.data.universo);

  // Wiki: enlaces correctos y texto en los dos idiomas
  for (const e of wiki) {
    const donde = `wiki/${e.id}`;
    existe(donde, 'universos', e.data.universo);
    e.data.personajes.forEach((r) => existe(donde, 'personajes', r));
    e.data.titulos.forEach((r) => existe(donde, 'titulos', r));
    e.data.relacionadas.forEach((r) => existe(donde, 'wiki', r));
  }
  const conTextoEn = new Set(textosEn.filter((t) => t.body?.trim()).map((t) => t.id));
  for (const [carpeta, entradas] of [['personajes', personajes], ['wiki', wiki]] as const) {
    for (const e of entradas) {
      if (!e.body?.trim()) continue;
      if (!conTextoEn.has(`${carpeta}/${e.id}`)) errores.push(`${carpeta}/${e.id}: falta el texto inglés en contenido/en/${carpeta}/`);
      if (!e.data.resumen || !e.data.resumenEn) errores.push(`${carpeta}/${e.id}: tiene texto de la Wiki pero le falta resumen o resumenEn`);
    }
  }

  const numeros = new Map<string, { id: string; grupo: string }>();
  const ocupadas = new Set(['sagas', 'personajes', 'wiki', 'cronologia', 'buscar', 'carpetas', 'guias', ...universos.flatMap((u) => u.data.secciones.map((s) => s.id))]);
  for (const t of titulos) {
    const d = t.data;
    const donde = `titulos/${t.id}`;
    if (ocupadas.has(t.id)) errores.push(`${donde}: el id "${t.id}" coincide con una sección o página reservada; renombra la carpeta`);
    existe(donde, 'universos', d.universo);
    if (!secciones.get(d.universo.id)?.has(d.seccion))
      errores.push(`${donde}: la sección "${d.seccion}" no está definida en contenido/universos/${d.universo.id}.yaml`);

    const propios = [d.numero, ...d.tramos.map((tr) => tr.numero)].filter((n): n is number => n !== undefined);
    // En secciones por carpetas el número es el de la carpeta del disco: lo comparten las temporadas de una serie
    const deCarpetas = porCarpetas.has(`${d.universo.id}/${d.seccion}`);
    for (const n of new Set(propios)) {
      const clave = `${d.universo.id}/${d.seccion}/${n}`;
      const grupo = deCarpetas ? (d.serie ?? t.id) : t.id;
      const otro = numeros.get(clave);
      if (otro && otro.grupo !== grupo) errores.push(`${donde}: el número ${n} de "${d.seccion}" ya lo usa titulos/${otro.id}`);
      else if (!otro) numeros.set(clave, { id: t.id, grupo });
    }

    d.sagas.forEach((s) => existe(donde, 'sagas', s));
    d.personajes.forEach((a) => existe(donde, 'personajes', a.personaje));
    const c = d.conexiones;
    [...c.verAntes, ...c.verDespues, ...c.relacionados].forEach((r) => existe(donde, 'titulos', r));
    c.cameos.forEach((cm) => {
      existe(donde, 'personajes', cm.personaje);
      existe(donde, 'titulos', cm.titulo);
    });
  }

  for (const v of visionados) {
    const donde = `visionados/${v.id}`;
    existe(donde, 'universos', v.data.universo);
    v.data.orden.forEach((o) => existe(donde, 'titulos', o.titulo));
  }

  // Aviso (no detiene el build): títulos del UMC sin época para la línea temporal
  const sinEpoca = titulos.filter((t) => llevaEpoca(t.data.universo.id, t.data.seccion) && !t.data.epoca).map((t) => t.id);
  if (sinEpoca.length) console.warn(`⚠️  Títulos del UMC sin «epoca» (no salen en la línea temporal): ${sinEpoca.join(', ')}`);

  if (errores.length) {
    throw new Error(`Hay ${errores.length} problema(s) en los datos:\n  - ${errores.join('\n  - ')}`);
  }
}

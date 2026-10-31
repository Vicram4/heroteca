/**
 * Comprobaciones entre archivos que el esquema por sí solo no puede hacer:
 * que las referencias apunten a algo que existe, que cada sección pertenezca
 * a su universo y que no haya dos fichas con el mismo número en una sección.
 * Se ejecuta durante el build; si algo falla, el build se detiene con la
 * lista completa de errores.
 */
import { getCollection } from 'astro:content';

let resultado: Promise<void> | undefined;

export function comprobarIntegridad() {
  resultado ??= ejecutar();
  return resultado;
}

async function ejecutar() {
  const [universos, sagas, personajes, titulos] = await Promise.all([
    getCollection('universos'),
    getCollection('sagas'),
    getCollection('personajes'),
    getCollection('titulos'),
  ]);

  const ids = {
    universos: new Set(universos.map((u) => u.id)),
    sagas: new Set(sagas.map((s) => s.id)),
    personajes: new Set(personajes.map((p) => p.id)),
    titulos: new Set(titulos.map((t) => t.id)),
  };
  const secciones = new Map(universos.map((u) => [u.id, new Set(u.data.secciones.map((s) => s.id))]));
  const errores: string[] = [];

  const existe = (donde: string, coleccion: keyof typeof ids, ref?: { id: string }) => {
    if (ref && !ids[coleccion].has(ref.id)) errores.push(`${donde}: no existe "${ref.id}" en ${coleccion}`);
  };

  for (const s of sagas) {
    existe(`sagas/${s.id}`, 'universos', s.data.universo);
    existe(`sagas/${s.id}`, 'sagas', s.data.padre);
  }

  for (const p of personajes) existe(`personajes/${p.id}`, 'universos', p.data.universo);

  const numeros = new Map<string, string>();
  for (const t of titulos) {
    const d = t.data;
    const donde = `titulos/${t.id}`;
    existe(donde, 'universos', d.universo);
    if (!secciones.get(d.universo.id)?.has(d.seccion))
      errores.push(`${donde}: la sección "${d.seccion}" no está definida en contenido/universos/${d.universo.id}.yaml`);

    const propios = [d.numero, ...d.tramos.map((tr) => tr.numero)].filter((n): n is number => n !== undefined);
    for (const n of new Set(propios)) {
      const clave = `${d.universo.id}/${d.seccion}/${n}`;
      const otro = numeros.get(clave);
      if (otro) errores.push(`${donde}: el número ${n} de "${d.seccion}" ya lo usa titulos/${otro}`);
      else numeros.set(clave, t.id);
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

  if (errores.length) {
    throw new Error(`Hay ${errores.length} problema(s) en los datos:\n  - ${errores.join('\n  - ')}`);
  }
}

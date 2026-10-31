/**
 * Comprobaciones entre archivos que el esquema por sí solo no puede hacer:
 * que las referencias apunten a algo que existe y que cada subuniverso
 * pertenezca a su universo. Se ejecuta durante el build; si algo falla,
 * el build se detiene con la lista completa de errores.
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
  const subuniversos = new Map(universos.map((u) => [u.id, new Set(u.data.subuniversos.map((s) => s.id))]));
  const errores: string[] = [];

  const existe = (donde: string, coleccion: keyof typeof ids, ref?: { id: string }) => {
    if (ref && !ids[coleccion].has(ref.id)) errores.push(`${donde}: no existe "${ref.id}" en ${coleccion}`);
  };
  const subuniversoValido = (donde: string, universo: string, sub?: string) => {
    if (sub && !subuniversos.get(universo)?.has(sub))
      errores.push(`${donde}: el subuniverso "${sub}" no está definido en contenido/universos/${universo}.yaml`);
  };

  for (const s of sagas) {
    const donde = `sagas/${s.id}`;
    existe(donde, 'universos', s.data.universo);
    existe(donde, 'sagas', s.data.padre);
    subuniversoValido(donde, s.data.universo.id, s.data.subuniverso);
  }

  for (const p of personajes) existe(`personajes/${p.id}`, 'universos', p.data.universo);

  for (const t of titulos) {
    const d = t.data;
    const donde = `titulos/${t.id}`;
    existe(donde, 'universos', d.universo);
    subuniversoValido(donde, d.universo.id, d.subuniverso);
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

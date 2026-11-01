/**
 * Versión inglesa de universos, secciones, sagas y personajes: devuelven el mismo objeto con los campos
 * traducidos (nombreEn, descripcionEn…) en su sitio, así los componentes siguen usando `.nombre`.
 * Si falta la traducción, se queda el texto en español.
 */
import type { CollectionEntry } from 'astro:content';
import type { Idioma } from './index';

type Universo = CollectionEntry<'universos'>;
type Seccion = Universo['data']['secciones'][number];
type Saga = CollectionEntry<'sagas'>;
type Personaje = CollectionEntry<'personajes'>;

export function seccionLoc(s: Seccion, idioma: Idioma): Seccion {
  if (idioma === 'es') return s;
  return {
    ...s,
    nombre: s.nombreEn ?? s.nombre,
    descripcion: s.descripcionEn ?? s.descripcion,
    tituloSeo: s.tituloSeoEn ?? s.tituloSeo,
    carpetas: s.carpetas.map((c) => ({ ...c, etapa: c.etapaEn ?? c.etapa })),
  };
}

export function universoLoc(u: Universo, idioma: Idioma): Universo {
  if (idioma === 'es') return u;
  return {
    ...u,
    data: {
      ...u.data,
      descripcion: u.data.descripcionEn ?? u.data.descripcion,
      tituloSeo: u.data.tituloSeoEn ?? u.data.tituloSeo,
      secciones: u.data.secciones.map((s) => seccionLoc(s, idioma)),
      gruposSagas: u.data.gruposSagas.map((g) => ({ ...g, titulo: g.tituloEn ?? g.titulo, texto: g.textoEn ?? g.texto })),
    },
  };
}

export function sagaLoc(s: Saga, idioma: Idioma): Saga {
  if (idioma === 'es') return s;
  return {
    ...s,
    data: { ...s.data, nombre: s.data.nombreEn ?? s.data.nombre, descripcion: s.data.descripcionEn ?? s.data.descripcion, notas: s.data.notasEn ?? s.data.notas },
  };
}

/**
 * Personaje en el idioma de la página. En español se ven todos los alias; en inglés, solo los que no son
 * exclusivos del español. El nombre y los alias españoles quedan en `aliasEs` para que el buscador los encuentre.
 */
export function personajeLoc(p: Personaje, idioma: Idioma): Personaje {
  if (idioma === 'es') return { ...p, data: { ...p.data, alias: [...p.data.alias, ...p.data.aliasEs] } };
  const nombre = p.data.nombreEn ?? p.data.nombre;
  const aliasEs = [...(p.data.nombreEn ? [p.data.nombre] : []), ...p.data.aliasEs];
  return { ...p, data: { ...p.data, nombre, alias: p.data.alias.filter((a) => a !== nombre), aliasEs } };
}

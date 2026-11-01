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
  return { ...s, data: { ...s.data, nombre: s.data.nombreEn ?? s.data.nombre, descripcion: s.data.descripcionEn ?? s.data.descripcion } };
}

export function personajeLoc(p: Personaje, idioma: Idioma): Personaje {
  if (idioma === 'es' || !p.data.nombreEn) return p;
  // El nombre español pasa a ser un alias más (el buscador lo sigue encontrando)
  return { ...p, data: { ...p.data, nombre: p.data.nombreEn, alias: [p.data.nombre, ...p.data.alias.filter((a) => a !== p.data.nombreEn)] } };
}

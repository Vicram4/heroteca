/**
 * Wiki: entradas de contenido/wiki/ y textos de los personajes (el cuerpo de su archivo).
 * El texto español es el cuerpo del archivo; el inglés está en contenido/en/<carpeta>/.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Idioma } from '../i18n';

export type EntradaWiki = CollectionEntry<'wiki'>;
type ConTexto = CollectionEntry<'personajes'> | EntradaWiki;

const nombreDe = (e: EntradaWiki, idioma: Idioma) => (idioma === 'en' ? (e.data.nombreEn ?? e.data.nombre) : e.data.nombre);
const porNombre = (idioma: Idioma) => (a: EntradaWiki, b: EntradaWiki) => nombreDe(a, idioma).localeCompare(nombreDe(b, idioma), idioma);

export async function entradasWikiDe(universo: string, idioma: Idioma) {
  return (await getCollection('wiki', (e) => e.data.universo.id === universo)).sort(porNombre(idioma));
}

export async function entradasDePersonaje(personaje: string, idioma: Idioma) {
  return (await getCollection('wiki', (e) => e.data.personajes.some((p) => p.id === personaje))).sort(porNombre(idioma));
}

/** Entradas que citan este título: la ficha enlaza a ellas. */
export async function entradasDeTitulo(titulo: string, idioma: Idioma) {
  return (await getCollection('wiki', (e) => e.data.titulos.some((t) => t.id === titulo))).sort(porNombre(idioma));
}

/** La entrada cuyo cuerpo es el texto en ese idioma, o undefined si aún no tiene texto. */
export async function textoWikiDe(carpeta: 'personajes' | 'wiki', entrada: ConTexto, idioma: Idioma) {
  const texto = idioma === 'en' ? await getEntry('textosEn', `${carpeta}/${entrada.id}`) : entrada;
  return texto?.body?.trim() ? texto : undefined;
}

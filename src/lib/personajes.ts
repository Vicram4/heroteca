/**
 * Asigna personajes a títulos a partir del reparto («Steve Rogers / Capitán América»)
 * y del campo `personajes` de cada ficha.
 *
 * Reglas para no equivocarse:
 *  - Se compara cada parte del texto (separadas por «/») completa, no por trozos:
 *    «She-Hulk» no cuenta como «Hulk».
 *  - Manda la identidad: en «Miles Morales / Spider-Man» se asigna Miles Morales, no Peter Parker.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { todosLosTitulos, type Titulo } from './datos';

export type Personaje = CollectionEntry<'personajes'>;

export interface Aparicion {
  titulo: Titulo;
  actor?: string;
  /** Texto del reparto tal cual («Steve Rogers / Capitán América») */
  como?: string;
}

const TRATAMIENTOS = new Set(['dr', 'dra', 'doctor', 'doctora', 'gral', 'general', 'cnel', 'coronel', 'sr', 'sra', 'el', 'la']);

export function normal(texto: string) {
  const palabras = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[´'’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ');
  while (palabras.length > 1 && TRATAMIENTOS.has(palabras[0])) palabras.shift();
  return palabras.join(' ');
}

interface Indice {
  identidad: Map<string, Set<string>>;
  heroe: Map<string, Set<string>>;
}

function crearIndice(personajes: Personaje[]): Indice {
  const identidad = new Map<string, Set<string>>();
  const heroe = new Map<string, Set<string>>();
  const poner = (mapa: Map<string, Set<string>>, texto: string, id: string) => {
    const k = normal(texto);
    if (!k) return;
    if (!mapa.has(k)) mapa.set(k, new Set());
    mapa.get(k)!.add(id);
  };
  for (const p of personajes) {
    const d = p.data;
    if (d.identidad) {
      poner(identidad, d.identidad, p.id);
      poner(heroe, d.nombre, p.id);
    } else {
      poner(identidad, d.nombre, p.id);
    }
    d.alias.forEach((a) => poner(heroe, a, p.id));
  }
  return { identidad, heroe };
}

/** Personajes que corresponden a un texto del reparto. */
function deTexto(texto: string, indice: Indice): string[] {
  const partes = texto.split('/').map(normal).filter(Boolean);
  const porIdentidad = new Set(partes.flatMap((p) => [...(indice.identidad.get(p) ?? [])]));
  if (porIdentidad.size) return [...porIdentidad];
  return [...new Set(partes.flatMap((p) => [...(indice.heroe.get(p) ?? [])]))];
}

interface Resultado {
  personajes: Personaje[];
  porPersonaje: Map<string, Aparicion[]>;
  porTitulo: Map<string, Set<string>>;
  /** Para enlazar cada línea del reparto: clave "tituloId|índice" → personaje */
  enlaceReparto: Map<string, string>;
}

let cache: Promise<Resultado> | undefined;

export function apariciones() {
  cache ??= calcular();
  return cache;
}

async function calcular(): Promise<Resultado> {
  const personajes = await getCollection('personajes');
  const titulos = await todosLosTitulos();
  const indices = new Map<string, Indice>();
  for (const u of new Set(personajes.map((p) => p.data.universo.id))) {
    indices.set(u, crearIndice(personajes.filter((p) => p.data.universo.id === u)));
  }
  const porPersonaje = new Map<string, Aparicion[]>(personajes.map((p) => [p.id, []]));
  const porTitulo = new Map<string, Set<string>>();
  const enlaceReparto = new Map<string, string>();

  const anotar = (pid: string, ap: Aparicion) => {
    const lista = porPersonaje.get(pid);
    if (!lista || lista.some((a) => a.titulo.id === ap.titulo.id)) return;
    lista.push(ap);
    if (!porTitulo.has(ap.titulo.id)) porTitulo.set(ap.titulo.id, new Set());
    porTitulo.get(ap.titulo.id)!.add(pid);
  };

  for (const t of titulos) {
    const indice = indices.get(t.universo);
    if (indice) {
      t.d.reparto.forEach((r, i) => {
        if (!r.personaje) return;
        const ids = deTexto(r.personaje, indice);
        ids.forEach((pid) => anotar(pid, { titulo: t, actor: r.actor, como: r.personaje }));
        if (ids.length === 1) enlaceReparto.set(`${t.id}|${i}`, ids[0]);
      });
    }
    // Apariciones escritas a mano en la ficha
    t.d.personajes.forEach((a) => anotar(a.personaje.id, { titulo: t, actor: a.actor }));
  }
  return { personajes, porPersonaje, porTitulo, enlaceReparto };
}

export async function personajesDe(universo: string) {
  const { personajes, porPersonaje } = await apariciones();
  return personajes
    .filter((p) => p.data.universo.id === universo)
    .map((p) => ({ p, apariciones: porPersonaje.get(p.id) ?? [] }))
    .sort((a, b) => b.apariciones.length - a.apariciones.length || a.p.data.nombre.localeCompare(b.p.data.nombre, 'es'));
}

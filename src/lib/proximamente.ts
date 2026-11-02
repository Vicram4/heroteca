/**
 * «Próximamente»: próximos estrenos de Marvel y DC y series en emisión.
 * Los genera scripts/sincronizar_proximamente.py en datos/proximamente.json; GitHub Actions los actualiza
 * cada semana. Como la web se compila de vez en cuando, la página oculta en el navegador lo que ya se ha estrenado.
 * Las películas llevan su fecha de estreno en cines en España y EE. UU. (`cines`): cada versión usa la de su país.
 * El archivo guarda también las películas estrenadas en cines hace poco (para «En cines» en Novedades) y, en `archivo`,
 * los estrenos que ya no salen en la lista, para que su página siga existiendo.
 */
import archivo from '../../datos/proximamente.json';
import type { Idioma } from '../i18n';

interface Textos {
  titulo: string;
  sinopsis: string;
  poster?: string | null;
  fondo?: string | null;
  /** Clave de YouTube del tráiler oficial */
  trailer?: string | null;
}
export interface Estreno {
  clave: string;
  universo: string;
  tipo: 'pelicula' | 'serie';
  tmdb: { tipo: 'movie' | 'tv'; id: number };
  /** AAAA-MM-DD (estreno mundial o emisión) */
  fecha: string;
  /** Películas: estreno en cines por país (AAAA-MM-DD) */
  cines?: Partial<Record<'ES' | 'US', string>>;
  temporada?: number | null;
  episodio?: number | null;
  /** «universo/ficha» si ya está en la colección */
  ficha?: string | null;
  /** Dirección de su página en cada idioma. No cambia aunque cambie el título */
  ruta: Record<Idioma, string>;
  es: Textos;
  en: Textos;
}

const datos = archivo as unknown as { fecha: string; estrenos: Estreno[]; archivo?: Estreno[] };
const estrenos = datos.estrenos;
const archivados = new Set((datos.archivo ?? []).map((e) => e.clave));

/** Todos los que tienen página: los de la lista y los archivados. */
export const todosLosEstrenos = () => [...estrenos, ...(datos.archivo ?? [])];

export const fechaProximamente = () => new Date(`${datos.fecha}T00:00:00Z`);

/** Serie con un episodio que no es el primero de la temporada: está en emisión. */
export const enEmision = (e: Estreno) => e.tipo === 'serie' && (e.episodio ?? 1) > 1;

/** Fecha que cuenta en un país: el estreno en sus cines si se conoce; si no, la general. */
export const fechaDe = (e: Estreno, pais: 'ES' | 'US') => e.cines?.[pais] ?? e.fecha;

/** Estrenos con fecha desde hoy (en la compilación) en ese país, por fecha; opcionalmente de un universo. */
export function proximosEstrenos(pais: 'ES' | 'US', universo?: string) {
  const hoy = new Date().toISOString().slice(0, 10);
  return estrenos
    .filter((e) => fechaDe(e, pais) >= hoy && (!universo || e.universo === universo))
    .sort((a, b) => fechaDe(a, pais).localeCompare(fechaDe(b, pais)));
}

/**
 * Situación al compilar. Un archivado con fecha futura dejó de salir en TMDB sin estrenarse (retrasado, sin fecha o
 * cancelado), así que su fecha ya no es de fiar.
 */
export function estadoEstreno(e: Estreno, pais: 'ES' | 'US'): 'proximo' | 'estrenado' | 'sinFecha' {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fechaDe(e, pais) < hoy) return 'estrenado';
  return archivados.has(e.clave) ? 'sinFecha' : 'proximo';
}

/** Adónde lleva una tarjeta: a la ficha si está en la colección; si no, a su página. Dirección española (ver i18n/rutas). */
export const enlaceEstreno = (e: Estreno) => (e.ficha ? `/${e.ficha}/` : `/proximamente/${e.ruta.es}/`);

export const textosEstreno = (e: Estreno, idioma: Idioma) => ({
  ...e[idioma],
  titulo: e[idioma].titulo || e.es.titulo || e.en.titulo,
  sinopsis: e[idioma].sinopsis || '',
  poster: e[idioma].poster || e.es.poster || e.en.poster,
});

export const enlaceTmdb = (e: Estreno, idioma: Idioma) =>
  `https://www.themoviedb.org/${e.tmdb.tipo}/${e.tmdb.id}${e.temporada && e.tipo === 'serie' ? `/season/${e.temporada}` : ''}?language=${idioma === 'en' ? 'en-US' : 'es-ES'}`;

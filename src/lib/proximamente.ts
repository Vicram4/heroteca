/**
 * «Próximamente»: próximos estrenos de Marvel y DC y series en emisión.
 * Los genera scripts/sincronizar_proximamente.py en datos/proximamente.json; GitHub Actions los actualiza
 * cada semana. Como la web se compila de vez en cuando, la página oculta en el navegador lo que ya se ha estrenado.
 */
import archivo from '../../datos/proximamente.json';
import type { Idioma } from '../i18n';

interface Textos {
  titulo: string;
  sinopsis: string;
  poster?: string | null;
}
export interface Estreno {
  clave: string;
  universo: string;
  tipo: 'pelicula' | 'serie';
  tmdb: { tipo: 'movie' | 'tv'; id: number };
  /** AAAA-MM-DD */
  fecha: string;
  temporada?: number | null;
  episodio?: number | null;
  /** «universo/ficha» si ya está en la colección */
  ficha?: string | null;
  es: Textos;
  en: Textos;
}

const estrenos = (archivo as { estrenos: Estreno[] }).estrenos;

export const fechaProximamente = () => new Date(`${(archivo as { fecha: string }).fecha}T00:00:00Z`);

/** Serie con un episodio que no es el primero de la temporada: está en emisión. */
export const enEmision = (e: Estreno) => e.tipo === 'serie' && (e.episodio ?? 1) > 1;

/** Estrenos con fecha desde hoy (en la compilación), opcionalmente de un universo. */
export function proximosEstrenos(universo?: string) {
  const hoy = new Date().toISOString().slice(0, 10);
  return estrenos.filter((e) => e.fecha >= hoy && (!universo || e.universo === universo));
}

export const textosEstreno = (e: Estreno, idioma: Idioma) => ({
  ...e[idioma],
  titulo: e[idioma].titulo || e.es.titulo || e.en.titulo,
  sinopsis: e[idioma].sinopsis || '',
  poster: e[idioma].poster || e.es.poster || e.en.poster,
});

export const enlaceTmdb = (e: Estreno, idioma: Idioma) =>
  `https://www.themoviedb.org/${e.tmdb.tipo}/${e.tmdb.id}${e.temporada && e.tipo === 'serie' ? `/season/${e.temporada}` : ''}?language=${idioma === 'en' ? 'en-US' : 'es-ES'}`;

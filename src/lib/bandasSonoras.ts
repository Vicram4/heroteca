/**
 * Álbumes de la banda sonora de cada ficha, leídos de datos/bandas-sonoras.json
 * (lo genera scripts/sincronizar_bandas_sonoras.py a partir de la búsqueda de iTunes). Al compilar no se contacta con nadie.
 */
import datos from '../../datos/bandas-sonoras.json';

export interface AlbumBandaSonora {
  album: string;
  artista?: string;
  anio?: number;
  /** Enlace del álbum en Apple Music (tienda española) */
  apple: string;
  /** Id del álbum en Spotify, si se pudo buscar con la API de Spotify */
  spotify?: string;
  /** Es la partitura («score»), no la banda sonora con canciones */
  partitura?: boolean;
}

const TODOS = datos as Record<string, AlbumBandaSonora[]>;

export const bandaSonora = (universo: string, id: string): AlbumBandaSonora[] => TODOS[`${universo}/${id}`] ?? [];

/** Nombre del álbum sin «(Original Motion Picture Soundtrack)» y similares, para buscarlo en otros servicios. */
const nombreCorto = (a: AlbumBandaSonora) => a.album.replace(/\s*[([][^)\]]*[)\]]/g, '').trim();
const busqueda = (a: AlbumBandaSonora) => `${nombreCorto(a)} ${a.artista && !/^vari(os|ous) artist/i.test(a.artista) ? a.artista : ''}`.trim();

export const enlacesAlbum = (a: AlbumBandaSonora, idioma: 'es' | 'en') => ({
  apple: a.apple,
  spotify: a.spotify ? `https://open.spotify.com/album/${a.spotify}` : `https://open.spotify.com/search/${encodeURIComponent(busqueda(a))}/albums`,
  youtube: `https://music.youtube.com/search?q=${encodeURIComponent(busqueda(a))}`,
  /** Reproductores para insertar en la página */
  embedApple: `${a.apple.replace('https://music.apple.com/', 'https://embed.music.apple.com/')}?l=${idioma}`,
  embedSpotify: a.spotify ? `https://open.spotify.com/embed/album/${a.spotify}` : undefined,
});

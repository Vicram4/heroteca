/**
 * Títulos de la colección incluidos en cada plataforma (suscripción o gratis), por país, para las páginas
 * «Dónde ver» (src/pages/[...idioma]/[dondeVer]/). Las temporadas de una serie se juntan en una entrada.
 */
import { PLATAFORMAS, type PlataformaPagina } from '../config/plataformas';
import { universosActivos, titulosDe, localizar, type Titulo } from './datos';
import { plataformasIncluidas, paisDe } from './dondever';
import { obraDe } from './actores';

export interface EntradaPlataforma {
  /** Primer título de la obra (la película, o la primera temporada disponible), ya en el idioma de la página */
  t: Titulo;
  nombre: string;
  anio: number;
  esSerie: boolean;
  /** Temporadas disponibles (solo series por temporadas) */
  temporadas: number[];
}

export interface GrupoPlataforma {
  universo: string;
  nombre: string;
  entradas: EntradaPlataforma[];
}

export async function titulosEnPlataforma(p: PlataformaPagina, idioma: 'es' | 'en'): Promise<GrupoPlataforma[]> {
  const pais = paisDe(idioma);
  const grupos: GrupoPlataforma[] = [];
  for (const u of await universosActivos()) {
    const porObra = new Map<string, Titulo[]>();
    for (const t of await titulosDe(u.id)) {
      if (!plataformasIncluidas(t.id, pais).some((n) => p.nombres.includes(n))) continue;
      const clave = obraDe(t);
      (porObra.get(clave) ?? porObra.set(clave, []).get(clave)!).push(t);
    }
    const entradas = [...porObra.values()]
      .map((lista) => {
        const orden = [...lista].sort((a, b) => (a.d.temporada ?? 0) - (b.d.temporada ?? 0) || a.d.anio - b.d.anio);
        const t = localizar(orden[0], idioma);
        const esSerie = t.tipo === 'serie';
        return {
          t,
          nombre: esSerie && t.d.serie ? t.d.titulo : t.corto,
          anio: Math.min(...lista.map((x) => x.d.anio)),
          esSerie,
          temporadas: [...new Set(orden.map((x) => x.d.temporada).filter((n): n is number => !!n))],
        };
      })
      .sort((a, b) => a.anio - b.anio || a.nombre.localeCompare(b.nombre));
    if (entradas.length) grupos.push({ universo: u.id, nombre: u.data.nombre, entradas });
  }
  return grupos;
}

/** Cuántas obras hay en cada plataforma (para la página índice y los enlaces). */
export async function recuentoPlataformas(idioma: 'es' | 'en') {
  return Promise.all(
    PLATAFORMAS.map(async (p) => ({ p, total: (await titulosEnPlataforma(p, idioma)).reduce((n, g) => n + g.entradas.length, 0) })),
  );
}

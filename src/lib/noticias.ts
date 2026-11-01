/**
 * «Noticias»: titulares de Marvel y DC de medios especializados (RSS públicos), clasificados por universo.
 * Los recoge scripts/sincronizar_noticias.py en datos/noticias.json; GitHub Actions lo actualiza cada día.
 * Solo se guarda titular, resumen breve y enlace a la noticia original.
 */
import archivo from '../../datos/noticias.json';
import type { Idioma } from '../i18n';

export interface Noticia {
  titulo: string;
  enlace: string;
  fuente: string;
  /** ISO, en UTC */
  fecha: string;
  resumen: string;
  universos: string[];
}

const datos = archivo as unknown as { fecha: string } & Record<Idioma, Noticia[]>;

export const fechaNoticias = () => new Date(datos.fecha);

/** Noticias del idioma (más recientes primero), opcionalmente de un universo. */
export function noticiasDe(idioma: Idioma, universo?: string, maximo?: number) {
  const lista = (datos[idioma] ?? []).filter((n) => !universo || n.universos.includes(universo));
  return maximo ? lista.slice(0, maximo) : lista;
}

/** Fuentes que aparecen en las noticias de un idioma. */
export const fuentesDe = (idioma: Idioma) => [...new Set((datos[idioma] ?? []).map((n) => n.fuente))].sort();

/**
 * «Dónde ver» (datos de JustWatch vía TMDB), por país:
 *   datos/donde-ver.json → España (versión en español)
 *   datos/donde-ver-us.json → Estados Unidos (versión en inglés)
 * Los genera scripts/sincronizar_donde_ver.py; GitHub Actions los actualiza cada semana.
 */
export interface Plataforma {
  nombre: string;
  logo?: string;
}
export interface DondeVer {
  enlace?: string;
  suscripcion?: Plataforma[];
  gratis?: Plataforma[];
  alquiler?: Plataforma[];
  compra?: Plataforma[];
}
interface Archivo {
  fecha: string;
  pais: string;
  fuente: string;
  titulos: Record<string, DondeVer>;
}
export type Pais = 'ES' | 'US';

const archivos = import.meta.glob<Archivo>('../../datos/donde-ver*.json', { eager: true, import: 'default' });
const porPais = new Map<string, Archivo>(Object.values(archivos).map((a) => [a.pais, a]));

export const fechaDondeVer = (pais: Pais = 'ES') => {
  const a = porPais.get(pais);
  return a ? new Date(`${a.fecha}T00:00:00Z`) : undefined;
};

export function dondeVer(id: string, pais: Pais = 'ES'): DondeVer | undefined {
  return porPais.get(pais)?.titulos[id];
}

/** Plataformas donde se puede ver sin pagar aparte (suscripción o gratis): las del filtro. */
export function plataformasIncluidas(id: string, pais: Pais = 'ES'): string[] {
  const d = dondeVer(id, pais);
  return [...new Set([...(d?.suscripcion ?? []), ...(d?.gratis ?? [])].map((p) => p.nombre))];
}

/** País de los datos según el idioma de la página. */
export const paisDe = (idioma: 'es' | 'en'): Pais => (idioma === 'en' ? 'US' : 'ES');

/** Valor para atributos HTML: «Disney+» → «disney-plus»; «Movistar Plus+ Ficción Total» → «movistar-plus-plus-ficcion-total». */
export const clavePlataforma = (nombre: string) =>
  nombre
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

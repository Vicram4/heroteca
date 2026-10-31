/**
 * «Dónde ver» en España (datos de JustWatch vía TMDB), leídos de datos/donde-ver.json.
 * Lo genera scripts/sincronizar_donde_ver.py; GitHub Actions lo actualiza cada semana.
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

const archivos = import.meta.glob<Archivo>('../../datos/donde-ver.json', { eager: true, import: 'default' });
const datos: Archivo | undefined = Object.values(archivos)[0];

export const fechaDondeVer = datos ? new Date(`${datos.fecha}T00:00:00Z`) : undefined;

export function dondeVer(id: string): DondeVer | undefined {
  return datos?.titulos[id];
}

/** Plataformas donde se puede ver sin pagar aparte (suscripción o gratis): las del filtro. */
export function plataformasIncluidas(id: string): string[] {
  const d = dondeVer(id);
  return [...new Set([...(d?.suscripcion ?? []), ...(d?.gratis ?? [])].map((p) => p.nombre))];
}

/** Valor para atributos HTML: «Disney+» → «disney»; «Movistar Plus+ Ficción Total» → «movistar-plus-ficcion-total». */
export const clavePlataforma = (nombre: string) =>
  nombre
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

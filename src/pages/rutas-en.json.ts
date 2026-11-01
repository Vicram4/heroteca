/**
 * Tabla de direcciones española → inglesa. La usa la integración de astro.config.mjs para reescribir los
 * enlaces de las páginas inglesas al compilar; después borra este archivo de dist/ (no se publica).
 */
import { tablasEn } from '../i18n/rutas';

export async function GET() {
  const { aIngles } = await tablasEn();
  return new Response(JSON.stringify(Object.fromEntries(aIngles)), { headers: { 'Content-Type': 'application/json' } });
}

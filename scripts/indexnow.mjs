/**
 * Avisa a Bing (y a los demás buscadores de IndexNow: Yandex, Seznam, Naver…) de las páginas nuevas de Heroteca.
 *
 * Lee el mapa del sitio publicado, lo compara con la lista de la vez anterior (archivo que guarda la tarea de GitHub
 * entre ejecuciones) y envía las direcciones nuevas y las que tienen otra fecha de modificación (<lastmod>), más las
 * páginas que cambian cada día (portada, Noticias y Próximamente). La primera vez, sin lista anterior, envía todas.
 *
 * Uso: node scripts/indexnow.mjs [archivo-lista-anterior] [--prueba]
 *   --prueba: muestra qué enviaría, sin enviar nada.
 *
 * La clave es pública a propósito: IndexNow comprueba que el archivo public/<clave>.txt está en la web.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SITIO = 'https://heroteca.vercel.app';
const CLAVE = '6b6c45e94d442eb6926b1ec2264b97b4';
const SIEMPRE = ['/', '/noticias/', '/proximamente/', '/en/', '/en/news/', '/en/coming-soon/'];
const MAXIMO = 10000; // límite de IndexNow por envío

const args = process.argv.slice(2);
const prueba = args.includes('--prueba');
const archivo = args.find((a) => !a.startsWith('--')) ?? 'indexnow-urls.txt';

const texto = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} respondió ${r.status}`);
  return r.text();
};
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
/** Cada dirección con su fecha de modificación: «https://… 2026-11-27» (sin fecha si el mapa no la trae). */
const conFecha = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => `${m[1].trim()} ${m[2] ?? ''}`.trim());
const sinFecha = (linea) => linea.split(' ')[0];

// 1. Comprobar que el archivo de la clave está publicado (si no, IndexNow rechazaría el envío)
if (!prueba && (await texto(`${SITIO}/${CLAVE}.txt`)).trim() !== CLAVE) throw new Error('El archivo de la clave no coincide');

// 2. Todas las direcciones del mapa del sitio
const lineas = [];
for (const mapa of locs(await texto(`${SITIO}/sitemap-index.xml`))) lineas.push(...conFecha(await texto(mapa)));
const urls = lineas.map(sinFecha);
if (!urls.length) throw new Error('El mapa del sitio está vacío');

// 3. Nuevas o modificadas desde la última vez (otra fecha en el mapa), más las que cambian cada día
const anteriores = existsSync(archivo) ? new Set(readFileSync(archivo, 'utf8').split('\n').filter(Boolean)) : null;
const fijas = SIEMPRE.map((p) => SITIO + p).filter((u) => urls.includes(u));
const nuevas = anteriores ? lineas.filter((l) => !anteriores.has(l)).map(sinFecha) : urls;
const enviar = [...new Set([...nuevas, ...fijas])].slice(0, MAXIMO);
console.log(`${urls.length} páginas en el mapa; ${anteriores ? `${nuevas.length} nuevas o modificadas` : 'primera vez: se envían todas'}; se envían ${enviar.length}.`);
nuevas.slice(0, 20).forEach((u) => console.log('  +', u));

if (prueba) process.exit(0);

// 4. Enviar
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITIO).host, key: CLAVE, keyLocation: `${SITIO}/${CLAVE}.txt`, urlList: enviar }),
});
console.log(`IndexNow respondió ${r.status} ${r.statusText}`);
if (r.status !== 200 && r.status !== 202) {
  console.log(await r.text());
  process.exit(1);
}

// 5. Guardar la lista para la próxima vez (solo si el envío fue bien)
writeFileSync(archivo, lineas.join('\n') + '\n');

/**
 * Fecha de publicación de cada tráiler de YouTube que usa la web (datos/trailers-fechas.json).
 *
 * Google solo acepta los datos de vídeo (VideoObject) con fecha de subida, y los archivos de datos guardan solo la
 * clave de YouTube. Este script busca la fecha («published_at») en las respuestas de TMDB guardadas en cache/tmdb/
 * (las de sincronizar_tmdb.py y sincronizar_proximamente.py) y la añade al archivo, que se sube al repositorio.
 * No pide nada a TMDB: ejecútalo después de sincronizar. Las fechas ya guardadas se conservan.
 *
 * Uso: node scripts/fechas_trailers.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const salida = new URL('datos/trailers-fechas.json', raiz);
/** @type {Record<string, string>} */
const fechas = existsSync(salida) ? JSON.parse(readFileSync(salida, 'utf8')) : {};

// 1. Claves de tráiler que usa la web
const claves = new Set();
const recoger = (valor) => {
  if (Array.isArray(valor)) valor.forEach(recoger);
  else if (valor && typeof valor === 'object')
    for (const [k, v] of Object.entries(valor)) {
      if (k === 'trailer' && typeof v === 'string') claves.add(v);
      else recoger(v);
    }
};
const carpetaDatos = new URL('datos/tmdb/', raiz);
for (const n of readdirSync(carpetaDatos)) if (n.endsWith('.json')) recoger(JSON.parse(readFileSync(new URL(n, carpetaDatos), 'utf8')));
recoger(JSON.parse(readFileSync(new URL('datos/proximamente.json', raiz), 'utf8')));

// 2. Fechas en la caché de TMDB (vídeos sueltos o dentro de «videos»)
const faltan = [...claves].filter((c) => !fechas[c]);
const cache = new URL('cache/tmdb/', raiz);
if (faltan.length && existsSync(cache)) {
  const buscadas = new Set(faltan);
  for (const n of readdirSync(cache)) {
    const texto = readFileSync(new URL(n, cache), 'utf8');
    if (!faltan.some((c) => texto.includes(c))) continue;
    const mirar = (valor) => {
      if (Array.isArray(valor)) valor.forEach(mirar);
      else if (valor && typeof valor === 'object') {
        if (typeof valor.key === 'string' && buscadas.has(valor.key) && valor.published_at) fechas[valor.key] ??= valor.published_at.slice(0, 10);
        Object.values(valor).forEach(mirar);
      }
    };
    mirar(JSON.parse(texto));
  }
}

const sinFecha = [...claves].filter((c) => !fechas[c]).length;
const ordenadas = Object.fromEntries(Object.entries(fechas).filter(([c]) => claves.has(c)).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(salida, JSON.stringify(ordenadas, null, 1) + '\n');
console.log(`${claves.size} tráileres; ${claves.size - sinFecha} con fecha${sinFecha ? `, ${sinFecha} sin ella (no se publican sus datos de vídeo)` : ''}.`);

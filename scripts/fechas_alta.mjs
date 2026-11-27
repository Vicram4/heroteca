/**
 * Fecha en que se añadió cada ficha a la web (datos/fichas-alta.json), para la etiqueta «Nuevo en Heroteca».
 *
 * Sale del historial de git: el primer commit que creó contenido/titulos/<universo>/<id>/index.md. Las fichas que aún
 * no están en ningún commit llevan la fecha de hoy. Vercel compila con un historial incompleto, por eso la fecha se
 * guarda en un archivo y no se calcula al compilar. La tarea diaria de IndexNow lo ejecuta y sube el archivo.
 *
 * Uso: node scripts/fechas_alta.mjs
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, writeFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const salida = new URL('datos/fichas-alta.json', raiz);
// Altas y renombrados (una ficha renombrada conserva la fecha de su primera alta)
const log = execFileSync('git', ['log', '--diff-filter=AR', '-M', '--name-status', '--format=@%as', '--', 'contenido/titulos/*/*/index.md'], {
  cwd: raiz,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const ficha = (ruta) => ruta?.match(/^contenido\/titulos\/([^/]+\/[^/]+)\/index\.md$/)?.[1];
/** @type {[string, string[]][]} */
const movimientos = [];
let fecha = '';
for (const linea of log.split('\n')) {
  if (linea.startsWith('@')) fecha = linea.slice(1);
  else if (linea.trim()) movimientos.push([fecha, linea.trim().split('\t')]);
}
/** @type {Record<string, string>} */
const alta = {};
// El log va del más reciente al más antiguo: se recorre al revés, en orden cronológico
for (const [f, [estado, a, b]] of movimientos.reverse()) {
  if (estado === 'A' && ficha(a)) alta[ficha(a)] ??= f;
  else if (estado.startsWith('R') && ficha(b)) alta[ficha(b)] ??= (ficha(a) && alta[ficha(a)]) || f;
}
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const carpeta = new URL('contenido/titulos/', raiz);
/** @type {Record<string, string>} */
const resultado = {};
for (const u of readdirSync(carpeta)) {
  for (const id of readdirSync(new URL(`${u}/`, carpeta))) {
    if (!existsSync(new URL(`${u}/${id}/index.md`, carpeta))) continue;
    resultado[`${u}/${id}`] = alta[`${u}/${id}`] ?? hoy;
  }
}
const ordenado = Object.fromEntries(Object.entries(resultado).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(salida, JSON.stringify(ordenado, null, 1) + '\n');
console.log(`${Object.keys(ordenado).length} fichas con fecha de alta.`);

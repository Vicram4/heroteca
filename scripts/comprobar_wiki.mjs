/**
 * Comprueba que los textos de la Wiki no copian frases de Wikipedia.
 *   node scripts/comprobar_wiki.mjs            → todos los textos
 *   node scripts/comprobar_wiki.mjs thor vengadores → solo esos
 *
 * Compara cada texto con el artículo de su idioma: el de `fuentes` si lo hay; si no, el primer resultado de buscar el
 * nombre. Avisa de cada secuencia de 7 palabras seguidas que coincida y termina con error si encuentra alguna. Una
 * coincidencia puede ser inocente (un título largo, por ejemplo): hay que leerla y reescribir la frase si es copia.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const N_PALABRAS = 7;
const CABECERAS = { 'User-Agent': 'HerotecaWikiCheck/1.0 (https://heroteca.vercel.app)' };

function archivos(carpeta) {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(path.join(carpeta, e.name)) : e.name.endsWith('.md') ? [path.join(carpeta, e.name)] : [],
  );
}

/** Lee lo poco que hace falta de la cabecera sin depender de un lector de YAML. */
function leer(archivo) {
  const crudo = readFileSync(archivo, 'utf8').replace(/\r\n/g, '\n');
  const m = crudo.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const cabecera = m ? m[1] : '';
  const campo = (k) => cabecera.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '');
  const urls = [...cabecera.matchAll(/https:\/\/(es|en)\.wikipedia\.org\/wiki\/([^\s'"]+)/g)].map((u) => ({ idioma: u[1], titulo: decodeURIComponent(u[2]) }));
  return { nombre: campo('nombre'), nombreEn: campo('nombreEn'), urls, cuerpo: m ? m[2] : crudo };
}

const palabras = (texto) =>
  texto
    .replace(/\]\([^)]*\)/g, ' ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

const cache = new Map();
async function articulo(idioma, titulo, buscar) {
  const clave = `${idioma}:${titulo}`;
  if (cache.has(clave)) return cache.get(clave);
  const seleccion = buscar ? `generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(titulo)}` : `redirects=1&titles=${encodeURIComponent(titulo)}`;
  const url = `https://${idioma}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&${seleccion}`;
  const datos = await (await fetch(url, { headers: CABECERAS })).json();
  const pagina = Object.values(datos.query?.pages ?? {})[0];
  const resultado = pagina?.extract ? { titulo: pagina.title, texto: pagina.extract } : undefined;
  cache.set(clave, resultado);
  return resultado;
}

async function comparar(id, idioma, cuerpo, ref) {
  const art = await articulo(idioma, ref.titulo, ref.buscar);
  if (!art) {
    console.log(`? ${id} (${idioma}): sin artículo para «${ref.titulo}»`);
    return 0;
  }
  const seq = palabras(art.texto);
  const conocidas = new Set();
  for (let i = 0; i + N_PALABRAS <= seq.length; i++) conocidas.add(seq.slice(i, i + N_PALABRAS).join(' '));
  const suyas = palabras(cuerpo);
  const coincidencias = [];
  for (let i = 0; i + N_PALABRAS <= suyas.length; i++) {
    const trozo = suyas.slice(i, i + N_PALABRAS).join(' ');
    if (conocidas.has(trozo)) coincidencias.push(trozo);
  }
  if (coincidencias.length) {
    console.log(`✗ ${id} (${idioma}) frente a «${art.titulo}»:`);
    coincidencias.forEach((c) => console.log(`    ${c}`));
  } else console.log(`✓ ${id} (${idioma}) frente a «${art.titulo}»`);
  return coincidencias.length;
}

const pedidos = new Set(process.argv.slice(2));
let total = 0;
let revisados = 0;
for (const [carpeta, raiz] of [['personajes', 'contenido/personajes'], ['wiki', 'contenido/wiki']]) {
  for (const archivo of archivos(raiz)) {
    const id = path.basename(archivo, '.md') === 'index' ? path.basename(path.dirname(archivo)) : path.basename(archivo, '.md');
    if (pedidos.size && !pedidos.has(id)) continue;
    const es = leer(archivo);
    if (!es.cuerpo.trim()) continue;
    revisados++;
    const referencia = (idioma, nombre) => {
      const u = es.urls.find((x) => x.idioma === idioma);
      return u ? { titulo: u.titulo, buscar: false } : { titulo: nombre, buscar: true };
    };
    total += await comparar(id, 'es', es.cuerpo, referencia('es', es.nombre));
    const archivoEn = path.join('contenido/en', carpeta, path.basename(path.dirname(archivo)), path.basename(archivo));
    if (existsSync(archivoEn)) total += await comparar(id, 'en', leer(archivoEn).cuerpo, referencia('en', es.nombreEn ?? es.nombre));
  }
}
console.log(`\n${revisados} textos revisados, ${total} coincidencias de ${N_PALABRAS} palabras.`);
process.exit(total ? 1 : 0);

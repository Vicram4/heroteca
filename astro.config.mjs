// @ts-check
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site.ts';
import { spoilers } from './src/lib/markdown-spoilers.mjs';

/**
 * Versión inglesa: en las páginas de dist/en/, los enlaces internos pasan a su dirección inglesa
 * («/marvel/umc/» → «/en/marvel/mcu/», «/marvel/capitan-america-el-primer-vengador/» → «/en/marvel/captain-america-the-first-avenger/»).
 * Las equivalencias las genera src/pages/rutas-en.json.ts a partir de los datos; el archivo se borra al terminar.
 * Así en el código los enlaces se escriben siempre en español. No se tocan los archivos (/_astro/…, /tmdb.svg…),
 * las direcciones completas (https://…) ni lo que ya empieza por /en/.
 */
function enlacesEnIngles() {
  return {
    name: 'heroteca-enlaces-ingles',
    hooks: {
      /** @param {{ dir: URL }} opciones */
      'astro:build:done': async ({ dir }) => {
        const raizDist = fileURLToPath(dir);
        const archivoTabla = path.join(raizDist, 'rutas-en.json');
        /** @type {Record<string, string>} */
        const tabla = JSON.parse(await readFile(archivoTabla, 'utf8').catch(() => '{}'));
        /** @param {string} destino */
        const traducir = (destino) => {
          const [ruta, resto = ''] = destino.split(/(?=[?#])/);
          return (tabla[`/${ruta}`] ?? `/en/${ruta}`) + resto;
        };
        /** @param {string} carpeta */
        const recorrer = async (carpeta) => {
          for (const e of await readdir(carpeta, { withFileTypes: true })) {
            const ruta = path.join(carpeta, e.name);
            if (e.isDirectory()) await recorrer(ruta);
            else if (e.name.endsWith('.html')) {
              const html = await readFile(ruta, 'utf8');
              const nuevo = html
                .replace(/href="\/(?!\/|en\/|en"|_astro\/)([^"]*)"/g, (todo, destino) =>
                  /\.[a-z0-9]+$/i.test(destino.split(/[?#]/)[0].split('/').pop() ?? '') ? todo : `href="${traducir(destino)}"`,
                )
                // Los avisos de los spoilers del Markdown se escriben en español (src/lib/markdown-spoilers.mjs)
                .replaceAll('title="Spoiler: pulsa para mostrar"', 'title="Spoiler: select to reveal"')
                .replaceAll('Spoiler oculto. ', 'Hidden spoiler. ');
              if (nuevo !== html) await writeFile(ruta, nuevo);
            }
          }
        };
        await recorrer(path.join(raizDist, 'en')).catch(() => {});
        await unlink(archivoTabla).catch(() => {});
      },
    },
  };
}


/**
 * Fecha de última modificación (<lastmod>) en el mapa del sitio, para que los buscadores vuelvan antes a lo que cambia.
 * Se compara el contenido principal (<main>) de cada página con el de datos/fechas-paginas.json: si es igual se mantiene
 * la fecha guardada, y si cambia (o la página es nueva) pasa a ser la de hoy. El archivo se actualiza en cada compilación
 * y la tarea diaria de IndexNow lo sube al repositorio (así una página no «cambia» cada vez que Vercel compila).
 */
function fechasEnElMapa() {
  return {
    name: 'heroteca-fechas-mapa',
    hooks: {
      /** @param {{ dir: URL }} opciones */
      'astro:build:done': async ({ dir }) => {
        const raizDist = fileURLToPath(dir);
        const archivo = new URL('./datos/fechas-paginas.json', import.meta.url);
        /** @type {Record<string, { h: string, f: string }>} */
        const anteriores = JSON.parse(await readFile(archivo, 'utf8').catch(() => '{}'));
        const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
        /** @type {Record<string, { h: string, f: string }>} */
        const fechas = {};
        const mapas = (await readdir(raizDist)).filter((n) => /^sitemap-\d+\.xml$/.test(n));
        for (const mapa of mapas) {
          const rutaMapa = path.join(raizDist, mapa);
          const xml = await readFile(rutaMapa, 'utf8');
          const nuevo = await reemplazarAsync(xml, /<loc>([^<]+)<\/loc>/g, async (/** @type {string} */ todo, /** @type {string} */ loc) => {
            const ruta = new URL(loc).pathname;
            const html = await readFile(path.join(raizDist, ruta, ruta.endsWith('/') ? 'index.html' : ''), 'utf8').catch(() => '');
            const principal = html.match(/<main[\s\S]*<\/main>/)?.[0];
            if (!principal) return todo;
            const h = createHash('sha1').update(principal).digest('hex').slice(0, 16);
            const f = anteriores[ruta]?.h === h ? anteriores[ruta].f : hoy;
            fechas[ruta] = { h, f };
            return `${todo}<lastmod>${f}</lastmod>`;
          });
          await writeFile(rutaMapa, nuevo);
        }
        const ordenadas = Object.fromEntries(Object.entries(fechas).sort(([a], [b]) => a.localeCompare(b)));
        await writeFile(archivo, JSON.stringify(ordenadas, null, 0).replace(/},"/g, '},\n"') + '\n');
      },
    },
  };
}

/**
 * String.replace con una función asíncrona.
 * @param {string} texto
 * @param {RegExp} re
 * @param {(...grupos: string[]) => Promise<string>} fn
 */
async function reemplazarAsync(texto, re, fn) {
  const partes = await Promise.all([...texto.matchAll(re)].map((m) => fn(...m)));
  let i = 0;
  return texto.replace(re, () => partes[i++]);
}

// https://astro.build/config
/** Páginas de estrenos que no se indexan (ver src/lib/proximamente.ts): redirigen a su ficha o no tienen sinopsis. */
const estrenosSinIndexar = (() => {
  const { estrenos, archivo = [] } = JSON.parse(readFileSync(new URL('./datos/proximamente.json', import.meta.url), 'utf8'));
  return new Set(
    [...estrenos, ...archivo].flatMap((e) => [
      ...(e.ficha || !e.es.sinopsis ? [`/proximamente/${e.ruta?.es}/`] : []),
      ...(e.ficha || !e.en.sinopsis ? [`/en/coming-soon/${e.ruta?.en}/`] : []),
    ]),
  );
})();

export default defineConfig({
  site: SITE.url,
  integrations: [
    // Mapa del sitio para buscadores (sitemap-index.xml): sin la página de error, las cuentas atrás para insertar en otras webs ni «Mi progreso» (personal, se rellena
    // en el navegador) y, hasta publicarla, sin la versión inglesa.
    // La correspondencia entre idiomas la indican las etiquetas hreflang de cada página.
    sitemap({
      filter: (pagina) => !estrenosSinIndexar.has(new URL(pagina).pathname) && !/^\/(en\/embed|insertar)\//.test(new URL(pagina).pathname) && !/\/(404|mi-progreso|my-progress|mi-ano|my-year)(\/|\.html|$)/.test(new URL(pagina).pathname) && (SITE.inglesPublicado || !new URL(pagina).pathname.startsWith('/en/')),
    }),
    enlacesEnIngles(),
    fechasEnElMapa(),
  ],
  markdown: {
    // ||texto|| en las fichas → spoiler oculto
    processor: satteri({ mdastPlugins: [spoilers] }),
  },
});

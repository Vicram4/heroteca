// @ts-check
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
              const nuevo = html.replace(/href="\/(?!\/|en\/|en"|_astro\/)([^"]*)"/g, (todo, destino) =>
                /\.[a-z0-9]+$/i.test(destino.split(/[?#]/)[0].split('/').pop() ?? '') ? todo : `href="${traducir(destino)}"`,
              );
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

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  integrations: [
    // Mapa del sitio para buscadores (sitemap-index.xml): sin la página de error ni «Mi progreso» (personal, se rellena
    // en el navegador) y, hasta publicarla, sin la versión inglesa.
    // La correspondencia entre idiomas la indican las etiquetas hreflang de cada página.
    sitemap({
      filter: (pagina) => !/\/(404|mi-progreso|my-progress)(\/|\.html|$)/.test(new URL(pagina).pathname) && (SITE.inglesPublicado || !new URL(pagina).pathname.startsWith('/en/')),
    }),
    enlacesEnIngles(),
  ],
  markdown: {
    // ||texto|| en las fichas → spoiler oculto
    processor: satteri({ mdastPlugins: [spoilers] }),
  },
});

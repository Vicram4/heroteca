// @ts-check
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site.ts';
import { spoilers } from './src/lib/markdown-spoilers.mjs';

/**
 * Versión inglesa: en las páginas de dist/en/, los enlaces internos («/marvel/umc/») pasan a «/en/marvel/umc/».
 * Así en el código los enlaces se escriben siempre sin prefijo de idioma. No se tocan los archivos
 * (/_astro/…, /tmdb.svg…), las direcciones completas (https://…) ni lo que ya empieza por /en/.
 */
function enlacesEnIngles() {
  return {
    name: 'heroteca-enlaces-ingles',
    hooks: {
      /** @param {{ dir: URL }} opciones */
      'astro:build:done': async ({ dir }) => {
        const raiz = path.join(fileURLToPath(dir), 'en');
        /** @param {string} carpeta */
        const recorrer = async (carpeta) => {
          for (const e of await readdir(carpeta, { withFileTypes: true })) {
            const ruta = path.join(carpeta, e.name);
            if (e.isDirectory()) await recorrer(ruta);
            else if (e.name.endsWith('.html')) {
              const html = await readFile(ruta, 'utf8');
              const nuevo = html.replace(/href="\/(?!\/|en\/|en"|_astro\/)([^"]*)"/g, (todo, destino) =>
                /\.[a-z0-9]+$/i.test(destino.split(/[?#]/)[0].split('/').pop() ?? '') ? todo : `href="/en/${destino}"`,
              );
              if (nuevo !== html) await writeFile(ruta, nuevo);
            }
          }
        };
        await recorrer(raiz).catch(() => {});
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  integrations: [
    // Mapa del sitio para buscadores (sitemap-index.xml): sin la página de error y, hasta publicarla, sin la versión inglesa
    sitemap({
      filter: (pagina) => !pagina.includes('/404') && (SITE.inglesPublicado || !new URL(pagina).pathname.startsWith('/en/')),
      i18n: SITE.inglesPublicado ? { defaultLocale: 'es', locales: { es: 'es-ES', en: 'en-US' } } : undefined,
    }),
    enlacesEnIngles(),
  ],
  markdown: {
    // ||texto|| en las fichas → spoiler oculto
    processor: satteri({ mdastPlugins: [spoilers] }),
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site.ts';
import { spoilers } from './src/lib/markdown-spoilers.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  // Mapa del sitio para buscadores (sitemap-index.xml); la página de error no entra
  integrations: [sitemap({ filter: (pagina) => !pagina.includes('/404') })],
  markdown: {
    // ||texto|| en las fichas → spoiler oculto
    processor: satteri({ mdastPlugins: [spoilers] }),
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { SITE } from './src/config/site.ts';
import { spoilers } from './src/lib/markdown-spoilers.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  markdown: {
    // ||texto|| en las fichas → spoiler oculto
    processor: satteri({ mdastPlugins: [spoilers] }),
  },
});

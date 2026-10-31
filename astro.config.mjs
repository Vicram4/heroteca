// @ts-check
import { defineConfig } from 'astro/config';
import { SITE } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
});

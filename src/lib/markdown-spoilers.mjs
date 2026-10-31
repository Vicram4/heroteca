/**
 * Spoilers en el texto libre de las fichas: escribe ||texto oculto|| en Markdown
 * y se mostrará difuminado hasta que se pulse (ver el script en Base.astro).
 * Plugin para Sätteri, el procesador de Markdown de Astro 7.
 */
import { defineMdastPlugin } from 'satteri';

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PATRON = /\|\|(.+?)\|\|/g;

/** @type {any} Sätteri no tipa bien los visitantes escritos en JavaScript */
export const spoilers = defineMdastPlugin({
  name: 'heroteca-spoilers',
  text(node, ctx) {
    if (!node.value.includes('||')) return;
    const partes = [];
    let ultimo = 0;
    for (const m of node.value.matchAll(PATRON)) {
      if (m.index > ultimo) partes.push({ type: 'text', value: node.value.slice(ultimo, m.index) });
      partes.push({
        type: 'html',
        value: `<span class="spoiler-linea" role="button" tabindex="0" aria-pressed="false" title="Spoiler: pulsa para mostrar"><span class="solo-lectores">Spoiler oculto. </span><span class="sl-texto">${escapar(m[1])}</span></span>`,
      });
      ultimo = m.index + m[0].length;
    }
    if (!partes.length) return;
    if (ultimo < node.value.length) partes.push({ type: 'text', value: node.value.slice(ultimo) });
    ctx.replaceNode(node, partes);
  },
});

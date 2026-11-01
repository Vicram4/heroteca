/**
 * «Mi progreso»: los títulos que has marcado como vistos. Solo para el navegador.
 *
 * - Se guardan en localStorage (este navegador y este dispositivo), sin cuentas ni servidor.
 * - Se identifican por el id de la ficha (el mismo en español y en inglés).
 * - Cualquier elemento con data-titulo="<id>" recibe data-visto si está visto (cajas de las estanterías,
 *   filas de las guías…), y los botones [data-alternar-visto="<id>"] marcan y desmarcan.
 * - Los contadores [data-progreso] (con data-ids="id1 id2 …") muestran cuántos llevas.
 * Al cambiar algo se lanza el evento «heroteca:vistos» en window (también si cambia en otra pestaña).
 */
const CLAVE = 'heroteca:vistos';
export const EVENTO = 'heroteca:vistos';

export function leerVistos(): Set<string> {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return new Set(Array.isArray(datos) ? datos.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function guardarVistos(vistos: Set<string>) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...vistos].sort()));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export function alternarVisto(id: string) {
  const vistos = leerVistos();
  if (vistos.has(id)) vistos.delete(id);
  else vistos.add(id);
  guardarVistos(vistos);
  return vistos.has(id);
}

/** Pone al día la página: marcas, botones y contadores. */
export function marcarPagina() {
  const vistos = leerVistos();
  document.querySelectorAll<HTMLElement>('[data-titulo]').forEach((el) => el.toggleAttribute('data-visto', vistos.has(el.dataset.titulo ?? '')));
  document.querySelectorAll<HTMLButtonElement>('[data-alternar-visto]').forEach((b) => b.setAttribute('aria-pressed', String(vistos.has(b.dataset.alternarVisto ?? ''))));
  document.querySelectorAll<HTMLElement>('[data-progreso]').forEach((p) => {
    const ids = (p.dataset.ids ?? '').split(' ').filter(Boolean);
    const hechos = ids.filter((id) => vistos.has(id)).length;
    const porcentaje = ids.length ? Math.round((hechos / ids.length) * 100) : 0;
    const texto = p.querySelector<HTMLElement>('[data-progreso-texto]');
    if (texto) texto.textContent = (p.dataset.plantilla ?? '{n}/{total}').replace('{n}', String(hechos)).replace('{total}', String(ids.length)).replace('{pc}', String(porcentaje));
    p.style.setProperty('--progreso', `${porcentaje}%`);
    p.toggleAttribute('data-empezado', hechos > 0);
    p.toggleAttribute('data-completo', ids.length > 0 && hechos === ids.length);
  });
}

/** Se llama una vez por página (desde Base.astro). */
export function iniciarVistos() {
  marcarPagina();
  document.addEventListener('click', (e) => {
    const boton = (e.target as Element).closest<HTMLButtonElement>('[data-alternar-visto]');
    if (boton?.dataset.alternarVisto) alternarVisto(boton.dataset.alternarVisto);
  });
  window.addEventListener(EVENTO, marcarPagina);
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) window.dispatchEvent(new CustomEvent(EVENTO));
  });
}

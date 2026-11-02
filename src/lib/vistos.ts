/**
 * «Mi progreso»: los títulos que has marcado como vistos. Solo para el navegador.
 *
 * - Se guardan en localStorage (este navegador y este dispositivo), sin cuentas ni servidor.
 * - Se identifican por el id de la ficha (el mismo en español y en inglés).
 * - El día en que se marca cada uno va en otra clave (heroteca:vistos-fechas), como { id: 'AAAA-MM-DD' }: la lista de
 *   ids sigue siendo la fuente de verdad y lo marcado antes de existir las fechas simplemente no tiene (no se inventa).
 * - Cualquier elemento con data-titulo="<id>" recibe data-visto si está visto (cajas de las estanterías,
 *   filas de las guías…), y los botones [data-alternar-visto="<id>"] marcan y desmarcan.
 * - Los contadores [data-progreso] (con data-ids="id1 id2 …") muestran cuántos llevas.
 * Al cambiar algo se lanza el evento «heroteca:vistos» en window (también si cambia en otra pestaña).
 */
const CLAVE = 'heroteca:vistos';
const CLAVE_FECHAS = 'heroteca:vistos-fechas';
export const EVENTO = 'heroteca:vistos';

export function leerVistos(): Set<string> {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return new Set(Array.isArray(datos) ? datos.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Convierte lo leído de localStorage o de una copia en id → día, descartando lo que no tenga forma de fecha. */
function normalizarFechas(datos: unknown): Map<string, string> {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return new Map();
  return new Map(Object.entries(datos).filter((e): e is [string, string] => typeof e[1] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e[1])));
}

export function leerFechas(): Map<string, string> {
  try {
    return normalizarFechas(JSON.parse(localStorage.getItem(CLAVE_FECHAS) ?? '{}'));
  } catch {
    return new Map();
  }
}

/** Guarda la lista y las fechas; las de títulos que ya no están en la lista se descartan. */
export function guardarVistos(vistos: Set<string>, fechas = leerFechas()) {
  const vigentes = [...fechas].filter(([id]) => vistos.has(id)).sort(([a], [b]) => (a < b ? -1 : 1));
  try {
    localStorage.setItem(CLAVE_FECHAS, JSON.stringify(Object.fromEntries(vigentes)));
    // La última, porque es la que avisa a las otras pestañas (evento «storage»)
    localStorage.setItem(CLAVE, JSON.stringify([...vistos].sort()));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export function alternarVisto(id: string) {
  const vistos = leerVistos();
  const fechas = leerFechas();
  if (vistos.has(id)) vistos.delete(id);
  else {
    vistos.add(id);
    fechas.set(id, hoy());
  }
  guardarVistos(vistos, fechas);
  return vistos.has(id);
}

/** El día de hoy en la hora local de quien marca (toISOString daría el de UTC, y en Nochevieja el año equivocado). */
function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Datos de la copia de seguridad. Los lectores de la versión 1 solo miran «vistos», que no cambia. */
export function copiaDeVistos() {
  return { app: 'heroteca', version: 2, fecha: new Date().toISOString(), vistos: [...leerVistos()].sort(), fechas: Object.fromEntries(leerFechas()) };
}

/**
 * Suma una copia (una lista suelta o un archivo de las versiones 1 y 2) a lo que ya hubiera y devuelve el total.
 * Si un título tiene fecha en los dos lados, se queda la más antigua: es cuando se vio de verdad.
 * Lanza un error si el archivo no es una copia de Heroteca.
 */
export function importarVistos(datos: any) {
  const lista = Array.isArray(datos) ? datos : datos?.app === 'heroteca' ? datos.vistos : null;
  if (!Array.isArray(lista)) throw new Error('No es una copia de Heroteca');
  const vistos = leerVistos();
  const fechas = leerFechas();
  lista.filter((x: unknown) => typeof x === 'string').forEach((x: string) => vistos.add(x));
  for (const [id, dia] of normalizarFechas(datos?.fechas)) {
    const actual = fechas.get(id);
    if (!actual || dia < actual) fechas.set(id, dia);
  }
  guardarVistos(vistos, fechas);
  return vistos.size;
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

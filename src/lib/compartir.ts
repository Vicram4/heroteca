/**
 * Compartir el resultado de un pasatiempo (código de navegador).
 * En móvil abre el menú de compartir del sistema (WhatsApp, Telegram…); si no lo hay, o en ordenador, copia el texto.
 * Devuelve 'copiado' si lo copió (para mostrar el aviso), 'compartido' si se abrió el menú, o null si no se pudo.
 */
export async function compartirResultado(texto: string): Promise<'copiado' | 'compartido' | null> {
  const movil = matchMedia('(pointer: coarse)').matches;
  if (movil && navigator.share) {
    try {
      await navigator.share({ text: texto });
      return 'compartido';
    } catch (e) {
      // Cancelado por la persona: no hacer nada más
      if ((e as DOMException).name === 'AbortError') return null;
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return null;
  }
}

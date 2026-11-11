/**
 * Datos de los próximos estrenos que no da TMDB y que se escriben a mano, sobre todo el día del estreno.
 * La página de Próximamente de cada película los muestra en «Preguntas rápidas».
 *
 * Clave: id de TMDB de la película (el mismo de datos/proximamente.json → tmdb.id).
 *
 * postCreditos:
 *  - Sin escribir: antes del estreno la página dice que se sabrá ese día; después, que aún no hay datos confirmados.
 *  - escenas: 0 → «No tiene escenas poscréditos».
 *  - escenas: n → «Sí: n escenas», y cada texto de es/en se muestra oculto tras un aviso de spoiler (uno por escena).
 *
 * Ejemplo para el día del estreno:
 *   1003596: { postCreditos: { escenas: 2, es: ['Una escena a mitad de créditos…', 'Al final…'], en: ['…', '…'] } },
 */
export interface ExtraEstreno {
  postCreditos?: { escenas: number; es?: string[]; en?: string[] };
}

export const EXTRAS_ESTRENOS: Record<number, ExtraEstreno> = {
  // Vengadores: Doomsday (en cines el 18 de diciembre de 2026, según TMDB a 11 de noviembre)
  1003596: {},
};

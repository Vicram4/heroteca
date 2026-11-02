/**
 * Pasatiempos (/pasatiempos/): cada juego tiene su página /pasatiempos/<id>/ (en inglés /en/games/<idEn>/).
 * Los textos están en el apartado `juegos` de src/i18n/textos.ts. El orden de la lista es el de la web
 * (la portada muestra los cuatro primeros).
 */
import type { Textos } from '../i18n/textos';

export const JUEGOS = [
  { id: 'heroedle', idEn: 'heroedle', clave: 'heroedle', icono: 'H' },
  { id: 'adivina-el-personaje', idEn: 'guess-the-character', clave: 'adivina', icono: '?' },
  { id: 'cartel-pixelado', idEn: 'pixelated-poster', clave: 'pixelado', icono: '▦' },
  { id: 'que-heroe-eres', idEn: 'which-hero-are-you', clave: 'quien', icono: '★' },
  { id: 'ordena-la-cronologia', idEn: 'sort-the-timeline', clave: 'ordena', icono: '↕' },
  { id: 'quien-lo-interpreto', idEn: 'who-played-them', clave: 'interpretes', icono: '◐' },
  { id: 'cual-fue-antes', idEn: 'which-came-first', clave: 'antes', icono: '⇄' },
  { id: 'duelo-de-notas', idEn: 'rating-duel', clave: 'duelo', icono: '≥' },
  { id: 'conecta-a-los-actores', idEn: 'connect-the-actors', clave: 'conecta', icono: '⇝' },
  { id: 'trivia-diaria', idEn: 'daily-trivia', clave: 'trivia', icono: '5' },
  { id: 'bingo-de-maraton', idEn: 'marathon-bingo', clave: 'bingo', icono: '▣' },
] as const;
export type Juego = (typeof JUEGOS)[number];

/** Nombre y descripción de un juego en el idioma de los textos. */
export function textoJuego(j: Textos['juegos'], clave: Juego['clave']) {
  const textos = {
    heroedle: [j.heroedle, j.heroedleTexto],
    adivina: [j.adivina, j.adivinaTexto],
    pixelado: [j.pixelado, j.pixeladoTexto],
    quien: [j.quien, j.quienTexto],
    ordena: [j.ordena, j.ordenaTexto],
    interpretes: [j.interpretes, j.interpretesTexto],
    antes: [j.antes, j.antesTexto],
    duelo: [j.duelo, j.dueloTexto],
    conecta: [j.conecta, j.conectaTexto],
    trivia: [j.trivia, j.triviaTexto],
    bingo: [j.bingo, j.bingoTexto],
  } as const;
  return { nombre: textos[clave][0], texto: textos[clave][1] };
}

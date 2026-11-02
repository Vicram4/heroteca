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
  } as const;
  return { nombre: textos[clave][0], texto: textos[clave][1] };
}

/** Ideas de pasatiempos para más adelante (se listan en /pasatiempos/). */
export const IDEAS = [
  { es: ['Conecta a los actores', 'Llega de un actor a otro en el menor número de saltos, a través de los títulos que comparten.'], en: ['Connect the actors', 'Get from one actor to another in as few steps as possible, through the titles they share.'] },
  { es: ['Trivia diaria', 'Cinco preguntas al día sobre duraciones, directores, años y escenas poscréditos.'], en: ['Daily trivia', 'Five questions a day about runtimes, directors, years and post-credits scenes.'] },
  { es: ['Bingo de maratón', 'Un cartón con momentos típicos (escena poscréditos, cameo, chiste en plena batalla) para ver una peli con amigos.'], en: ['Marathon bingo', 'A card with classic moments (post-credits scene, cameo, a joke mid-battle) to play while watching with friends.'] },
] as const;

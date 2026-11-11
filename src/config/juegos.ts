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

type TextoSeo = { titulo: string; descripcion: string; pasos: string[] };

/**
 * Textos para buscadores de cada juego: título de la pestaña, descripción y los pasos de «Cómo se juega»
 * (se muestran debajo del juego). Si cambian las reglas de un juego, hay que repasar sus pasos aquí.
 */
export const SEO_JUEGOS: Record<Juego['clave'], Record<'es' | 'en', TextoSeo>> = {
  heroedle: {
    es: {
      titulo: 'Heroedle: adivina el superhéroe del día (Marvel y DC)',
      descripcion: 'Juego diario tipo Wordle de superhéroes: adivina el personaje de Marvel o DC del día en 6 intentos, con pistas en cada uno. Gratis y sin registro.',
      pasos: [
        'Escribe un personaje de Marvel o DC y pulsa «Probar».',
        'Cada intento te dice si aciertas el universo y si el personaje del día apareció antes o después, en más o menos títulos y con más o menos intérpretes.',
        'Tienes 6 intentos. El personaje es el mismo para todo el mundo y cambia cada día.',
        'Al terminar puedes compartir tu resultado.',
      ],
    },
    en: {
      titulo: 'Heroedle: guess the daily superhero (Marvel and DC)',
      descripcion: 'A Wordle-style daily superhero game: guess the Marvel or DC character of the day in 6 tries, with clues on each one. Free, no sign-up.',
      pasos: [
        'Type a Marvel or DC character and press “Try”.',
        'Each try tells you whether the universe matches and whether the character of the day first appeared earlier or later, in more or fewer titles and with more or fewer actors.',
        'You get 6 tries. The character is the same for everyone and changes every day.',
        'When you finish, you can share your result.',
      ],
    },
  },
  adivina: {
    es: {
      titulo: 'Adivina el personaje de Marvel y DC con pistas',
      descripcion: 'Juego de adivinar personajes de Marvel y DC: cinco personajes, pistas que se van desvelando y cuatro opciones. Cuantas menos pistas uses, más puntos.',
      pasos: [
        'Cada partida tiene 5 personajes.',
        'Empiezas con una pista y puedes pedir más (hasta 5): universo, primera aparición, un título, intérpretes e identidad.',
        'Elige entre cuatro opciones del mismo universo. Con una sola pista ganas 5 puntos; con cada pista más, uno menos.',
      ],
    },
    en: {
      titulo: 'Guess the Marvel and DC character from clues',
      descripcion: 'A Marvel and DC character guessing game: five characters, clues revealed one by one and four options. The fewer clues you use, the more points you get.',
      pasos: [
        'Each game has 5 characters.',
        'You start with one clue and can ask for more (up to 5): universe, first appearance, a title, actors and identity.',
        'Pick from four options from the same universe. One clue is worth 5 points; each extra clue takes one away.',
      ],
    },
  },
  pixelado: {
    es: {
      titulo: 'Cartel pixelado: adivina la película de superhéroes',
      descripcion: 'Adivina películas y series de Marvel y DC por su cartel pixelado. Cinco carteles por partida y cuatro opciones: cuanto menos lo aclares, más puntos.',
      pasos: [
        'Verás el cartel muy pixelado de un título de Marvel o DC.',
        'Pulsa «Más nítido» para verlo mejor, o arriésgate antes.',
        'Elige el título entre cuatro opciones: 5 puntos si aciertas a la primera, menos cuanto más lo aclares.',
        'La partida tiene 5 carteles.',
      ],
    },
    en: {
      titulo: 'Pixelated poster: guess the superhero movie',
      descripcion: 'Guess Marvel and DC movies and series from their pixelated posters. Five posters per game and four options: the less you sharpen it, the more points.',
      pasos: [
        'You see a heavily pixelated poster of a Marvel or DC title.',
        'Press “Sharpen” to see it better, or take a guess straight away.',
        'Pick the title from four options: 5 points if you get it at first sight, fewer the more you sharpen it.',
        'Each game has 5 posters.',
      ],
    },
  },
  quien: {
    es: {
      titulo: '¿Qué héroe de Marvel o DC eres? Test',
      descripcion: 'Test de seis preguntas sobre ti para descubrir con qué héroe de Marvel o DC tienes más en común. Gratis, sin registro y con resultado para compartir.',
      pasos: ['Responde seis preguntas sobre tu forma de ser.', 'Cada respuesta suma puntos a varios héroes.', 'Al final verás con cuál tienes más en común y podrás compartirlo.'],
    },
    en: {
      titulo: 'Which Marvel or DC hero are you? Quiz',
      descripcion: 'A six-question quiz about you to find out which Marvel or DC hero you have most in common with. Free, no sign-up, and a result you can share.',
      pasos: ['Answer six questions about yourself.', 'Each answer adds points to several heroes.', 'At the end you see which one you have most in common with and can share it.'],
    },
  },
  ordena: {
    es: {
      titulo: 'Ordena las películas del UMC (MCU) en orden cronológico',
      descripcion: 'Reto del Universo Cinematográfico de Marvel: coloca cinco películas en el orden en que transcurre su historia y comprueba cuántas posiciones aciertas.',
      pasos: [
        'Te tocan cinco películas del UMC al azar.',
        'Súbelas o bájalas hasta ponerlas en el orden en que pasa su historia, no en el de estreno.',
        'Pulsa «Comprobar» para ver cuántas posiciones aciertas y el orden correcto.',
      ],
    },
    en: {
      titulo: 'Put the MCU movies in chronological order',
      descripcion: 'A Marvel Cinematic Universe challenge: put five films in the order their stories take place and see how many positions you get right.',
      pasos: [
        'You get five random MCU films.',
        'Move them up or down until they are in the order their stories take place, not their release order.',
        'Press “Check” to see how many positions you got right and the correct order.',
      ],
    },
  },
  interpretes: {
    es: {
      titulo: '¿Quién lo interpretó? Actores de Marvel y DC',
      descripcion: 'Une cada personaje de Marvel y DC con el actor o la actriz que más veces lo ha interpretado. Un reto rápido de cuatro parejas.',
      pasos: ['Te salen cuatro personajes.', 'Elige para cada uno quién lo ha interpretado más veces.', 'Pulsa «Comprobar» para ver tus aciertos y juega otra ronda.'],
    },
    en: {
      titulo: 'Who played them? Marvel and DC actors',
      descripcion: 'Match each Marvel and DC character with the actor who has played them most often. A quick challenge with four pairs.',
      pasos: ['You get four characters.', 'For each one, choose who has played them most often.', 'Press “Check” to see your score, then play another round.'],
    },
  },
  antes: {
    es: {
      titulo: '¿Cuál se estrenó antes? Juego de Marvel y DC',
      descripcion: 'Dos películas o series de Marvel y DC: elige cuál se estrenó primero y encadena aciertos para batir tu récord.',
      pasos: ['Verás dos títulos con su cartel.', 'Elige el que se estrenó antes.', 'Cada acierto alarga tu racha y un fallo la termina. Tu mejor racha se guarda en tu navegador.'],
    },
    en: {
      titulo: 'Which came first? Marvel and DC game',
      descripcion: 'Two Marvel and DC movies or series: pick the one released first and chain correct answers to beat your record.',
      pasos: ['You see two titles with their posters.', 'Pick the one released first.', 'Each correct answer extends your streak and a miss ends it. Your best streak is saved in your browser.'],
    },
  },
  duelo: {
    es: {
      titulo: 'Duelo de notas: Marvel y DC según TMDB',
      descripcion: 'Dos títulos de Marvel y DC: adivina cuál tiene mejor nota de los usuarios de TMDB y encadena aciertos para batir tu récord.',
      pasos: ['Verás dos títulos con su cartel.', 'Elige el que tiene mejor nota en TMDB.', 'Cada acierto alarga tu racha y un fallo la termina. Tu mejor racha se guarda en tu navegador.'],
    },
    en: {
      titulo: 'Rating duel: Marvel and DC on TMDB',
      descripcion: 'Two Marvel and DC titles: guess which one has the higher TMDB user rating and chain correct answers to beat your record.',
      pasos: ['You see two titles with their posters.', 'Pick the one with the higher TMDB rating.', 'Each correct answer extends your streak and a miss ends it. Your best streak is saved in your browser.'],
    },
  },
  conecta: {
    es: {
      titulo: 'Conecta a los actores de Marvel y DC',
      descripcion: 'Un juego tipo «seis grados»: llega de un actor de Marvel o DC a otro saltando por las películas y series que comparten, en el menor número de saltos.',
      pasos: [
        'Te damos dos actores.',
        'Elige un título del primero y salta a otra persona de su reparto.',
        'Repite hasta llegar al segundo actor. Al final verás uno de los caminos más cortos.',
      ],
    },
    en: {
      titulo: 'Connect the Marvel and DC actors',
      descripcion: 'A “six degrees” game: get from one Marvel or DC actor to another by jumping through the movies and series they share, in as few steps as possible.',
      pasos: ['You get two actors.', 'Pick a title of the first one and jump to someone else in its cast.', 'Repeat until you reach the second actor. At the end you see one of the shortest paths.'],
    },
  },
  trivia: {
    es: {
      titulo: 'Trivia diaria de Marvel y DC: 5 preguntas al día',
      descripcion: 'Cinco preguntas nuevas cada día sobre películas de Marvel y DC: años de estreno, dirección, duración y escenas poscréditos.',
      pasos: [
        'Cada día hay cinco preguntas nuevas, las mismas para todo el mundo.',
        'Preguntan por el año de estreno, quién dirigió, cuánto dura y cuándo hay escenas poscréditos.',
        'Si juegas varios días seguidos, sumas racha.',
      ],
    },
    en: {
      titulo: 'Daily Marvel and DC trivia: 5 questions a day',
      descripcion: 'Five new questions every day about Marvel and DC movies: release years, directors, runtimes and post-credits scenes. The same for everyone.',
      pasos: [
        'Every day there are five new questions, the same for everyone.',
        'They ask about release years, directors, runtimes and post-credits scenes.',
        'Play several days in a row to build a streak.',
      ],
    },
  },
  bingo: {
    es: {
      titulo: 'Bingo de superhéroes para ver películas en grupo',
      descripcion: 'Cartón de bingo con momentos típicos del cine de superhéroes para jugar mientras veis una película de Marvel o DC. Un cartón distinto para cada persona.',
      pasos: [
        'Abrid la página en cada móvil: a cada persona le sale un cartón distinto.',
        'Marca cada casilla cuando pase ese momento en la película. El centro es libre.',
        'Canta línea o completa el cartón para ganar.',
      ],
    },
    en: {
      titulo: 'Superhero movie night bingo',
      descripcion: 'A bingo card of classic superhero movie moments to play while watching a Marvel or DC film together. Everyone gets a different card.',
      pasos: ['Open the page on each phone: everyone gets a different card.', 'Mark a square when that moment happens in the film. The centre is free.', 'Call a line or fill the whole card to win.'],
    },
  },
};

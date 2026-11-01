/**
 * Pasatiempos (/pasatiempos/): cada juego tiene su página /pasatiempos/<id>/ (en inglés /en/games/<idEn>/).
 * Los textos están en el apartado `juegos` de src/i18n/textos.ts.
 */
export const JUEGOS = [
  { id: 'adivina-el-personaje', idEn: 'guess-the-character', clave: 'adivina' },
  { id: 'que-heroe-eres', idEn: 'which-hero-are-you', clave: 'quien' },
  { id: 'cual-fue-antes', idEn: 'which-came-first', clave: 'antes' },
] as const;
export type Juego = (typeof JUEGOS)[number];

/** Ideas de pasatiempos para más adelante (se listan en /pasatiempos/). */
export const IDEAS = [
  { es: ['Heroedle', 'Un personaje al día que todo el mundo intenta adivinar por sus atributos (universo, año, equipo…), al estilo de Wordle.'], en: ['Heroedle', 'One character a day that everyone tries to guess from their attributes (universe, year, team…), Wordle-style.'] },
  { es: ['Cartel pixelado', 'Adivina la película a partir de un cartel muy pixelado que se va aclarando poco a poco.'], en: ['Pixelated poster', 'Guess the film from a heavily pixelated poster that gradually sharpens.'] },
  { es: ['Ordena la cronología', 'Arrastra cinco títulos del UMC al orden en que pasa su historia.'], en: ['Sort the timeline', 'Drag five MCU titles into the order their stories take place.'] },
  { es: ['Conecta a los actores', 'Llega de un actor a otro en el menor número de saltos, a través de los títulos que comparten.'], en: ['Connect the actors', 'Get from one actor to another in as few steps as possible, through the titles they share.'] },
  { es: ['Trivia diaria', 'Cinco preguntas al día sobre duraciones, directores, años y escenas poscréditos.'], en: ['Daily trivia', 'Five questions a day about runtimes, directors, years and post-credits scenes.'] },
  { es: ['¿Quién lo interpretó?', 'Une cada actor con el personaje que interpretó.'], en: ['Who played them?', 'Match each actor with the character they played.'] },
  { es: ['Duelo de notas', '¿Cuál tiene mejor nota en TMDB? Encadena aciertos como en «¿Cuál se estrenó antes?».'], en: ['Rating duel', 'Which has the higher TMDB rating? Chain answers like in “Which came first?”.'] },
  { es: ['Bingo de maratón', 'Un cartón con momentos típicos (escena poscréditos, cameo, chiste en plena batalla) para ver una peli con amigos.'], en: ['Marathon bingo', 'A card with classic moments (post-credits scene, cameo, a joke mid-battle) to play while watching with friends.'] },
] as const;

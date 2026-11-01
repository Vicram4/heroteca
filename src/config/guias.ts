/**
 * Guías de visionado: páginas pensadas para lo que la gente busca («orden para ver Marvel»…).
 * Las listas se generan solas a partir de las fichas; aquí solo van los textos y qué mostrar.
 *
 * tipo:
 *  - 'secciones': estanterías completas en forma de lista (orden propio y, si lo tiene, de estreno)
 *  - 'carpetas':  carpetas de visionado de series, con el orden capítulo a capítulo si existe
 */
export interface Guia {
  universo: string;
  /** Final de la URL: /<universo>/guias/<id>/ */
  id: string;
  /** Final de la URL en inglés: /en/<universo>/guides/<idEn>/ */
  idEn?: string;
  titulo: string;
  /** Título para buscadores */
  tituloSeo: string;
  /** Descripción para buscadores y para la lista de guías */
  descripcion: string;
  /** Párrafos de introducción */
  intro: string[];
  tipo: 'secciones' | 'carpetas';
  /** Ids de las secciones que muestra, en orden */
  secciones: string[];
  /** Solo para tipo 'carpetas': qué carpetas incluye */
  carpetas?: number[];
  /** Mostrar la fase (sagas de tipo «fase») de cada título */
  conFases?: boolean;
  /** Versión inglesa de los textos */
  en?: { titulo: string; tituloSeo: string; descripcion: string; intro: string[] };
}

export const GUIAS: Guia[] = [
  {
    universo: 'marvel',
    id: 'orden-umc',
    idEn: 'mcu-watch-order',
    titulo: 'Cómo ver el UMC (MCU) en orden',
    tituloSeo: 'Orden para ver Marvel (UMC / MCU): orden cronológico y de estreno',
    descripcion:
      'Todas las películas, series y One-Shots del Universo Marvel Cinematográfico (UMC o MCU) en orden cronológico y en orden de estreno, con sus fases.',
    intro: [
      'Hay dos formas habituales de ver el Universo Marvel Cinematográfico (UMC, en inglés MCU): por orden de estreno, tal como llegó a los cines y a la televisión, o por orden cronológico, siguiendo la historia desde la Segunda Guerra Mundial.',
      'El orden cronológico de esta guía es el de la colección de Heroteca. Incluye series y One-Shots, y reparte algunas temporadas en varios tramos cuando sus capítulos transcurren en momentos distintos, como en Agentes de S.H.I.E.L.D.',
      'Para una primera vez, el orden de estreno es el más sencillo, porque respeta las sorpresas tal como se pensaron. El cronológico es ideal para volver a verlo.',
    ],
    tipo: 'secciones',
    secciones: ['umc'],
    conFases: true,
    en: {
      titulo: 'How to watch the MCU in order',
      tituloSeo: 'MCU watch order: chronological and release order of every film and series',
      descripcion:
        'Every Marvel Cinematic Universe (MCU) film, series and One-Shot in chronological order and in release order, with their phases.',
      intro: [
        'There are two common ways to watch the Marvel Cinematic Universe (MCU): in release order, as it reached cinemas and TV, or in chronological order, following the story from World War II onwards.',
        'The chronological order in this guide is the Heroteca collection’s own. It includes series and One-Shots, and splits some seasons into several parts when their episodes take place at different points in the timeline, as with Agents of S.H.I.E.L.D.',
        'For a first watch, release order is the simplest, because it keeps the surprises as they were intended. Chronological order is ideal for a rewatch.',
      ],
    },
  },
  {
    universo: 'dc',
    id: 'orden-peliculas',
    idEn: 'dc-movies-in-order',
    titulo: 'Orden de las películas de DC',
    tituloSeo: 'Orden para ver las películas de DC: Universo Extendido (DCEU) y clásicas',
    descripcion:
      'Las películas del Universo Extendido de DC (DCEU) en orden cronológico y de estreno, y las clásicas de Superman, Batman y compañía por orden de estreno.',
    intro: [
      'Las películas de acción real de DC se dividen en dos grandes bloques: el Universo Extendido de DC (DCEU), que arranca con El hombre de acero (2013), y las películas anteriores o independientes, como las de Superman con Christopher Reeve, el Batman de Tim Burton o la trilogía de Christopher Nolan.',
      'En el DCEU, el orden cronológico empieza con Wonder Woman, ambientada en la Primera Guerra Mundial. La colección incluye en este bloque Joker (2019) y The Batman (2022), aunque no forman parte de la continuidad oficial del DCEU. Las clásicas no comparten historia entre sí, así que se ordenan por estreno.',
    ],
    tipo: 'secciones',
    secciones: ['dcdu', 'udc'],
    en: {
      titulo: 'DC movies in order',
      tituloSeo: 'DC movies in order: the DC Extended Universe (DCEU) and the classic films',
      descripcion:
        'DC Extended Universe (DCEU) films in chronological and release order, plus the classic Superman, Batman and other DC films in release order.',
      intro: [
        'DC’s live-action films fall into two big groups: the DC Extended Universe (DCEU), which begins with Man of Steel (2013), and the earlier or standalone films, such as the Christopher Reeve Superman films, Tim Burton’s Batman and Christopher Nolan’s trilogy.',
        'In the DCEU, chronological order starts with Wonder Woman, set during World War I. The collection includes Joker (2019) and The Batman (2022) in this group, although they are not part of the official DCEU continuity. The classic films don’t share a story, so they are listed in release order.',
      ],
    },
  },
  {
    universo: 'dc',
    id: 'orden-arrowverso',
    idEn: 'arrowverse-watch-order',
    titulo: 'Orden del Arrowverso capítulo a capítulo',
    tituloSeo: 'Orden para ver el Arrowverso capítulo a capítulo: Arrow, The Flash, Supergirl y Legends',
    descripcion:
      'Cómo ver Arrow, The Flash, Supergirl, Legends of Tomorrow y el resto del Arrowverso en orden, capítulo a capítulo, con los crossovers en su sitio.',
    intro: [
      'El Arrowverso es el universo compartido de las series de DC que empezó con Arrow (2012). Sus series se cruzan a menudo, sobre todo en los grandes crossovers anuales, así que verlas por separado estropea sorpresas y deja tramas a medias.',
      'Esta guía sigue las carpetas de visionado de la colección de Heroteca. En los bloques Crossover, las temporadas que se emitían a la vez se intercalan capítulo a capítulo, en el orden en que conviene verlas. Las carpetas Entre-Crossover reúnen otras series de DC que encajan en ese punto.',
    ],
    tipo: 'carpetas',
    secciones: ['series'],
    carpetas: [4, 5, 6, 7, 8, 9, 10, 11],
    en: {
      titulo: 'Arrowverse watch order, episode by episode',
      tituloSeo: 'Arrowverse watch order episode by episode: Arrow, The Flash, Supergirl and Legends',
      descripcion:
        'How to watch Arrow, The Flash, Supergirl, Legends of Tomorrow and the rest of the Arrowverse in order, episode by episode, with every crossover in place.',
      intro: [
        'The Arrowverse is the shared universe of DC series that began with Arrow (2012). Its shows cross over often, especially in the big yearly crossover events, so watching them separately spoils surprises and leaves storylines hanging.',
        'This guide follows the Heroteca collection’s viewing folders. In the crossover blocks, seasons that aired at the same time are interleaved episode by episode, in the order they are best watched. The “between crossovers” folders gather other DC series that fit at that point.',
      ],
    },
  },
];

export const guiasDe = (universo: string) => GUIAS.filter((g) => g.universo === universo);

/** La guía con sus textos en el idioma pedido (si falta la traducción, en español). */
export const guiaLoc = (g: Guia, idioma: 'es' | 'en'): Guia => (idioma === 'en' && g.en ? { ...g, ...g.en } : g);

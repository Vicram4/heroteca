/**
 * Guías «Todas las películas de X en orden» (tipo 'personaje', ver src/config/guias.ts).
 *
 * - Cada versión es una continuidad (o un actor) con sus películas en el orden de la historia.
 * - El orden de estreno, la duración y «dónde ver» se calculan solos a partir de las fichas.
 * - Solo películas donde el personaje es protagonista o pieza clave; los cameos se nombran en el texto.
 * - Las versiones `animacion: true` van en un bloque aparte y no cuentan en el orden de estreno principal.
 * - Años de las historias sin `epoca` en la ficha: Wikipedia (artículos de cada película y de cada saga), noviembre de 2026.
 */
import type { Guia } from './guias';

const base = { tipo: 'personaje' as const, secciones: [] as string[] };

export const GUIAS_PERSONAJE: Guia[] = [
  // ─── Marvel ───
  {
    ...base,
    universo: 'marvel',
    id: 'peliculas-de-spider-man-en-orden',
    idEn: 'spider-man-movies-in-order',
    peliculasDe: 'de Spider-Man',
    personajes: ['spider-man', 'miles-morales'],
    titulo: 'Todas las películas de Spider-Man en orden',
    tituloSeo: 'Películas de Spider-Man en orden: de estreno, cronológico y dónde verlas',
    descripcion:
      'Las películas de Spider-Man en orden de estreno y por sagas: Tobey Maguire, Andrew Garfield, Tom Holland y el Spider-Verse, con dónde ver cada una.',
    intro: [
      'Spider-Man ha tenido tres sagas de imagen real en veinte años y cada una empieza de cero: la de Sam Raimi con Tobey Maguire, la de Marc Webb con Andrew Garfield y la del Universo Marvel Cinematográfico (UMC) con Tom Holland. Aparte están las dos películas animadas del Spider-Verse, protagonizadas por Miles Morales.',
      'Abajo tienes las películas por orden de estreno y, después, saga a saga en el orden de la historia, con dónde verlas.',
    ],
    consejo:
      'No. Cada saga se entiende sola. La única que pide deberes es Spider-Man: No Way Home, que se disfruta mucho más con las de Raimi y las de Garfield vistas.',
    versiones: [
      {
        titulo: 'El telefilme de 1977 (Nicholas Hammond)',
        texto: 'El primer Spider-Man de imagen real: el episodio piloto de la serie de la CBS, que en Europa se estrenó en cines.',
        ids: ['spider-man-1977'],
        en: {
          titulo: 'The 1977 TV film (Nicholas Hammond)',
          texto: 'The first live-action Spider-Man: the pilot of the CBS series, released in cinemas in Europe.',
        },
      },
      {
        titulo: 'Trilogía de Sam Raimi (Tobey Maguire)',
        texto: 'Tres películas seguidas. Spider-Man 2 es la que suele salir en las listas de las mejores películas de superhéroes.',
        ids: ['spider-man-2002', 'spider-man-2', 'spider-man-3'],
        en: {
          titulo: 'Sam Raimi’s trilogy (Tobey Maguire)',
          texto: 'Three films in a row. Spider-Man 2 is the one that keeps showing up on best superhero film lists.',
        },
      },
      {
        titulo: 'The Amazing Spider-Man (Andrew Garfield)',
        texto: 'Un reinicio con otro origen y Gwen Stacy en lugar de Mary Jane. Se quedó en dos películas.',
        ids: ['the-amazing-spider-man', 'the-amazing-spider-man-2-el-poder-de-electro'],
        en: {
          titulo: 'The Amazing Spider-Man (Andrew Garfield)',
          texto: 'A reboot with a new take on the origin and Gwen Stacy instead of Mary Jane. It stopped at two films.',
        },
      },
      {
        titulo: 'Universo Marvel Cinematográfico (Tom Holland)',
        texto:
          'Peter Parker debuta en Capitán América: Civil War y su historia sigue en las películas de los Vengadores. No Way Home junta a los tres Spider-Man de imagen real.',
        ids: [
          'capitan-america-civil-war',
          'spider-man-homecoming',
          'vengadores-infinity-war',
          'vengadores-endgame',
          'spider-man-lejos-de-casa',
          'spider-man-no-way-home',
          'spider-man-brand-new-day',
        ],
        en: {
          titulo: 'Marvel Cinematic Universe (Tom Holland)',
          texto:
            'Peter Parker debuts in Captain America: Civil War and his story carries on through the Avengers films. No Way Home brings the three live-action Spider-Men together.',
        },
      },
      {
        titulo: 'Spider-Verse (animación, Miles Morales)',
        texto: 'Miles Morales y un multiverso de arañas. La tercera parte, Spider-Man: Beyond the Spider-Verse, está anunciada para 2027.',
        ids: ['spider-man-un-nuevo-universo', 'spider-man-cruzando-el-multiverso'],
        en: {
          titulo: 'Spider-Verse (animated, Miles Morales)',
          texto: 'Miles Morales and a multiverse of spiders. The third part, Spider-Man: Beyond the Spider-Verse, is set for 2027.',
        },
      },
    ],
    en: {
      peliculasDe: 'Spider-Man',
      titulo: 'Every Spider-Man movie in order',
      tituloSeo: 'Spider-Man movies in order: release order, chronological order and where to watch',
      descripcion:
        'Every Spider-Man film in release order and saga by saga: Tobey Maguire, Andrew Garfield, Tom Holland and the Spider-Verse, with where to watch each one.',
      intro: [
        'Spider-Man has had three live-action sagas in twenty years, and each one starts from scratch: Sam Raimi’s with Tobey Maguire, Marc Webb’s with Andrew Garfield and the Marvel Cinematic Universe (MCU) one with Tom Holland. Then there are the two animated Spider-Verse films, starring Miles Morales.',
        'Below are the films in release order and then saga by saga in story order, with where to watch them.',
      ],
      consejo:
        'No. Each saga works on its own. The only one with homework is Spider-Man: No Way Home, which is far more fun if you have seen the Raimi and Garfield films.',
    },
  },
  {
    ...base,
    universo: 'marvel',
    id: 'peliculas-de-x-men-en-orden',
    idEn: 'x-men-movies-in-order',
    peliculasDe: 'de X-Men',
    personajes: ['lobezno', 'profesor-x', 'magneto', 'ciclope', 'jean-grey', 'mistica', 'deadpool'],
    titulo: 'Todas las películas de X-Men en orden',
    tituloSeo: 'Películas de X-Men en orden cronológico y de estreno (con Lobezno y Deadpool)',
    descripcion:
      'Las películas de X-Men en orden cronológico y de estreno, con las de Lobezno y Deadpool, cómo encajan los viajes en el tiempo y dónde ver cada una.',
    intro: [
      'La saga X-Men de la Fox es la más liosa del cine de superhéroes: empezó en el presente con X-Men (2000), retrocedió a los años sesenta con Primera Generación y en Días del futuro pasado cambió la historia con un viaje en el tiempo. Lobezno y Deadpool tienen además sus propias películas.',
      'Por eso esta guía da los dos órdenes: el de estreno, el más cómodo para una primera vez, y el de la historia, año a año.',
    ],
    consejo:
      'No hace falta. Si vas con poco tiempo, con X-Men, X-Men 2, Primera Generación, Días del futuro pasado y Logan tienes lo mejor de la saga. Deadpool & Wolverine se entiende sin haberlas visto todas, aunque los guiños funcionan mejor si conoces Logan.',
    versiones: [
      {
        titulo: 'La saga X-Men de la Fox',
        texto:
          'Días del futuro pasado cambia el pasado: lo que pasa en X-Men, X-Men 2 y La decisión final queda en una línea temporal que ya no existe, y Apocalipsis y Fénix Oscura siguen la nueva. Logan transcurre en 2029 y cierra la historia de Lobezno.',
        ids: [
          'x-men-primera-generacion',
          'x-men-origenes-lobezno',
          'x-men-dias-del-futuro-pasado',
          'x-men-apocalipsis',
          'x-men-fenix-oscura',
          'x-men',
          'x-men-2',
          'x-men-la-decision-final',
          'lobezno-inmortal',
          'deadpool',
          'deadpool-2',
          'los-nuevos-mutantes',
          'logan',
        ],
        epocas: {
          'x-men-primera-generacion': '1962',
          'x-men-origenes-lobezno': '1845–1979',
          'x-men-dias-del-futuro-pasado': '1973 y 2023',
          'x-men-apocalipsis': '1983',
          'x-men-fenix-oscura': '1992',
          logan: '2029',
        },
        en: {
          titulo: 'Fox’s X-Men saga',
          texto:
            'Days of Future Past changes the past: what happens in X-Men, X2 and The Last Stand ends up in a timeline that no longer exists, and Apocalypse and Dark Phoenix follow the new one. Logan takes place in 2029 and closes Wolverine’s story.',
          epocas: { 'x-men-dias-del-futuro-pasado': '1973 and 2023' },
        },
      },
      {
        titulo: 'En el Universo Marvel Cinematográfico',
        texto: 'Deadpool & Wolverine lleva a los dos al UMC y se despide de la Fox con muchos guiños a sus películas.',
        ids: ['deadpool-y-wolverine'],
        en: {
          titulo: 'In the Marvel Cinematic Universe',
          texto: 'Deadpool & Wolverine brings both of them into the MCU and says goodbye to Fox with plenty of nods to its films.',
        },
      },
    ],
    en: {
      peliculasDe: 'X-Men',
      titulo: 'Every X-Men movie in order',
      tituloSeo: 'X-Men movies in chronological and release order (with Wolverine and Deadpool)',
      descripcion:
        'The X-Men films in chronological and release order, with the Wolverine and Deadpool films, how the time travel fits together and where to watch each one.',
      intro: [
        'Fox’s X-Men saga is the most tangled in superhero cinema: it began in the present with X-Men (2000), went back to the sixties with First Class and rewrote history in Days of Future Past with time travel. Wolverine and Deadpool also have their own films.',
        'That is why this guide gives both orders: release order, the easiest for a first watch, and story order, year by year.',
      ],
      consejo:
        'No need. If you are short on time, X-Men, X2, First Class, Days of Future Past and Logan are the best of the saga. Deadpool & Wolverine works without having seen them all, though the jokes land better if you know Logan.',
    },
  },
  {
    ...base,
    universo: 'marvel',
    id: 'peliculas-de-hulk-en-orden',
    idEn: 'hulk-movies-in-order',
    peliculasDe: 'de Hulk',
    personajes: ['hulk'],
    titulo: 'Todas las películas de Hulk en orden',
    tituloSeo: 'Películas de Hulk en orden: de Lou Ferrigno a Mark Ruffalo, y dónde verlas',
    descripcion:
      'Las películas de Hulk en orden de estreno y por versiones: los telefilmes de Lou Ferrigno, el Hulk de Ang Lee y el de Edward Norton y Mark Ruffalo en el UMC.',
    intro: [
      'Hulk no ha tenido muchas películas en solitario: los telefilmes que continuaron la serie de los setenta, el Hulk de Ang Lee (2003) y El increíble Hulk (2008). Desde entonces, en el Universo Marvel Cinematográfico, su historia avanza en las películas de otros, sobre todo en las de los Vengadores.',
      'Aquí están todas por orden de estreno y, después, versión a versión en el orden de la historia.',
    ],
    consejo:
      'No. Para seguir al Hulk de Mark Ruffalo bastan Los Vengadores, La era de Ultrón, Thor: Ragnarok, Infinity War y Endgame. El increíble Hulk (2008), con Edward Norton, es la única película del UMC con Hulk como protagonista.',
    versiones: [
      {
        titulo: 'Bill Bixby y Lou Ferrigno (telefilmes)',
        texto:
          'El primero es el piloto de la serie de 1977. Los otros tres llegaron tras su final: en El regreso aparece Thor, y en El juicio, Daredevil.',
        ids: ['el-increible-hulk-1977', 'el-regreso-del-increible-hulk', 'el-juicio-del-increible-hulk', 'la-muerte-del-increible-hulk'],
        en: {
          titulo: 'Bill Bixby and Lou Ferrigno (TV films)',
          texto: 'The first is the pilot of the 1977 series. The other three came after it ended: Thor appears in The Return, and Daredevil in The Trial.',
        },
      },
      {
        titulo: 'Hulk de Ang Lee (Eric Bana)',
        texto: 'Una película suelta y muy de autor, sin relación con las del UMC.',
        ids: ['hulk'],
        en: { titulo: 'Ang Lee’s Hulk (Eric Bana)', texto: 'A standalone, very personal film, unrelated to the MCU ones.' },
      },
      {
        titulo: 'Universo Marvel Cinematográfico (Edward Norton y Mark Ruffalo)',
        texto:
          'Edward Norton lo interpreta en El increíble Hulk; desde Los Vengadores es Mark Ruffalo. Tiene además cameos en Iron Man 3, Capitana Marvel y Shang-Chi.',
        ids: [
          'el-increible-hulk-2008',
          'los-vengadores',
          'vengadores-la-era-de-ultron',
          'thor-ragnarok',
          'vengadores-infinity-war',
          'vengadores-endgame',
          'spider-man-brand-new-day',
        ],
        en: {
          titulo: 'Marvel Cinematic Universe (Edward Norton and Mark Ruffalo)',
          texto: 'Edward Norton plays him in The Incredible Hulk; from The Avengers on it is Mark Ruffalo. He also has cameos in Iron Man 3, Captain Marvel and Shang-Chi.',
        },
      },
      {
        titulo: 'Animación',
        texto: 'Películas animadas sueltas, para ver en cualquier orden.',
        ids: ['hulk-vs', 'planet-hulk', 'hulk-donde-habitan-los-monstruos'],
        animacion: true,
        en: { titulo: 'Animation', texto: 'Standalone animated films, to watch in any order.' },
      },
    ],
    en: {
      peliculasDe: 'Hulk',
      titulo: 'Every Hulk movie in order',
      tituloSeo: 'Hulk movies in order: from Lou Ferrigno to Mark Ruffalo, and where to watch',
      descripcion:
        'The Hulk films in release order and by version: Lou Ferrigno’s TV films, Ang Lee’s Hulk and Edward Norton’s and Mark Ruffalo’s Hulk in the MCU.',
      intro: [
        'Hulk hasn’t had many solo films: the TV films that continued the seventies series, Ang Lee’s Hulk (2003) and The Incredible Hulk (2008). Since then, in the Marvel Cinematic Universe, his story moves forward in other characters’ films, mostly the Avengers ones.',
        'Here they all are in release order and then version by version in story order.',
      ],
      consejo:
        'No. To follow Mark Ruffalo’s Hulk, The Avengers, Age of Ultron, Thor: Ragnarok, Infinity War and Endgame are enough. The Incredible Hulk (2008), with Edward Norton, is the only MCU film with Hulk as the lead.',
    },
  },
  {
    ...base,
    universo: 'marvel',
    id: 'peliculas-de-venom-en-orden',
    idEn: 'venom-movies-in-order',
    peliculasDe: 'de Venom y del universo Spider-Man de Sony',
    personajes: ['venom', 'morbius', 'madame-web', 'kraven'],
    titulo: 'Películas de Venom y del universo Spider-Man de Sony en orden',
    tituloSeo: 'Películas de Venom y del universo Spider-Man de Sony en orden (Morbius, Madame Web, Kraven)',
    descripcion:
      'Venom, Morbius, Madame Web y Kraven the Hunter en orden de estreno y cronológico, cómo se conectan con el UMC y dónde ver cada una.',
    intro: [
      'Sony tiene los derechos de Spider-Man en el cine y entre 2018 y 2024 hizo seis películas con personajes de su mundo, pero sin Spider-Man: la trilogía de Venom con Tom Hardy, Morbius, Madame Web y Kraven the Hunter.',
      'Venom: habrá matanza y Morbius tienen escenas poscréditos que las cruzan con el multiverso del Universo Marvel Cinematográfico. Aquí van por estreno y en el orden de la historia.',
    ],
    consejo:
      'No. Lo que tiene continuidad es la trilogía de Venom; Morbius, Madame Web y Kraven se ven sueltas.',
    versiones: [
      {
        titulo: 'El universo Spider-Man de Sony',
        texto: 'Madame Web transcurre en 2003, con un prólogo en los setenta. El resto pasa en la actualidad.',
        ids: ['madame-web', 'kraven-the-hunter', 'venom', 'venom-habra-matanza', 'morbius', 'venom-el-ultimo-baile'],
        epocas: { 'madame-web': '2003' },
        en: { titulo: 'Sony’s Spider-Man Universe', texto: 'Madame Web takes place in 2003, with a prologue in the seventies. The rest are set in the present.' },
      },
      {
        titulo: 'Venom en la trilogía de Sam Raimi',
        texto: 'Antes que Tom Hardy, Topher Grace fue Eddie Brock en Spider-Man 3.',
        ids: ['spider-man-3'],
        en: { titulo: 'Venom in Sam Raimi’s trilogy', texto: 'Before Tom Hardy, Topher Grace played Eddie Brock in Spider-Man 3.' },
      },
    ],
    en: {
      peliculasDe: 'Venom and Sony’s Spider-Man Universe',
      titulo: 'Venom and Sony’s Spider-Man Universe movies in order',
      tituloSeo: 'Venom and Sony’s Spider-Man Universe movies in order (Morbius, Madame Web, Kraven)',
      descripcion:
        'Venom, Morbius, Madame Web and Kraven the Hunter in release and chronological order, how they connect to the MCU and where to watch each one.',
      intro: [
        'Sony holds the film rights to Spider-Man, and between 2018 and 2024 it made six films with characters from his world, but without Spider-Man: the Venom trilogy with Tom Hardy, Morbius, Madame Web and Kraven the Hunter.',
        'Venom: Let There Be Carnage and Morbius have post-credits scenes that cross them over with the Marvel Cinematic Universe multiverse. Here they are in release order and in story order.',
      ],
      consejo: 'No. Only the Venom trilogy has continuity; Morbius, Madame Web and Kraven stand on their own.',
    },
  },
  // ─── DC ───
  {
    ...base,
    universo: 'dc',
    id: 'peliculas-de-batman-en-orden',
    idEn: 'batman-movies-in-order',
    peliculasDe: 'de Batman',
    personajes: ['batman'],
    titulo: 'Todas las películas de Batman en orden',
    tituloSeo: 'Películas de Batman en orden: de Adam West a Robert Pattinson, y dónde verlas',
    descripcion:
      'Las películas de Batman en orden de estreno y por actor: Adam West, Michael Keaton, Val Kilmer, George Clooney, Christian Bale, Ben Affleck y Robert Pattinson, más las mejores animadas.',
    intro: [
      'Batman es el superhéroe con más películas, pero no forman una sola historia: cada director empezó la suya. Las de Tim Burton y Joel Schumacher van seguidas; la trilogía de Christopher Nolan, las del Universo Extendido de DC (DCEU) con Ben Affleck y The Batman de Matt Reeves son mundos aparte.',
      'Aquí están las de imagen real por orden de estreno y, después, versión a versión en el orden de la historia. Al final, una selección de las animadas, que adaptan cómics muy conocidos.',
    ],
    consejo:
      'No. Cada etapa se ve sola. Si solo vas a ver una, la trilogía de Nolan es la más recomendada; The Batman (2022) es la mejor puerta de entrada reciente.',
    versiones: [
      {
        titulo: 'Adam West (1966)',
        texto: 'La película de la serie de televisión: color, humor y onomatopeyas en pantalla.',
        ids: ['batman'],
        en: { titulo: 'Adam West (1966)', texto: 'The film of the TV series: colour, humour and on-screen sound effects.' },
      },
      {
        titulo: 'Tim Burton y Joel Schumacher (Keaton, Kilmer y Clooney)',
        texto: 'Cuatro películas seguidas con tres Batman distintos. Michael Keaton volvió al personaje en Flash (2023).',
        ids: ['batman-1989', 'batman-vuelve', 'batman-forever', 'batman-y-robin'],
        en: {
          titulo: 'Tim Burton and Joel Schumacher (Keaton, Kilmer and Clooney)',
          texto: 'Four films in a row with three different Batmen. Michael Keaton returned to the role in The Flash (2023).',
        },
      },
      {
        titulo: 'Trilogía de Christopher Nolan (Christian Bale)',
        texto: 'Una historia completa en tres películas, de los orígenes al retiro de Bruce Wayne.',
        ids: ['batman-begins', 'el-caballero-oscuro', 'el-caballero-oscuro-la-leyenda-renace'],
        en: { titulo: 'Christopher Nolan’s trilogy (Christian Bale)', texto: 'A complete story in three films, from Bruce Wayne’s origins to his retirement.' },
      },
      {
        titulo: 'Universo Extendido de DC (Ben Affleck)',
        texto:
          'Un Batman veterano que se enfrenta a Superman y funda la Liga de la Justicia. La Liga de la Justicia de Zack Snyder es otra versión de Liga de la Justicia: basta con ver una. También sale brevemente en Escuadrón suicida.',
        ids: ['batman-vs-superman-el-amanecer-de-la-justicia', 'liga-de-la-justicia', 'la-liga-de-la-justicia-de-zack-snyder', 'flash'],
        en: {
          titulo: 'DC Extended Universe (Ben Affleck)',
          texto:
            'A veteran Batman who takes on Superman and founds the Justice League. Zack Snyder’s Justice League is another cut of Justice League: one of them is enough. He also appears briefly in Suicide Squad.',
        },
      },
      {
        titulo: 'The Batman de Matt Reeves (Robert Pattinson)',
        texto: 'Un Batman en su segundo año, más detective. La secuela, The Batman Part II, está anunciada para 2027.',
        ids: ['the-batman'],
        en: {
          titulo: 'Matt Reeves’s The Batman (Robert Pattinson)',
          texto: 'Batman in his second year, more of a detective. The sequel, The Batman Part II, is set for 2027.',
        },
      },
      {
        titulo: 'Animación',
        texto: 'Adaptaciones de cómics famosos; cada una se entiende sola.',
        ids: [
          'batman-ano-uno',
          'batman-capucha-roja',
          'batman-el-regreso-del-caballero-oscuro',
          'batman-la-broma-asesina',
          'batman-gotham-a-luz-de-gas',
          'batman-ninja',
          'batman-hush',
        ],
        animacion: true,
        en: { titulo: 'Animation', texto: 'Adaptations of famous comics; each one stands on its own.' },
      },
    ],
    en: {
      peliculasDe: 'Batman',
      titulo: 'Every Batman movie in order',
      tituloSeo: 'Batman movies in order: from Adam West to Robert Pattinson, and where to watch',
      descripcion:
        'The Batman films in release order and by actor: Adam West, Michael Keaton, Val Kilmer, George Clooney, Christian Bale, Ben Affleck and Robert Pattinson, plus the best animated ones.',
      intro: [
        'Batman is the superhero with the most films, but they don’t tell a single story: each director started his own. Tim Burton’s and Joel Schumacher’s run in sequence; Christopher Nolan’s trilogy, the DC Extended Universe (DCEU) films with Ben Affleck and Matt Reeves’s The Batman are separate worlds.',
        'Here are the live-action films in release order and then version by version in story order. At the end, a selection of the animated films, which adapt well-known comics.',
      ],
      consejo:
        'No. Each era stands on its own. If you only watch one, Nolan’s trilogy is the most recommended; The Batman (2022) is the best recent way in.',
    },
  },
  {
    ...base,
    universo: 'dc',
    id: 'peliculas-de-superman-en-orden',
    idEn: 'superman-movies-in-order',
    peliculasDe: 'de Superman',
    personajes: ['superman'],
    titulo: 'Todas las películas de Superman en orden',
    tituloSeo: 'Películas de Superman en orden: de Christopher Reeve a David Corenswet, y dónde verlas',
    descripcion:
      'Las películas de Superman en orden de estreno y por actor: George Reeves, Christopher Reeve, Brandon Routh, Henry Cavill y David Corenswet, más las mejores animadas.',
    intro: [
      'Superman lleva en el cine desde 1951 y ha tenido cinco actores en imagen real. Las películas de Christopher Reeve van seguidas; Superman Returns (2006) las continúa a su manera; Henry Cavill fue Superman en el Universo Extendido de DC (DCEU), y David Corenswet abrió en 2025 el nuevo universo DC de James Gunn.',
      'Aquí están las de imagen real por orden de estreno y, después, versión a versión en el orden de la historia. Al final, una selección de las animadas.',
    ],
    consejo:
      'No. Superman (1978) y Superman II son las imprescindibles de la etapa clásica. Superman (2025) empieza de cero, así que se puede ver sin haber visto ninguna otra.',
    versiones: [
      {
        titulo: 'George Reeves (1951)',
        texto: 'La primera película de Superman, que sirvió de presentación a la serie de televisión.',
        ids: ['superman-y-los-hombres-topo'],
        en: { titulo: 'George Reeves (1951)', texto: 'Superman’s first feature film, which served as a launch for the TV series.' },
      },
      {
        titulo: 'Christopher Reeve (y Superman Returns)',
        texto:
          'Cuatro películas seguidas. Superman Returns, con Brandon Routh, continúa la historia después de Superman II e ignora la III y la IV, así que también se puede ver justo después de la II.',
        ids: ['superman', 'superman-ii-la-aventura-continua', 'superman-iii', 'superman-iv-en-busca-de-la-paz', 'superman-returns'],
        en: {
          titulo: 'Christopher Reeve (and Superman Returns)',
          texto:
            'Four films in a row. Superman Returns, with Brandon Routh, picks up after Superman II and ignores III and IV, so it can also be watched right after II.',
        },
      },
      {
        titulo: 'Universo Extendido de DC (Henry Cavill)',
        texto:
          'Un Superman más serio, del origen a la Liga de la Justicia. La Liga de la Justicia de Zack Snyder es otra versión de Liga de la Justicia: basta con ver una. Cavill hace además un cameo en Black Adam.',
        ids: ['el-hombre-de-acero', 'batman-vs-superman-el-amanecer-de-la-justicia', 'liga-de-la-justicia', 'la-liga-de-la-justicia-de-zack-snyder'],
        en: {
          titulo: 'DC Extended Universe (Henry Cavill)',
          texto:
            'A more serious Superman, from his origin to the Justice League. Zack Snyder’s Justice League is another cut of Justice League: one of them is enough. Cavill also has a cameo in Black Adam.',
        },
      },
      {
        titulo: 'Universo DC de James Gunn (David Corenswet)',
        texto: 'Un Superman ya asentado en Metrópolis, sin repetir el origen. Es la primera película del nuevo universo DC.',
        ids: ['superman-2025'],
        en: {
          titulo: 'James Gunn’s DC Universe (David Corenswet)',
          texto: 'A Superman already settled in Metropolis, with no retelling of the origin. It is the first film of the new DC Universe.',
        },
      },
      {
        titulo: 'Animación',
        texto: 'Adaptaciones de cómics famosos, como La muerte de Superman o Hijo rojo.',
        ids: [
          'superman-doomsday',
          'superman-viaja-al-sol',
          'superman-vs-la-elite',
          'superman-sin-limites',
          'la-muerte-de-superman',
          'la-muerte-de-superman-parte-2-el-reinado-de-los-superhombres',
          'superman-hijo-rojo',
        ],
        animacion: true,
        en: { titulo: 'Animation', texto: 'Adaptations of famous comics, such as The Death of Superman and Red Son.' },
      },
    ],
    en: {
      peliculasDe: 'Superman',
      titulo: 'Every Superman movie in order',
      tituloSeo: 'Superman movies in order: from Christopher Reeve to David Corenswet, and where to watch',
      descripcion:
        'The Superman films in release order and by actor: George Reeves, Christopher Reeve, Brandon Routh, Henry Cavill and David Corenswet, plus the best animated ones.',
      intro: [
        'Superman has been in cinemas since 1951 and has had five live-action actors. Christopher Reeve’s films run in sequence; Superman Returns (2006) continues them in its own way; Henry Cavill played Superman in the DC Extended Universe (DCEU), and David Corenswet launched James Gunn’s new DC universe in 2025.',
        'Here are the live-action films in release order and then version by version in story order. At the end, a selection of the animated ones.',
      ],
      consejo:
        'No. Superman (1978) and Superman II are the essentials of the classic era. Superman (2025) starts from scratch, so it can be watched without having seen any other.',
    },
  },
  {
    ...base,
    universo: 'dc',
    id: 'peliculas-de-wonder-woman-en-orden',
    idEn: 'wonder-woman-movies-in-order',
    peliculasDe: 'de Wonder Woman',
    personajes: ['wonder-woman'],
    titulo: 'Todas las películas de Wonder Woman en orden',
    tituloSeo: 'Películas de Wonder Woman en orden: de Lynda Carter a Gal Gadot, y dónde verlas',
    descripcion:
      'Las películas de Wonder Woman en orden de estreno y cronológico: los telefilmes de los setenta, las de Gal Gadot en el DCEU y las animadas, con dónde ver cada una.',
    intro: [
      'Wonder Woman tuvo dos telefilmes en los setenta, el segundo con Lynda Carter, que dio paso a la serie. En el cine es Gal Gadot quien la interpreta en el Universo Extendido de DC (DCEU), donde el orden de la historia empieza en la Primera Guerra Mundial.',
      'Aquí están por orden de estreno y, después, versión a versión en el orden de la historia.',
    ],
    consejo:
      'No. Wonder Woman (2017) se ve sola. Si quieres seguir a Gal Gadot, después van Wonder Woman 1984 y las películas de la Liga de la Justicia.',
    versiones: [
      {
        titulo: 'Los telefilmes de los setenta',
        texto: 'El de 1974, con Cathy Lee Crosby, no convenció; el de 1975, con Lynda Carter, fue el piloto de la serie.',
        ids: ['wonder-woman', 'the-new-original-wonder-woman'],
        en: {
          titulo: 'The seventies TV films',
          texto: 'The 1974 one, with Cathy Lee Crosby, didn’t catch on; the 1975 one, with Lynda Carter, was the pilot of the series.',
        },
      },
      {
        titulo: 'Universo Extendido de DC (Gal Gadot)',
        texto:
          'Wonder Woman transcurre en 1918 y Wonder Woman 1984 en ese año; en Batman v Superman aparece ya en la actualidad. La Liga de la Justicia de Zack Snyder es otra versión de Liga de la Justicia: basta con ver una. Hace además cameos en Flash y en ¡Shazam! La furia de los dioses.',
        ids: [
          'wonder-woman-2017',
          'wonder-woman-1984',
          'batman-vs-superman-el-amanecer-de-la-justicia',
          'liga-de-la-justicia',
          'la-liga-de-la-justicia-de-zack-snyder',
        ],
        epocas: { 'wonder-woman-2017': '1918', 'wonder-woman-1984': '1984' },
        en: {
          titulo: 'DC Extended Universe (Gal Gadot)',
          texto:
            'Wonder Woman takes place in 1918 and Wonder Woman 1984 in that year; by Batman v Superman she is in the present. Zack Snyder’s Justice League is another cut of Justice League: one of them is enough. She also has cameos in The Flash and Shazam! Fury of the Gods.',
        },
      },
      {
        titulo: 'Sobre su creador',
        texto: 'La historia real de William Moulton Marston, el psicólogo que creó a Wonder Woman.',
        ids: ['el-profesor-marston-y-wonder-women'],
        en: { titulo: 'About her creator', texto: 'The true story of William Moulton Marston, the psychologist who created Wonder Woman.' },
      },
      {
        titulo: 'Animación',
        texto: 'Dos películas sobre sus orígenes y su familia amazona.',
        ids: ['wonder-woman-la-mujer-maravilla', 'wonder-woman-linaje'],
        animacion: true,
        en: { titulo: 'Animation', texto: 'Two films about her origins and her Amazon family.' },
      },
    ],
    en: {
      peliculasDe: 'Wonder Woman',
      titulo: 'Every Wonder Woman movie in order',
      tituloSeo: 'Wonder Woman movies in order: from Lynda Carter to Gal Gadot, and where to watch',
      descripcion:
        'The Wonder Woman films in release and chronological order: the seventies TV films, Gal Gadot’s DCEU films and the animated ones, with where to watch each one.',
      intro: [
        'Wonder Woman had two TV films in the seventies, the second with Lynda Carter, which led to the series. In cinemas, Gal Gadot plays her in the DC Extended Universe (DCEU), where story order begins in World War I.',
        'Here they are in release order and then version by version in story order.',
      ],
      consejo:
        'No. Wonder Woman (2017) stands on its own. If you want to follow Gal Gadot, next come Wonder Woman 1984 and the Justice League films.',
    },
  },
  {
    ...base,
    universo: 'dc',
    id: 'peliculas-del-joker-en-orden',
    idEn: 'joker-movies-in-order',
    peliculasDe: 'del Joker',
    personajes: ['joker'],
    titulo: 'Todas las películas del Joker en orden',
    tituloSeo: 'Películas del Joker en orden: Nicholson, Ledger, Leto y Phoenix, y dónde verlas',
    descripcion:
      'Las películas del Joker en orden de estreno y por actor: César Romero, Jack Nicholson, Heath Ledger, Jared Leto, Joaquin Phoenix y Barry Keoghan, con dónde ver cada una.',
    intro: [
      'El Joker ha tenido un actor distinto en casi cada etapa de Batman, y cada versión es independiente: no hace falta ver ninguna para entender la siguiente. Solo Joaquin Phoenix lo ha protagonizado en solitario, en Joker (2019) y su secuela.',
      'Aquí están por orden de estreno y, después, actor a actor.',
    ],
    consejo: 'No. Cada Joker es independiente. Las dos de Joaquin Phoenix sí van seguidas.',
    versiones: [
      {
        titulo: 'César Romero (1966)',
        texto: 'El Joker de la serie de Adam West, en su película.',
        ids: ['batman'],
        en: { titulo: 'Cesar Romero (1966)', texto: 'The Joker from Adam West’s series, in its film.' },
      },
      {
        titulo: 'Jack Nicholson (1989)',
        texto: 'El Batman de Tim Burton, donde el Joker tiene casi tanto protagonismo como Batman.',
        ids: ['batman-1989'],
        en: { titulo: 'Jack Nicholson (1989)', texto: 'Tim Burton’s Batman, where the Joker gets almost as much screen time as Batman.' },
      },
      {
        titulo: 'Heath Ledger (2008)',
        texto: 'El caballero oscuro, la segunda de la trilogía de Nolan. Ledger ganó un Óscar póstumo por el papel.',
        ids: ['el-caballero-oscuro'],
        en: { titulo: 'Heath Ledger (2008)', texto: 'The Dark Knight, the second film in Nolan’s trilogy. Ledger won a posthumous Oscar for the role.' },
      },
      {
        titulo: 'Jared Leto (DCEU)',
        texto: 'Un Joker gánster, pareja de Harley Quinn, con poco tiempo en pantalla en las dos.',
        ids: ['escuadron-suicida', 'la-liga-de-la-justicia-de-zack-snyder'],
        en: { titulo: 'Jared Leto (DCEU)', texto: 'A gangster Joker, Harley Quinn’s partner, with little screen time in both.' },
      },
      {
        titulo: 'Joaquin Phoenix',
        texto: 'Joker transcurre en 1981 y cuenta cómo Arthur Fleck se convierte en el Joker; Folie à Deux sigue justo después.',
        ids: ['joker', 'joker-folie-a-deux'],
        epocas: { joker: '1981' },
        en: { titulo: 'Joaquin Phoenix', texto: 'Joker takes place in 1981 and tells how Arthur Fleck becomes the Joker; Folie à Deux follows right after.' },
      },
      {
        titulo: 'Barry Keoghan (2022)',
        texto: 'Un Joker que apenas asoma en The Batman, preso en Arkham.',
        ids: ['the-batman'],
        en: { titulo: 'Barry Keoghan (2022)', texto: 'A Joker who barely shows up in The Batman, locked up in Arkham.' },
      },
      {
        titulo: 'Animación',
        texto: 'Las películas animadas donde el Joker es pieza central.',
        ids: ['batman-el-regreso-del-caballero-oscuro', 'batman-la-broma-asesina', 'batman-capucha-roja'],
        animacion: true,
        en: { titulo: 'Animation', texto: 'The animated films where the Joker is central.' },
      },
    ],
    en: {
      peliculasDe: 'Joker',
      titulo: 'Every Joker movie in order',
      tituloSeo: 'Joker movies in order: Nicholson, Ledger, Leto and Phoenix, and where to watch',
      descripcion:
        'The Joker films in release order and by actor: Cesar Romero, Jack Nicholson, Heath Ledger, Jared Leto, Joaquin Phoenix and Barry Keoghan, with where to watch each one.',
      intro: [
        'The Joker has had a different actor in almost every Batman era, and each version stands alone: you don’t need any of them to follow the next. Only Joaquin Phoenix has played him as the lead, in Joker (2019) and its sequel.',
        'Here they are in release order and then actor by actor.',
      ],
      consejo: 'No. Each Joker stands on its own. Joaquin Phoenix’s two films do go together.',
    },
  },
];

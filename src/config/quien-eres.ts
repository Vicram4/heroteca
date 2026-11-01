/**
 * Test «¿Qué héroe eres?» (pasatiempos). Cada respuesta suma puntos a uno o varios resultados; gana el que más tenga
 * (en caso de empate, el primero de la lista RESULTADOS). Para añadir un resultado: ponerlo en RESULTADOS y darle
 * puntos en algunas respuestas.
 */
export interface Resultado {
  /** Id del personaje (su página: /<universo>/personajes/<id>/) */
  id: string;
  universo: 'marvel' | 'dc';
  es: { nombre: string; texto: string };
  en: { nombre: string; texto: string };
}
export interface Pregunta {
  es: string;
  en: string;
  respuestas: { es: string; en: string; puntos: Partial<Record<string, number>> }[];
}

export const RESULTADOS: Resultado[] = [
  { id: 'spider-man', universo: 'marvel', es: { nombre: 'Spider-Man', texto: 'Tienes buen corazón y sentido del humor incluso en los peores días. Ayudas a los demás aunque nadie lo vea, porque sabes que un gran poder conlleva una gran responsabilidad.' }, en: { nombre: 'Spider-Man', texto: 'You have a big heart and a sense of humour even on the worst days. You help others when nobody is watching, because with great power comes great responsibility.' } },
  { id: 'iron-man', universo: 'marvel', es: { nombre: 'Iron Man', texto: 'Tienes ingenio, confianza en ti y una solución para todo (aunque a veces sea demasiado arriesgada). Debajo de tanto sarcasmo hay alguien capaz de sacrificarlo todo.' }, en: { nombre: 'Iron Man', texto: 'Witty, confident and always with a solution (even if it is sometimes too risky). Under all that sarcasm is someone willing to sacrifice everything.' } },
  { id: 'capitan-america', universo: 'marvel', es: { nombre: 'Capitán América', texto: 'Tu lealtad y tu honestidad son a prueba de todo. Defiendes lo que es justo aunque nadie te acompañe, y los demás confían en ti para tomar las decisiones difíciles.' }, en: { nombre: 'Captain America', texto: 'Loyal, honest and clear-headed. You stand up for what is right even if you stand alone, and others trust you to make the hard calls.' } },
  { id: 'thor', universo: 'marvel', es: { nombre: 'Thor', texto: 'Entusiasta, valiente y con un punto teatral. Disfrutas de la vida a lo grande, aprendes de tus errores y siempre vuelves más fuerte.' }, en: { nombre: 'Thor', texto: 'Enthusiastic, brave and a little theatrical. You enjoy life to the full, learn from your mistakes and always come back stronger.' } },
  { id: 'viuda-negra', universo: 'marvel', es: { nombre: 'Viuda Negra', texto: 'Te fijas en todo, sabes guardar un secreto y vas siempre un paso por delante. No necesitas superpoderes: te basta con tu cabeza, tu entrenamiento y tu lealtad a los tuyos.' }, en: { nombre: 'Black Widow', texto: 'Observant, discreet and always one step ahead. You do not need superpowers: your mind, your training and your loyalty to your people are enough.' } },
  { id: 'deadpool', universo: 'marvel', es: { nombre: 'Deadpool', texto: 'Irreverente, imprevisible y con un humor que no conoce límites. Rompes las reglas (y la cuarta pared), pero cuando importa, estás ahí.' }, en: { nombre: 'Deadpool', texto: 'Irreverent, unpredictable and with a sense of humour that knows no limits. You break the rules (and the fourth wall), but when it matters, you show up.' } },
  { id: 'batman', universo: 'dc', es: { nombre: 'Batman', texto: 'Tienes disciplina, un punto perfeccionista y un plan para todo. Prefieres la sombra al foco y conviertes tus heridas en determinación.' }, en: { nombre: 'Batman', texto: 'Disciplined, a perfectionist and with a plan for everything. You prefer the shadows to the spotlight and turn your wounds into determination.' } },
  { id: 'superman', universo: 'dc', es: { nombre: 'Superman', texto: 'Optimista, amable y con una fuerza que usas para proteger, no para imponer. Crees en lo mejor de las personas y les ayudas a encontrarlo.' }, en: { nombre: 'Superman', texto: 'Optimistic, kind and strong, using your strength to protect rather than to impose. You believe in the best in people and help them find it.' } },
  { id: 'wonder-woman', universo: 'dc', es: { nombre: 'Wonder Woman', texto: 'Tienes valentía, compasión y un sentido de la justicia inquebrantable. Luchas por la verdad y por un mundo mejor, con firmeza y con el corazón por delante.' }, en: { nombre: 'Wonder Woman', texto: 'Brave, compassionate and with an unshakeable sense of justice. You fight for truth and a better world, with firmness and your heart first.' } },
  { id: 'harley-quinn', universo: 'dc', es: { nombre: 'Harley Quinn', texto: 'Tienes un punto caótico, mucho sentido del humor y energía de sobra. Vives a tu manera, sin pedir permiso, y quien te subestima suele arrepentirse.' }, en: { nombre: 'Harley Quinn', texto: 'Chaotic, fun and full of energy. You live your own way without asking permission, and whoever underestimates you usually regrets it.' } },
];

export const PREGUNTAS: Pregunta[] = [
  {
    es: 'Es sábado por la noche. ¿Qué plan eliges?',
    en: 'It is Saturday night. What is the plan?',
    respuestas: [
      { es: 'Fiesta grande con todos mis amigos', en: 'A big party with all my friends', puntos: { thor: 2, 'iron-man': 1, 'harley-quinn': 1 } },
      { es: 'Proyecto personal hasta las tantas', en: 'A personal project until late', puntos: { 'iron-man': 2, batman: 2 } },
      { es: 'Ayudar a alguien que lo necesita', en: 'Helping someone who needs it', puntos: { 'spider-man': 2, superman: 2, 'capitan-america': 1 } },
      { es: 'Algo improvisado y un poco loco', en: 'Something spontaneous and a bit crazy', puntos: { deadpool: 2, 'harley-quinn': 2 } },
    ],
  },
  {
    es: 'Tu mayor virtud es…',
    en: 'Your greatest strength is…',
    respuestas: [
      { es: 'La lealtad', en: 'Loyalty', puntos: { 'capitan-america': 2, 'viuda-negra': 2 } },
      { es: 'La inteligencia', en: 'Intelligence', puntos: { 'iron-man': 2, batman: 2 } },
      { es: 'La bondad', en: 'Kindness', puntos: { superman: 2, 'spider-man': 1, 'wonder-woman': 1 } },
      { es: 'El sentido del humor', en: 'My sense of humour', puntos: { deadpool: 2, 'spider-man': 1, 'harley-quinn': 1 } },
    ],
  },
  {
    es: 'Ante un problema difícil, tú…',
    en: 'Faced with a tough problem, you…',
    respuestas: [
      { es: 'Hago un plan detallado', en: 'Make a detailed plan', puntos: { batman: 2, 'viuda-negra': 1, 'capitan-america': 1 } },
      { es: 'Me lanzo y ya veré sobre la marcha', en: 'Jump in and figure it out as I go', puntos: { thor: 2, deadpool: 1, 'spider-man': 1 } },
      { es: 'Busco un invento o una solución creativa', en: 'Look for a gadget or a creative fix', puntos: { 'iron-man': 2, 'spider-man': 1 } },
      { es: 'Lo afronto de frente, con decisión', en: 'Face it head-on, with resolve', puntos: { 'wonder-woman': 2, superman: 1, 'capitan-america': 1 } },
    ],
  },
  {
    es: '¿Qué superpoder te gustaría tener?',
    en: 'Which superpower would you like?',
    respuestas: [
      { es: 'Volar', en: 'Flight', puntos: { superman: 2, thor: 1 } },
      { es: 'Superfuerza', en: 'Super strength', puntos: { 'wonder-woman': 2, thor: 1 } },
      { es: 'Ninguno: me basta con prepararme bien', en: 'None: being well prepared is enough', puntos: { batman: 2, 'viuda-negra': 2 } },
      { es: 'Curarme de todo (y no tomarme nada en serio)', en: 'Healing from anything (and taking nothing seriously)', puntos: { deadpool: 3 } },
    ],
  },
  {
    es: '¿Cómo te describirían tus amigos?',
    en: 'How would your friends describe you?',
    respuestas: [
      { es: 'Una persona responsable y de fiar', en: 'Responsible and reliable', puntos: { 'capitan-america': 2, superman: 1 } },
      { es: 'Con un aire de misterio', en: 'Mysterious', puntos: { 'viuda-negra': 2, batman: 1 } },
      { es: 'El alma de la fiesta', en: 'The life of the party', puntos: { thor: 1, 'harley-quinn': 2, 'iron-man': 1 } },
      { es: 'Con un corazón enorme', en: 'With a huge heart', puntos: { 'spider-man': 2, 'wonder-woman': 1 } },
    ],
  },
  {
    es: 'Elige un lugar para vivir:',
    en: 'Pick a place to live:',
    respuestas: [
      { es: 'Una gran ciudad que nunca duerme', en: 'A big city that never sleeps', puntos: { 'spider-man': 1, 'iron-man': 1, batman: 1, 'harley-quinn': 1 } },
      { es: 'Un pueblo tranquilo en el campo', en: 'A quiet country town', puntos: { superman: 2, 'capitan-america': 1 } },
      { es: 'Una isla lejana y legendaria', en: 'A distant, legendary island', puntos: { 'wonder-woman': 2, thor: 1 } },
      { es: 'Donde sea, mientras haya acción', en: 'Anywhere, as long as there is action', puntos: { deadpool: 1, 'viuda-negra': 1, thor: 1 } },
    ],
  },
];

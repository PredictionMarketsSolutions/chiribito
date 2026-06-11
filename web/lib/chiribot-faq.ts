// Chiribot — castizo FAQ content + pure keyword matcher. No AI, no network, no backend.
// Canonical data verified against the repo: 28 cards · 6 streets · Perla = Sota+7 same suit ·
// Color beats Full · max 6 players · ranking order below.

export interface FaqEntry {
  id: string
  pregunta: string
  respuesta: string
  relacionadas?: string[]
  keywords: string[]
}

export const GREETING =
  "¡Hombre, qué hay! Soy el Chiribot. Pregúntame lo que quieras del Chiribito " +
  "—reglas, la Perla, de dónde viene— que de esto sé un rato. ¿Por dónde empezamos?"

export const FALLBACK =
  "Uy, de eso no controlo. Pero pregúntame por cómo se juega, la Perla o el ranking " +
  "de manos, que ahí sí te ilumino."

export const FAQS: FaqEntry[] = [
  {
    id: "reglas",
    pregunta: "¿Cómo se juega al Chiribito?",
    respuesta:
      "Mira, sencillo: baraja española de 28 cartas —del 5 al 7, y luego Sota, Caballo, Rey y As, " +
      "en los cuatro palos: Oros, Copas, Espadas y Bastos—. Te reparten dos cartas tuyas y van " +
      "saliendo cinco en la mesa, de una en una, con su ronda de apuestas en cada una. Con tus dos " +
      "cartas —y es sagrado, las dos— más las de la mesa, montas tu mejor jugada. Gana la mejor " +
      "mano cuando se enseñan. Y apúntate esto: aquí el Color le gana al Full.",
    relacionadas: ["perla", "ranking", "baraja"],
    keywords: ["como se juega", "jugar", "reglas", "empezar", "mecanica", "instrucciones", "se juega", "que es el chiribito", "que es esto"],
  },
  {
    id: "perla",
    pregunta: "¿Qué es la Perla?",
    respuesta:
      "La joya de la casa: Sota y 7 del mismo palo en tu mano. La mejor jugada del Chiribito, la " +
      "que parte la pana. Si la cantas, te llevas el Bote con la cabeza bien alta.",
    relacionadas: ["ranking", "reglas"],
    keywords: ["perla", "mejor mano", "mejor jugada", "sota 7", "sota y 7", "joya"],
  },
  {
    id: "baraja",
    pregunta: "¿Qué baraja se usa?",
    respuesta:
      "La española de toda la vida, pero de 28 cartas: del 5 al 7, y luego Sota, Caballo, Rey y As, " +
      "en los cuatro palos —Oros, Copas, Espadas y Bastos—. Ni comodines ni zarandajas.",
    relacionadas: ["reglas", "ranking"],
    keywords: ["baraja", "cartas", "palos", "espanola", "oros", "copas", "espadas", "bastos", "cuantas cartas"],
  },
  {
    id: "ranking",
    pregunta: "¿Cuál es el ranking de manos?",
    respuesta:
      "De mayor a menor: Perla, Escalera de color, Póker, Color, Full, Escalera, Trío, Doble " +
      "pareja, Pareja y Carta alta. Lo que más despista al novato: el Color manda sobre el Full. " +
      "No lo olvides en la mesa.",
    relacionadas: ["perla", "reglas"],
    keywords: ["ranking", "manos", "jugadas", "orden", "color", "full", "escalera", "que mano gana"],
  },
  {
    id: "historia",
    pregunta: "¿De dónde viene el Chiribito?",
    respuesta:
      "Del Madrid de los años cincuenta, cuando se jugaba a escondidas en sótanos y trastiendas. " +
      "Pasó por los círculos selectos, vivió su edad de oro… y aquí sigue, vivo. Si quieres la " +
      "historia entera, échale un ojo a la sección de Historia.",
    relacionadas: ["reglas", "jugar"],
    keywords: ["historia", "origen", "madrid", "de donde viene", "cincuenta", "clandestino", "nacio"],
  },
  {
    id: "jugar",
    pregunta: "¿Dónde juego? ¿Es gratis?",
    respuesta:
      "Donde mejor: sentándote a la mesa. Te llevo a play.chiribito.com y echas una mano con la " +
      "parroquia. Y sí, puedes empezar sin gastarte un duro.",
    relacionadas: ["reglas", "perla"],
    keywords: ["donde juego", "jugar online", "gratis", "precio", "coste", "cuantos jugadores", "jugadores", "online", "duro"],
  },
]

/** Link a related-question id back to its full entry (for the suggestion chips after an answer). */
export function faqById(id: string): FaqEntry | undefined {
  return FAQS.find((f) => f.id === id)
}

/** Lowercase, strip Spanish accents (ó→o, ñ→n), drop punctuation, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Keyword matcher for the Chiribot FAQ. Pure and deterministic.
 * Single-word keywords match whole tokens; multi-word keywords match as a phrase.
 * Returns the highest-scoring entry, or null when nothing overlaps. Ties go to the first entry.
 */
export function matchFaq(input: string, faqs: FaqEntry[]): FaqEntry | null {
  const norm = normalizeText(input)
  if (!norm) return null

  const tokens = new Set(norm.split(" "))
  const padded = ` ${norm} `

  let best: FaqEntry | null = null
  let bestScore = 0

  for (const faq of faqs) {
    let score = 0
    for (const keyword of faq.keywords) {
      const nkw = normalizeText(keyword)
      if (!nkw) continue
      const hit = nkw.includes(" ") ? padded.includes(` ${nkw} `) : tokens.has(nkw)
      if (hit) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = faq
    }
  }

  return best
}

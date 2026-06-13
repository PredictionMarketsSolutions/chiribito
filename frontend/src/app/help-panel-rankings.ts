/**
 * help-panel-rankings.ts — Renders the "Jerarquía de manos" section into the
 * help-panel body.
 *
 * DOM/UI only: no engine, Pixi, Colyseus schema, or networking imports.
 * Hand labels are READ from the exported `getHandName` — never hardcoded here.
 */

import { getHandName } from "../game/current-hand";
import { getCardTextureUrl } from "../card-texture-url";

// ---------------------------------------------------------------------------
// Suit alt-text map (for meaningful Spanish alt attributes)
// ---------------------------------------------------------------------------
const SUIT_LABEL: Record<string, string> = {
  O: "de oros",
  C: "de copas",
  E: "de espadas",
  B: "de bastos",
};

const RANK_LABEL: Record<string, string> = {
  "5": "Cinco",
  "6": "Seis",
  "7": "Siete",
  "10": "Sota",
  "11": "Caballo",
  "12": "Rey",
  "1": "As",
};

/** Build a Spanish alt text from a card id like "10C" → "Sota de copas". */
function cardAlt(cardId: string): string {
  const suit = cardId.slice(-1);
  const rank = cardId.slice(0, -1);
  const rankName = RANK_LABEL[rank] ?? rank;
  const suitName = SUIT_LABEL[suit] ?? suit;
  return `${rankName} ${suitName}`;
}

// ---------------------------------------------------------------------------
// Emphasis flags
// ---------------------------------------------------------------------------
/** Identifies the Perla row (category 9) for the strongest visual treatment. */
const FLAG_PERLA = "perla" as const;
/** Identifies Color (6) and Full (5) rows for the quirk cue. */
const FLAG_QUIRK = "quirk" as const;

type EmphasisFlag = typeof FLAG_PERLA | typeof FLAG_QUIRK | null;

// ---------------------------------------------------------------------------
// RANKING_EXAMPLES — ordered 9 (Perla) → 0 (Carta alta)
//
// Rules:
//   - `category` is the numeric key passed to getHandName at render time.
//   - `cards` are canonical frontend card ids: <rank><suit>
//       ranks: 5 / 6 / 7 / 10 / 11 / 12 / 1
//       suits: O / C / E / B
//   - `note` is a single-line castizo description (sentence case, anti-casino).
//   - No hand NAME string is stored — names come from getHandName at render time.
//   - `emphasis` signals the CSS variant to apply.
// ---------------------------------------------------------------------------
export interface RankingEntry {
  category: number;
  cards: string[];
  note: string;
  emphasis: EmphasisFlag;
  /** Visible "Color gana al Full" cue rendered near this row (Color and Full rows). */
  quirkCue?: string;
}

export const RANKING_EXAMPLES: RankingEntry[] = [
  {
    // 9 — Perla: Sota (10) + 7 del mismo palo
    category: 9,
    cards: ["10C", "7C"],
    note: "Sota + 7 del mismo palo — la mano máxima.",
    emphasis: FLAG_PERLA,
  },
  {
    // 8 — Escalera de color
    category: 8,
    cards: ["7C", "10C", "11C", "12C", "1C"],
    note: "Cinco cartas consecutivas del mismo palo.",
    emphasis: null,
  },
  {
    // 7 — Póker
    category: 7,
    cards: ["1O", "1C", "1E", "1B", "12O"],
    note: "Cuatro cartas del mismo valor.",
    emphasis: null,
  },
  {
    // 6 — Color: gana al Full (Chiribito quirk)
    category: 6,
    cards: ["1O", "12O", "11O", "7O", "5O"],
    note: "Cinco del mismo palo. Gana al Full.",
    emphasis: FLAG_QUIRK,
    quirkCue: "Color gana al Full",
  },
  {
    // 5 — Full: pierde contra Color
    category: 5,
    cards: ["12E", "12C", "12O", "10B", "10E"],
    note: "Trío + pareja. Pierde contra el Color.",
    emphasis: FLAG_QUIRK,
    quirkCue: "Color gana al Full",
  },
  {
    // 4 — Escalera
    category: 4,
    cards: ["5B", "6O", "7C", "10E", "11B"],
    note: "Cinco cartas consecutivas de distintos palos.",
    emphasis: null,
  },
  {
    // 3 — Trío
    category: 3,
    cards: ["10O", "10C", "10E", "1B", "5O"],
    note: "Tres cartas del mismo valor.",
    emphasis: null,
  },
  {
    // 2 — Doble pareja
    category: 2,
    cards: ["12C", "12E", "6O", "6B", "1E"],
    note: "Dos parejas distintas.",
    emphasis: null,
  },
  {
    // 1 — Pareja
    category: 1,
    cards: ["1O", "1E", "12C", "10B", "5C"],
    note: "Dos cartas del mismo valor.",
    emphasis: null,
  },
  {
    // 0 — Carta alta
    category: 0,
    cards: ["1C", "12E", "10O", "7B", "6C"],
    note: "Sin combinación. Gana la carta más alta.",
    emphasis: null,
  },
];

// ---------------------------------------------------------------------------
// renderRankings — mounts the section into `container` (idempotent)
// ---------------------------------------------------------------------------

/**
 * Build and mount the hand-rankings section into `container`.
 * Idempotent: a prior `.help-rankings` node is removed before re-rendering.
 * Labels come exclusively from `getHandName(entry.category)` — never from a stored string.
 */
export function renderRankings(container: HTMLElement): void {
  // Idempotency: remove any previously-rendered rankings root.
  const existing = container.querySelector(".help-rankings");
  if (existing) {
    existing.remove();
  }

  const root = document.createElement("section");
  root.className = "help-rankings";
  root.setAttribute("aria-label", "Jerarquía de manos");

  const heading = document.createElement("h2");
  heading.className = "help-rankings__heading";
  heading.textContent = "Jerarquía de manos";
  root.appendChild(heading);

  for (const entry of RANKING_EXAMPLES) {
    const row = document.createElement("div");
    row.className = "help-rankings__row";

    if (entry.emphasis === FLAG_PERLA) {
      row.classList.add("help-rankings__row--perla");
    } else if (entry.emphasis === FLAG_QUIRK) {
      row.classList.add("help-rankings__row--quirk");
    }

    // Header line: hand name + badge/cue + note. Stacking the text above the
    // cards frees the example cards below to span the full row width.
    const header = document.createElement("div");
    header.className = "help-rankings__header";

    // Label — read from canonical source, never a stored string
    const label = document.createElement("span");
    label.className = "help-rankings__label";
    label.textContent = getHandName(entry.category);
    header.appendChild(label);

    // Perla "la más fuerte" seal (Perla row only) — reading order: name → seal → note
    if (entry.emphasis === FLAG_PERLA) {
      const perlaBadge = document.createElement("span");
      perlaBadge.className = "help-rankings__perla-badge";
      perlaBadge.textContent = "la más fuerte";
      header.appendChild(perlaBadge);
    }

    // Color-beats-Full quirk cue (Color and Full rows)
    if (entry.quirkCue) {
      const cue = document.createElement("span");
      cue.className = "help-rankings__quirk-cue";
      cue.textContent = entry.quirkCue;
      header.appendChild(cue);
    }

    // Note
    const note = document.createElement("p");
    note.className = "help-rankings__note";
    note.textContent = entry.note;
    header.appendChild(note);

    row.appendChild(header);

    // Example cards — a full-width strip below the header
    const cardsGroup = document.createElement("div");
    cardsGroup.className = "help-rankings__cards";

    for (const cardId of entry.cards) {
      const img = document.createElement("img");
      img.src = getCardTextureUrl(cardId);
      img.alt = cardAlt(cardId);
      img.loading = "lazy";
      img.className = "help-rankings__card-img";
      cardsGroup.appendChild(img);
    }
    row.appendChild(cardsGroup);

    root.appendChild(row);
  }

  container.appendChild(root);
}

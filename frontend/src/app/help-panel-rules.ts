/**
 * help-panel-rules.ts — Renders the "Cómo se juega" section into the
 * help-panel body.
 *
 * DOM/UI only: no engine, Pixi, Colyseus schema, or networking imports.
 * All rule content is static castizo prose, engine-verified against
 * src/rooms/game/glossary.ts / WinnerDeterminator / CardEvaluator.
 * Text is set exclusively via .textContent — no .innerHTML injection.
 */

// ---------------------------------------------------------------------------
// Engine-verified mechanic cards (adapted from web/components/rules-section.tsx)
// Facts reconciled against glossary.ts + WinnerDeterminator.ts + CardEvaluator.ts
// ---------------------------------------------------------------------------

interface MechanicCard {
  title: string;
  desc: string;
  /** Extra BEM modifier class; null if none */
  modifier: string | null;
}

const MECHANIC_CARDS: MechanicCard[] = [
  {
    title: "La baraja",
    desc: "baraja española de 28 cartas: 4 palos (Oros, Copas, Espadas, Bastos) y 7 rangos por palo: 5, 6, 7, Sota (10), Caballo (11), Rey (12) y As. Del menor al mayor: 5 < 6 < 7 < Sota < Caballo < Rey < As — el As manda.",
    modifier: null,
  },
  {
    title: "El estilo",
    desc: 'Una mezcla de póker tapado y abierto, jugado con estructura "No-Limit".',
    modifier: null,
  },
  {
    title: "El reparto",
    desc: "Cada jugador recibe 2 cartas cerradas, repartidas en sentido antihorario, y se usan 5 cartas comunitarias reveladas una a una. Hasta 6 jugadores por mesa.",
    modifier: null,
  },
  {
    title: "La regla de oro",
    desc: "Es obligatorio usar las DOS cartas de tu mano para formar tu jugada. Siempre. Sin excepción.",
    modifier: "help-rules__card--gold",
  },
];

// ---------------------------------------------------------------------------
// Engine-verified 6 betting streets
// Source: PHASES enum = PREFLOP → CARD_1 → CARD_2 → CARD_3 → CARD_4 → CARD_5
// TOTAL_BETTING_ROUNDS = 6 (glossary.ts)
// ---------------------------------------------------------------------------

interface StreetItem {
  label: string;
  desc: string;
}

const STREETS: StreetItem[] = [
  {
    label: "Inicio (preflop)",
    desc: "No hay ciegas. Todos los jugadores apuestan por orden hasta el repartidor; se puede ir all-in en cualquier momento.",
  },
  {
    label: "Primera carta",
    desc: "Se levanta la primera comunitaria. Habla primero el último que apostó o subió en la ronda anterior —el último agresor— (si sigue activo; si no, el siguiente al repartidor).",
  },
  {
    label: "Segunda carta",
    desc: "Se levanta la segunda comunitaria; misma mecánica de apuestas.",
  },
  {
    label: "Tercera carta",
    desc: "Se levanta la tercera comunitaria; misma mecánica.",
  },
  {
    label: "Cuarta carta",
    desc: "Se levanta la cuarta comunitaria; misma mecánica.",
  },
  {
    label: "Última carta (river)",
    desc: "Se levanta la quinta comunitaria y se juega la última ronda de apuestas. Luego, showdown: gana quien forme la mejor mano usando las DOS cartas de su mano y tres de las comunitarias.",
  },
];

// ---------------------------------------------------------------------------
// renderRules — mounts the section into `container` (idempotent)
// ---------------------------------------------------------------------------

/**
 * Build and mount the "Cómo se juega" rules section into `container`.
 * Idempotent: a prior `.help-rules` node is removed before re-rendering.
 * All text is set via .textContent — no .innerHTML injection.
 */
export function renderRules(container: HTMLElement): void {
  // Idempotency: remove any previously-rendered rules root.
  const existing = container.querySelector(".help-rules");
  if (existing) {
    existing.remove();
  }

  const root = document.createElement("section");
  root.className = "help-rules";
  // Name the region from its heading (avoids duplicate AT announcements).
  root.setAttribute("aria-labelledby", "help-rules-heading");

  // -------------------------------------------------------------------------
  // Section heading
  // -------------------------------------------------------------------------
  const heading = document.createElement("h2");
  heading.className = "help-rules__heading";
  heading.id = "help-rules-heading";
  heading.textContent = "Cómo se juega";
  root.appendChild(heading);

  // -------------------------------------------------------------------------
  // Mechanic cards
  // -------------------------------------------------------------------------
  const mechanicsGroup = document.createElement("div");
  mechanicsGroup.className = "help-rules__mechanics";

  for (const card of MECHANIC_CARDS) {
    const cardEl = document.createElement("div");
    cardEl.className = "help-rules__card";
    if (card.modifier) {
      cardEl.classList.add(card.modifier);
    }

    const cardTitle = document.createElement("h3");
    cardTitle.className = "help-rules__card-title";
    cardTitle.textContent = card.title;
    cardEl.appendChild(cardTitle);

    const cardDesc = document.createElement("p");
    cardDesc.className = "help-rules__card-desc";
    cardDesc.textContent = card.desc;
    cardEl.appendChild(cardDesc);

    mechanicsGroup.appendChild(cardEl);
  }

  root.appendChild(mechanicsGroup);

  // -------------------------------------------------------------------------
  // Betting streets block
  // -------------------------------------------------------------------------
  const streetsBlock = document.createElement("div");
  streetsBlock.className = "help-rules__streets";

  const streetsHeading = document.createElement("h3");
  streetsHeading.className = "help-rules__streets-heading";
  streetsHeading.textContent = "Las 6 calles";
  streetsBlock.appendChild(streetsHeading);

  const streetsLead = document.createElement("p");
  streetsLead.className = "help-rules__streets-lead";
  streetsLead.textContent =
    "Las 5 cartas comunitarias se revelan una a una, generando 6 rondas de apuestas (preflop + las 5 cartas).";
  streetsBlock.appendChild(streetsLead);

  const streetsList = document.createElement("ol");
  streetsList.className = "help-rules__streets-list";
  // `list-style: none` strips list semantics in Safari/VoiceOver — restore them.
  streetsList.setAttribute("role", "list");

  for (const street of STREETS) {
    const li = document.createElement("li");
    li.className = "help-rules__street";

    const streetLabel = document.createElement("strong");
    streetLabel.className = "help-rules__street-label";
    streetLabel.textContent = street.label;
    li.appendChild(streetLabel);

    const streetDesc = document.createElement("span");
    streetDesc.className = "help-rules__street-desc";
    streetDesc.textContent = " — " + street.desc;
    li.appendChild(streetDesc);

    streetsList.appendChild(li);
  }

  streetsBlock.appendChild(streetsList);
  root.appendChild(streetsBlock);

  container.appendChild(root);
}

# Visual + Mobile audit — Move 2 build snapshot

> Audit run: 2026-05-18 against HEAD `0bc8f92`.
> Method: headless Chromium driven by `scripts/visual-audit.ts` over three viewports (desktop 1440×900, tablet 768×1024, mobile 375×812 @ DPR 2) capturing 10 key flow checkpoints per viewport + a `measurements.json` snapshot of design tokens, button box sizes and viewport metrics.
> Screenshots: `.dev-stack/visual-audit/` (gitignored).
> Purpose: honest baseline before opening the "Visual + Mobile Polish & Premium Table Feel" Move.

This is observation only. No code changes proposed inside this document — only findings + a roadmap for the next Move.

---

## What is genuinely good (do not touch)

Don't lose these in the polish Move — they're the brand's strongest assets right now.

1. **Auth scene desktop two-column hero** — "EL PÓKER QUE SOBREVIVIÓ AL CASINO." in Manrope-serif tension with the cartoon characters, restrained gold, clear ACCEDER / CREAR CUENTA tabs, gold primary CTA. Editorial in tone, brand-correct.
2. **Auth scene mobile single-column** — collapses cleanly, keeps headline + characters + chips visible above the form card. 44 px touch targets on tabs and primary CTA.
3. **Tablet lobby** — better than desktop: drops the characters, stacks `MESAS EN VIVO` + `RANKING` vertically with breathing room, `RANKING` shows the gold/silver/bronze medal circles and the "Los reyes del bote" castizo subtitle.
4. **Design tokens** — `--felt-main #0d5f4a` (forest green) and `--gold #f4c430` (mustard) are the right Chiribito colors. Body font Manrope is a premium choice.
5. **Move 2 reconnect mechanics** — verified in E2E (40/40 × 3 runs). The visible regressions described below are layout/UI level, not protocol level.

---

## Findings by priority

### P0 — breaks "premium" feel / blocks real play

Each P0 is a single change anyone would notice on first 30 s of use.

#### P0-1. The mesa sidebar is a dev/debug panel

**Where:** desktop 1440 `04_mesa_alone`, `05_mesa_2players`, `06_mesa_full`.

The left sidebar shows raw protocol stats: `API: http://localhost:3000`, `WS: ws://localhost`, `Sala: BqfHKaCdP`, `Sesión: ...`, `Estado: Esperando`, `RTT: 0/0ms`, `Calidad: EXCELENTE`, `Búfer: 0`, `Conexión: EXCELENTE`. Followed by `JUGADORES` listing usernames as raw strings and a `HAND HISTORY` empty section.

This panel is operational, not playful. For a player it reads like dev tools. It is the single most "indie/temporal/placeholder" element in the entire build.

**Root cause:** the sidebar was originally a debug HUD and never got a player-facing redesign. The information shown (URLs, RTT, buffer state) belongs in DevTools or a discreet `?debug` flag, not in the chrome of a real game.

**What a player needs in that real estate instead:** their stack with a chip-stack visualization, hand history with hand outcomes, lobby return CTA, maybe a mini-chat. The connection indicator can stay as the existing single coloured dot.

#### P0-2. The mesa loses its identity below desktop width

**Where:** tablet `04_mesa_alone`, mobile `04_mesa_alone` / `05_mesa_2players`.

Below ~1100 px the mesa stops being a poker table and becomes a stacked column: a small oval at the top with phase pills inside, a `CARTAS COMUNITARIAS` placeholder pill, a `TUS CARTAS` placeholder pill, then a text list "JUGADORES EN LA MESA" with one row per player, then the action panel.

Desktop has six seats arranged around the oval rim with chip values at each position. Tablet and mobile do not. The visual concept "you and five friends around a table" is missing for any device narrower than 1100 px.

**Root cause:** the seat-around-rim layout uses absolute positioning that does not respond to viewport scaling. The mobile fallback flattens into a vertical feed because there was no compact-table primitive built.

This is the biggest single hit to "premium table feel" on the dominant viewport (mobile).

#### P0-3. Duplicate pot indicator

**Where:** every mesa screenshot, all viewports.

Inside the table you see two pot labels at once: a styled dark chip `POT 0` and a plain text `Pot: 0` directly below it. Same data, two presentations. Reads like a half-finished migration.

#### P0-4. Action panel always visible with all six actions

**Where:** every mesa screenshot, all viewports.

`START GAME`, `CHECK`, `CALL`, `FOLD`, `ALL-IN`, `BET`, `RAISE`, plus a `20` chip-stack input — all rendered, with the non-applicable ones dimmed. Pre-game, only `START GAME` makes sense; out-of-turn, none. The persistent grey button row is permanent visual noise that competes with the table for attention.

**Mobile impact:** the action panel takes ≥ 40 % of the screen height in waiting state (see mobile `04_mesa_alone`). The "table" reads as a sidebar to the controls instead of the other way round.

#### P0-5. Phase indicator is illegible

**Where:** every mesa screenshot.

The row right under the pot shows four small pills: `ESPERANDO · TURNO - · RELOJ - · JUGADA -`. At desktop these are too small to read; the dashes after `TURNO`, `RELOJ`, `JUGADA` mean nothing to a player. The current phase highlight (gold dot under one of the pills) is not visible at the captured zoom.

**Root cause:** the original 6-streets phase indicator from Fase 3 (`Calle 4/6 · 3ª comunitaria` with six dots) appears to have been replaced or layered with a different status-pill row. The current row mixes phase + clock + last-action + bet status into one cramped strip.

---

### P1 — high impact on perceived quality

#### P1-1. No seat presence / no avatars

Every seat slot is an identical thin oval ring with a number value (`1.000€` or `0.000€`). No avatars, no names on the seats themselves, no indication of who is sitting where. The sidebar shows player names but the table does not. There is no visual link between "Player X" in the sidebar and the seat they occupy on the rim. Even a placeholder circle with the username initial would close the loop.

#### P1-2. Reconnect banner does not appear during pre-game waiting

**Where:** desktop / tablet / mobile `07_reconnect_banner` are visually identical to `06_mesa_full` — no banner.

In our audit the player is seated in a freshly created mesa, status `Esperando`, and we toggle offline for 2.5 s. The banner controller never renders. E2E step 8 (which does show the banner) runs after an in-progress game state, so the banner works there.

**Hypothesis (to be verified during the polish Move):** `shouldAutoReconnect` is `false` until the game starts, so the director never enters its loop pre-game; or the banner debounce window swallows the visible duration if the reconnect succeeds quickly. Either way, a user waiting for friends with a dropping connection sees zero feedback.

#### P1-3. Mobile lobby touch targets under spec

From `measurements.json`:

| Control | Mobile box | Issue |
|---|---|---|
| `Unirme` (per mesa row in `MESAS EN VIVO`) | 72 × 31 | 31 px ≪ 44 px iOS minimum |
| `Refrescar` | 121 × 33 | 33 px below minimum |
| `Salir` (top-right) | 78 × 39 | 39 px below minimum |

The primary CTAs (`+ Abrir mesa`, `Unirme por código`, auth tabs, action panel buttons) are all 44 – 50 px and fine. Only the secondary/utility controls are too small.

#### P1-4. Empty-state copy is flat

`MESAS EN VIVO` empty state on desktop: `Cualquiera puede pedir mesa.` reads like a system stub. The lobby hero has voice ("Elige tu mesa o abre la tuya." + "Veintiocho cartas, seis rondas, hasta seis jugadores. Tu habitación de cada Jueves.") but the empty state of the live-tables list breaks that voice. Plus the subtitle differs between desktop (`Tu habitación de cada Jueves`) and mobile (`Los habituales ya están dentro`).

#### P1-5. No depth on the table

The felt is a flat green oval with a gold rim. No drop shadow under the rim, no soft top-down light, no felt texture/grain, no specular gloss on the chip pile (the chip pile is currently a single styled `<div>` rather than a stack of stacked SVGs). At the cards' eventual placement zones we also don't see any reserved well or "card slot" affordance.

#### P1-6. The connection indicator is doing two jobs poorly

The top-right of the mesa shows a coloured dot ("EXCELENTE" tooltip) and the sidebar also shows `Conexión: EXCELENTE`. Same datum, two places, neither hooked into the reconnect-banner state visually — so when the banner DOES show, the dot does not turn yellow/red in sync.

---

### P2 — polish / tactility

#### P2-1. No tactile press states

Action buttons (`CHECK`, `CALL`, `FOLD`, `ALL-IN`, `BET`, `RAISE`) appear flat at rest, no hover lift on desktop in the screenshots (would need a video to confirm; the static is suggestive). On mobile, no documented `:active` scale-down or haptic-style transform. Compared to the existing GSAP card-tilt-on-hover (which IS present per memory `feedback_chiribito_north_star.md`), the chrome controls feel "less alive" than the cards.

#### P2-2. Sidebar typography hierarchy

In the desktop mesa sidebar the rows have nearly identical font weight and size: `API`, `WS`, `Sala`, `Sesión`, `Estado`, etc. all read as a single uniform list. There's no visual primary/secondary split, no group spacing.

#### P2-3. Ranking entries are cramped

In the desktop lobby `RANKING` panel, entries show full username (`bot_mpb4kbu6_unh2`) + `1 ganadas - 2 jugadas` on a single tight line. On tablet the medal circles solve part of the issue but the username remains long. Truncation rule + an optional alias display would help.

#### P2-4. Lobby ranking shows leftover test users

`bot_mpb...` and `vau_...` usernames from previous audit + E2E runs pollute the live ranking. Not a visual bug but means production sees a polluted "RANKING" UI. A dev-mode flag to filter `bot_*` / `vau_*` prefixes in non-production environments would help.

#### P2-5. The `start-game` button text is in English

`Start Game` in the action panel. Everything else is Spanish (`Crear cuenta`, `Iniciar sesión`, `Abrir mesa`, `Unirme`, `Salir`). Should be `Empezar partida` or similar.

#### P2-6. Phase indicator dashes

`TURNO - / RELOJ - / JUGADA -` — the dashes are placeholder for an empty value. When the value is empty, hide the pill entirely instead of showing `-`.

---

### P3 — cosmetic

- `MESA vau_1779106240224_4BVN` room IDs in lobby cards are unreadable strings. The mesa name `Mesa <username>` placeholder also reuses the username. A friendlier "Mesa de X" + `#A1B2` short-code display would help.
- The top-of-screen "CÍRCULO PRIVADO" badge in the lobby is small and easy to miss.
- `back-to-auth` button label `Salir` is direct but a confirmation modal would prevent accidental logout-on-mobile.
- The auth tabs `ACCEDER / CREAR CUENTA` show a gold underline only on the active tab. The inactive tab has no hover/focus affordance.
- Mobile auth screen has dead space between the hero block and the form card. Could compress.

---

## Cross-cutting observations

### Continuity (real Move 2 promise)

The reconnect mechanics pass automated E2E. But the UI never visualises the recovery in the most common scenario (waiting state). The discreet-UX requirement was hit so well it became invisible — including when it shouldn't be. A "connection status pill" that turns yellow during retries and green on success, separate from the banner, would address P0/P1 without re-introducing modals.

### Mobile-first vs mobile-fallback

The mobile and tablet mesa layouts feel like fallbacks rather than designs. Auth and lobby were clearly designed mobile-first; the mesa was not. This is the largest delta between auth/lobby quality and mesa quality.

### Vocabulary drift

`Start Game` (English) in an otherwise Spanish UI. `TURNO`, `RELOJ`, `JUGADA` truncated with `-` dashes when empty. `Pot: 0` (English-ish label) alongside the styled `POT 0` chip. Castizo voice present in auth + lobby ("La Perla esperando", "Tu habitación de cada Jueves") but absent in the mesa chrome.

### Two-screen asymmetry

Desktop dedicates ~25 % of width to a sidebar that is mostly dev stats; mobile/tablet hide the sidebar entirely (panel toggled `◀`). The desktop sidebar real estate is misallocated.

---

## Proposed roadmap — "Visual + Mobile Polish & Premium Table Feel"

Six slices, each shippable independently. Order is the recommended sequence (each slice unblocks observation of the next). Server intact, engine intact, no new abstractions.

### Slice A — Mesa chrome cleanup (P0-1 + P0-3 + P0-4 + P0-5 + P2-5)

- Replace the dev-stats sidebar with a player-facing panel: stack visualization (chip image stack with count badge), hand history, current-round summary. Move URLs/RTT/buffer behind a `?debug=1` flag.
- Remove the duplicate `Pot: 0` text; keep only the styled chip.
- Action panel: show only `START GAME` in waiting state; show only the contextually-valid actions in-game (`CHECK`/`CALL`/`FOLD` when no bet, `CALL`/`RAISE`/`FOLD` when bet exists, `ALL-IN` always available). Localize `Start Game → Empezar partida`.
- Phase indicator: restore the Fase 3 six-dot streets display (`Calle 4/6 · 3ª comunitaria`). Drop the `TURNO - / RELOJ - / JUGADA -` pills entirely; surface that info next to the active player's seat where it belongs.

### Slice B — Compact-table primitive for mobile + tablet (P0-2 + P1-1)

- Build a single `compact-table` layout that renders the oval + six seats at any width ≥ 320 px.
- Seats become avatar pucks: circular `<div>` with username initials, chip count below, ring around active speaker. Maintain absolute positioning but use percentage offsets relative to the oval's bounding box.
- Below ~600 px the oval rotates to portrait orientation (taller than wide) and seats stack in a 2-3-1 pattern that still reads as "table".
- Acceptance: at 375 × 812 the user sees the table + their seat + at least three other seats above the action panel, without scrolling.

### Slice C — Reconnect banner visibility + connection pill (P1-2 + P1-6)

- Always set `shouldAutoReconnect = true` once `mountJoinedRoom` runs (including waiting states). Confirms the director runs in pre-game too.
- Add a small "connection chip" near the player seat: green dot at rest, yellow with "Reconectando…" when director is in `trying`, red on `degraded`. Lower visual weight than the top banner. Wired off the same `onAttemptChange` signal.
- Keep the discreet top banner; remove the sidebar duplicate `Conexión: EXCELENTE` row.

### Slice D — Touch targets + mobile chrome (P1-3 + P3 list)

- Bump `Unirme` (per mesa row), `Refrescar`, `Salir` to ≥ 44 px height. Adjust padding, not font size.
- Auth tab inactive state: subtle `border-bottom: 2px solid transparent` so the absence of gold underline reads as "inactive" rather than "broken".
- Friendlier room labels: `Mesa de <username>` + `#A1B2` short code (last 4 chars). Truncate username to 12 chars with ellipsis.

### Slice E — Table depth + tactile press (P1-5 + P2-1 + P2-2)

- Felt: add subtle radial gradient (centre lighter than edges) + 1-px noise overlay (cheaply via base64 PNG, no GSAP).
- Rim: drop shadow `0 8px 24px rgba(0,0,0,0.35)` + inner highlight.
- Card slots: reserve two soft-edge wells for `TUS CARTAS` and five wells for `CARTAS COMUNITARIAS` so when no cards are present we see the absence framed, not a green void.
- Action buttons: `:active` transform `scale(0.97)` + 80-ms colour pulse. On touch devices, no hover, only active.
- Sidebar typography (after Slice A): primary stats (`STACK`, `HAND`, `POT MINE`) in 14 px semibold; secondary in 11 px regular muted.

### Slice F — Empty states + voice + ranking polish (P1-4 + P2-3 + P2-4 + P2-6 + P3 list)

- Empty `MESAS EN VIVO`: "El círculo está vacío. Sé el primero en abrir mesa." (matches castizo voice).
- Sync mobile/desktop subtitle: pick one — recommend `Tu habitación de cada Jueves`.
- `RANKING` row: username max 12 chars + medal circle (already on tablet) + tighter line height. Add `(tú)` next to your own row.
- `bot_*` / `vau_*` username filter in non-production environments — read `import.meta.env.MODE` and exclude.
- Hide phase pill values when empty (no `-` placeholder).

### Slice G — Visual audit doc closeout + memory

- Update this doc with diff of what landed vs what didn't.
- Update `memory/project_chiribito.md` resume point.
- Document new design tokens (rim shadow, well shape, chip stack measurement).

---

## Validation plan for the polish Move (when it runs)

- Re-run `scripts/visual-audit.ts` after each slice; compare new screenshots side-by-side with the baseline saved in `.dev-stack/visual-audit/`.
- Acceptance per slice has at least one screenshot diff + one `measurements.json` field that changed in the expected direction.
- E2E Playwright suite (`scripts/e2e-browser.ts`) must stay 40/40 × 3 runs throughout.
- Manual smoke per slice: desktop 1440 + mobile 375 + a 2-tab multi-player session with a network drop somewhere in the middle.

---

## Out of scope for the polish Move

- Engine / managers / schemas / glossary (Chiribito real rules).
- Server `reconnectionTimeoutSeconds` (Move 2 user-locked at 60 s).
- `SESSION_EXISTS` gate (Move 5).
- Auth flow / token refresh / logout (Move 3).
- Single-player auto-dispose fix (separate Move).
- Render / Docker deploy.
- New character art, new card art, new mascot art (all branding stays untouched per `feedback_chiribito_north_star.md`).

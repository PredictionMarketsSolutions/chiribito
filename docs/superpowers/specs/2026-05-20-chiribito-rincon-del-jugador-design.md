# Chiribito — El Rincón del Jugador (Slice 1) · Design Spec

> **Status: APPROVED — ready for implementation planning.** Date: 2026-05-20. Spec-review answers folded in (§14).
> First slice of the player profile / social-identity system, built **soul-first**,
> inside the game client. Visual direction validated through 4 companion mockups.
> Domain/UI terms stay in Spanish (product language); prose in English (repo convention).

---

## 1. Objetivo (what + why)

Build the first **living player profile** inside the Chiribito game client — *"tu rincón
dentro del universo Chiribito"* — that already feels **premium, warm, social, shareable and
with identity**, using **only real minimal data + honest derived/teaser elements**, with
**no fake corporate UI**.

It is explicitly **NOT** a dashboard, analytics panel, generic gaming profile, modern social
app, or SaaS surface. It is an **artisanal living object** of the Chiribito bar/universe.

**Why now:** the game client already owns auth, identity and the strongest castizo/nocturnal
atmosphere. This slice delivers felt value with near-zero new schema and produces the
**reusable foundation components** every later social phase will inherit.

---

## 2. Dirección visual bloqueada (locked)

Validated with the user across the companion session. **Do not re-litigate without explicit "go".**

- **"El Carnet Vivo"** — the membership carnet of the bar as the hero artifact. Balance **70% objeto / 30% presencia** ("objeto artesanal vivo", **not** "perfil social moderno").
- **Hero identity mark = El Lacre** — a generated personal **wax seal** (unique, imperfect). Connects with the carnet; deliberately avoids any avatar/photo/gaming feel.
- **Material DNA:** wood holder (`--wood-*`) + felt face (`--felt-*`) + **naipe** secondary language (double gold hairline frame + Spanish-suit corner pips + a card-style corner rank).
- **Human imperfection (invariant):** slight tilt (placed-on-table), worn/darkened edges, grain overlay, a warm **bar-lamp spotlight** pool from above.
- **Living presence, in minimal doses:** soft aura/breathing, light recency signal, contained streak — *"hay alguien detrás"* without invading identity.
- **Mobile is the primary truth** (mobile-first real); desktop is the scale-up.
- **Tokens are the existing ones** from `frontend/src/style.css` (`--felt-main #0d5f4a`, `--gold #f4c430`, `--ivory #f4ecd8`, `--wood-*`, `--ease-out-expo`, grain SVG, glow/vignette). Fonts: **Cinzel** (display/names), **Manrope** (body/labels), **Cormorant Garamond** italic (mote/flourish).

### Role of the three identity languages
- **A · El Lacre** → **hero** identity (the wax seal). Primary.
- **C · La Figura / presencia** → **secondary, contextual** social presence (recognition at the table). Never protagonist.
- **B · El Hierro / Marca** → **tertiary** graphic language (small details/branding accents). Not a primary surface.

### Two final visual tweaks (locked this session)
1. **"Compartir mi rincón"** must be **discreet/secondary** — a quiet affordance, not a big gold button. The carnet/identity stays the visual hero.
2. **Racha** must be **whisper-level** — present but *very subtle*, no protagonism, no aggressive numbers, never gamified.

---

## 3. Alcance del Slice 1 (in scope)

A new **overlay scene** in the game client (`play.chiribito.com`) showing the logged-in
player's own Rincón, reachable from the **lobby**:

1. `RinconScene` — the overlay scene + atmosphere (bg, glow, grain, vignette, lamp spotlight), open/close, mobile-first scroll.
2. `CarnetVivo` — hero identity card (holder + felt face + naipe frame).
3. `LacrePersonal` — the generated personal wax seal (hero identity mark). **Deterministic, client-side.**
4. `StatMarks` — engraved real stats ("La hoja del socio").
5. `HistoriaStrip` — "Tu historia": real recency facts + honest ghost teaser for future per-hand memories.
6. `CompartirRincon` — **discreet** share affordance (per tweak #1). Slice 1 shares a **castizo text blurb** (mote + rango + the public game URL `play.chiribito.com`) via native share / clipboard — **not** a personal-profile link (no public page exists yet). No new backend.
7. `PresenciaMesa` — a **self-contained preview** inside the Rincón of *"en la mesa apareces así"* (the secondary C presence). **Does NOT modify the live table** (see §9).
8. **One backend change:** expand `GET /api/users/me` to also return the player-stats columns that **already exist** on the `users` table.
9. **Lobby entry point:** a "Mi Rincón" control in the lobby header (alongside the existing sound/logout controls).
10. **Empty state** (new socio, 0 manos) designed to feel alive on day one (see §7).

Everything must be authored as **reusable foundation components** so later phases (public web
profile, achievements, activity, avatars, social graph) reuse the visual language and the data
shape — without rework.

---

## 4. Non-goals / explicitly deferred (out of scope for Slice 1)

These are **deliberately not built now**. They are the seeds the foundation prepares for:

- ❌ **No new DB schema / migrations.** (Slice 1 = soul-first, not schema-first.)
- ❌ **No avatar upload / custom image.** Identity is the generated seal only.
- ❌ **No achievements/logros engine.**
- ❌ **No real activity feed / per-hand or per-game history** (we store only aggregates).
- ❌ **No streak (racha) tracking backend** — racha is a teaser only.
- ❌ **No live presence/online system** — no real "en línea ahora".
- ❌ **No public web profile** on `chiribito.com` (different stack; a later sub-project).
- ❌ **No friend/follow/social graph.**
- ❌ **No user-editable mote/suit** (generation is deterministic; manual choice deferred).
- ❌ **No changes to `TableScene` / live seats / felt / gameplay.** The table is locked by prior perceptual sprints.
- ❌ **No changes to `web/`, PMS, or PT.**

---

## 5. Identidad generada — El Lacre (deterministic, client-side)

Each player's seal is **derived deterministically from their stable identity** (`user.id` +
`user.username`), so it is **unique, stable across sessions, and imperfect**. Nothing is
uploaded; nothing is chosen by hand in Slice 1.

| Element | Rule (Slice 1) |
|---|---|
| **Palo (suit)** | `SUITS[user.id % 4]` where `SUITS = [Oros, Copas, Espadas, Bastos]`. Stable per user. |
| **Monograma** | First letter of `username`, uppercased. (Single initial in Slice 1; 2-initial when display names exist — deferred.) |
| **Tono de cera (wax tone)** | `TONES[user.id % 3]` from a warm house palette: `oro` (default/house), `granate` (oxblood), `bronce`. All warm; no cold/neon tones. |
| **Imperfección (seeded)** | Rotation in `[-8°, +6°]`, irregular `border-radius`, and grain seed all derived from `user.id` — so a given player's seal always looks the same. |

The seal renders as CSS/SVG (no raster assets): radial wax gradient + inset highlights + grain
overlay + irregular edge + the suit glyph embossed (dark pressed tone) + the monogram.

**Suit glyphs** (Oros/Copas/Espadas/Bastos) are authored once as small inline SVGs and reused
across `LacrePersonal`, `StatMarks` pips, `PresenciaMesa`, and the naipe corner pips.

---

## 6. Datos — honesty matrix

The user prizes data honesty. Every shown element is classified. **Nothing fake.**

### Real today (from `users` table via expanded `GET /api/users/me`)
- `username` → display name (the only name we have).
- `games_played` → "Manos/Partidas".
- `games_won` → "Ganadas".
- `total_chips_won` → "Fichas".
- `last_played_at` → **"Última vez en la mesa: anoche / hace 3 días"** (relative time).
- `created_at` → **"Socio desde marzo 2026"**.

### Real, but from a different existing endpoint
- **Puesto en la casa (#N)** → from `GET /api/ranking/top-winners` (top-10 only). Shown **only if the player is in that list**. Otherwise show neutral copy *"sin clasificar aún"* — **never a fabricated rank**.

### Derived client-side (honest computation/cosmetic, no new data)
- **Victorias %** = `round(games_won / games_played * 100)`; if `games_played === 0` → `—`.
- **Rango (veteranía ladder)** from `games_played` — **neutral/inclusive castizo wording (confirmed)**, preferring epicene/place phrases over gendered endings:
  - `0` → **Cara nueva** · `1–9` → **De paso** · `10–49` → **De la parroquia** · `50–149` → **Habitual de la Casa** · `150–499` → **Veteranía de la Casa** · `500+` → **Leyenda de la Casa**.
  - No gender stored; exact copy locked at plan/implementation (the above is the approved neutral direction).
- **Mote** = deterministic castizo alias seeded by `user.id` from a **curated pool**, often referencing the player's suit (e.g. *"La Sota de Oros"*). It is a **cosmetic stable alias**, explicitly **not** a claim about playstyle (we don't track playstyle). Editing deferred. **Tone (confirmed):** humano, de baraja/bar, con personalidad, ligeramente imperfecto — **nunca meme/cartoon**.
- **El Lacre** (see §5).

### Teaser / future (clearly-a-placeholder, never fake numbers)
- **Racha** → no streak storage. Rendered as a **whisper-level teaser** (per tweak #2), or as part of the "pronto…" language. Not a hard gamified counter.
- **"Manos memorables"** in `HistoriaStrip` → ghost/empty marks + *"tus manos memorables, pronto…"*. Establishes the visual slot for future per-hand history without faking entries.
- **Live presence dot ("en línea ahora")** → **deferred** (no presence service). Slice 1 conveys "alive object" through the **aura/breathing + real recency** ("última vez"), not a fake online indicator.

### Backend change (the only one)
`GET /api/users/me` currently returns `{ id, username, email, createdAt }`. **Expand** it to also
return `gamesPlayed`, `gamesWon`, `totalChipsWon`, `lastPlayedAt` (columns already present on the
`users` entity). No migration. Keep `email` out of any shareable payload. Auth unchanged.

---

## 7. Estados (states)

`RinconScene` must define all four:

1. **Default (rich)** — established socio with real stats. As mocked.
2. **Empty (new socio, `games_played === 0`)** — **critical for day-one soul.** Still shows the
   full carnet + their Lacre + name + mote, rango **"Cara nueva"**, stats as `—`/`0`, and
   `HistoriaStrip` reads an inviting castizo line (e.g. *"Tu historia está por escribirse. Siéntate
   a una mesa."*). The empty state must feel like a **fresh membership card**, never a broken/blank profile.
3. **Loading** — atmosphere (bg/glow/grain) renders immediately; carnet skeleton uses felt/gold
   shimmer consistent with tokens (no generic gray skeletons).
4. **Error / offline** — if `GET /api/users/me` fails, show the identity we already know
   (name + generated seal from the cached token/user) with a quiet *"no pudimos cargar tus marcas"*
   line and a retry. Identity never fully fails because the seal is client-derived.

---

## 8. Arquitectura, componentes y ficheros

**Constraint:** the frontend is **vanilla TypeScript + Vite, no framework, no component lib.**
Views are overlay "scenes" toggled by a `.hidden` class (pattern: `.auth-scene`, lobby, tournament).
New surfaces = HTML structure (built in TS) + scoped CSS in `style.css` + wiring in `main.ts`.
Follow the **existing `app/` module pattern**: pure functions accepting explicit deps, no globals.

### Proposed new files (frontend)
- `frontend/src/app/rincon/rincon-scene.ts` — open/close, scene lifecycle, orchestrates sections, owns the four states.
- `frontend/src/app/rincon/identidad.ts` — **pure** deterministic generators: `getSuit(id)`, `getWaxTone(id)`, `getMonogram(username)`, `getImperfection(id)`, `getRango(gamesPlayed)`, `getMote(id, suit)`, `formatUltimaVez(lastPlayedAt)`, `formatSocioDesde(createdAt)`, `winRate(...)`. **Unit-tested** (Vitest) — pure, deterministic, easy to cover.
- `frontend/src/app/rincon/components.ts` — DOM builders: `CarnetVivo`, `LacrePersonal`, `StatMarks`, `HistoriaStrip`, `CompartirRincon`, `PresenciaMesa`. Each returns an `HTMLElement`; each accepts a typed props object; no globals.
- `frontend/src/app/rincon/suits.ts` — the 4 Spanish-suit inline-SVG factories (shared).
- `frontend/src/app/rincon/types.ts` — `RinconData`, `Identidad`, `Rango`, etc.
- `frontend/src/app/rincon/rincon.css` — all Rincón styles in a **new separate file** (imported via Vite), scoped under `.rincon-scene`, reusing existing CSS variables. **Do not edit the large shared `style.css`** (keeps isolation and avoids colliding with the uncommitted edit there).

### Data layer
- Reuse `frontend/src/security/api-client.ts` (`ApiClient`) — it already injects auth headers.
- Add a typed `getMyRincon()` call hitting the **expanded** `GET /api/users/me`, plus an optional
  read of `GET /api/ranking/top-winners` to resolve "puesto" (reuse existing winners fetch; do not duplicate).

### API server change
- The route handler serving `GET /api/users/me` (in `api-server/src/controllers/` — confirm the
  exact file during planning): widen the selected columns + response DTO to include `gamesPlayed`,
  `gamesWon`, `totalChipsWon`, `lastPlayedAt`. Update/extend its tests. **No migration, no auth
  change.** (`email` stays in the player's own `/me` response but is never used in the share blurb.)

### Integration / entry point
- `index.html`: add `#rincon-overlay` scene container following the `#auth-overlay` / lobby pattern.
- `main.ts`: add `setRinconOverlayVisible(bool)`; wire a **"Mi Rincón"** control in the lobby header
  (next to sound/logout) that opens the scene and triggers `getMyRincon()`.
- `dom-refs.ts`: register the new refs.
- Close returns to the lobby. Scene reuses the `.hidden` toggle convention.

---

## 9. Integración con la mesa (PresenciaMesa) — boundary

- In Slice 1, `PresenciaMesa` is rendered **only inside the Rincón** as a preview (*"en la mesa
  apareces así"*: seal + name + mote on a mini-seat illustration). It is a self-contained component.
- **Wiring the seal/mote into the actual `TableScene` seats is DEFERRED** to a separate, explicitly
  gated step. The live table + felt are locked by prior perceptual sprints; we do not touch them in
  this slice. Designing `PresenciaMesa` now means the later table integration is a drop-in, not a redesign.

---

## 10. Motion (subtle)

- Reuse `--ease-out-expo` / `--ease-spring` and existing durations.
- Scene-in: fade + soft rise (like `.auth-scene`).
- Aura: slow breathing (~3.4s). Lamp spotlight static. Glow drift reused.
- Respect `prefers-reduced-motion`: disable breathing/drift, keep static composition.
- No bouncy/gamified motion; everything calm and warm.

---

## 11. Responsive (mobile-first real)

- Mobile is the design source of truth: single-column scroll inside the scene; carnet hero, then
  `StatMarks` (3-col grid), `HistoriaStrip`, discreet share, `PresenciaMesa`.
- Desktop: carnet hero on one side, stats/historia/share stacked beside it; same components, no new
  layout primitives. Breakpoint approach consistent with the existing scenes.
- Touch targets ≥ 40px; the close/back and "compartir" must be comfortably tappable.

---

## 12. Riesgos + mitigaciones

| Riesgo | Mitigación |
|---|---|
| Derivar hacia avatar/gaming/SaaS | Seal-as-identity (no avatar), engraved stats, carnet hero, locked tokens. Visual direction frozen in §2. |
| Fake data leaking in | §6 honesty matrix is binding; racha/online/"#N for non-top" handled honestly. |
| Tocar la mesa/felt (bloqueada) | §9 boundary: `PresenciaMesa` is preview-only; no `TableScene` edits this slice. |
| `style.css` is large + a user edit is uncommitted | Author Rincón CSS in a **separate scoped file**; never sweep the uncommitted `style.css` change into our commits. |
| Vanilla DOM scope creep | Components are pure DOM builders with typed props; logic generators are pure + unit-tested. |
| Empty state feeling broken | §7 mandates a soulful day-one empty state. |

---

## 13. Validación / criterios de éxito

- **Feel:** reads as *"tu rincón dentro del universo Chiribito"* — premium, warm, artisanal, an object; not a dashboard. (User perceptual sign-off.)
- **Honesty:** every visible element maps to §6; no fabricated numbers; teasers clearly read as future.
- **Identity:** two different users get visibly distinct, stable, imperfect seals (deterministic).
- **States:** default, **empty (new socio)**, loading, error all render with soul.
- **Mobile-first:** looks intentional on a phone first; scales to desktop with no new layout system.
- **Isolation:** no changes to `TableScene`/felt/gameplay, `web/`, PMS, PT. One backend change (`/me`).
- **Tests:** `identidad.ts` pure generators covered by Vitest; api-server `/me` test updated. Existing suites stay green.
- **Foundation:** components + data shape are reusable by the deferred phases without rework.

---

## 14. Decisions resolved at spec review (2026-05-20)

1. **Mote** — ✅ curated castizo pool, deterministic/stable, suit-referencing. Feel: humano, de baraja/bar, con personalidad, ligeramente imperfecto; **never meme/cartoon**.
2. **Rango** — ✅ neutral/inclusive castizo wording (epicene/place phrases, no gendered endings) — see §6 ladder.
3. **Compartir** — ✅ keep discreet + limited; **no fake profile pages**; a small shareable social *seed* (text blurb), never promising a page that doesn't exist.
4. **Racha** — ✅ keep as a **very subtle teaser**, no protagonism, no aggressive numbers.

**Locked boundaries reaffirmed by user:** _mesa, felt, gameplay feel, current atmosphere, and the main `style.css`_ stay **completely untouched** this slice.

---

**End of design spec. Next step: user review → then `writing-plans` for the implementation plan.**

# Chiribito Web — Product Vision & Roadmap

> **Status:** SPEC — audit-only · NOT a commitment to execute · 2026-05-20
> **Scope:** `web/` layer of `chiri-app/` (the public site at `chiribito.com`)
> **HEAD at audit time:** `7443b4f` (canon alignment wave closed)
> **Out of scope:** gameplay runtime, `frontend/`, `api-server/`, `src/`, infra (play/backend/realtime), domain config

---

## 1. Context + scope

### What this doc IS

A unified product vision for `web/` that:

- Diagnoses the current state honestly
- Establishes a north star to gate every future change
- Verdicts every existing component (`KEEP / REFINE / REWRITE / REMOVE`)
- Sequences work in 5 waves ordered by leverage (defensive → identity → funnel → narrative → polish)
- Defines what we explicitly will NOT do, so scope can't drift

It is the **single source of truth** for what `web/` should become over the next several sprints.

### What this doc IS NOT

- ❌ A code plan — each wave gets its own `writing-plans` pass before execution
- ❌ A copy draft — we sketch tone, not final text
- ❌ A schedule — no dates, no estimates beyond t-shirt sizes
- ❌ A redesign brief — no mockups, no new component inventory beyond what already exists
- ❌ A pretext to touch `frontend/`, `src/`, `api-server/`, or infra — those are sealed

### Sign-off model

| Stage | Gate | Decision rights |
|---|---|---|
| This doc | User approves vision/structure | Full vision lives or dies here |
| Wave plan (per wave) | `writing-plans` produces atomic implementation plan | Per wave |
| Wave execution | Atomic commits, stop-on-ambiguous | Per commit |

No wave executes without its own plan-phase + user "go".

### Operational stance

Single landing (`/`) + one secondary route (`/contacto`). Static-ish. No backend today (newsletter is fake, see §3). Vercel team `chiribito293-7173s-projects`, project `chiribito-web`. The deploy contract from Phase W is preserved: independent from game stack, no shared deps, separate Vercel project.

---

## 2. North star — the compass card

Every change in `web/` must be gated against this card. If a change reinforces a "push" pole, ship. If it reinforces a "reject" pole — even slightly — cut it before it ships.

### 2.1 Push hard (the soul to reinforce)

| Pole | What it means concretely |
|---|---|
| **Clandestinidad madrileña** | Sótanos, trastiendas, cafés castizos, Gran Vía, humo, lámparas bajas. References to physical spaces, not abstractions. |
| **Hermandad / círculos selectos** | Not "users" — *parroquianos*. The web speaks to insiders, even when explaining the basics. |
| **Ritual** | Sentarse a la mesa is an act, not an action. Openings, closings, ceremony. Tempo > efficiency. |
| **Underground** | Subtle. Slow reveals. Gold under penumbra. No bright banners. Reward attention. |
| **Castizo** | Spanish vocabulary first. Sota / Caballo / Rey / Perla / envidarse / pasar / igualar / tirar / mesa / mano / cantar. |
| **Histórico-pero-vivo** | Not a museum. The mesa is here, now, with the smoke and the people. The past gives weight; the present uses it. |
| **Premium artesanal** | One piece at a time. Cartas Fournier. Logo dibujado a mano. Detalle por detalle. No factory pattern. |
| **Misterio / leyenda** | El Cabezón de Elche. El Refugio. Cosas que sugieren, no que explican. |
| **Exclusivo** | Not for everyone. The web doesn't fight to convince — it stays itself, and you come closer if it pulls you. |

### 2.2 Reject explicitly (the casino-DNA to delete)

| Anti-pole | Currently visible in | Why it kills Chiribito |
|---|---|---|
| **Casino online genérico** | `BonosSection`, `TorneosSection` headers, `ReviewsSection`, hero alt "Mesa de casino" | Makes Chiribito interchangeable with 50 sites |
| **SaaS moderno vacío** | "Promociones exclusivas", "Club VIP", grid-of-icons sections | Drains the place of place |
| **Startup AI / techno-bro** | None today, but a future risk if we drift | Castizo is anti-tech-bro by definition |
| **Poker-site clon** | "Botes garantizados", "Eventos diarios", "miles de jugadores" | Reduces a mythology to a product feature |
| **Trust theater** | Fake Trustpilot stars, "reseñas verificadas" without reseñas | Anti-trust signal in a "trust" section |
| **Fake metrics / performance** | "50+ años", "1000+ jugadores activos" | Lie meter: high. Brand damage: permanent. |
| **Fake economy** | "Bono de Bienvenida 100% en primer depósito", "cashback", "tiradas gratis", "tickets" | Chiribito has none of this. Lying about features = lying about identity. |
| **Disabled CTAs with `Próximamente`** when product exists | Hero CTA, Navbar "Juega Ya" | The site denies its own product. Self-sabotage. |
| **Crypto / gambling slop aesthetics** | Not visible today, watch in Wave 3+ | Permanent identity destruction risk |

### 2.3 The one-sentence gate

> **"Would a parroquiano del Círculo de Bellas Artes en 1965 recognize this as suyo?"**

If yes — ship it. If no — cut it or rework until yes.

### 2.4 Castizo vocabulary primer (working set)

Push these:
`mesa · mano · echar una mano · sentarse · cantar · Sota · Caballo · Rey · As · Perla · envidarse · pasar · igualar · tirar · apostar · subir · empezar mano · sala · salón · trastienda · sótano · hermandad · círculo · parroquia · tertulia · penumbra · humo · ritual · castizo · castizos · clandestino · el que reparte · el que da`

Ban these from user-facing copy (internal tech terms are fine):
`bono · cashback · tiradas gratis · Club VIP / VIP · tickets · jackpot · deposito · multiplicador · promo · promoción · spinning / spins · welcome bonus · loyalty program · earn / earnings`

When in doubt, prefer the castizo word over the global poker word.

---

## 3. Diagnostic snapshot (the audit, formalized)

Five buckets, sorted by severity. File:line references throughout. **No softening language.**

### 3.1 🔴 Credibility — things that lie to the user

| # | Issue | Where | Brutal verdict |
|---|---|---|---|
| C1 | **Fake Trustpilot stars** with claim "miles de jugadores nos eligen cada día" and CTA to an empty Trustpilot page | `components/reviews-section.tsx:33-39, 42-47` | A "trust" section that is itself the anti-trust signal. Remove this week. |
| C2 | **Stats inventados** (`50+ años de historia`, `1000+ jugadores activos`) rendered on first day of production with no data behind | `app/page.tsx:51-58` | Lie. Brand damage is permanent and silent. |
| C3 | **Newsletter is a lie machine** — `// Simulate sending - replace with real API call`, `setTimeout(1200)`, returns "Bienvenido al club" with no email actually sent | `components/newsletter-section.tsx:18` | Worst single issue on the site. Captures emails it cannot deliver to, claims success it didn't perform. GDPR-adjacent. Disable today. |
| C4 | **Bonos casino-clone falsos**: "Bono de Bienvenida 100% en primer depósito", "Recompensas Diarias / tiradas gratis / saldo extra", "Club VIP / cashback" | `components/bonos-section.tsx:6-28` | Chiribito has no deposits, no spins, no cashback, no VIP tiers. Every word is fiction. |
| C5 | **CTA "Reclamar mi bono"** leads to `play.chiribito.com` with nothing to claim | `components/bonos-section.tsx:114-122` | Reinforces C4. User arrives at the game expecting a promo that doesn't exist. |

### 3.2 🔴 Funnel — the site denies its own product

| # | Issue | Where | Brutal verdict |
|---|---|---|---|
| F1 | **Hero primary CTA `JUGAR PARTIDA · Próximamente` is `disabled`** while `play.chiribito.com` is LIVE and shipping | `components/hero-section.tsx:164-189` | Self-sabotage. The web is claiming the game doesn't exist. |
| F2 | **Navbar "Juega Ya" also `disabled`** in both desktop and mobile menu | `components/navbar.tsx:111-117, 165-170` | Same self-sabotage at the persistent nav layer. |
| F3 | **Only real paths to play are buried in Torneos + Bonos** — both wrapped in fake/generic copy | `components/torneos-section.tsx:114-122`, `components/bonos-section.tsx:114-122` | The user has to scroll past ~7 sections to find a working door, and the door is inside a lie. |
| F4 | **No "lightweight try" path** before commitment — Simulador exists but is positioned as education, not as a bridge to play | `components/simulador-section.tsx` | The funnel skips the cheapest possible "yes". |

### 3.3 🟡 Atmosphere — casino-DNA diluting the castizo soul

| # | Issue | Where | Brutal verdict |
|---|---|---|---|
| A1 | **`generator: 'v0.app'`** leaked into production `<meta>` | `app/layout.tsx:13` | The site signs itself "made by v0". Strip. |
| A2 | **Hero image alt = "Mesa de casino vintage en Madrid"** | `components/hero-section.tsx:29` | The word "casino" anywhere in this brand is wrong. |
| A3 | **Hero ace images alt = "Ace of Coins / Cups / Swords / Clubs"** (English) in a castizo Spanish-language brand | `components/hero-section.tsx:99-103` | Wrong language, wrong vocabulary register. |
| A4 | **`TorneosSection` copy** ("jugadores de todo el mundo", "botes garantizados", "la gloria absoluta", "Eventos Diarios", "El Gran Torneo de Fin de Semana") | `components/torneos-section.tsx:6-28, 51-54` | Generic poker promo language. Strip or rewrite top-to-bottom. |
| A5 | **`BonosSection` entirely** | `components/bonos-section.tsx` | Doesn't just have fake content (C4) — its existence imports casino logic into a castizo product. |
| A6 | **`ReviewsSection` framing** ("Lo que dicen nuestros jugadores", "miles de jugadores nos eligen") | `components/reviews-section.tsx:15-20` | SaaS landing voice. Wrong register. |
| A7 | **`HomeCards`** duplicates Torneos+Bonos as the FIRST thing under the hero | `components/home-cards.tsx`, mounted at `app/page.tsx:41` | Doubles down on the wrong frame at the most strategic scroll position. |

### 3.4 🟡 Narrative + cohesion gaps

| # | Issue | Where | Brutal verdict |
|---|---|---|---|
| N1 | **Timeline ends in 2005** ("Legado vivo") | `components/timeline-section.tsx:42-47` | We're in 2026. The site has no story for the last 21 years, no explanation of why it returns now. The myth is incomplete. |
| N2 | **`/contacto` is an orphan page** — own header, no Navbar, no AudioPlayer, no SocialBar, no link back to play, different mini-footer | `app/contacto/page.tsx` | Two visual identities in one product. |
| N3 | **`id="contacto"` (newsletter section)** collides conceptually with the `/contacto` route | `components/newsletter-section.tsx:24` vs `app/contacto/page.tsx` | Two things called "contacto", neither knows the other exists. |
| N4 | **Three email addresses** (`support@`, `management@`) with no Resend domain verified yet (Phase W deuda #11) | `components/footer.tsx`, `components/social-bar.tsx`, `components/navbar.tsx` (via SocialBar), `app/contacto/page.tsx` | Mails to these likely vanish. Inviting contact through a black hole. |
| N5 | **Cabezón de Elche legend** — no provenance, no link, no source | `components/history-section.tsx:122-144` | If this is real, where's the citation? If it's mythology authored by the project, that's fine — but the spec doesn't say which. (Decision needed.) |
| N6 | **Two logos in use** (`logo-chiribito-horizontal.png` navbar, `logo-chiribito-circular.png` footer) without a documented rule | `components/navbar.tsx:62`, `components/footer.tsx:58` | Fine if intentional, but no doc. |
| N7 | **`<ScrollToTop />` rendered twice** | `app/layout.tsx:4` + `app/page.tsx:36` | Duplicate effect handlers. |

### 3.5 🟡 Copy / ortografía

A pass produces this exhaustive table (Wave 0):

| File | Line(s) | Current | Correct |
|---|---|---|---|
| `components/navbar.tsx` | 12 | `Mécanica` | `Mecánica` |
| `app/layout.tsx` | 11 | `El Alma del Poker Español` | `El Alma del Póker Español` |
| `components/hero-section.tsx` | 124 | `El Alma del Poker Español` | `El Alma del Póker Español` |
| `components/footer.tsx` | 65 | `El Poker Sintetico. Nacido en Madrid, jugado en la penumbra, inmortalizado en la memoria...` | `El Póker Sintético. Nacido en Madrid, jugado en la penumbra, inmortalizado en la memoria...` |
| `components/torneos-section.tsx` | 18, 24, 46, 52, 53 | `Competicion`, `dinamicas`, `dias`, `rapidas`, `Demuestra quien`, `Enfrentate`, `llevate` | `Competición`, `dinámicas`, `días`, `rápidas`, `Demuestra quién`, `Enfréntate`, `llévate` |
| `components/bonos-section.tsx` | 11, 18, 25 | `deposito`, `iniciar sesion`, `recibiras`, `atencion`, `Cuanto mas` | `depósito`, `iniciar sesión`, `recibirás`, `atención`, `Cuanto más` |
| `components/comparativa-section.tsx` | 75 | `raices`, `unicas` | `raíces`, `únicas` |
| `components/home-cards.tsx` | 44 | `Enfrentate` | `Enfréntate` |
| `components/hero-section.tsx` | 99-103 (alt) | `Ace of Coins / Cups / Swords / Clubs` | `As de Oros / Copas / Espadas / Bastos` |
| `components/hero-section.tsx` | 29 (alt) | `Mesa de casino vintage en Madrid` | `Salón de juego madrileño años 50` (or similar) |
| `components/history-section.tsx` | 61 (alt) | `Interior de un club social madrileño de los años 60` | OK — leave or sharpen |

Most of these are mojibake-style accent stripping common in v0 outputs. Single careful pass solves them all.

### 3.6 🟢 Technical debt (minor, low priority)

| # | Issue | Where | Notes |
|---|---|---|---|
| T1 | `<ScrollToTop />` duplicate render | `app/layout.tsx:4` + `app/page.tsx:36` | Trivial fix. |
| T2 | Fonts `Inter` + `Playfair_Display` imported as `_inter` / `_playfair` — discarded variable names mean next/font does not preload | `app/layout.tsx:7-8, 34` | Tailwind 4 `@theme inline` still references them by family name so the browser falls back to (likely) Google Fonts CDN fetch. Loses CLS prevention + subset + display:swap optimization. Wire properly in Wave 4. |
| T3 | `ChipCounter.incrementTime = (duration*1000) / end` | `components/chip-counter.tsx:25` | For `end=1000`, `setInterval` fires every 2ms. CPU-heavy, jittery. Replace with `requestAnimationFrame`-based easing in Wave 4. (Note: if all stats die in Wave 0, this becomes moot.) |
| T4 | `next.config.mjs`: `typescript.ignoreBuildErrors: true` + `images.unoptimized: true` | `web/next.config.mjs:6-11` | v0.dev defaults. Already flagged in Phase W deuda. Address in Wave 4. |
| T5 | `public/1-de-espada.png` — orphan asset with inconsistent naming (uses `-de-` separator, hyphenated, while the rest of the deck lives under `public/cartas/<rank>_<palo>.webp`) | `web/public/1-de-espada.png` | Unreferenced by anything I read. Wave 0 cleanup. |
| T6 | Hardcoded `oklch(0.18 0.01 160)` `<polygon fill>` in YouTube SVG icon | `components/social-bar.tsx:41`, `components/footer.tsx:44`, `app/contacto/page.tsx:46` | Won't theme-shift if dark/light variants are ever added. Tailwind class `fill-background` is already in `social-bar.tsx` (better) — propagate. |

---

## 4. Strategic principles (durable rules)

Seven rules. Every wave is built on these. If a principle is violated in a PR, that PR doesn't ship — it gets reworked or dropped.

### P1 — Every claim must be true

No fake metrics. No fake reviews. No fake bonos. No fake "miles de jugadores". If we can't substantiate it now, we don't claim it. The site loses nothing by saying less; it loses everything by saying false.

**Apply:** In every PR, scan for numbers, social proof, testimonials, and time-based claims. Each gets a source or gets cut.

### P2 — Every CTA must work or not exist

A disabled CTA that says "Próximamente" while the product exists tells the user the product doesn't. If a path is real, the CTA fires. If a path isn't ready, the CTA doesn't appear — no "Próximamente" stub.

**Apply:** No `disabled` buttons in any user-facing CTA position. Either it goes, or it ships connected.

### P3 — Casino-DNA never returns

Bonos, cashback, VIP tiers, jackpot, tiradas gratis, "Club" suffixes, fake Trustpilot, generic poker-promo copy — banned. If a future product idea genuinely needs reward mechanics, it must be re-cast in castizo vocabulary AND tested against the §2.3 gate.

**Apply:** Lexical ban list lives in §2.4. Any PR introducing one of those words gets bounced.

### P4 — Castizo wins over global

When the same idea can be expressed castizo (Sota) or globally (Jack), castizo wins. When the same UI pattern can feel ritual (slow reveal) or modern (instant), ritual wins for content sections (hero, history, narrative). Modern can win for utility (forms, simulator controls) — but only when ritual would actually hurt.

**Apply:** Tone gate. Read every copy block in a parroquiano's voice before shipping.

### P5 — Pacing protects the soul

A 15-section vertical scroll is a contract: each section must earn its place. If a section doesn't reinforce identity or move the funnel, it shouldn't exist. Cutting a section is more powerful than polishing it. (See §5 verdicts.)

**Apply:** "Could I remove this section and lose nothing important?" — if yes, remove it.

### P6 — The web ↔ play handoff is sacred

The site exists, in large part, to make the user want to sit at the mesa at `play.chiribito.com`. Every section either deepens that desire or it doesn't. The handoff must feel inevitable, not transactional.

**Apply:** §8 maps the CTA hierarchy. Wave 2 implements. No section ships without a clear answer to "where does this lead?".

### P7 — Mobile is not a viewport, it's a context

Mobile users skim, tap with thumbs, fatigue at section 8. The current 15-section single-column scroll punishes them. Mobile pacing needs its own design pass (Wave 4) — not as polish but as a first-class experience.

**Apply:** Every wave includes a "mobile sanity check" as a checklist item. Wave 4 has a dedicated mobile pacing pass.

---

## 5. Section-by-section verdict

Every component currently in `web/components/` and every route in `web/app/`. Verdict + 1-line reason + wave assignment + intended-vs-delivered emotion.

| Component | Verdict | Reason | Wave | Emotion intended | Emotion delivered today |
|---|---|---|---|---|---|
| `app/layout.tsx` | REFINE | Strip `v0.app` generator (A1), wire fonts properly (T2), fix duplicate ScrollToTop (T1). | 0 + 4 | Foundational | n/a |
| `app/page.tsx` | REFINE | Remove `StatsGrid` (C2), reorder sections per pacing pass (§8.3). | 0 (stats) + 1 (reorder) | Cinematic flow | Catalog feel |
| `app/contacto/page.tsx` | REWRITE | Cohere with global shell (Navbar/Audio/SocialBar/Footer), add link to play, fold or differentiate vs newsletter (N2/N3). Verify Resend before encouraging mailto (N4). | 1 | Belonging, reachability | Orphan, disconnected |
| `components/navbar.tsx` | REFINE | Fix `Mécanica`. Wire `Juega Ya` to `play.chiribito.com` (F2). Active-section highlight on `/contacto` works currently (external link path) — verify. | 0 | Anchor, orientation | Anchor + frustration (disabled) |
| `components/social-bar.tsx` | REFINE | Verify Trustpilot link target before shipping; if Trustpilot is empty/none, remove that icon (C1 cascade). Email link gated on Resend (N4). | 0 (remove TP) + Wave 1 (email gate) | Reachability | Decorative |
| `components/audio-player.tsx` | KEEP → REFINE later | Best concept on the site. Wave 3 candidate for ritualization (intro tone, persistence across sessions, optional "abrir mesa" intro chord). Wave 0/1: untouched. | 3 (later) | Atmosphere, presence | Atmosphere ✓ (already great) |
| `components/hero-section.tsx` | REFINE | Wire CTA (F1). Castizo alts (A2/A3). Replace `Mesa de casino` (A2). Keep copy + animation + particles + smoke. | 0 (CTA + alts) + 1 (copy polish) | Threshold, mystery, "I want in" | Mystery + frustration |
| `components/home-cards.tsx` | REMOVE | Doubles down on Torneos+Bonos at the most strategic post-hero slot (A7). After Wave 1 removes Bonos and rewrites Torneos, this dual card no longer makes sense. The post-hero slot should be the Simulador or a "ritual entry" (see §8.4). | 1 | Quick paths to next steps | Confusion ("but I haven't seen the game yet?") |
| `components/history-section.tsx` | KEEP | The narrative spine. Cabezón / Bellas Artes / Jockey / Tiro de Pichón — soul intact. Only tiny refinement: clarify Cabezón provenance (N5). | — | Awe, weight, belonging | Awe ✓ |
| `components/timeline-section.tsx` | REFINE | Extend to 2026 (N1). Add one to three new beats covering 2005 → today. See §9 for tone options. | 3 | Continuity, depth | Continuity → emptiness (ends in 2005) |
| `components/chip-counter.tsx` | REMOVE (current usage) | `StatsGrid` lies (C2). Remove from `page.tsx`. The component itself can live in the codebase unused if we want to reintroduce real stats later — but no fake values, ever. (Or: delete the component too. See §5 footnote.) | 0 | Confidence | Distrust |
| `components/rules-section.tsx` | KEEP → light REFINE | Mechanics copy is accurate and castizo. Light polish on rhythm. Watch the "No-Limit" loanword — culturally accepted but it's English. Optional: re-frame as "sin límite" or "a tope". | 1 (polish only) | Competence | Educational ✓ |
| `components/comparativa-section.tsx` | KEEP → light REFINE | Comparison is sharp and serves identity ("Color GANA al Full"). Fix `raices` / `unicas` (3.5). | 0 | "I'm in the know" | Insider feel ✓ |
| `components/simulador-section.tsx` | KEEP → strategic REFINE in Wave 2 | Mechanically correct, canon-aligned, polished. In Wave 2, repurpose it as a *bridge* to play: after the user reveals a hand, show a soft CTA "¿Sentarte a una mesa de verdad?" → `play.chiribito.com`. Today it's a dead-end interactive. | 2 | Curiosity → satisfaction → desire to play | Curiosity → satisfaction → ends |
| `components/rankings-section.tsx` | KEEP → REFINE | Canon correct, 10 manos perfect, La Perla rank 1 ✓. **Decide bilingual subtitles** (`nameEn: "The Pearl"` etc.): keep for international reach OR drop for castizo purity. Recommendation: drop. (Open decision §5.1.) | 1 | Mastery, jerarquía | Educational ✓ |
| `components/torneos-section.tsx` | REWRITE | The shape (3 cards + CTA) is fine. The copy is generic-casino. Rewrite from scratch in castizo voice: real tournament types, real names, no "botes garantizados", no "joya de la corona" hype. If we don't run real tournaments yet, the section becomes one card pointing to play, or it's deferred entirely. (Open decision §5.1.) | 1 | "Real action awaits" | Generic poker site |
| `components/bonos-section.tsx` | REMOVE | Every word is fiction (C4). Chiribito has no economy of bonos. Section deletion is the right move. If real rewards exist someday, they get a different section with a different name (see §2.4). | 1 | Reward, motivation | Confusion + brand damage |
| `components/tips-section.tsx` | KEEP → REFINE | Content is castizo-correct, La Perla / Color vs Full are the canon insights. Title `¿Sabías que...?` is the only weak link — too quiz-show, not castizo enough. Candidates: *Los matices que importan* · *La sabiduría de la mesa* · *Lo que separa al jugador del aficionado*. | 1 | Insider knowledge | Quiz-show ☑ → Insider ✓ after rewrite |
| `components/newsletter-section.tsx` | REWRITE | Concept is valid; today's implementation lies (C3). Wave 0: disable form, replace with a non-lying placeholder ("Pronto podrás unirte al círculo. De momento, síguenos en Instagram.") OR remove form entirely. Wave 4: implement real with Resend after R9 (Phase W deuda #11) is resolved. | 0 (disable) + 4 (implement real) | Belonging | Trap |
| `components/reviews-section.tsx` | REMOVE | Fake stars, fake claim, link to empty Trustpilot (C1). No replacement in the short term — Chiribito doesn't need testimonials this early. If we ever add real testimonials (parroquiano voices, lore quotes), they become a different section with a different name. | 0 | Trust | Anti-trust |
| `components/footer.tsx` | REFINE | Copy is correct (fix `Sintetico` → `Sintético`). Open-source mention is good and castizo. Verify GitHub link and emails before each ship. | 0 | Closure, respect | Closure ✓ |
| `components/back-to-top.tsx` | KEEP | Utility, invisible until used. No action. | — | n/a | n/a |
| `components/scroll-to-top.tsx` | KEEP | Utility. Just dedupe usage (T1). | 0 | n/a | n/a |
| `components/section-separator.tsx` | KEEP | Visual rhythm device, works. | — | Pacing | Subtle ✓ |
| `components/spanish-suits.tsx` | KEEP | Asset primitives. | — | n/a | n/a |
| `components/theme-provider.tsx` | KEEP | Plumbing. The site has only one theme today; this is harmless. | — | n/a | n/a |
| `components/ui/*` (shadcn primitives) | KEEP | Untouched by audit. Maintenance only. | — | n/a | n/a |

### 5.1 Open decisions (for the user to settle during Wave 1 planning)

1. **Bilingual subtitles in Rankings** (`nameEn: "The Pearl"` etc.) — KEEP for non-castizo curious / international SEO, DROP for castizo purity. *Recommendation: drop.*
2. **Cabezón de Elche provenance** — real historical figure with a citation we should add, OR project-authored mythology that should be marked as such (perhaps subtly: "Cuentan que..." opener). *Recommendation: name it explicitly as one or the other.*
3. **`TorneosSection`** — keep as one castizo-rewritten card pointing to play, OR remove entirely until we run real tournaments. *Recommendation: collapse to a single sober card, defer rewrite-from-scratch until tournaments are real.*
4. **`NewsletterSection`** — Wave 0 disables; Wave 4 implements with Resend. Question: in the interim, do we show a "síguenos en Instagram" placeholder OR remove the section entirely until the real implementation lands? *Recommendation: placeholder. The space matters for closing rhythm.*
5. **`ChipCounter` component** — if `StatsGrid` is the only consumer and StatsGrid dies in Wave 0, do we delete the component (cleaner) or keep it dormant for future real stats (optimistic)? *Recommendation: delete in Wave 0, reintroduce when real numbers exist.*

---

## 6. Roadmap — 5 waves

Each wave: goal, in-scope items, success criteria, risk, t-shirt size, reversibility, atomic commit suggestions.

### Wave 0 — Defensivo / parar la sangría

**Goal:** Stop lying. Stop the funnel self-sabotage. Strip the most obvious v0.dev signatures. Make the site honest in the cheapest way possible.

**In scope:**
1. Strip `generator: 'v0.app'` from `app/layout.tsx` (A1)
2. Remove `<StatsGrid>` block from `app/page.tsx` (C2). If `ChipCounter` becomes unused, delete the component file (5.1 #5).
3. Remove or disable `NewsletterSection` (C3). Recommended: replace form with one-line "pronto podrás unirte al círculo" + Instagram link.
4. Remove `ReviewsSection` from `page.tsx` (C1).
5. Remove `BonosSection` from `page.tsx` (C4). Delete the component file.
6. Wire Hero `JUGAR PARTIDA` button to `https://play.chiribito.com` and drop the `Próximamente` tag (F1).
7. Wire Navbar `Juega Ya` to `https://play.chiribito.com` in both desktop and mobile menu (F2).
8. Replace hero alt `Mesa de casino vintage` with castizo phrasing (A2).
9. Replace hero ace alts (`Ace of Coins/Cups/Swords/Clubs`) with Spanish (A3).
10. Fix `<ScrollToTop />` duplicate render (T1) — keep in `layout.tsx`, remove from `page.tsx`.
11. Verify Trustpilot link target in `SocialBar`. If empty/broken, remove that icon (cascade of C1).
12. **Ortografía pass** (table §3.5): single commit covering navbar/layout/hero/footer/torneos/bonos/comparativa/home-cards. (Note: bonos file may already be removed by step 5 — adjust.)
13. Delete `public/1-de-espada.png` if confirmed unreferenced (T5).
14. Update `app/page.tsx` section order after removals: Hero → HomeCards (or its replacement, see Wave 1) → Simulador → Rankings → History → Timeline → Rules → Comparativa → Torneos (rewritten or trimmed in Wave 1) → Tips → Footer.

**Success criteria:**
- No fake claims visible on the site
- All primary CTAs route to live destinations
- Spelling correct across all user-facing text
- No `v0.app` string anywhere in built HTML
- Lighthouse / smoke check passes (no broken images, no console errors)

**Risk:** Very low. All changes are removals or trivial wires. Reversible per commit.

**Size:** S (1–2 commits, single afternoon-sized session).

**Reversibility:** Total. Each removal is one `git revert` away.

**Suggested atomic commits:**
1. `chore(web): strip v0.app generator from metadata`
2. `feat(web): wire hero + navbar CTAs to play.chiribito.com`
3. `fix(web): correct accent marks across navbar/hero/footer/torneos/comparativa/home-cards`
4. `chore(web): castizo alt text for hero imagery`
5. `refactor(web): remove fake StatsGrid + ChipCounter from landing`
6. `refactor(web): remove BonosSection — Chiribito has no fake economy`
7. `refactor(web): remove ReviewsSection — no fake trust theater`
8. `refactor(web): defang NewsletterSection until real backend exists`
9. `chore(web): dedupe ScrollToTop render between layout and page`
10. `chore(web): drop orphan 1-de-espada.png asset`

(Each commit independently reversible. Order doesn't matter except #8/#11 which depend on `SocialBar` decisions.)

---

### Wave 1 — Identidad & cohesión

**Goal:** Strip the residual casino-DNA tone from sections that survive Wave 0. Cohere `/contacto` with the rest of the site. Begin shifting the post-hero slot toward Chiribito identity instead of feature-cards.

**In scope:**
1. **`TorneosSection`** — per 5.1 #3, collapse to a single sober castizo card pointing to play, OR rewrite copy from scratch in castizo voice (no "botes garantizados", no "jugadores de todo el mundo"). Decide before this wave starts.
2. **`HomeCards`** — remove entirely (verdict §5). Replace the post-hero slot with one of: (a) immediate Simulador push, (b) a single "la mesa te espera" invitation card pointing to play, (c) nothing (let Hero breathe → Simulador). Recommendation: option (c) or (b). Decide during Wave 1 planning.
3. **`/contacto`** — rebuild on top of the global shell (Navbar + AudioPlayer + SocialBar + Footer), add a link back to the game, decide on email visibility based on Resend state (N4).
4. **`TipsSection`** — rename `¿Sabías que...?` → castizo alternative (5.1 #4 candidates) and re-tone any copy that drifts toward quiz-show register.
5. **`RankingsSection`** — settle bilingual subtitles (5.1 #1) and apply.
6. **Cabezón de Elche** — settle provenance (5.1 #2): cite or mark as cuento.
7. **Capitalization audit** — global pass on title-case vs sentence-case in headings, kickers, button labels. Pick one rule and apply.
8. **Vocabulary scan** — global grep for §2.4 banned words; replace each with castizo equivalents or remove.

**Success criteria:**
- Zero casino-DNA words on the site (§2.4 banned list)
- `/contacto` visually + structurally consistent with `/`
- Section titles read in one consistent voice across the whole site
- The §2.3 one-sentence gate (parroquiano-1965 test) passes for every section that survives

**Risk:** Medium. Tone shifts have aesthetic judgment calls. Mitigated by writing copy in pairs (current vs proposed) and running it past the user before committing.

**Size:** M (3–6 commits across a sprint).

**Reversibility:** Per commit. Each section's rewrite is its own commit.

---

### Wave 2 — Funnel & onboarding

**Goal:** Make `play.chiribito.com` feel like the inevitable destination of the site, not a buried link. Make the Simulador a soft bridge into the real game.

**In scope:**
1. **CTA hierarchy implementation** (§8) — apply primary/secondary/tertiary CTA design across all sections.
2. **Simulador → play bridge** — after the user reveals all 5 community cards and sees their best hand, surface a soft CTA: *"Tu primera mano. ¿La siguiente, contra alguien?"* → `play.chiribito.com`. Subtle, ritual, never aggressive. Code lives in `simulador-section.tsx`.
3. **"La mesa te espera" sticky / floating element** — consider a small floating element (similar in spirit to the AudioPlayer) that holds the play link persistently as the user scrolls. Has to be subtle, not banner-y. Defer or test in this wave.
4. **Hero secondary CTA** — alongside the primary "JUGAR PARTIDA", add a quiet secondary "Conoce primero" that scrolls to Simulador. Two doors: the impatient one and the curious one.
5. **Footer CTA** — final call-to-mesa as the user reaches the bottom. One line, one button.
6. **Deeplink hygiene** — confirm `play.chiribito.com` accepts a referrer / UTM param so we can later attribute web→play conversion. (Coordinate with play-side, no play-side code change required for Wave 2 itself.)

**Success criteria:**
- Three distinct doors to `play.chiribito.com` in the user journey: Hero primary (impatient), Simulador post-reveal (curious), Footer (about to leave). All ritualized, none banner-y.
- "Time to first play-link visibility" on mobile: ≤1 thumb-scroll from landing.
- The site no longer feels like a feature catalog — it feels like an invitation.

**Risk:** Low. All changes are additive wires + small UI elements. No removals beyond Wave 0/1.

**Size:** S–M (2–4 commits).

**Reversibility:** Per commit.

---

### Wave 3 — Narrativa profunda

**Goal:** Close the narrative gap 2005 → 2026 (N1). Deepen the mythology where it pays off. Ritualize AudioPlayer where appropriate.

**In scope:**
1. **Timeline bridge 2005 → 2026** (see §9): add one to three new beats in `TimelineSection`. Tonal option chosen by the user.
2. **History micro-lore** — optionally add 1–2 small sidebars to `HistorySection`: e.g., a quote, an anecdote about El Refugio, the name of one game that ended badly. Lightweight, prose-only, no new components.
3. **AudioPlayer ritualization** — make the player feel more intentional: a tiny opening chord on first play, station name lingers longer on hover, persist user's last station + playing state across page reloads (cookie or localStorage). Optional: castizo intro phrase ("Que empiece la mano" or similar) replacing or accompanying the play icon on first interaction.
4. **Hero scroll indicator** — currently says "Descubre la historia" and scrolls to `#historia`. Consider reframing to a castizo verb ("Pasa al salón", "Entra"). Tiny but high-signal touch.
5. **(Optional) "El Cabezón" expansion** — if user authors more lore, this is the wave to add it. Strict gate: a parroquiano must believe it.

**Success criteria:**
- The timeline tells a complete story from 1950 to today
- A first-time visitor reading top-to-bottom understands not just what Chiribito *was* but what it *is* now
- AudioPlayer feels like part of the ritual, not a generic floating button
- No new section added unless it earns its place (P5)

**Risk:** Medium-high. This is creative work. Every new sentence must pass §2.3 gate. Mitigated by writing in drafts the user approves before committing.

**Size:** M (3–6 commits).

**Reversibility:** Per beat / per addition.

---

### Wave 4 — Polish premium

**Goal:** Technical and visual polish. Mobile pacing pass. Performance debt cleanup. No identity work in this wave — that's all upstream.

**In scope:**
1. **next/font fix** — properly wire `Inter` and `Playfair_Display` so next/font preload + subset + display:swap work. Update Tailwind 4 `@theme inline` to reference the CSS variables next/font generates (`--font-inter`, `--font-playfair`) instead of hardcoded family names (T2).
2. **`next.config.mjs` cleanup** — flip `typescript.ignoreBuildErrors` to `false` (fix any surfaced errors first) and `images.unoptimized` to `false` (verify build/deploy still passes) (T4). Test on a Vercel preview before promoting.
3. **`ChipCounter` rewrite** — IF reintroduced for real stats (5.1 #5), replace `setInterval` with `requestAnimationFrame` + easing (T3). Otherwise, remains deleted.
4. **NewsletterSection real implementation** — gated on R9 Resend (Phase W deuda #11). Wire form to Resend API, real success/error states, proper GDPR-mindful microcopy ("Tus datos se guardan en Europa, los puedes borrar cuando quieras", or similar — no fake "Bienvenido al club" without an email actually sent).
5. **Mobile pacing pass** — a dedicated audit using Chrome MCP / Playwright at Pixel 5 viewport: section heights, AudioPlayer position vs navbar mobile menu overlap, content density per breakpoint, scroll fatigue beats, hero parallax behavior, sticky element positioning. Capture screenshots. Surface findings into a Wave 4.5 mini-plan if needed.
6. **Typography fluid scale** — consider `clamp()` for heading sizes so we don't jump between breakpoints. Low priority, evaluate during mobile pass.
7. **Micro-interactions ritualizadas** — small ceremony touches: e.g., the Repartir Mano button has a tiny gesture animation; the Rankings cards reveal in a staggered castizo sequence; the timeline scroll-trigger has a more deliberate rhythm. Subtle. Test against P5 (does it earn its place?).
8. **Logo discipline** — document when to use `logo-chiribito-horizontal.png` vs `logo-chiribito-circular.png` (N6). Inline brief rule in `web/README.md`.

**Success criteria:**
- Lighthouse mobile ≥85, no font flash, no layout shift on hero
- TypeScript builds clean without `ignoreBuildErrors`
- Mobile experience feels intentional, not "desktop scaled down"
- Newsletter actually delivers emails

**Risk:** Low (technical work, well-scoped).

**Size:** M (4–6 commits).

**Reversibility:** Per commit.

---

### Wave summary

| Wave | Theme | Size | Risk | Identity risk |
|---|---|---|---|---|
| 0 | Defensive — stop lying, wire the funnel | S | Very low | None (subtractive) |
| 1 | Identity & cohesion — strip casino tone, cohere `/contacto` | M | Medium | Medium (tone judgment) |
| 2 | Funnel & onboarding — bridge to play | S–M | Low | Low |
| 3 | Narrative depth — close 2005→2026, ritualize | M | Medium-high | High (creative — strict gate) |
| 4 | Polish premium — tech + mobile + perf | M | Low | Low |

---

## 7. Copy & ortografía pass plan

### 7.1 Tildes (exhaustive — single commit, Wave 0)

See table §3.5. Single PR fixes all. No risk.

### 7.2 Tone shift (Wave 1 — sectional rewrites)

| Casino-clone phrase (today) | Castizo replacement (direction, not final copy) |
|---|---|
| "Bono de Bienvenida 100% en primer depósito" | (section removed) |
| "Recompensas Diarias / tiradas gratis / saldo extra" | (section removed) |
| "Club VIP / Fidelidad / cashback" | (section removed) |
| "Promociones exclusivas" | (section removed) |
| "miles de jugadores nos eligen cada día" | (section removed) |
| "La confianza se gana en la mesa" | (section removed — though the phrase itself is castizo, it lived in a fake context) |
| "Compite y gana" (HomeCards) | (component removed) |
| "Demuestra quien manda en la mesa" (Torneos) | "Sentarse, escuchar, jugar." or similar — defer to wave 1 user-approved copy |
| "jugadores de todo el mundo" (Torneos) | (remove geographic claim entirely) |
| "botes garantizados" (Torneos) | (remove or restate as concrete tournament structure) |
| "la gloria absoluta en juego" (Torneos) | (remove hype register entirely) |
| "Mesa de casino vintage en Madrid" (alt) | "Salón de cartas en Madrid, años 50" |
| "¿Sabías que...?" (Tips heading) | "Lo que separa al jugador del aficionado" / "La sabiduría de la mesa" / "Los matices que importan" |
| "Próximamente" on Hero button | (button wires to play, tag disappears) |
| "Próximamente" on Navbar "Juega Ya" | (button wires to play, tag disappears) |
| "Suscribirme" (Newsletter button) | "Unirme al círculo" (only if section keeps form; Wave 0 likely disables) |
| "Bienvenido al club" (Newsletter success — never actually shown) | (replaced when Wave 4 ships real Resend impl; e.g., "Tu sitio en la mesa queda apartado.") |

### 7.3 ALT text & language rules

- All ALT text in Spanish. No English. No "Ace of Coins" — `As de Oros`.
- All ALT text castizo: never "casino", prefer "salón / mesa / sala / trastienda".
- For decorative-only icons (palos, particles), `aria-hidden="true"` is fine (already done in many spots).

### 7.4 Capitalization rules (proposal, Wave 1)

- **Headings (h1/h2/h3):** sentence case for body-style titles ("Lo que dicen los parroquianos"), title case for proper-noun-led ("El Alma del Póker Español", "Una Historia de Humo, Cartas y Leyenda"). Pick one consistently — recommendation: **sentence case across the board** for cohesion, except established proper nouns.
- **Kickers (text-xs uppercase tracking):** always uppercase with letter-spacing (existing convention, keep).
- **Button labels:** **TÍTULO CORTO** uppercase for action-CTAs (`JUGAR PARTIDA`), sentence case for secondary actions (`Ver torneos`). Existing pattern is consistent enough — minor cleanup only.
- **Card hand names:** sentence case per CardEvaluator canon (already enforced) — `Perla`, `Escalera de color`. Do not break.

### 7.5 Bilingual decision (Rankings subtitles)

Per 5.1 #1. Recommendation: drop English subtitles. Rationale: castizo purity > international hand-holding. The hand names speak for themselves; if a non-castizo speaker wants the equivalent, the comparativa table already provides it for the two most impactful concepts.

---

## 8. CTA hierarchy & funnel web ↔ play

### 8.1 Current state (bad)

| Position | Current CTA | State | Destination |
|---|---|---|---|
| Hero primary | `JUGAR PARTIDA` | `disabled`, "Próximamente" | none |
| Navbar primary | `Juega Ya` | `disabled` | none |
| HomeCards #1 | `Ver torneos` | anchor scroll | `#torneos` |
| HomeCards #2 | `Ver bonos` | anchor scroll | `#bonos` |
| Torneos | `Ver todos los torneos` | external | `play.chiribito.com` |
| Bonos | `Reclamar mi bono` | external | `play.chiribito.com` (with lie) |
| Reviews | `Ver opiniones en Trustpilot` | external | empty Trustpilot |
| Newsletter | `Suscribirme` | fake submit | nowhere |
| Footer | (none) | — | — |

**Diagnosis:** Two doors to play exist, both wrapped in lies. The two visible primary CTAs are disabled. The cleanest CTA goes to a fake review page.

### 8.2 Target state (post Wave 0 + 2)

| Position | New CTA | State | Destination | Role |
|---|---|---|---|---|
| Hero primary | `JUGAR PARTIDA` | live | `play.chiribito.com` | The impatient door |
| Hero secondary | `Conoce primero` (or similar) | live | `#simulador` | The curious door |
| Navbar primary | `Juega Ya` | live | `play.chiribito.com` | Persistent across scroll |
| Simulador post-reveal | `¿La siguiente, contra alguien?` (or similar) | live | `play.chiribito.com` | The "I tried it, I want more" door |
| Torneos (if survives) | `Sentarse en una mesa` | live | `play.chiribito.com` | Context-specific |
| Footer | `La mesa sigue ahí` (or similar) | live | `play.chiribito.com` | The leaving-the-room door |
| Newsletter (Wave 4) | `Unirme al círculo` | live | (Resend API) | Belonging |
| SocialBar | (icon-only links to socials) | live | external socials | Continuity, not conversion |

**Three primary doors** to play, each emotionally distinct (impatient / curious / satisfied). One persistent door (Navbar). One closing door (Footer). All wired. None lying.

### 8.3 Section pacing — the emotional flow

Proposed order after Wave 1 trimming. Roughly: hook → invitation → emotional weight → mastery → closing call.

```
1. Hero            — threshold, mystery, "I want in"
                   [primary CTA: jugar]
                   [secondary CTA: conocer]

2. Simulador       — first taste, low stakes, "I tried it"
                   [bridge CTA after reveal: jugar]

3. Rankings        — mastery, "now I see the depth"

4. History         — emotional weight, "this is mine"

5. Timeline        — continuity 1950 → today (Wave 3)
                   "the story is alive"

6. Rules           — competence, "I can do this"

7. Comparativa     — insider feel, "I know what's different"

8. Torneos (lite)  — concrete present (if section survives)
                   [CTA: sentarse]

9. Tips            — sabiduría, "I want to know more"

10. Footer         — closing call, respect
                    [CTA: la mesa sigue ahí]
```

Sections removed in Wave 0/1: HomeCards, StatsGrid, BonosSection, ReviewsSection, NewsletterSection (until Wave 4 reintroduces real).

### 8.4 The ritual structure

The page becomes a five-act ritual:

1. **Cruzar el umbral** (Hero) — the user steps in
2. **Tocar las cartas** (Simulador) — the first ritual gesture
3. **Aprender el lugar** (Rankings → History → Timeline → Rules → Comparativa) — the initiation
4. **Decidir** (Torneos lite / Tips) — the moment of choice
5. **Cerrar** (Footer) — leave with weight, or pass to the mesa

If a section doesn't fit this arc, it doesn't belong.

### 8.5 Mobile-first CTA discipline

On mobile:
- Hero primary CTA must be visible within first thumb-scroll
- Navbar CTA "Juega Ya" stays in the mobile menu (already there)
- Footer CTA stays reachable (already at bottom)
- No floating CTA banners (P3 forbids casino vibes)
- Optional: small floating "mesa" affordance — must be subtle and never animate aggressively

---

## 9. Narrative bridge 2005 → 2026

The single largest narrative gap. The site closes its myth in 2005 but exists in 2026.

### 9.1 Constraints

- Castizo voice (§2.4 vocabulary)
- No tech-bro "renacer digital powered by AI" register
- Can be 1 beat, 2 beats, or 3 beats — whatever earns its weight
- Lives in `TimelineSection` as additional `events[]` entries, OR as a new closing block after the timeline
- Must answer (subtly): why does Chiribito return now? what is `play.chiribito.com`?

### 9.2 Tonal options (decide during Wave 3)

**Option A — "El renacer digital"** (clean, simple)

```
2024 — El testigo digital
Veinte años después del último gran torneo del Círculo, un puñado de
parroquianos digitaliza la mesa. No para reemplazar a los sótanos —
para que los sótanos no se pierdan.

2026 — La mesa abierta
chiribito.com abre la puerta. La parroquia ya no se reúne en una
sola ciudad. La mesa, sin embargo, sigue siendo la misma.
```

Tone: returning home. Risk: slightly safe.

**Option B — "La nueva clandestinidad"** (poetic, ambiguous)

```
2026 — Clandestinos en abierto
Lo clandestino ya no necesita esconderse. Internet le dio a los
círculos selectos una nueva forma de sentarse. El Chiribito vuelve —
abierto a quien sepa buscarlo, cerrado a quien no sienta la mesa.
```

Tone: paradox + invitation. Risk: requires deftness or it tips into pretension.

**Option C — "Open source castizo"** (manifesto, orgulloso)

```
2026 — Castizo, abierto, sin dueño
El Chiribito ya no pertenece a tres clubes de Madrid. Pertenece a
quien lo juega. El código vive en GitHub, la mesa vive aquí.
Castizo, abierto, sin dueño.
```

Tone: pride + statement. Risk: pivots toward "tech project" register, may dilute mythology.

**Option D — "El testigo"** (minimalist, sentimental)

```
2026 — El último capítulo que faltaba
Pasaron veinte años de silencio. Los que se sentaron en aquellas
mesas envejecieron. Algunos nos pasaron el testigo.
Este sitio es el capítulo que aún no se había escrito.
```

Tone: weight + handoff. Risk: very personal; needs to feel sincere, not affected.

### 9.3 Recommendation

**Option D, complemented by a short line from Option B's last sentence:** *"Abierto a quien sepa buscarlo, cerrado a quien no sienta la mesa."*

Reasoning: D centers the human, the handoff, the inheritance. B's closing line adds the underground texture without leaning into the paradox too hard. Together: weight + invitation.

Final copy to be drafted and approved in Wave 3 planning — this spec only commits to direction.

### 9.4 Placement options

- **A:** New `events[]` entries inside `TimelineSection` (1–2 entries: 2024 + 2026, or just 2026)
- **B:** Standalone closing block AFTER the timeline ends — separate visual treatment, more weight
- **C:** Replace the existing 2005 entry with a longer 2005-2026 entry

Recommendation: **B** (standalone closing block). The 2005 entry stays; a new block titled e.g. *"El capítulo que faltaba"* closes the timeline with visible visual weight. Lets the existing timeline keep its rhythm.

---

## 10. Execution discipline + NO tocar bucket

### 10.1 Discipline rules

These apply per-wave and per-commit. Lifted from prior Chiribito sprint disciplines that have proven themselves under pressure ([[chiribito-runtime-probe-ladder-validated-2026-05-19]]).

- **Atomic commits.** Each commit reverses independently. No "fix several things at once".
- **6-point pre-change format** for any non-trivial change ([[chiribito-disciplined-format]]): Objetivo / Restricciones / Non-goals / Riesgos / Plan / Validación.
- **Stop-on-ambiguous.** If user reaction to a wave-1+ change is ambiguous, default to STOP, not "escalate one more". Roll back, regroup.
- **Mobile sanity check obligatoria.** Every wave includes at least one mobile-viewport visual check (Pixel 5 viewport via Chrome MCP/Playwright) before "done".
- **Vercel team gate.** `vercel whoami` must return `chiribito293-7173` before any `vercel` command. Never link `web/` to PMS or PT teams.
- **Play stack untouched by default.** Wave 2 deeplink hygiene is the only wave that even *coordinates* with play. No wave modifies play/backend/realtime code.
- **Identity gate at PR time.** Every PR includes a self-check: "does this push toward §2.1 or §2.3?". If toward §2.3, doesn't ship.
- **One sprint at a time.** No starting Wave N+1 before N is shipped and merged.

### 10.2 NO TOCAR — protected today

Components / decisions that work and are not in scope to modify:

- **`HeroSection` copy** ("clandestinidad madrileña de los años 50, hermandad, secreto, círculos selectos") — soul, untouched. Only CTA wire + alts change in Wave 0.
- **`HistorySection` narrative** — Cabezón / Bellas Artes / Jockey / Tiro de Pichón. Untouched except provenance clarification (5.1 #2).
- **`SimuladorSection` mechanics + canon** — alignment with `CardEvaluator` is sacred. Wave 2 ONLY adds a post-reveal CTA; the eval logic doesn't change.
- **`RankingsSection` canon** — 10 manos, La Perla rank 1, Color > Full ordering, `.webp` assets. Touched only for bilingual decision (5.1 #1).
- **Theme tokens (`globals.css :root`)** — oklch deep green felt + gold + ivory. Premium foundation. No changes.
- **Custom CSS utilities** (`text-shimmer`, `glass-card`, `gradient-border`, `shadow-gold` / `-lg`, `felt-texture`, `art-deco-frame`) — quality utilities, no changes.
- **`prefers-reduced-motion` block** — accessibility foundation, untouched.
- **`AudioPlayer` core concept** (flamenco/guitarra streams) — best concept on the site. Wave 3 ritualizes lightly; never replaces.
- **Game stack** — `frontend/`, `src/`, `api-server/`, `render.yaml`, `play.chiribito.com`, `backend.chiribito.com`, `realtime.chiribito.com`. Sealed.
- **Domain/DNS records** — apex A + CNAMEs untouched (Phase W guarantee).
- **Vercel team / project linking** — `chiribito-web` in `chiribito293-7173s-projects`. Sealed.

### 10.3 NO BECOME — anti-patterns that signal the work has drifted

If any of these surface in a PR or in a wave's deliverable, stop the wave and re-evaluate. These are the failure modes Chiribito must avoid by definition.

- **Casino online genérico** — Welcome bonus banners, tier rewards, Trustpilot-style trust theater, "limited time offers"
- **SaaS moderno vacío** — Hero with "Powerful poker for modern players", grids of feature icons, generic illustrations
- **Startup AI / techno-bro** — "Built with AI", anthropomorphizing the product, modern minimalism stripped of all texture
- **Poker-site clon** — Generic chip imagery, English-default vocab, country-flag selectors
- **Crypto / gambling aesthetic** — Neon gradients, casino chips spinning, dollar/euro signs as visual elements
- **Redesign por ansiedad** — "Let me also fix this other section while I'm here". Each wave has its scope; that's it.
- **Scope explosion** — A wave that started as Wave 0 stop-the-bleeding turns into a 30-commit identity rewrite. Stop. Reload spec. Re-scope.
- **Identity drift through "modernization"** — "Let's make the hero feel more like Linear / Stripe / Vercel". No. The reference is the Círculo de Bellas Artes en 1965, not SaaS-of-the-month.

### 10.4 Living document protocol

This doc is the **spec**, not a frozen contract:
- Update it when a wave reveals something the audit missed
- Mark each wave's completion in §6 with a date + commit-range stamp
- If a verdict in §5 needs revision after seeing the live result, update the table — don't write a separate doc
- New principles can be added to §4 IF they generalize beyond a single wave

### 10.5 Resume protocol after each wave

After each wave ships:
1. Update `docs/HANDOFF_WAVE_<N>.md` with final state
2. Stamp this spec's §6 with completion date + commit range
3. Next session opens fresh — no auto-start, user re-frames whether to enter wave N+1 or pivot
4. The §2.3 gate ("would a parroquiano del 1965 recognize this as suyo?") runs on the deployed site before declaring done

---

## Appendix A — File index touched by spec

| File | Touched in waves | Operation |
|---|---|---|
| `web/app/layout.tsx` | 0, 4 | strip generator (0), wire fonts (4), dedupe ScrollToTop (0) |
| `web/app/page.tsx` | 0, 1 | remove StatsGrid + ReviewsSection + BonosSection + HomeCards + NewsletterSection (0/1), reorder (1) |
| `web/app/contacto/page.tsx` | 1 | rebuild on global shell |
| `web/components/navbar.tsx` | 0 | fix tilde, wire Juega Ya |
| `web/components/hero-section.tsx` | 0, 1, 2 | wire CTA + alts (0), copy polish (1), add secondary CTA (2) |
| `web/components/home-cards.tsx` | 1 | DELETE |
| `web/components/simulador-section.tsx` | 2 | add post-reveal bridge CTA |
| `web/components/rankings-section.tsx` | 1 | bilingual subtitle decision applied |
| `web/components/history-section.tsx` | 1, 3 | provenance polish (1), optional micro-lore (3) |
| `web/components/timeline-section.tsx` | 3 | bridge 2005 → 2026 |
| `web/components/rules-section.tsx` | 1 | light castizo polish |
| `web/components/comparativa-section.tsx` | 0 | tilde fix |
| `web/components/torneos-section.tsx` | 1 | rewrite or collapse (decision 5.1 #3) |
| `web/components/bonos-section.tsx` | 0 | DELETE |
| `web/components/tips-section.tsx` | 1 | rename + light copy polish |
| `web/components/newsletter-section.tsx` | 0, 4 | disable form (0), real Resend impl (4) |
| `web/components/reviews-section.tsx` | 0 | DELETE |
| `web/components/footer.tsx` | 0, 2 | tilde fix (0), add closing CTA (2) |
| `web/components/audio-player.tsx` | 3 | ritualize lightly |
| `web/components/social-bar.tsx` | 0 | conditionally remove Trustpilot icon |
| `web/components/chip-counter.tsx` | 0 | DELETE (or keep dormant per 5.1 #5) |
| `web/next.config.mjs` | 4 | flip `ignoreBuildErrors` + `unoptimized` |
| `web/public/1-de-espada.png` | 0 | DELETE |

---

## Appendix B — Open decisions deferred to wave-planning

Numbered for traceability:

1. **(§5.1 #1)** Rankings bilingual subtitles — keep or drop. *Recommendation: drop.*
2. **(§5.1 #2)** Cabezón de Elche — real-with-citation or named-as-myth. *Recommendation: name it explicitly.*
3. **(§5.1 #3)** Torneos — rewrite or collapse. *Recommendation: collapse to single sober card until real tournaments exist.*
4. **(§5.1 #4)** Newsletter Wave-0 placeholder vs full removal. *Recommendation: placeholder pointing to Instagram.*
5. **(§5.1 #5)** ChipCounter — delete or dormant. *Recommendation: delete; reintroduce when real numbers exist.*
6. **(§7.4)** Capitalization rule — sentence case across the board or mixed. *Recommendation: sentence case.*
7. **(§8.2)** Mobile floating "mesa" affordance — yes/no. *Recommendation: test in Wave 2, drop if at all banner-y.*
8. **(§9.2)** Narrative bridge tone — A / B / C / D / hybrid. *Recommendation: D + B closing line.*
9. **(§9.4)** Bridge placement — inside timeline events / standalone block after timeline / replace 2005. *Recommendation: standalone block after timeline.*

---

**End of spec. Wave 0 ready to plan when user gives "go".**

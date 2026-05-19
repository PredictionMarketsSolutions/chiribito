# Chiribito Audio Ritual Layer — Architecture Prep

> **Status:** PREP DOC for tomorrow's brainstorm — NOT a design contract, NOT a plan to execute · 2026-05-20
> **Scope:** Replace `components/audio-player.tsx` with an ambient ritual layer for `chiribito.com`
> **Out of scope:** gameplay audio, `play.chiribito.com` audio, anything outside `web/`

---

## 1. What this doc is, what it isn't

### Is
- Consolidated audit of the current `audio-player.tsx` and why it ontologically fails the brand
- Enumeration of the strategic forks tomorrow's brainstorm must resolve
- Options + tradeoffs across 13 dimensions (asset / activation UX / persistence / Web Audio / mobile / performance / placement / pacing / fallback / narrative / placement / accessibility / future bridge)
- Recommendations where one path is clearly stronger; preserved uncertainty where it isn't
- Anti-patterns to refuse mid-build

### Is NOT
- A final design spec — tomorrow's brainstorming session produces that
- A plan to execute — `writing-plans` comes after the design spec
- A copy draft for the activation language
- Code (no implementation snippets — those belong in the design spec / plan)
- A commitment to any specific audio asset, library, or vendor

### How tomorrow's session uses this doc
1. User re-frames intent (mood, time available, scope)
2. Brainstorming skill resumes, reads this doc as cold context, asks the user 2-4 fork decisions sequentially
3. Brainstorming produces `docs/superpowers/specs/2026-05-21-chiribito-audio-ritual-layer-design.md`
4. writing-plans produces `docs/superpowers/plans/2026-05-21-chiribito-audio-ritual-layer.md`
5. executing-plans ships the layer

---

## 2. The brand gate (north star inheritance)

This work is gated by the same compass card as the master vision spec ([2026-05-20-chiribito-web-product-vision-and-roadmap.md §2](2026-05-20-chiribito-web-product-vision-and-roadmap.md)):

**Push hard:** clandestinidad madrileña · ritual · underground · castizo · penumbra · histórico-pero-vivo · premium artesanal · exclusivo · misterio

**Reject explicitly:** casino-online generic · SaaS · startup-AI · poker-site clone · "media player" UI · "now playing" widget · broadcast feel · Spotify-embed aesthetic · feature-of-the-week vibe

**The one-sentence gate (specialized for audio):**

> "Would a parroquiano del Círculo de Bellas Artes en 1965 sentir que el lugar tiene su propio aire, sin notar nunca que hay un 'reproductor'?"

If yes — ship. If the visitor notices a player, we failed.

---

## 3. Consolidated audit of current state

Single source of truth — pulled from the 2026-05-20 audit (chat session), permanentized here.

### 3.1 Implementation snapshot
- File: [`components/audio-player.tsx`](../../web/components/audio-player.tsx) — 133 lines, "use client"
- 3 external Zeno.FM streams (Flamenco Radio / Radio Clásica Española / España Flamenco)
- HTML5 `<audio>` element, `crossOrigin="anonymous"`, `preload="none"`
- Position: `fixed top-24 right-6 z-40` — third fixed element in top-right corner stack (SocialBar at top-0 z[60], Navbar at top-8 z[50], this at top-24 z[40])
- Visual: gold-filled circle 48×48px, pulse `scale [1, 1.15, 1]` every 1.2s while playing
- Skip station + tooltip both hover-only (mobile-broken)
- Zero persistence — every reload resets to idle

### 3.2 Root causes of "se siente mal"

| # | Root cause | Why it kills the brand |
|---|---|---|
| 1 | Announces itself visually | Pulsing gold dot is the opposite of ambient |
| 2 | Broadcasts (live radio) | A reservado has its own air — it doesn't tune in |
| 3 | Generic radio vocabulary | "Reproducir / Silenciar / Siguiente emisora" = Spotify |
| 4 | Top-right traffic jam | 3 fixed elements competing in the same corner |
| 5 | No persistence | Every reload = friction |
| 6 | Mobile-broken | Skip + tooltip hover-only = invisible on touch |
| 7 | External dependency brittle | Zeno.FM down = silent break |
| 8 | Touristy content | "Flamenco Radio" = "Spain Vibes ☀️", not "sótano años 50" |
| 9 | No emotional framing | Zero ritual of activation |
| 10 | Island, not system | Doesn't share visual / tonal / narrative vocabulary with the rest |

After Wave 0, `audio-player.tsx` is **the last visible vestige of v0.dev identity drift in production.** Every other surface now leans castizo; this one is still generic-web.

---

## 4. The 13 strategic forks (decisions for tomorrow)

Each fork lists options + tradeoffs + recommendation. Tomorrow's brainstorm picks one per fork. "Recommendation" = my read, not user mandate.

### Fork F1 — Asset model

| Option | Pros | Cons |
|---|---|---|
| **F1.A Hosted curated loop(s)** (own asset in `web/public/ambient/`) | Full control, true ambient feel, no broadcast semantics, no external dep, can layer with Web Audio API, can fade/crossfade seamlessly | Need to produce or license the asset (~2–5 MB total), bandwidth on first load |
| **F1.B External live stream (new, better than Zeno)** | Zero hosting, content always fresh, no asset production | Still "broadcast" conceptually, still brittle to provider outage, harder to layer |
| **F1.C Sample library (Freesound / Pixabay ambient)** | No composition, free, hosted-locally feel | Quality variable, licensing nuances, still need curation work |
| **F1.D No audio at all** (replace with non-sonic ambient) | Zero technical risk, zero battery/bandwidth/autoplay concern | Loses unique sensory dimension; this is what the user explicitly rejected |

**Recommendation:** **F1.A (hosted curated loop)** with possible blend of F1.C as a starting point for the asset itself (curated free samples mixed into one master loop). The user's framing ("ambient ritual layer, not radio web") is incompatible with F1.B. F1.D is off the table per user.

**Open question for user:** are you willing to spend ~10-20 minutes evaluating 3-5 candidate audio loops (we'd source/preview them together), or do you have a specific atmospheric track / composer in mind already?

### Fork F2 — Track composition

| Option | Pros | Cons |
|---|---|---|
| **F2.A Single master loop** (one file ~2-3 MB seamless) | Simplest, lowest CPU, lowest bandwidth | Long-session repetition fatigue (~3-5 min loops get old) |
| **F2.B 2-3 stems crossfading randomly** (web/public/ambient/{bed,texture1,texture2}.mp3) | More variety, "alive" feel, occasional events (cards/copa) feel natural | More work, more CPU, requires Web Audio API gain orchestration |
| **F2.C Bed + procedural events** (bed loop + occasional one-shots triggered on scroll / dwell) | Most "alive" — copa clink at section transition, distant murmur during History, etc. | Complex, risk of feeling gimmicky |

**Recommendation:** **F2.A for the initial wave, F2.B as evolution.** Start contained (premium = contención). F2.C only if F2.B succeeds and we feel the need.

### Fork F3 — Activation UX

| Option | Pros | Cons |
|---|---|---|
| **F3.A Micro-control persistent** (tiny discreet icon, off by default, click to toggle) | Respects autonomy, browser-policy-safe, minimal UI footprint | Visitor must discover and choose |
| **F3.B First-visit subtle invitation** (after 5-10s dwell, a small text label fades in next to the micro-control: "Entrar al reservado" — clickable, dismisses after first interaction or 30s) | Frames ritual, primes intent, still gated on user action | Slightly more UI ceremony, must be perfectly subtle or it tips into casino-popup vibe |
| **F3.C Aggressive ritual overlay** (full-screen "Cruza el umbral" on first visit) | Maximum ritual feel | Friction wall, user might leave; the user explicitly rejected "teatralidad" |
| **F3.D No control, no UI** (audio silently starts on first user gesture, never visible) | Most ambient | Accessibility nightmare (no way to silence), violates user control principle |

**Recommendation:** **F3.A baseline + F3.B as a soft layer.** Micro-control always present (so user can toggle on/off any time); invitation only on first visit, dismissible. Off by default. F3.C and F3.D are off the table.

### Fork F4 — Placement

| Option | Pros | Cons |
|---|---|---|
| **F4.A Bottom-right** (near BackToTop, not stacked with SocialBar/Navbar) | Clears the top-right traffic jam, feels "settle in", consistent with BackToTop affordance | New corner real estate to design |
| **F4.B Top-right replacement** (slimmer micro-control still in current spot) | Familiar location, but smaller | Still competes with SocialBar + Navbar CTA |
| **F4.C Inline within a section** (e.g., bottom-right of HistorySection) | Contextual, only present when reading narrative | Invisible to scrollers, visitors not at that section can't engage |
| **F4.D Audio always present but UI in Footer** | Most contained UI | UI invisible most of the session |

**Recommendation:** **F4.A (bottom-right)**. The BackToTop button already lives there and only appears on scroll → AudioPlayer micro-control could be the persistent companion that sits there always, with BackToTop appearing above it conditionally. Clean visual relationship.

### Fork F5 — Persistence model

| Option | Pros | Cons |
|---|---|---|
| **F5.A localStorage** (remember last toggle state, station, volume) | Returning visitor experience matters; "I came back, the room remembered me" feels like recognition | One more privacy surface (low risk — no PII) |
| **F5.B sessionStorage** (per-tab persistence) | Lighter, no cross-session memory | Loses the "the room remembered me" emotional beat |
| **F5.C No persistence** (current — each reload resets) | Simplest | Friction accumulates, no ritual continuity |

**Recommendation:** **F5.A (localStorage)** — remember on/off state + volume across sessions. NOT track listening time or "habits" (creepy). Just on/off + last volume.

### Fork F6 — Volume model

| Option | Pros | Cons |
|---|---|---|
| **F6.A Fixed low** (hardcoded volume ~0.15-0.25) | Forces contención, prevents loud accidents | User can't adjust if too quiet or too loud |
| **F6.B User-adjustable slider** | Standard, respects user control | UI surface grows, must design subtle slider |
| **F6.C Two-state (low / off)** | Minimal UI, still some control | No granular tuning |
| **F6.D Scroll-aware dynamic** (louder during atmospheric sections, softer during utility) | Cinematic | Complex, can backfire ("why is it getting louder?") |

**Recommendation:** **F6.A as v1, F6.B as v2 in a follow-up wave**. Start with fixed low. If user feedback says "I want louder" or "I want quieter", add slider later.

### Fork F7 — Web Audio API vs HTML5 `<audio>`

| Option | Pros | Cons |
|---|---|---|
| **F7.A Web Audio API** (AudioContext, GainNode, can fade in/out, can crossfade between layers, can apply filters) | Real fades on toggle (no abrupt cut), can layer (F2.B/C), full programmatic control | More code, more CPU on mobile, more iOS Safari quirks |
| **F7.B HTML5 `<audio>` element** (current — `<audio src>` + `.play()` / `.pause()`) | Simplest, browser-managed, works everywhere | No fades, no layering, no programmatic volume curves |
| **F7.C Hybrid** (`<audio>` for source, Web Audio API just for the GainNode wrapper to add fade) | Best of both: source loading is simple, but transitions are smooth | Slightly more code than pure F7.B |

**Recommendation:** **F7.C (hybrid)**. Web Audio API just for GainNode on top of the audio element. Enables proper fade-in (1-2s) on activation and fade-out on deactivation. No layering needed for v1 (F2.A wins fork F2), so Web Audio doesn't have to do much.

### Fork F8 — Mobile safety strategy

Constraints (factual):
- Browser autoplay policies require user gesture for audio
- iOS Safari: even after gesture, audio pauses when app goes to background; can't resume without new gesture
- Mobile battery: continuous audio is moderately expensive
- Mobile bandwidth: external streams are 64-128 kbps continuous (rude on metered)
- Mobile UI: touch-only, no hover, smaller viewport
- Mobile screen real estate: every fixed UI element is more visually weighty

| Option | Pros | Cons |
|---|---|---|
| **F8.A Same UX desktop + mobile** | Simpler implementation | Mobile-specific concerns ignored |
| **F8.B Mobile = hidden by default + opt-in only via menu** | Respects battery/bandwidth | Two UX flows, more complexity |
| **F8.C Mobile = full feature but lower-bitrate stream + more aggressive auto-pause on backgrounding** | Best of both | Implementation complexity |

**Recommendation:** **F8.A with mobile-aware defaults**. Same UX surface (micro-control bottom-right). On mobile: prefer a smaller asset (lower bitrate or shorter loop), respect `prefers-reduced-motion` to disable any visual pulse, suspend audio when document.hidden = true. No separate UX flow needed.

### Fork F9 — Fallback strategy

What happens when audio fails (asset 404, network drop, codec unsupported, user disabled HTML5 audio in browser)?

| Option | Pros | Cons |
|---|---|---|
| **F9.A Silent fallback** (catch failure, hide control, user never knows) | Graceful, never broken UI | User confused if they expect audio |
| **F9.B Visible error state** ("No se puede cargar el ambiente") | Honest | UI surface for an edge case, breaks contención |
| **F9.C Silent fallback + console log** (`console.warn` only) | Best of both: user sees nothing broken, devs can debug | Risk: silent failures accumulate undetected |

**Recommendation:** **F9.C**. Hide the control if the asset fails to load. Log to console for debugging. The control is opt-in anyway — if it's not there, it doesn't feel broken.

### Fork F10 — Emotional pacing

When should the audio join the experience? When should it lower? When silence?

| Option | Pros | Cons |
|---|---|---|
| **F10.A Audio is fully user-driven** (on/off, no dynamic behavior) | Simple, predictable | Static feel |
| **F10.B Audio auto-fades to ~50% when video/iframe plays** (e.g., if Simulador had video, or if user clicks JUGAR PARTIDA which opens play in new tab) | Prevents collision with other sounds | Edge cases, complexity |
| **F10.C Audio always at the same level once on** | Simplest | Doesn't react to context |
| **F10.D Audio fades when document.hidden, resumes on focus** | Saves battery, respects user attention | Web Audio API edge cases on iOS |

**Recommendation:** **F10.C as baseline + F10.D**. Once user toggles on, stays at fixed level. Auto-pause when tab in background (battery + politeness). No other dynamic behavior in v1.

### Fork F11 — Activation language (Spanish copy)

What does the micro-control SAY (title attribute / aria-label) and what (if anything) does the first-visit invitation read?

Constraints:
- Castizo voice (per [[chiribito-castizo-vocabulary]])
- No "Play" / "Pausa" / "Reproducir" — those are media-player vocab
- No "Spotify-radio" register

Candidates for **micro-control title / aria-label**:
- "Entrar al reservado" / "Salir del reservado"
- "Encender el salón" / "Apagar el salón"
- "Escuchar la mesa" / "Silenciar la mesa"
- "Abrir la noche" / "Cerrar la noche"

Candidates for **first-visit invitation label** (if F3.B chosen):
- "¿Entrar al reservado?"
- "Pasar al salón"
- "Encender el ambiente"

**Recommendation:** Decide in tomorrow's brainstorm with the user. My instinct: "Escuchar la mesa" / "Silenciar la mesa" (sits inside the castizo verb space — escuchar es lo que hace un parroquiano en el reservado). Or "Abrir la noche" / "Cerrar la noche" (more poetic, slightly more abstract).

Recommend **multi-choice question for user** in tomorrow's brainstorm.

### Fork F12 — Visual identity of the micro-control

What does the control LOOK like? It must be small + castizo + not a media-player.

Candidates:
- **F12.A** Tiny round amber dot (~16-20px), no icon, fades brighter when on (the "ember" / "candle" metaphor)
- **F12.B** Tiny suit-icon (Oros copas Espadas Bastos rotating? Or one specific suit) at small scale
- **F12.C** Tiny art-deco-frame mini square (~24px) with no icon, fills with felt-color when on
- **F12.D** Minimal text label "·" or "•" that animates very subtly
- **F12.E** Custom castizo icon (commissioned or hand-crafted SVG — small chandelier, copa silhouette, etc.)

**Recommendation:** **F12.A or F12.C**. The ember/candle metaphor (F12.A) reads as "atmosphere ON / OFF" without any media-player vocabulary. The art-deco mini-frame (F12.C) ties to existing `art-deco-frame` utility. **Lean F12.A** for purest contención.

### Fork F13 — Future bridge to play.chiribito.com

How does the ambient layer eventually connect to the game? NOT to implement now, but design with the bridge in mind.

| Option | Implementation complexity | Notes |
|---|---|---|
| **F13.A No bridge** (web audio stops on link click, play.chiribito.com is its own audio universe) | Trivial | Simpler, no cross-domain audio coordination |
| **F13.B URL hint** (web passes `?ambient=on` when user clicks JUGAR PARTIDA, play.chiribito.com optionally picks up and starts its own analogous ambient) | Low | Game side decides; loose coupling; nothing breaks if game doesn't honor it |
| **F13.C Shared audio context via subdomain coordination** (broadcast channel, shared session token, etc.) | High, brittle, cross-origin complexity | Probably not worth it |
| **F13.D Visual cue only** (web ambient is mentioned in play.chiribito.com first-load if `referrer === chiribito.com` — "el ambiente sigue") | Medium | Marketing thread, not technical |

**Recommendation:** **F13.A for v1, F13.B for future**. Don't engineer cross-domain audio. If we want continuity later, F13.B is the lightest bridge. No need to bake F13.B into v1 architecture — it can be added later.

---

## 5. Performance & bandwidth budgets

For the recommended path (F1.A hosted curated loop):

| Constraint | Target | Notes |
|---|---|---|
| Total asset size | ≤ 3 MB (gzipped if applicable) | Stretchable to 5 MB if quality demands; we already added 6.4 MB of card assets in Phase W |
| Asset format | MP3 128 kbps OR OGG 96 kbps (both at minimum for browser coverage) | MP3 is universal; OGG smaller; we can ship MP3-only for simplicity |
| Initial page load impact | 0 bytes — asset only loads on user toggle (`preload="none"`) | Preserves current PageSpeed of the home |
| Per-session bandwidth (if user toggles on) | One-time download (~3 MB), then loop forever; no continuous streaming | Critical difference vs current Zeno.FM streams (continuous bandwidth) |
| CPU on play | Negligible — single audio element + one GainNode | Current pulsing animation actually costs more CPU than the audio would |
| iOS Safari battery | Pause on `document.hidden` change → minimal background drain | Standard, no special accommodation |
| Reduced-motion preference | Respect `prefers-reduced-motion`: disable any visual pulse / ember animation on the micro-control; audio behavior unaffected | Already established pattern in `globals.css` |

---

## 6. Accessibility

| Concern | Mitigation |
|---|---|
| User can't perceive audio (deaf, hearing-impaired) | Visual cue still works (micro-control state visible); not relying on audio for any information |
| User has audio sensitivity | Off by default; can be permanently silenced (toggle state persists via F5.A) |
| User on assistive tech (screen reader) | `aria-label` reads castizo phrase ("Escuchar la mesa" / "Silenciar la mesa"); `aria-pressed="true|false"` on the toggle |
| User prefers reduced motion | Per F7/F8 — disable visual pulse on the micro-control |
| User on metered connection | Asset doesn't load until toggle (no autoplay, no preload); one-time download <3 MB then loops in memory |

---

## 7. Anti-patterns to refuse mid-build

If any of these appear in the design spec or the implementation plan, stop and reframe.

- ❌ Visible station selector ("Next station", "Skip", playlist UI)
- ❌ Now-playing label ("Flamenco Radio · Track Name")
- ❌ Progress bar / scrubber
- ❌ Equalizer / EQ visualization
- ❌ Volume slider as primary UI (only as v2 / secondary)
- ❌ Pulsing button that draws attention
- ❌ Notification or modal asking user to enable audio
- ❌ "🎵" or any music-note emoji
- ❌ Headphone-icon recommendation banner
- ❌ "For the best experience, use headphones" copy
- ❌ Sound effects on UI interactions (click sounds, hover chimes)
- ❌ Multiple ambient layers competing (only the ambient layer exists; no per-section music)
- ❌ Triggering audio on scroll, hover, or anything other than explicit user click on the micro-control or first-visit invitation
- ❌ Talking about "stations" in copy or code (it's not radio)
- ❌ Live broadcast feel of any kind

---

## 8. Open questions for tomorrow's brainstorm

The brainstorming session should resolve these in order:

1. **Asset model (F1)** — F1.A confirmed? Or any other fork? Most foundational decision.
2. **Track composition (F2)** — F2.A single master loop (recommended) or F2.B stems?
3. **Activation UX (F3)** — F3.A + F3.B (recommended) or F3.A alone?
4. **Placement (F4)** — F4.A bottom-right confirmed?
5. **Activation language (F11)** — pick from the 4 candidate phrase pairs?
6. **Visual identity (F12)** — F12.A ember/dot vs F12.C art-deco-mini-frame?
7. **Audio asset acquisition** — does the user have a track in mind, or do we curate together from candidates?
8. **Activation invitation timing** — if F3.B is in: invitation appears after 5s? 10s? On second scroll? On scroll into history section?
9. **Volume default** — 0.15? 0.20? 0.25? (Subjective — user picks based on the candidate track)
10. **First-load policy** — never-touched user: do they see the invitation, or just the dot, or nothing until they interact?
11. **Off-state visibility** — is the micro-control visible when off, or only when on? (Recommend always-visible so user knows the option exists.)

---

## 9. What is OUT of scope for this layer

To prevent scope creep tomorrow:

- ❌ Audio on `play.chiribito.com` (separate concern, separate ecosystem layer)
- ❌ Sound effects on the existing site (button clicks, hover sounds, etc.)
- ❌ Background music for individual sections (per F10 — one ambient layer, fixed level)
- ❌ Per-page audio variation (the ambient is the same on `/` and `/contacto`)
- ❌ Voice tagging / narrator audio
- ❌ Audio analytics ("how many users played, for how long, etc.") — privacy + scope creep
- ❌ User-uploaded ambient
- ❌ Multiple themed ambients ("daytime ambient" / "nighttime ambient")
- ❌ Equalizer / DSP for users
- ❌ Music-store-style discovery UI

---

## 10. Estimated effort (rough)

Once design spec is approved + plan is written:

| Phase | Effort |
|---|---|
| Asset curation/sourcing (find + edit 1 master loop to ~3 min seamless) | 30-90 min depending on path (existing vs new commission) |
| Implementation (new `AmbientLayer.tsx` component, hybrid Web Audio + HTML5, micro-control UI, persistence) | 2-4 hours |
| Mobile testing (iOS Safari + Android Chrome viewport) | 30-60 min |
| Production deploy + live smoke | 15 min |

**Total:** half-day to 1 day of focused work IF the asset is decided upfront. The asset curation is the longest variable.

---

## 11. Required input from user before tomorrow's brainstorm

Helpful to think about overnight:

1. **Music direction preference:** flamenco-guitar-very-sparse / jazz-noir-very-quiet / room-tone-only-no-music / hybrid (light bed + occasional instrumental flourishes) / something specific you have in mind
2. **Risk appetite for opt-in:** are you OK with "off by default, micro-control visible, user must click" (most defensive), or do you want a soft invitation overlay on first visit?
3. **Castizo phrasing preference:** do you have a phrase in mind for the on/off label? Otherwise we'll pick from candidates (§4 F11)

---

## 12. Cross-references

- Master vision spec: [`2026-05-20-chiribito-web-product-vision-and-roadmap.md`](2026-05-20-chiribito-web-product-vision-and-roadmap.md) — §5 verdict for AudioPlayer = KEEP (concept) → REFINE later (Wave 3)
- Wave 0 plan: [`2026-05-20-chiribito-web-wave-0-defensive.md`](../plans/2026-05-20-chiribito-web-wave-0-defensive.md) — AudioPlayer untouched
- Current implementation: [`web/components/audio-player.tsx`](../../web/components/audio-player.tsx)
- North star: vision spec §2 (compass card)
- Auto-deploy policy: memory `feedback_chiribito_auto_deploy_policy.md`
- Castizo vocabulary canon: memory `feedback_chiribito_castizo_vocabulary.md`

---

**End of architecture prep. Tomorrow's brainstorm picks up here.**

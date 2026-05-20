# HANDOFF — Premium Perceptual Phase (Chiribito)

> **Status:** Closed + validated in live 2-player gameplay · 2026-05-20
> **Scope:** Audiovisual atmosphere / "mesa viva" / game-feel — perceptual polish only.
> **Delivered:** a first genuinely *playable & feel-able* Chiribito with living atmosphere
> across landing → lobby → mesa. Pushed to origin/main; `chiribito-play` (re)deployed to
> play.chiribito.com as part of this close-out.
> **Next session = perceptual only.** Do NOT reopen resolved technical work.

---

## 1. Real state of the audio / music

### Game client (`frontend/`, play.chiribito.com)
- **SFX layer** (`audio.ts`): warm master bus + short dark room reverb; castizo timbres
  (triangle/sine + lowpass + octave-down + pitch glides); dealt-card swoosh; distinct
  win (rising chord, local winner only) vs lose (descending fifth); final-seconds
  countdown tick on your own turn; persistent "Sonido" mute (localStorage).
- **Music layer** (`music.ts`): lobby / mesa / none state machine, ~2s crossfades,
  ducking (moment SFX dip music to 65% ~0.8s; routine SFX don't duck), lazy preload,
  mute mirrors "Sonido", mobile-safe (gesture unlock + pause on `document.hidden`),
  graceful 404 fallback, mesa round-robins its 2 loops. Procedural room-tone REMOVED
  (user rejected — do not re-propose procedural ambient).
- **Tracks** (`frontend/public/audio/`, royalty-free): `lobby.mp3` (spanish flamenco),
  `mesa-1.mp3` (jazz chill), `mesa-2.mp3` (dark jazz guitar). Defaults: lobby **0.15**,
  mesa **0.10**, duck **65%**, crossfade **2s**. ~14 MB total (re-encode to lower bitrate
  is a future option — needs ffmpeg, not installed; NOT done, not scope).
- **Runtime tuning knob (no UI):** `__chiri.music.level(state,v)` · `.state(s)` ·
  `.duck()` · `.debug()`.

### Landing site (`web/`, chiribito.com) — Next.js 16 / React 19
- Music **already integrated + mounted**: `web/components/audio-player.tsx`, rendered in
  `web/app/page.tsx`. Click-to-play (no autoplay) flamenco / spanish-guitar **radio
  streams** (3 zeno.fm stations) with play/pause, skip-station, mute, tooltip. Uses
  external streams → no local audio assets in `web/`. (No change this phase — verified live.)

### Audiovisual coherence (landing → lobby → mesa)
Flamenco / spanish guitar (landing + in-game lobby) → jazz (mesa). Consistent with the
locked "spanish dark jazz / flamenco lounge" direction. Verified across all three surfaces.

### Felt / lighting polish (this phase, `frontend/src/style.css`)
- `felt-L1` + `felt-L2a`: deeper, slightly desaturated green felt + micro tonal variation.
- `lighting-L1`: subtle cinematic vignette in the ambient AROUND the felt oval (center stays
  clear — no spotlight, which would compete with the cards; only edges/corners deepen).
  Does NOT touch felt / cards / rim.

---

## 2. 2-player bot harness (perception tooling — `.dev-stack/`, gitignored)

The whole point of this phase was perceiving music + gameplay together, which needs a real
hand (≥2 players — solo testing sits in "ESPERANDO", no hand is dealt).

- **`.dev-stack/table-bot.ts`** — seats N passive bot players into a live mesa. Human
  creates a mesa, reads the room id from `#room-status`, then runs:
  `BOT_ROOM_ID=<id> [BOT_COUNT=1] [BOT_HEADFUL=1] npx tsx .dev-stack/table-bot.ts`.
  Each bot registers a guest, joins by id, then auto-plays the most PASSIVE legal action
  each turn (Pasar > Igualar, never bet/raise/fold) so hands run to showdown across all 6
  streets — maximal perceptual surface. Human clicks "Empezar mano" at their own pace.
- **`.dev-stack/bot-diag.ts`** — one-shot diagnostic (overlay-state dumps + screenshots +
  network 4xx/5xx + console errors) used to debug seating.
- **Gotcha solved — do NOT re-hit:** tsx/esbuild `keepNames` wraps named functions with
  `__name(...)`, undefined in the Playwright page context → `__name is not defined`. Fix:
  pass every `page.evaluate` / `waitForFunction` body as a STRING (strings aren't
  transformed). Same workaround `scripts/e2e-browser.ts` already uses.
- **Gotcha (environmental):** Colyseus disposes a room when its last client disconnects.
  Leaving the create→bot gap open for minutes can dispose the host's mesa (`joinById` → 522
  "room not found"). Create the mesa and run the bot promptly; keep the host tab focused.

---

## 3. Initial perceptual conclusions (user, live 2P audition)

- The mesa **feels much more alive**.
- The music **works much better in real context** than in solo/static testing.
- **2-player gameplay completely changes the perception** — this was the missing piece.
- The **nocturnal / social atmosphere** is starting to emerge.

### What worked best
- A **real 2-player hand** as the perception baseline (vs solo) — the single biggest lever.
  Judge audio / feel only in a live hand.
- Music + gameplay SFX + ducking **together**, in context.
- Felt deeper/desaturated + the ambient lighting vignette (play area emerging from shadow)
  reinforced "mesa viva" WITHOUT touching the locked card/felt identity.

---

## 4. Next focuses (future sessions — NOT started, not a committed roadmap)

- Lock final **mix / levels by ear** over longer sessions (fatigue, loop-seam quality).
- Deeper **microfeedback / microanimations** (chip movement, deal tactility, turn pulse).
- Smooth **transitions** further (crossfade / duck feel over many consecutive hands).
- Optional: **more bots** (`BOT_COUNT`) for a fuller social table.
- Optional housekeeping: **re-encode MP3s** to reduce repo size (needs ffmpeg).

---

## 5. What NOT to touch (locks — carry-forward; do not change without explicit "go")

- **Audio tech is resolved & verified — do NOT re-debug** (flow, table render, music plays).
  The remaining work is perceptual, not technical.
- **Procedural room-tone:** rejected. Do not re-propose procedural ambient.
- **Card size:** locked-good. Do not rescale.
- **Felt width / oval gradient identity; wood border + gold rim; Fournier cards
  (`frontend/public/cards/*.webp`); mascots; castizo vocabulary; branding.**
- No new systems, no big refactors, no framework changes, no infra changes.

---

## 6. Tests / runtime
- Frontend vitest: **232/232 green** (41 files). Game-server + api-server untouched this
  phase (their jest suites unaffected).
- dev:stack ports: api 3000, game 2567, postgres 5432; frontend Vite 5173.

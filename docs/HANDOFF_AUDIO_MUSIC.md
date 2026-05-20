# HANDOFF — Audio + Music Layer (Chiribito game)

> **Status:** Implemented + technically verified · **SHIPPED-local, NOT pushed** · 2026-05-20
> **Scope:** `play.chiribito.com` game client (`frontend/`). Landing-site audio is a separate concern.
> **Next session = PERCEPTUAL only.** Do NOT reopen technical investigation (it's resolved & verified).

---

## 1. What's done (all local commits, `main` ahead of origin)

### SFX overhaul (validated by ear: "más vivo y físico")
- Warm master mix bus (gain → gentle compressor) + short dark room reverb.
- Killed arcade square/sawtooth → warm triangle/sine timbres w/ lowpass, octave-down body,
  pitch glides (call settles, raise climbs, fold sighs, allIn leaps).
- Dealt-card swoosh wired (`deal` was dead code).
- Distinct **win** (rising chord, local winner only) vs **lose** (descending fifth); fixed the
  bug where the win chord fired for everyone.
- Final-seconds **countdown tick** on the local player's own turn.
- **Mute toggle** ("Sonido" in lobby header) + localStorage persistence.

### Music layer — plug-and-play (`frontend/src/music.ts`)
- Lobby / mesa / none **state machine** with ~2s **crossfades**.
- **Ducking**: moment SFX (win/lose/perla/yourTurn/allIn) dip music to 65% ~0.8s; routine
  SFX (hover/click/tick) don't duck. Wired via `audio.setMomentEffectHandler`.
- **Preload** (lazy), **mute** (mirrors "Sonido"), **mobile-safe** (gesture unlock + pause on
  `document.hidden`), **graceful fallback** (missing/errored track → console.warn + silent).
- Mesa **round-robins** its 2 loops + a ~3-min in-session crossfade for variety.
- Shares `audio.ts`'s AudioContext + bus via `music.attach()`; music routes through the
  compressor but **bypasses the SFX reverb**.
- **Procedural room-tone REMOVED** (user rejected it — do not re-propose procedural ambient).
- Runtime tuning knob (no UI): `__chiri.music.level(state,v)` / `.state(s)` / `.duck()` / `.debug()`.

### Tracks integrated (royalty-free, user-selected) → `frontend/public/audio/`
| File | Track | Role |
|------|-------|------|
| `lobby.mp3` | studiokolomna spanish flamenco | lobby (identity, more melodic) |
| `mesa-1.mp3` | waveloom jazz chill | mesa bed A |
| `mesa-2.mp3` | surprising_media guitar-charm dark jazz | mesa bed B (alternates) |

Default mix: lobby **0.15**, mesa **0.10**, duck **65%**, crossfade **2s**. ~14 MB total.
Swap/iterate = replace MP3s or edit `TRACKS` in `music.ts`; no other change.

---

## 2. Relevant commits (local, NOT pushed — `main` ahead of origin ~22)

```
SFX:    9bd498d  warm mix bus + reverb + timbres
        ff2e8ad  deal swoosh
        323eabc  win/lose distinct (+ fix win-for-losers)
        204f76b  mute toggle + persistence
        5422ce6  countdown tick
Music:  77327ee  docs(spec): game music layer design
        b770475  drop procedural room-tone; add music tap + duck hook
        ba402d5  music.ts layer + 6 unit tests
        6f7f1a2  integrate into game shell + public/audio README
        7fdabf2  mix defaults + runtime tuning knob
        c4027a5  fix: start music on unmute-from-muted-load
        4f716a1  chore: __chiri.music.debug hook
        8c97016  add the 3 selected ambient loops (binaries)
(superseded: 8a30c47 procedural room-tone — removed by b770475)
```
Spec: `docs/superpowers/specs/2026-05-20-chiribito-game-music-layer-design.md`.
Note: interleaved with the user's parallel table/card-render commits (`30bc600`, `1d3a171`,
`06490eb`, `07f53c5`, `40a0894`, `08709bd`, `e5a64ea`, `0803d83`) — no conflict with audio.

---

## 3. Runtime status

- dev:stack from a prior session is up: **api :3000, game :2567, postgres :5432**.
- **Frontend Vite :5173** is up (PID was 43976; it's days-old — a fresh page load still serves
  current code). If it's gone next session: `cd frontend && npm run dev` (backend already up),
  or full `npm run dev:stack` (note: aborts if postgres :5432 is still locked by the running one).
- Tests: **232/232 vitest green**, `tsc --noEmit` clean for all audio/music files.

---

## 4. Validated (technical) vs. PENDING (perceptual)

### ✅ Validated with evidence (Playwright e2e + runtime probe `.dev-stack/diag-music-flow.ts`)
- Full flow works: register → lobby → **create mesa → table mounts** → reload/login/reconnect (e2e all green).
- Table **renders correctly** (screenshot `.dev-stack/diag-music-table.png`): felt/wood/gold/seats/pot.
- Music **plays**: lobby `lobby.mp3` (paused=false, t advancing, 0.15) → **lobby→mesa transition fires**
  → mesa `mesa-1.mp3` (paused=false, t advancing, 0.10). **Zero page errors.**

### ⏳ PENDING — needs the user's ears (this is the whole next session)
- Final **mix / levels** (the 3 tracks have different mastering loudness → balance by ear via `__chiri.music.level`).
- **Music ↔ gameplay coexistence** during a **real hand** (needs ≥2 players — see §6).
- **"Mesa viva"** feel, crossfade smoothness, ducking feel, loop-seam quality, fatigue over time.
- Then: lock levels in code → commit binaries' final mix → **PUSH** (push is gated on this).

---

## 5. The "perceived problem" — RESOLVED, do not re-debug

It was **not a code bug**. Causes were environmental:
- **Solo testing** → table sits in **"ESPERANDO"**; no hand is dealt (needs ≥2 players) → no
  gameplay to feel.
- **Stale/cached browser tab** (Vite running for days) → hard-refresh loads current code.

---

## 6. How to validate next session

1. **Hard-refresh** `localhost:5173` + one click (unlocks audio). Confirm with `__chiri.music.debug()`
   (expect `attached:true, paused:false`).
2. **Solo audition (no table needed):** `__chiri.music.state("lobby")` / `("mesa")` to hear each
   track + crossfade; `__chiri.music.level("mesa",0.07)` to tune; `__chiri.music.duck()` to hear the dip.
3. **Real gameplay (for "mesa viva" + coexistence):** needs 2 players. Options — open a 2nd
   browser/guest into the same table, OR ask the assistant to spin up a 2nd-player bot (the
   `scripts/e2e-browser.ts` "spawn second player" pattern can be adapted). Then play a hand and
   judge music + gameplay SFX together.
4. Tell the assistant the levels you like → it locks them in `music.ts` → commit → **push**.

---

## 7. Next-session focus (per user)

Perception · experience · fine-tuning · atmosphere · emotional/game-feel validation · final mix
· final levels · audiovisual polish · 2-player real gameplay. **NOT** technical re-investigation
of anything above (resolved & verified).

See also: memory `feedback_chiribito_audio_direction.md` (locked direction + reject-list +
plug-and-play workflow), `project_chiribito_audio_music.md` (resume point).

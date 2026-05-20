# Chiribito Game Music Layer — Design

> **Status:** APPROVED design (user signed off on architecture 2026-05-20) · scope: `play.chiribito.com` game client (`frontend/`)
> **Out of scope:** the landing `chiribito.com` ambient player (separate deferred spec), gameplay SFX (already shipped this session)

---

## 1. North star

The sound of a clandestine Madrid card room at night — a *timba* in a sótano: warm
Spanish guitar, dark/chill latin jazz, soft flamenco lounge. Human, intimate, social,
slightly *canalla*, very warm. Music that **accompanies**, never demands attention.

Gated against the Chiribito brand compass (web vision spec §2): push *clandestinidad
madrileña · penumbra · castizo · premium artesanal*; reject *casino · EDM · synthwave ·
corporate lounge · épico · tech/abstract ambience*.

This replaces the rejected procedural brown-noise room-tone shipped earlier this session.

---

## 2. Honest sourcing boundary

Real ambient music = audio asset files. The assistant cannot compose, cannot *hear*,
cannot reliably fetch/verify binary audio, and must not fabricate track URLs. Therefore:

- **Assistant delivers:** the complete, tested, integrated, plug-and-play music *system*.
- **Human (or external source) delivers:** the actual royalty-free / CC MP3 files.
- **Drop-in contract:** placing the files in `frontend/public/audio/` makes it work
  instantly — no further technical setup.

## 2.1 Asset acquisition brief (royalty-free / CC)

Search terms: `spanish guitar lounge`, `flamenco chill`, `nylon guitar instrumental`,
`flamenco jazz`, `latin jazz lounge`, `jazz noir`, `gypsy jazz` (slow), `tapas bar`,
`late night jazz guitar`. Mood filters: calm / mellow / sophisticated / mysterious.
Instruments: nylon guitar, upright bass, brushed drums / cajón, soft Rhodes, muted trumpet.

| Param | Lobby | Mesa (gameplay) |
|-------|-------|-----------------|
| BPM | 75–90 | 60–78 |
| Energy | low-medium | low, sparse |
| Melody | a bit more present | minimal, near-texture |
| Source length | 2–3 min, loopable | 2–3 min, loopable |
| Structure | even, no climax/build/hook | even, flatter |

Must be: instrumental, loopable, low-energy, non-invasive, not-too-melodic. Avoid vocals,
drops/builds, strong hooks, BPM > 100, intense palmas. **License: commercial-use OK; avoid
CC-BY-NC.** Pixabay Music (no attribution) and Uppbeat (free-with-credit) are easiest.

**Track count v1:** 1 lobby + 2 mesa (the two mesa loops alternate to fight fatigue).

---

## 3. Architecture

New module `frontend/src/music.ts` — single responsibility: long-lived looping music
playback + state transitions. Separate from `audio.ts` (one-shot SFX), but **shares
`audio.ts`'s AudioContext + master bus** so the "Sonido" mute and the mobile unlock cover
both, and one compressor glues the whole mix.

### 3.1 Audio graph

```
SFX voices ─► sfxBus(masterGain) ─► [dry] ─► comp ─► destination
                                  └─► [reverb send] ─► comp
music tracks ─► trackGain(each) ─► musicMaster ─► musicInput ─► comp ─► destination
```

Music routes to a dedicated `musicInput` gain (created in `audio.init()`, connected to the
compressor) — it gets the shared limiter + master mute, but **bypasses the SFX room reverb**
(pre-produced music shouldn't be re-verbed).

### 3.2 `music.ts` public interface

- `attach(ctx, destination)` — wire to the shared bus (called once, post-unlock).
- `setState("lobby" | "mesa" | "none")` — crossfade to that state's track(s).
- `setEnabled(boolean)` — mute/unmute (pause/resume, remembers intent).
- `duck(amount?, durationMs?)` — briefly dip music under a "moment" SFX, then restore.

Internal: per-track `HTMLAudioElement(loop)` → `MediaElementAudioSourceNode` → `trackGain`
→ `musicMaster` → injected destination. State machine crossfades trackGains (~2s). Mesa
round-robins its loop list on each entry + an in-session timed crossfade for variety.

### 3.3 Behaviours

- **Crossfade:** ~2 s linear gain ramps on state change; target track restarts from 0.
- **Ducking:** moment SFX (win / lose / perlaArrive / yourTurn / allIn) dip music to ~65 %
  for ~0.8 s then restore. Routine SFX (hover / click / tick) do **not** duck.
  Wired via `audio.setMomentEffectHandler(fn)` → `fn = () => music.duck()` (no module
  coupling: `audio` doesn't import `music`).
- **Mix levels (defaults, tunable by ear):** lobby base ≈ 0.15, mesa base ≈ 0.10.
- **Preload:** `preload="auto"`; lobby loads on attach, mesa lazily on first mesa entry.
- **Mute persistence:** reuses the existing `chiri_sound_muted` localStorage key + the
  "Sonido" toggle (toggle calls both `audio.setEnabled` and `music.setEnabled`).
- **Mobile-safe:** starts only after the first user gesture (shared unlock); pauses on
  `document.hidden`, resumes on visible (if enabled + has a state).
- **Graceful fallback:** a track that 404s / errors → `console.warn` + skipped. A state
  with no available track → silence. The build runs cleanly with **zero** assets.

### 3.4 Integration points (`main.ts` / controllers)

- On unlock/init: `audio.init()` → `music.attach(ctx, audio.getMusicTap())` →
  `music.setState("lobby")`; register `audio.setMomentEffectHandler(() => music.duck())`.
- Lobby shown → `music.setState("lobby")`; room joined/active → `setState("mesa")`;
  leave / back-to-lobby → `setState("lobby")`.
- "Sonido" toggle → `audio.setEnabled(x)` **and** `music.setEnabled(x)`.

---

## 4. Asset pipeline

`frontend/public/audio/` (sibling of existing `public/brand/`, `public/cards/`):

```
lobby.mp3     ← 1 lobby loop
mesa-1.mp3    ← mesa loop A
mesa-2.mp3    ← mesa loop B
README.md     ← filenames + the §2.1 brief, for swapping tracks later
```

Track URLs are a small config map in `music.ts`, so adding/swapping a loop is a one-line
edit. Iterating the definitive music later = replace the MP3s, no code change.

---

## 5. Testing

- **Unit (vitest):** state machine transitions, gain/crossfade math, duck dip+restore,
  round-robin mesa selection, graceful handling of a missing/errored track — with the
  audio element + Web Audio nodes mocked (same boundary the existing tests mock).
- **Runtime (dev:stack):** build serves cleanly, no console errors, transitions fire,
  graceful silence with no assets present. Audible mix/level tuning is validated by the
  user once real tracks are dropped in (assistant cannot hear).

---

## 6. Out of scope (v1)

- Sourcing/auditioning the actual tracks (human + ears).
- A separate music on/off control distinct from the master mute (v2 if wanted).
- A volume slider (v2).
- Per-result musical sting (the win/lose SFX already own that beat).
- Gapless buffer-based looping (HTMLAudioElement streaming for v1; upgrade if seams audible).

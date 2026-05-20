# HANDOFF — El Chiricacharro / La Verbena (feel prototype)

> **Status:** Tactile hands-on pass SHIPPED-local + **VALIDATED on device** · 2026-05-20
> **Scope:** throwaway feel prototype `.dev-stack/cacharro-mockup.html` (gitignored, vanilla JS + canvas + Web Audio synth + haptics, mobile-first). This is the *feel lab*, NOT the real game.
> **Direction SoT:** `docs/superpowers/specs/2026-05-20-chiribito-el-cacharro-design.md` (Locked Design Laws §2, Non-Goals §11).
> **Next session = the perceptual roadmap (§6), gated and in order.** No re-brainstorming, no new systems, no economy. The conceptual direction is locked and confirmed.

---

## 1. Where we are

The prototype now reads as a **physical, living object with personality** — not an interactive UI. This was confirmed by the user on a real mobile device. The conceptual reframe (a grumpy half-broken *character-machine*, anti-slot, anti-casino) is working in the hand. The remaining gap before it feels like a *complete game* (vs. a great interactive object) is **gameplay/reward legibility** (§4).

Run it: `preview_start("cacharro-mockup")` → `localhost:4599` (config in the **global** `~/.claude/launch.json`; server `.dev-stack/serve.cjs`). Real Chiribito deck is wired via the game's own contract (`frontend/src/card-texture-url.ts`).

## 2. What's done — tactile hands-on pass (LOCKED-GOOD — do NOT re-tune without explicit reason)

Two direct-touch interactions were overhauled, then deliberately dialed back to *contención*.

- **Lever** — stopped being a UI slider. `LEVER{}` config drives a resistance curve (stiction to start + a commit "wall" near the top), **3 position-based detents** that tick (sound + haptic + rattle, speed-independent), and an **underdamped spring return** (`leverVel`, overshoot, a variable `leverRest` so it never settles at the same angle), plus a `creak` on a quick release and a micro-tremble while grabbed. Helpers: `leverMap` / `leverInv` / `leverDetents`.
- **Golpe (the smack)** — stopped being symmetric screen-shake. Now a **directional knock**: the cabinet lurches *away from where you tap* (computed from pointer vs. cabinet center) + recoil + slight rock, via the `knockX/Y/VX/VY` spring, with the old random jitter riding on top as internal rattle. Drier, more metallic `sfx.smack`. Added `sfx.tick` (dry click) + `sfx.creak` (old spring).
- **Three dial-backs (user-confirmed: "presencia física implícita > feedback explícito"):**
  1. Lever ticks are now **only** the 3 position-based detents (removed the per-`pointermove` random tick — it was cascabeleo).
  2. **Single dry bulb flick** on smack (reverted the double).
  3. **Grumble/text heavily reduced** — base grunt ~22%, of those only ~35% pop a text bubble, longer stunned-silence delay (150–290 ms). The body talks, not the text. Streak-based annoyance kept (poke it repeatedly → it gets fed up) but text stays contained.
- **Tunable knobs** (for future tweaks): `LEVER.{stiction,wall,wallK,fire,detents,k,c}`, smack `force`, knock spring (220/16). If the golpe reads as *camera* not *mass* → lower `force` / raise knock damping; jelly overshoot → raise `LEVER.c`; gamified detents → soften `tick` or drop to 2 detents.

**Verification caveat (don't relearn the hard way):** the headless preview SUSPENDS `requestAnimationFrame` after reload → pixel screenshots time out, live animation can't be observed in-tool. Verify via **console-clean + structural `preview_eval`** only; the **feel judgment is the user's on a real device.**

## 3. What works (user's mobile reading, validated)

Physical interaction · personality · golpes · resistance · rareza · the sense of a living object. The strongest current loop is *negotiating with the cacharro* — and it gives the urge to interact **even when nothing happens**, which is the core thesis of the whole feature.

## 4. The real gap — gameplay/reward legibility (the next big challenge)

A great interactive object, not yet a complete game. Missing layer, **without becoming a modern casino**:

- fichas/monedas **más presentes** — as physical castizo objects / spectacle, **never a credit balance or number**;
- **lectura de rango/victoria** + which combinations matter (hang it on the real Chiribito hand ranks — **La Perla** = Sota + 7 of the same suit is the canonical strongest);
- **feedback visual de premio** + **jerarquía de resultados** (Nivel 0 *nada* → Nivel 1 *algo* / el Pato → **El Caos** / La Perla, made legible);
- the sense that **"algo valioso está ocurriendo"** — via **rareza + card focus + castizo spectacle**, NOT via jackpot juice.

> **Locked reward principle (the single most protective rule going forward):**
> **recompensa = rareza + carta + alma, NUNCA dinero** — *reward = rarity + card + soul, never money.*
> This is what keeps Chiribito from accidentally drifting into a generic slot.

The machine should read **bigger, fuller, deeper, more "verbena viva," more physical, more memorable — but NOT noisier.** *Más rico ≠ más ruidoso.*

## 5. Risks detected

1. **Casino-drift (highest)** — when building reward feedback / visual richness (phases 2–3). Mitigate: reward never = money; gate every decision against the Locked Design Laws + the *test-de-5-segundos* (muted clip must read "se ha liao", not "I won X").
2. **Over-expression relapse** — *más rico ≠ más ruidoso*. Same contención discipline that just worked: body > text, rareza.
3. **Mockup-loop trap** — a prior V1→V4 mockup loop drifted casino-clone (see `docs/HANDOFF_COMPACT_DENSITY_PASS.md`). Evolve THIS prototype; no V5+ reboot.
4. **Headless rAF** — can't verify feel in-tool; the user judges on device (a permanent constraint, see §2).

## 6. Perceptual roadmap (locked order — gated)

1. **"La máquina vive"** — imperfección física + dirty secondary motion: irregular breathing, asynchrony, charm with inertia (coupled to the shake), unstable dial, micro-delays, physical resonance, uncomfortable pauses, small internal sounds. *Low-risk continuation of the validated tactile line. No big FX.*
2. **Claridad gameplay/recompensa** — the gap in §4. *Highest design-risk phase (casino-drift lives here).* Reward = rarity + card + soul, never money.
3. **Riqueza visual controlada** — bigger / fuller / deeper / "verbena viva" / physical / memorable, NOT noisier.
4. **Escalada correcta de El Caos** — *GATED until 1 + 2 are done.* Better crescendo (tensión → explosión breve → agotamiento), **not bigger.**
5. **Audio identity final** — metal viejo / muelles / madera / fluorescente / ventilador cansado / verbena lejana, with distance + ambient layers (synth placeholder now).
6. **Mobile feel final** — final tactile/readability/perf pass on device.
7. **Integración con el loop real de Chiribito** — bridge to the real mesa game (hand ranks via `CardEvaluator`; the real deck is already wired in the prototype).

**Sequencing note (open decision for next session):** recommended — a *short* phase 1 first (banks the "it's alive" feel cheaply, low risk, continues the validated line), then the bigger phase 2 design challenge. But the user's energy is on phase 2 (the real "complete game" payoff), so going straight at it is defensible; cheap phase-1 details (unstable dial, charm inertia) can ride along. **User opens fresh, no auto-start.**

## 7. Limits NOT to cross

No casino moderno / Vegas / slot app / jackpot juice · no fake economy / wallet / persistent balance / dark patterns · no *más ruidoso* · no systems / economy / multiplayer / progression / modifiers yet · El Caos not bigger until the gated phases are done · no mockup V5+ reboot · never break card focus / contención / rareza / alma castiza / mobile clarity.

## 8. Do NOT touch (locked-good)

- The validated tactile pass (lever physics, golpe knock, contained reaction, the 3 dial-backs).
- Card sharpness fixes from the prior session (integer translateY bob, NO fractional scale, NO blur, slim glass glare).
- Real cards via the game contract.
- The Locked Design Laws, naming, economy stance, and invariants in the design SoT.

## 9. Pending valuable ideas

- Reward legibility hung on real Chiribito hand ranks (La Perla etc.) — doubles as the bridge to roadmap #7.
- Cheap "máquina vive" wins ready to bank: unstable dial, charm with inertia coupled to the shake, irregular breathing, micro-delays, small internal sounds, odd pauses.
- Optional sparse distance-based "grind" texture on lever travel — **deliberately held back** (contención); revisit only if more mechanical texture is wanted.
- Coins as accumulating physical objects in the belly tray (spectacle, never a number).
- Depth / "verbena viva" via scene context (backwall, farolillos, La Verbena framing) without adding noise.

## 10. Resume protocol & housekeeping

- This file + the auto-memory (`project_chiribito_el_cacharro.md`) preserve the direction. Read the design SoT first, then this handoff.
- Prototype is **gitignored** (`.dev-stack/cacharro-mockup.html`); it is the feel lab, not shipped code.
- Dev server on `:4599` left running for continuity (removable on request). `serve.cjs` + the global `launch.json` "cacharro-mockup" entry stay in place.
- Unrelated working-tree WIP at handoff time (felt/premium-perceptual phase): modified `.gitignore`, `frontend/src/style.css`, and two untracked phase docs — **left untouched**, not part of this commit.

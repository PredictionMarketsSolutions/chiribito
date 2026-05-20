# El Cacharro — Direction & Source of Truth

> An arcade-castizo **living relic** for the Chiribito universe — **NOT a slot machine.**
>
> **Status:** Direction LOCKED via brainstorm 2026-05-20. Pre-implementation — **no code yet.**
> This document is the single source of truth for the feature. Implementation must not
> contradict the Locked Design Laws (§2) or the Non-Goals (§11) without an explicit decision
> recorded here.
>
> **Language note:** prose is English (repo convention). All in-world names, catchphrases,
> tier labels, and the castizo lexicon are **canonical Spanish** — they are brand/voice
> content and must not be translated.

---

## 0. TL;DR

A grumpy, half-broken **character-machine** that lives in a warm, rowdy corner of the
Chiribito tavern called **La Verbena**. You feed it *un duro*, yank its lever, or **smack it**
— and most of the time it just grumbles. Rarely, it *se vuelve loco*: **El Caos**, a 5-second
physical spectacle that auto-clips into a shareable story. It takes nothing from you, gives no
money, changes no poker rules. Its only job is to make something *happen* — and to be the kind
of thing people remember as *"le pegué al cacharro y explotó"*, not *"hice una tirada."*

---

## 1. Why this exists (strategic context)

On 2026-05-20 the project shipped **Wave 0**, which deliberately **stripped casino-DNA and the
fake economy** from the web (removed `BonosSection`, `ChipCounter`, `StatsGrid`,
`ReviewsSection`) and steered audio toward a warm "ritual layer" (killed the arcade timbres).
Chiribito's positioning is *"El Alma del Póker Español"* — castizo, ritual, premium,
anti-casino.

A slot machine is the single most casino-coded object that exists. Adding one naively would
contradict everything Wave 0 just established. **The reframe that makes it additive instead of
contradictory:** in Spain the *tragaperras* is not Las Vegas — it is the dusty machine in the
corner of the neighbourhood bar, the one your grandfather fed *duros* into, the contraption at
the *verbena*. Reframed as a **character with soul**, it deepens the castizo identity instead of
fighting it.

**The core thesis:** this is not a feature, it is a *character*. A casino slot is soulless and
takes your money; **El Cacharro has soul, takes nothing, and the only thing it gives is that
something happens.** That is the anti-casino vaccine.

---

## 2. Locked Design Laws (the constitution)

These are non-negotiable without an explicit recorded decision.

| # | Law | Meaning |
|---|-----|---------|
| **L1** | **Espectáculo, no regla** | El Caos is something you WATCH and react to, never something you must understand or that changes the poker math. |
| **L2** | **Contención** | Mostly silent and physical (~90% of the time it barely moves/speaks). It erupts rarely (~10%). It talks at peaks, not every interaction. Silence is an instrument. |
| **L3** | **Un solo mundo, dos estados de ánimo** | Same tavern: the **ritual mesa is sacred and untouchable**; La Verbena is the rowdy corner. Same warm DNA, opposite energy. |
| **L4** | **No over-design; validate feel first** | Answer *"is interacting with El Cacharro fun?"* before building economy, modifiers, systems, or lore. |
| **L5** | **Rarity is the product** | If El Caos is frequent it is a slot; if it is rare it is a legend. Tune for *earned + surprising*, never for session-length metrics. |
| **L6** | **No dark patterns** | No casino semiotics/vocabulary, no persistent wallet, no fake economy, no infinite-spend loops, no nagging-to-share. |
| **L7** | **The 5-second clip test** | A muted 5-second clip must read as *"se ha liado."* If it needs explaining, it is wrong. |

---

## 3. Naming system

| Layer | Name | Role |
|-------|------|------|
| **Place** (lobby corner, expandable) | **La Verbena** | A *verbena* has many stalls → room to add more attractions later without touching the mesa. |
| **Brand / official** | **El Chiricacharro** | Ownable, unique, funny; ties to Chiribito. |
| **Nickname** (what people say) | **el cacharro** · **el trasto** | The social mote. *"El cacharro se ha vuelto loco."* |
| **The peak event** (anti-jackpot) | **El Caos** · *"la que se ha liao'"* | The rare spectacle. Never the word "jackpot." |
| **The two souls / mascots** | **el Pato** & **el Toro** | Turn RNG into narrative (see §5). |

**Vocabulary firewall (avoid casino terms entirely):**

| Casino term | Chiribito term |
|---|---|
| spin | una **tirada** · un tirón |
| jackpot | **El Caos** · "la que se ha liao'" |
| bet | **echar un duro** |
| lever | la **palanca** |
| win | premio · "te ha tocado" |
| the machine | el **cacharro** · el trasto |
| session | un rato en la **verbena** |
| bonus | la **racha** · "se ha venido arriba" |

---

## 4. Economy stance (deliberately minimal)

- **No wallet. No persistent balance. No fake economy.** After Wave 0 this is a hard line.
- **Fuel = "el duro".** Earned by playing (a hand, a stretch at the mesa) or trickled gently.
  It **cannot** be bought, hoarded into a stressful balance, exchanged for anything, or used to
  buy advantage. It is a *permission to have fun*, not money.
- **Rewards are experiential, never accumulative:** cosmetics (card backs, tapetes, emotes),
  absurd titles, visual effects, the spectacle itself. *The "lluvia de oros" is del palo (the
  suit) / pure spectacle — not currency.*
- **The goal is not to win.** The goal is that *something happens*.

---

## 5. Character bible — El Cacharro

**What it is.** A contraption of indeterminate age in the corner of La Verbena. Half 1970s
*tasca tragaperras*, half *feria* contraption, half haunted relic. **Nobody installed it and
nobody knows how to turn it off.** It wheezes, it judges you, it grumbles — and every so often
*se vuelve loco*. It takes nothing. It just makes something happen.

**Two souls: el Pato and el Toro (RNG-as-narrative).** Inside the cacharro two spirits fight for
control. This converts random outcomes into *story*: not *"it went random"* but *"el toro tomó
el control."*

- **El Pato** — playful, mischievous, a comedian. When the Pato is in charge the cacharro
  teases, jokes, and makes small, friendly chaos. This is ~90% of the time.
- **El Toro** — when it heats up, it *embiste* (charges). When the Toro takes over = *"se ha
  vuelto loco"* = the big, clippable chaos.

**Mood system (how it feels alive & unpredictable).** It has its own drifting mood — not a flat
random roll. An internal humour state:

`De buenas → Regular → Cabreado → Poseído → ¡LOCO! (el Toro embiste) → Fundido (rests)`

Mood rises/falls with: how long it has been ignored, how many people are watching, time of day,
streaks. Mood governs **everything** — what it says, how it moves, and the odds it kicks off.
Same *duro*, different reaction depending on its mood → a creature with a will, not a slot.

**Voice & humor.** Register: **cascarrabias castizo + deadpan absurd** (lineage: Gila / La
Codorniz / Mortadelo y Filemón). It likes you, but won't make it easy. Delivered through a
**broken speaker** (crackly, old-radio) so sparse lines hit harder.

Sample lines (a large rotating pool; good ones are rare; gated by mood):

- *Ignored:* "¿Qué miras? ¿Nunca has visto un cacharro?" · "Anda, échame un duro y no seas rata."
- *Weak result:* "Ná. Como tu vida." · "Pa' este viaje no hacían falta alforjas."
- *Refusing:* "Hoy no trabajo, que es fiesta." · "*ZRRRT*… no me da la gana."
- *Near-miss (comedy, NOT bait):* "¡Por un pelo, Manolo! Por un pelo."
- *Going loco (Toro):* "¡QUE EMBISTE! ¡QUE EMBISTEEE!" · "¡La que se ha liao'!"
- *Non-sequitur:* "¿Está el enemigo? Que se ponga." · "Tengo hambre. ¿Alguien tiene una aceituna?"

**Contención (L2) applied.** Mostly quiet and physical: it grunts, vibrates, wheezes. It speaks
at peaks, not every tirada. Large line pool + rotation + mood-gating so it never becomes the
attention-needy mobile-app voice. This is also what keeps it from contaminating the ritual mesa.

---

## 6. Embodiment / sensory direction

### 6.1 Body & visual language
- **The single most important anti-casino choice: the window shows Spanish cards, not Vegas
  symbols.** Oros, Copas, Espadas, Bastos from the 28-card deck. The rarest, most-wanted
  alignment is **La Perla** (Sota + 7). Zero cherries/BARs/7s. Total continuity with the real game.
- **Materials:** chipped walnut + dented green-ish brass + bakelite. It rhymes with the table's
  wood + gold but is *more worn* — the mesa is ritual-premium, the cacharro is the beloved broken
  trasto.
- **A face without a face:** reads as a creature without being a literal cartoon face — two round
  dials = eyes, the coin slot = mouth, the lever = an arm. Chunky cartoon proportions, slightly
  leaning (looks like it could topple).
- **Imperfection = warmth = anti-casino:** half-peeled stickers, a crossed-out "NO FUNCIONA"
  sign, a dead flickering bulb, cigarette burns. Casinos are pristine and predatory; this is
  broken and loved.
- **Pato & Toro on the chassis:** the Pato as a top ornament/weather-vane when calm; the Toro
  painted on the body, worn — until it comes alive.
- **Palette:** warm woods, aged brass/gold, Chiribito felt-green accent, bone for card faces,
  tasca oxblood. Warm tungsten/amber light. **No neon, no RGB, no casino black-and-purple.**

### 6.2 Motion language
Principle: **weight, inertia, stillness.** It is old and heavy. No hyperactive app micro-motion.
- **Idle = breathing, not jittering:** a slow wheeze, an occasional shudder, the bulb flickers,
  the lever sways. Long near-still stretches = the "callado".
- **The lever is the tactile hero:** pull → mechanical resistance → CHUNK-CHUNK-CHUNK of reels
  engaging. Anticipation comes from *slowness*; the old machine takes its time.
- **Physical reaction first, verbal second:** weak result → it *deflates*, a puff of smoke, a
  wheeze. Good result → it rattles, lights stutter on. The line, only sometimes, at the peak.
- **GSAP (already in stack):** few animations, very heavy, very anticipated. *90% it barely
  moves; 10% it goes nuclear.*

### 6.3 Sound identity
Fits the recent warm-mix/room-reverb direction (arcade timbres killed). The cacharro is a
**diegetic pocket** — its noise lives in its corner and does **not** bleed into the mesa.
- **Analog & old:** clunks, bellows, a tired motor, springs, the CLACK of the lever, the brass
  clink of the duro. No digital casino bleeps.
- **Verbena ambience behind it:** distant *organillo*, bar murmur, a far-off pasodoble, glasses.
  Warm, low, present without demanding.
- **Voice through a broken speaker** (see §5).
- **Silence as an instrument:** the near-silence is what makes the eruption land.

### 6.4 The Pato → Toro transformation (the drama engine)
Not a flag flip — a **3-act micro-drama** the player watches escalate:
1. **Pato (calm, ~90%):** calm, teasing register; amber light; light reactions.
2. **The tell (tension):** something heats it (a streak, a watching crowd, rising mood). The Pato
   gets nervous and hides. The machine starts to SHAKE, smoke, lights tilt to ember-red, a low
   bramido grows. *This build is the heart of the emotion.*
3. **The charge (El Caos):** the Toro takes over, the machine BUCKS, the Toro bursts out, the
   verbena erupts.
4. **Fundido (cooldown):** spent — smoke, a dead wheeze, the Pato sheepishly returns ("¿ya está?
   menudo susto").

**The Fundido is the natural anti-spam pager:** the machine *needs to recover* before the next
Caos → rarity is enforced by *character*, not by a "you're out of spins, buy more" wall.

### 6.5 Mobile / touch feel
- **A vertical cabinet is a gift for portrait:** a tragaperras is already a tall object → perfect
  one-handed portrait fit. Lever on the side (thumb-reachable), card window centered.
- **Pulling = a drag-down gesture** on the lever, with **haptics** on the CHUNK of engagement and
  on the result. Weight is conveyed through timing + vibration pulses.
- **"Darle un golpe" (the standout interaction):** when it jams or sulks, you can **smack it**
  (tap/whack) — the universal castizo gesture of hitting the broken machine. Tactile, funny,
  unique, impossibly anti-casino. It can unstick a reel or nudge its mood. People will remember
  *"le pegué al cacharro y explotó"* more than any reward.
- **Short sessions:** a tirada is 5–15s; El Caos is the rare longer spectacle. No grind.
- **Haptics = secret weapon:** on mobile the CHUNK, the buck, the wheeze are *felt* more than
  seen. That is where "physical" is won.

---

## 7. La Verbena — placement & the firewall

Principle: **one world, two moods.** Same tavern: the mesa is the serious, ritual corner; La
Verbena is the rowdy corner. Same wood/gold/green, opposite energy.

- **Spatial separation:** La Verbena is a place you *enter* from the lobby (the existing
  `LobbyRoom` is the natural anchor) — never a machine bolted onto the mesa. Walking mesa → verbena
  = stepping from the serious table to the rowdy corner of the same bar.
- **Audio firewall:** the verbena's noise is spatially contained; at the mesa you barely hear it
  in the background.
- **The hard rule (this protects everything Wave 0 built):** El Cacharro **NEVER** touches the
  competitive integrity of a serious poker hand. If a chaos event ever reaches a table, it
  happens **only** in an opt-in casual mode (**"Mesa de la Verbena" / "Mesa Loca"**), is symmetric
  for everyone, is purely for laughs, and is never pay-to-win. **The ritual mesa stays 100%
  intact.**
- **Clean expansion:** because La Verbena is a *place*, more stalls can be added later (tiro al
  pato, tómbola, …) without ever touching the mesa.

---

## 8. El Caos

### 8.1 The law
Spectacle, not rule (L1). The 5-second clip test (L7). Físico > mecánico, visual > matemático.
The best chaos event *does nothing* except be spectacular — a virtue, not a limitation.

### 8.2 Anatomy template (one shape, not 50 bespoke designs)
Every event is the same 4-beat shape; only intensity changes. Anti-over-design by construction.
1. **Mecha** — the tell (the Toro stirring; §6.4).
2. **Embestida** — the physical burst, 1–3s of pure chaos.
3. **Reacción** — the cacharro's line + the crowd reacts. This makes it SOCIAL and tells the
   viewer "that was huge."
4. **Rastro** — smoke clears, oros on the floor, the sheepish Pato, the Fundido.

### 8.3 Catalog — 4 tiers of rarity (small on purpose)
- **Nivel 0 · Cotidiano (most frequent):** it grumbles, spits out a card, a puff of smoke, **jams
  → you smack it.** ~90% of tiradas. Small, physical, charming. *Not El Caos — the quiet texture
  that makes the peaks matter.*
- **Nivel 1 · Se anima (uncommon):** cards shoot out, lights stutter, the Pato pokes out, steals
  something small and flees, a light drizzle of oros.
- **Nivel 2 · EL CAOS (rare, the peak):** **the Toro charges** — cards flying, smoke, bursting
  bulbs, lluvia de oros, the machine bucks, the verbena erupts → Fundido. *This is the clip.*
- **Nivel 3 · La Invasión (very rare, social):** the casual **Mesa de la Verbena** (opt-in) is
  invaded — the Toro runs across it, confetti, the Pato steals a cosmetic chip from someone,
  everyone sees it and reacts. **Pure spectacle: no hand changes rules; the ritual mesa never
  knows.** The legendary moment.

Each tier = the same 4-beat anatomy at higher volume.

### 8.4 Pacing / frequency (rarity is the product, L5)
- Most tiradas are Nivel 0. The silence is intentional.
- El Caos (N2) is **rare** — gated by mood + the Fundido cooldown (the machine must recover; it
  cannot chain).
- La Invasión (N3) is *"once a session, talked about for days."*
- **Not deterministic** ("every 50 tiradas" is gameable/casino-y): mood + cooldown = organic and
  unpredictable. Tuned for *earned + surprising*, never for session-length metrics.

### 8.5 The clip machine (the viral engine)
The edit is pre-solved by the 3-act anatomy:
- **Auto-capture the peak:** when an N2/N3 fires, the client records ~5–8s (mecha → embestida →
  reacción). One tap to save/share. You don't have to be recording — the machine knows it just
  did something legendary.
- **The replay is already a story:** the cacharro's line is baked in as a subtitle → memeable even
  muted.
- **Native format:** vertical 9:16 (matches existing TikTok/Stories asset folders), with a
  Chiribito stamp + the Fundido as a recognizable close → every clip propagates the brand.
- **Spectator loop:** the people who were *watching* also receive/react to the clip. *"Estabas
  cuando el cacharro se volvió loco."*
- **Opt-in, no nagging (L6):** offered once, elegantly, then it gets out of the way.

---

## 9. Becoming an icon of the Chiribito universe

An icon is made of **few strong signatures repeated**, not many features or lore.
- **Two owned catchphrases:** e.g. *"¡QUE EMBISTE!"* + *"anda, no seas rata."* Used sparingly so
  they land. The brand's verbal signature.
- **Ownable silhouette:** the chunky leaning cabinet with the Pato on top → app icon, stickers,
  loading screens, merch.
- **Host of the universe (with contención):** can be the grumpy soul that comments on the
  lobby/events — RARE, not a chatty assistant.
- **Less lore = more iconic:** its myth is *silhouette + 2 phrases + the "se volvió loco" moment.*
  Resist the backstory novel.

---

## 10. The validation slice (MVP)

Per L4, do **not** build the full catalog. Build the smallest thing that answers the central
hypothesis:

> **Is it fun to PULL and SMACK the cacharro, and does El Caos make you shout "¡hostia!" and want
> to share it?**

**In scope:**
- One screen, El Cacharro.
- **Pull the lever + smack it** (with haptics).
- Small physical events (Nivel 0): grumbles, jams, a card spat out, smoke.
- **One** big Chaos Event (Nivel 2) with the full Pato→Toro→Fundido arc.
- The auto-clip / replay capture.

**Explicitly out of this slice:** mesa integration, economy, La Invasión, the broader catalog,
mood-system depth (a simple stub is fine).

**Success is emotional, not metric:** the "¡hostia!" reaction + the urge to share. If that lands,
everything else is low-risk additive. If it doesn't, better to learn it with one screen than with
a system.

---

## 11. Non-Goals (LOCKED — do not build yet)

Until the validation slice proves the feel, **do not** build:
- A persistent wallet / balance / any economy.
- Rule modifiers on poker hands (any tier-changing-the-math mechanic).
- Complex progression / leveling / unlock trees.
- Large systems (matchmaking for the verbena, deep mood tuning, etc.).
- Deep lore / backstory.
- Any chaos that touches ranked/serious tables (L3).

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Reads as a casino / reactivates gambling perception | Character not feature; Spanish cards not Vegas symbols; castizo vocabulary firewall (§3); no wallet (§4). |
| Becomes an attention-needy mobile slot | Contención (L2); mostly silent + physical; El Caos rare; Fundido cooldown. |
| Contaminates the ritual mesa | The firewall (§7): one world/two moods; audio pocket; chaos only in opt-in casual mode. |
| Over-design before validating fun | L4 + the validation slice (§10) + Non-Goals (§11). |
| Chaos too complex to read | L1 + L7: spectacle not rule; the 5-second muted clip test. |
| Catchphrase / humor fatigue | Large rotating pool, mood-gating, sparse delivery. |
| Share mechanics feel spammy | Opt-in, offered once, no nagging (L6). |

---

## 13. Next steps (post-doc, per user direction)

In rough order:
1. **Navigable mockup** (browser) — fast visual read of body + layout.
2. **Visual exploration** — material/colour/light passes on the cabinet, Pato/Toro.
3. **Motion tests** — idle breathing, the pull/CHUNK, the Pato→Toro build, the Fundido.
4. **Tactile feel validation** — the lever drag + **"darle un golpe"** + haptics on mobile.
5. **First functional Chaos Event** — one Nivel 2 with the full 3-act arc + auto-clip.
6. Real prototype assembling the **validation slice** (§10) on the existing stack (PixiJS canvas
   + GSAP), anchored where La Verbena will live.

**Technical anchors (for the future plan, not designed here):** frontend is vanilla TS + Vite,
PixiJS v7 for canvas (lazy-loaded), GSAP for animation, `LobbyRoom` registered server-side.
Implementation detail belongs in a later plan, not in this direction doc.

---

## 14. Open questions / deferred decisions

- Exact source of *el duro* (poker-earned vs. gentle trickle vs. both) — decide at slice time;
  keep it trivial for the MVP.
- Whether the cacharro hosts beyond La Verbena (lobby commentary) — deferred; default OFF until
  the character proves non-annoying.
- Whether La Invasión (N3) ships at all in v1 or waits — likely waits (Non-Goal for the slice).
- Final catchphrase shortlist (the two "owned" lines) — pick after motion/voice tests.

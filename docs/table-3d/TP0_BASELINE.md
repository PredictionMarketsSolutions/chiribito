# TP0 Baseline — Frozen Rig Record

**Phase:** TP0 (Phase 1) — Eval Rig & Baseline (BLOCKING)
**Authored:** 2026-06-09
**Status:** SKELETON — "Frozen presets" and "Draw-call / frame-time baseline" sections
filled by plans 02 and 06 respectively.

---

## Worktree HEAD (rig as-built)

**Branch:** `claude/cranky-volhard-dd8b01`
**HEAD SHA (after Task 1 commit):** `05df4931c335d5956297562d4db4efcfe461b3bb`
**Pre-edit rollback tag:** `tp0-before-rig` @ `f807d6fc810f351001128a218daa38161dd659ba`

---

## Protected Reference Tag

| Tag | SHA | Description |
|-----|-----|-------------|
| `table-3d-premium-reference-2026-06-04` | `d17df37a588dd12a9ae299caa70704cd2628d6f4` | Chip-centric premium table baseline (pre-M1 cards). Immutable. This plan only reads its SHA — never mutated. |
| `table-3d-lab-checkpoint-2026-06-04` | (see git tags) | Lab checkpoint companion tag. |

> **Invariant (SSOT §5.2):** The protected tag is NEVER degraded, moved, or deleted.
> It is superseded only by an explicit operator promotion at TP9; the old tag is retained forever.

---

## Harness Contract

| Property | Value |
|----------|-------|
| Harness file | `.dev-stack/lab-shot.mjs` (gitignored — lives only in worktree / main checkout) |
| Resolved from | Repo ROOT `node_modules/playwright` |
| Invocation | `LAB_URL="http://localhost:5173/table-lab.html?cam=<hero|card|macro>" node .dev-stack/lab-shot.mjs <out.png>` |
| Auto-appended | `&spin=off` → `autoRotate={false}` in R3F |
| Chromium flags | `--headless=new --ignore-gpu-blocklist --enable-gpu --use-angle=d3d11` |
| GPU (verified) | NVIDIA GeForce RTX 4060 Laptop GPU — Direct3D11 (`ANGLE`) |
| Viewport | 1440×900 @ DPR 2 → **2880×1800 PNG** |
| Settle wait | 2500 ms post-resize (environment + shadows bake) |
| Diagnostics | Prints `CANVAS {w,h,cw,ch}`, `GPU <renderer>`, `ERRORS [...]` |
| Canvas readable | `preserveDrawingBuffer: true` at `TableLab.tsx:762` |

### Smoke verification (2026-06-09 — plan 01-01)

| Shot | URL param | Output | Dimensions | GPU | ERRORS |
|------|-----------|--------|-----------|-----|--------|
| HERO | `?cam=hero` | `.dev-stack/diag/table-3d/tp0-smoke/hero.png` | 2880×1800 | RTX 4060 D3D11 | [] |
| POV | `?cam=card` | `.dev-stack/diag/table-3d/tp0-smoke/pov.png` | 2880×1800 | RTX 4060 D3D11 | [] |
| MACRO | `?cam=macro` | `.dev-stack/diag/table-3d/tp0-smoke/macro.png` | 2880×1800 | RTX 4060 D3D11 | [] |

> Smoke PNGs live ONLY in the gitignored `.dev-stack/diag/` scratch dir. No anchor committed yet
> (baseline freeze deferred to plan 06, after the operator perceptual gate).

---

## Prod-Build Isolation Proof

**File inspected:** `frontend/vite.config.ts`
**Grep assertion:** `grep -L "table-lab|rollupOptions|input" frontend/vite.config.ts` → FILE LISTED (none found)
**Conclusion:** `ISOLATION OK: no lab build input`

The lab (`/table-lab.html`) is served by the Vite **dev server only**. The `vite build` prod
entries are the game's vanilla `.html` files only. No `table-lab` input exists in `vite.config.ts`.
This invariant must be re-verified at TP9 (SSOT §5.8 + PROJECT.md Constraints).

---

## Frozen Presets (verbatim)

> Recorded by plan 02 (TP0a-2). Values are EXACTLY what the code contains today — no changes baked.
> The fov-37 candidate is an operator-gate decision deferred to plan 05; it is NOT in the code yet.

### Camera presets (TableLab.tsx lines 616–631)

| Shot | URL param | Preset key | Position | Target | FOV (code) | Code line | Notes |
|------|-----------|------------|----------|--------|-----------|-----------|-------|
| HERO | `?cam=hero` | `hero` | `[1.2, 5.0, 8.2]` | `[0, 0.5, 0]` | **32** | 620 | Matches SSOT |
| POV  | `?cam=card` | `card` | `[0, 4.7, 10.6]` | `[0, 0.25, 1.2]` | **40** | 618 | See note below |
| MACRO | `?cam=macro` | `macro` | `[-1.7, 1.7, 2.4]` | `[-1.55, 0.05, 1.05]` | **26** | 623 | Matches SSOT |

> **POV fov — operator-gate note (SSOT §4.1 + §Ordering constraint):**
> The code today is `fov: 40` (line 618). The SSOT specifies "tightened 40→37" but explicitly
> allows this as the ONE permitted TP0 refinement, applied LAST — after the operator blesses the
> three money shots on-device — and BEFORE the irreversible baseline freeze (plan 06).
> **Do NOT bake fov 37 until the operator confirms.** This record captures fov 40 as the
> current code reality. The refinement to 37 is the operator's decision (plan 05).

### Staged scene (FROZEN, SSOT §4.2 + §5.1)

Defined verbatim in `TableLab.tsx:60–61`:

```ts
const LAB_COMMUNITY = ["1E", "12C", "11B"]; // As de Espadas · Rey de Copas · Caballo de Bastos
const LAB_HOLE      = ["10O", "7O"];         // La Perla de Oros — Sota + 7 de Oros
```

- **Community cards (3, FACE-UP):** `["1E","12C","11B"]` = As Espadas · Rey Copas · Caballo Bastos
  - Layout: flat on felt, centered row (`communityLayout()` → `COMMUNITY_Z = -0.55`, rotation `−π/2`)
- **Hole cards / La Perla (2, FACE-UP):** `["10O","7O"]` = Sota + 7 de Oros
  - Layout: fanned + lifted toward POV camera (`holeLayout()` → `HOLE_Z = 3.95`, `HOLE_LIFT = 0.46`)
- **Demoted accent pot:** `<group position={[2.7, 0, 1.5]} scale={0.66}>` (TableLab.tsx:702)
  - Contents: C×6 stacks + B×4 + E×3 + 1 O chip — set off to the side, smaller than the full pot
- **Invariant:** NO face-down card and NO 6th card are added to the Perla hand.
  Any deck-stub is a TP6 center-of-table prop, never a 6th hole card (preserves SSIM/MSE anchor validity).

---

## StatsProbe — Zero-Visual-Change Proof (plan 02)

**Verified:** 2026-06-09 (plan 02, commit c9ef9a8)

The `?stats` overlay renders `null` — it adds ZERO pixels to the captured frame.
Proven by md5 byte-identity between two captures of `?cam=card` (with and without `?stats`):

| Capture | URL | md5 |
|---------|-----|-----|
| Without `?stats` | `?cam=card` (harness auto-appends `&spin=off`) | `3b7480d7d1a9bab8c6f015637fe93b79` |
| With `?stats` | `?cam=card&stats` | `3b7480d7d1a9bab8c6f015637fe93b79` |

**Result: IDENTICAL — zero-visual-change CONFIRMED (T-02-01 mitigated)**

Determinism (M9) also confirmed: two consecutive `?cam=card` captures → same md5 (`3b7480d7d1a9bab8c6f015637fe93b79`).

Scratch PNGs: `.dev-stack/diag/table-3d/tp0-smoke/card-nostats.png` + `card-stats.png` (gitignored).

---

## Draw-Call / Frame-Time Baseline

> **TO BE FILLED by plan 06 (TP0a-3 + operator gate).**
> After the `?stats` StatsProbe (plan 02) is in place and the operator blesses the money shots,
> the draw-call + frame-time numbers are recorded here.

| Shot | Draw calls (M10) | Frame-time median ms (M11) | Threshold |
|------|-----------------|---------------------------|-----------|
| HERO | TBD | TBD | <150 draws / <8 ms |
| POV (`?cam=card`) | TBD | TBD | <150 draws / <8 ms |
| MACRO | TBD | TBD | <150 draws / <8 ms |
| HERO `?chips=full` | TBD | TBD | <220 draws |

---

## Rollback Protocol

- Per-phase rollback tag: `tp0-before-rig` @ `f807d6fc810f351001128a218daa38161dd659ba`
- Cut: 2026-06-09 before any edits (SSOT §5.3, disposition = BLOCKING for TP0)
- Do NOT push. Do NOT delete. Revert with `git reset --hard tp0-before-rig` if needed.

---

## Anchor Corpus Layout (for plan 06 to fill)

```
docs/table-3d/anchors/
├── .gitkeep                    # ensures dir is tracked (empty until plan 06)
├── controls/
│   └── .gitkeep                # wave-3 plans 03/04 write control PNGs here
tools/table-3d/
└── .gitkeep                    # wave-3 plans 03/04 write metric .mjs here
```

> Committed anchors will be downscaled (to ~1280px wide) to avoid repo bloat (Pitfall 5 of 01-RESEARCH.md).
> Full-res working copies live in gitignored `.dev-stack/diag/`.

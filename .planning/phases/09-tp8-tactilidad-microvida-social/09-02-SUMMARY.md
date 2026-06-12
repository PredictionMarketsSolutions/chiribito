---
phase: 09-tp8-tactilidad-microvida-social
plan: "02"
subsystem: frontend/lab
tags: [tp8, grep-check, static-assertion, micro-motion, anchor-captures, m9, social-read]
dependency_graph:
  requires: [09-01-SUMMARY]
  provides: [grep-check-tp8-09, tp8-gate-anchors, social-read-audit, m2-standing]
  affects: [frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp8-gate/, tools/table-3d/]
tech_stack:
  added: []
  patterns: [static-grep-check-code-assertion, frozen-anchor-capture-byte-identity]
key_files:
  created:
    - tools/table-3d/grep-check-tp8-09.cjs
    - docs/table-3d/anchors/tp8-gate/hero.png
    - docs/table-3d/anchors/tp8-gate/card.png
    - docs/table-3d/anchors/tp8-gate/macro.png
  modified: []
key_decisions:
  - "CHECK 5 regex case-sensitive (no /i flag): GSAP easing class names are PascalCase (Elastic/Bounce/Back); /i would false-positive on 'bounce'/'glow' in JSX {/* */} block-comment text not stripped by stripComments (which only removes // lines)"
  - "All three tp8-gate captures byte-identical to tp7-gate: M9 HARD gate confirmed -- HeroMotion frozen under spin=off produces zero pixel mutation"
  - "M2 standing is TP7 carry-forward (3.66x hero / 2.60x card): TP8 adds HeroMotion which returns null (no geometry) -- no new metric run required"
  - "Social read = COMPLETE per existing scene: CenterGameState + staged Perla hand + 5-card community board + demoted accent pot all unconditionally mounted; no new center objects added in TP8"
patterns-established:
  - "grep-check convention: stripComments() removes only // lines; JSX {/* */} block-comment text survives -- regexes must tolerate it or be case-sensitive"
requirements-completed:
  - "SSOT §TP8 — static CODE assertion that easing constants <= documented thresholds (since frozen captures cannot measure live motion)"
  - "SSOT §TP8 — no flip/spin/glow/bouncy easing in lab source (no-FX assertion)"
  - "SSOT §TP8 — freeze guard present (motionFrozen or equivalent guards the useFrame)"
  - "SSOT §TP8 — social read via CENTER table-STATE ONLY — NO new objects; M2 >= 2x holds"
duration: ~15min
completed: 2026-06-12
---

# Phase 9 Plan 02: TP8 Grep-Check + Gate Anchors + Audit Summary

**grep-check-tp8-09.cjs exits 0 (18/18: 4 constant-value bounds + no-FX + freeze-guard + reducedMotion + 11 TP7 forward-carry); 3 frozen gate anchors byte-identical to TP7 (M9 HARD gate confirmed); social read COMPLETE; M2 = 3.66x/2.60x floor PASS.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-06-12T21:21Z
- **Tasks:** 2
- **Files modified/created:** 4

## Accomplishments

- Authored `tools/table-3d/grep-check-tp8-09.cjs` — 18-check static code assertion for all TP8 micro-motion invariants (7 new) + all TP7 camera invariants forward-carried verbatim (11). Exits 0.
- Captured 3 canonical TP8 gate anchors (hero/card/macro with `?fx&spin=off`): all three byte-identical to TP7-gate counterparts, confirming the M9 HARD gate (HeroMotion is airtight under `spin=off`).
- Social-read completeness audit: all four center scene items PRESENT unconditionally; no new objects added in TP8.
- M2 standing documented: 3.66x (hero) / 2.60x (card) — carry-forward from TP7; TP8 adds no scene geometry; 2x floor unambiguously PASS.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author grep-check-tp8-09.cjs (18 checks) | b0021ab | tools/table-3d/grep-check-tp8-09.cjs |
| 2 | TP8 gate anchors + audit | fa417b6 | docs/table-3d/anchors/tp8-gate/{hero,card,macro}.png |

## grep-check-tp8-09.cjs — 18-Check Verdict

| Check | Description | Result | Value |
|-------|-------------|--------|-------|
| CHECK 1 | MICRO_AMPLITUDE_Y <= 0.01wu | PASS | 0.003 (30% of ceiling) |
| CHECK 2 | MICRO_AMPLITUDE_ROT <= 0.00873 rad (0.5°) | PASS | 0.004 (46% of ceiling) |
| CHECK 3 | MICRO_IDLE_PERIOD in [6, 12]s | PASS | 9.0 (midpoint) |
| CHECK 4 | MICRO_SETTLE_TAU in [0.2, 0.4]s | PASS | 0.25 (midpoint) |
| CHECK 5 | No Elastic/Bounce/Back/Flip/Glow in lab source | PASS | 0 matches (case-sensitive) |
| CHECK 6 | Freeze guard (motionFrozen/frozen) present | PASS | `motionFrozen` + `if (frozen) return` |
| CHECK 7 | reducedMotion/prefers-reduced-motion present | PASS | `reducedMotion` declared in Scene() |
| CHECK 8 | EffectComposer present behind ?fx (TP6) | PASS | — |
| CHECK 9 | N8AO present — M6 satisfier (TP6) | PASS | — |
| CHECK 10 | DepthOfField present — M1 HARD gate (TP6) | PASS | — |
| CHECK 11 | Vignette present — M8 gate (TP6) | PASS | — |
| CHECK 12 | No Bloom in frontend/src/lab/ — M7 HARD GATE | PASS | 0 matches |
| CHECK 13 | brassMat roughness 0.42-0.45 — TP4-locked | PASS | 0.42 |
| CHECK 14 | SoftShadows unconditional in Scene — TP5 | PASS | — |
| CHECK 15 | ContactShadows frames={1} — TP5 baked once | PASS | — |
| CHECK 16 | autoRotate={false} hardcoded — M9 HARD GATE | PASS | — |
| CHECK 17 | fov: 32 / fov: 40 / fov: 26 all present | PASS | TP0-frozen presets unchanged |
| CHECK 18 | No second makeDefault PerspectiveCamera | PASS | 1 found (expected) |

**Exit code: 0. All 18/18 PASS.**

grep-check-tp7-08.cjs backward compatibility: **11/11 PASS** (exit 0).

## MICRO_* Constant Values (grep-checked)

| Constant | Value in TableLab.tsx | SSOT Ceiling | % of Ceiling | Verdict |
|----------|-----------------------|-------------|-------------|---------|
| `MICRO_AMPLITUDE_Y` | 0.003 wu | < 0.01 wu | 30% | PASS |
| `MICRO_AMPLITUDE_ROT` | 0.004 rad | < 0.00873 rad (0.5°) | 46% | PASS |
| `MICRO_IDLE_PERIOD` | 9.0 s | 6–12 s | midpoint | PASS |
| `MICRO_SETTLE_TAU` | 0.25 s | 0.2–0.4 s | midpoint | PASS |
| `CHIP_PHASE_OFFSET` | Math.PI * 0.7 | — (non-harmonic) | — | n/a |

All five constants are `const` at module scope (lines 747–753 in TableLab.tsx), outside any function, comment block, or JSX — grep-checkable.

## TP8 Gate Anchor Captures

| Capture | Path | md5 | tp7-gate identical | Size |
|---------|------|-----|--------------------|------|
| hero (?cam=hero&fx&spin=off) | docs/table-3d/anchors/tp8-gate/hero.png | c0c7e124 | YES | 3.6 MB |
| card (?cam=card&fx&spin=off) | docs/table-3d/anchors/tp8-gate/card.png | d7a4350d | YES | 3.2 MB |
| macro (?cam=macro&fx&spin=off) | docs/table-3d/anchors/tp8-gate/macro.png | cd073a0c | YES | 3.3 MB |

**M9 HARD GATE: PASS** — All three byte-identical to the TP7 gate captures. HeroMotion's `if (frozen) return` is code-airtight: when `spin=off` is in the URL, `isFrozen=true`, `motionFrozen=true`, the useFrame returns immediately on every frame, no hero object is mutated. The frozen scene is pixel-perfect to the pre-TP8 TP7 baseline.

GPU: NVIDIA GeForce RTX 4060 Laptop (D3D11 / ANGLE). Viewport: 2880×1800. 0 console errors.

Note: The operator reviews the LIVE motion feel in plan 09-03. These frozen captures are the scene record for the gate (operator can compare the still against the live, but motion quality is evaluated live).

## Social-Read Completeness Audit

| Scene Item | Status | Location in JSX | Notes |
|------------|--------|-----------------|-------|
| CenterGameState (deck stub + dealer button) | PRESENT — UNCONDITIONAL | Line 1343, after HeroMotion, no condition | Mounted after `<HeroMotion>`, before `EffectComposer` guard; reads under both ?fx-off and ?fx-on |
| Staged Perla hole pair (Sota de Oros + 7 de Oros) | PRESENT — conditional on `qp("cards") !== "off"` | Line 1218 | Default URL (no ?cards=off): PRESENT. The "off" condition is a diagnostic flag only; not part of the social-read default. |
| 5-card community board (LAB_COMMUNITY) | PRESENT — conditional on `qp("cards") !== "off"` | Line 1220 | Same condition as hole cards; PRESENT by default |
| Demoted accent pot group (InstancedChipStack, scale={0.5}, position=[3.0,0,1.5]) | PRESENT — conditional on `qp("chips") !== "off"` and not "full"/"legacy" | Lines 1260-1272 | Default URL: PRESENT. "off"/"full"/"legacy" are diagnostic flags; default branch renders the demoted pot |

**VERDICT:** Social read COMPLETE — CenterGameState + staged Perla hand + community board + demoted pot all PRESENT by default (no additional query params needed). No new center objects added in TP8. TP8 adds only `HeroMotion` (returns `null`, no geometry) and the ref wrappers on the existing hole-card group and demoted-pot group. The opt-in `?seats=on` SeatHands (TP8 scope) is correctly isolated and not part of the social read default.

## M2 Standing (Cards-vs-Chips Ratio)

| Source | Hero M2 | Card M2 | Floor | Verdict |
|--------|---------|---------|-------|---------|
| TP7-08-SUMMARY / STATE.md (08-01 plan metric) | 3.66x | 2.60x | >= 2.0x | PASS |

**M2 standing: 3.66x (hero) / 2.60x (card) — TP7 carry-forward.** No new metric run required.

Rationale: TP8 adds only `HeroMotion` (returns `null`, no geometry, no material), plus ref wrappers on the existing hole-card group and demoted-pot group (ref additions — no new scene objects, no geometry change). The scene geometry is unchanged from TP7. M2 is unchanged from the TP7 recorded value. The 2x floor is unambiguously met.

## Pre-Gate Check Battery (Final)

| Check | Result |
|-------|--------|
| `node tools/table-3d/grep-check-tp8-09.cjs` | 18/18 PASS (exit 0) |
| `node tools/table-3d/grep-check-tp7-08.cjs` | 11/11 PASS (exit 0) — backward compat |
| `cd frontend && npx vitest run src/lab/` | 45/45 PASS |
| `cd frontend && npx tsc --noEmit \| grep src/lab` | 0 errors |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed /i flag from CHECK 5 regex (CHECK 5 false-positive on JSX block-comment text)**

- **Found during:** Task 1 (authoring grep-check-tp8-09.cjs)
- **Issue:** The plan specified `/\b(Elastic|Bounce|Back\.out|Back\.in|Flip|Glow)\b/i` (case-insensitive). The `stripComments()` function removes only `//` lines — it does NOT remove JSX `{/* ... */}` block-comment text. TableLab.tsx contains legitimate English words "bounce" (in "warm room bounce", "green-bounce GI") and "glow" in JSX block comments. The /i flag caused false-positive matches on these, causing CHECK 5 to fail on valid code.
- **Fix:** Removed the `/i` flag — regex is now case-sensitive. GSAP easing class names are always PascalCase (`Elastic`, `Bounce`, `Back.out`, `Flip`, `Glow`). Case-sensitive matching catches the intended targets without false-positiving on natural-language English in block comments.
- **Files modified:** `tools/table-3d/grep-check-tp8-09.cjs`
- **Verification:** `node tools/table-3d/grep-check-tp8-09.cjs` exits 0 (18/18). Separately confirmed: no actual GSAP easing class names are in lab source.
- **Committed in:** b0021ab (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in plan-specified regex)
**Impact on plan:** Necessary for correctness. The fix makes CHECK 5 semantically correct (catches GSAP easing names, not English words). No scope creep. The security intent is fully preserved.

## Known Stubs

None. The grep-check is fully wired to the real constants. The anchor captures are the real frozen scene. The social-read audit documents the existing scene, not a planned future state.

## Threat Flags

None. This plan adds only tooling (grep-check) and documentation (anchor PNGs). No network endpoints, no auth, not in the prod build.

## Self-Check: PASSED

- [x] `tools/table-3d/grep-check-tp8-09.cjs` — FOUND (committed b0021ab)
- [x] `docs/table-3d/anchors/tp8-gate/hero.png` — FOUND (committed fa417b6)
- [x] `docs/table-3d/anchors/tp8-gate/card.png` — FOUND (committed fa417b6)
- [x] `docs/table-3d/anchors/tp8-gate/macro.png` — FOUND (committed fa417b6)
- [x] `node tools/table-3d/grep-check-tp8-09.cjs` exit 0 (18/18) — PASS
- [x] `node tools/table-3d/grep-check-tp7-08.cjs` exit 0 (11/11) — PASS
- [x] vitest 45/45 — PASS
- [x] tsc src/lab — 0 errors
- [x] M9 byte-identity hero/card/macro — PASS (all three identical to tp7-gate)
- [x] Social-read audit — 4/4 items documented, PRESENT
- [x] M2 standing — 3.66x/2.60x documented, >= 2x PASS
- [x] git status: only tools/table-3d/ + docs/table-3d/ + .planning/ changed — PASS
- [x] No frontend/src changes — PASS (no motion code touched; 09-01 is the source)
- [x] LOCAL only — no push — PASS

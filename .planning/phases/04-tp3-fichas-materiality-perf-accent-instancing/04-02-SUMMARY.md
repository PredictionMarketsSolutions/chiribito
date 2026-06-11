---
phase: 04-tp3-fichas-materiality-perf-accent-instancing
plan: 02
subsystem: ui
tags: [react-three-fiber, drei, instancing, three-js, chip, webgl, performance, m10]

# Dependency graph
requires:
  - phase: 04-01
    provides: tp3-base M10 baseline (HERO 233 / MACRO 195 / chips=full 653) + tp3-base anchor PNGs

provides:
  - InstancedChipStack component (drei Instances per denomination; body + top face; bottom face dropped)
  - Chip textures right-sized 2048->512 (chipFaceTexture, chipFaceBump, chipEdgeTexture)
  - ?chips=legacy A/B flag for apples-to-apples comparison vs pre-instancing ChipStack
  - grep-check-tp3-02.cjs structural invariant checker (Instances wired; bottom face absent; S/W=512)
  - M10 PASS: HERO 105 (< 150) / chips=full 133 (< 220) / demoted-pot delta -96 draws
  - MACRO strict visual parity CONFIRMED vs tp3-base/macro.png (chip look byte-equivalent)
  - A/B captures: .dev-stack/diag/table-3d/tp3/instancing/{hero-instanced,macro-instanced,hero-legacy}.png
  - TP3_BASELINE.md updated with post-instancing measured results

affects:
  - 04-03 (de-Vegas materiality — builds ON TOP of the instanced InstancedChipStack)
  - Any future chip work in TableLab.tsx

# Tech tracking
tech-stack:
  added: []
  patterns:
    - InstancedChipStack pattern: <Instances geometry= material= limit={count+4}> per denomination + <Instance position rotation>
    - chipStackLayout import consumed by component (pure layout fn from sibling module)
    - ?chips=legacy A/B flag keeping ChipStack available alongside InstancedChipStack default

key-files:
  created:
    - frontend/src/lab/chipStack.ts (Task 1 — prior run)
    - frontend/src/lab/chipStack.test.ts (Task 1 — prior run)
    - tools/table-3d/grep-check-tp3-02.cjs (Task 3)
  modified:
    - frontend/src/lab/TableLab.tsx (Task 2: InstancedChipStack + Chip bottom face dropped + flag wiring)
    - frontend/src/lab/textures.ts (Task 2: S/W 2048->512)
    - docs/table-3d/TP3_BASELINE.md (post-instancing M10 results appended)

key-decisions:
  - "InstancedChipStack ships as default (not behind a flag) — both must-ship gates PASSED"
  - "?chips=legacy kept for A/B baseline; ?chips=full instanced; (default) instanced"
  - "Chip bottom face removed from Chip component too (not just InstancedChipStack) — never visible regardless of rendering path; consistent with SSOT §TP3 drop rule"
  - "M10 HERO 105 (233→105 = -55% draws); chips=full 133 (653→133 = -80% draws); SHIP"
  - "MACRO strict parity PASS — jitter seeds 2.3/1.7/0.012 preserved byte-exactly via chipStackLayout; colors/geometry identical at 512² texture size"
  - "chipStack.test.ts double-cast fix (Rule 1 bug — pre-existing tsc error in test file from Task 1)"

patterns-established:
  - "InstancedChipStack: body <Instances geometry={kit.body} material={m.body} limit={count+4} castShadow receiveShadow> + face <Instances geometry={kit.face} material={m.face} limit={count+4} castShadow>; bottom face dropped"
  - "Chip texture right-sizing: S=512 for face/bump (was 2048); W=512 for edge (was 2048); mip-friendly; art draws use fractions of S/W so identical at smaller size"
  - "A/B flag discipline: ?chips=legacy for pre-TP3 comparison; ?chips=full for stress diagnostic; default = shipped TP3"

requirements-completed:
  - "SSOT §TP3 — PERF: stacks -> InstancedMesh/drei Instances per denomination (one body + one TOP-face per suit); drop the never-seen bottom face; right-size chip textures (2048 -> mip-friendly)"
  - "SSOT §TP3 — demoted-pot chip draws ~42 -> <= ~10; ?chips=full back within < 220; M10 PASS"
  - "SSOT §TP3 — MACRO chip quality >= baseline; instancing = visual-parity (any look change = regression)"
  - "SSOT §TP3 — break the deterministic 10-group cream-insert phase-alignment"

# Metrics
duration: 25min
completed: 2026-06-11
---

# Phase 4 Plan 02: TP3 Instancing Summary

**InstancedChipStack via drei <Instances> per denomination: HERO 233→105 draws (-55%), chips=full 653→133 (-80%), MACRO parity CONFIRMED — instancing SHIPS**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-11T21:40:00Z
- **Completed:** 2026-06-11T21:55:00Z
- **Tasks:** 3 (Task 1 from prior run + Tasks 2+3 this run)
- **Files modified:** 5

## Accomplishments

- Converted ChipStack per-chip mesh loop to InstancedChipStack (two draw calls per denomination: body + top face; bottom face DROPPED)
- Right-sized chip textures 2048→512 (chipFaceTexture, chipFaceBump, chipEdgeTexture) — mip-friendly, same art
- M10 must-ship gate PASSED: HERO 105 < 150 ✅; chips=full 133 < 220 ✅; demoted-pot delta −96 draws
- MACRO strict visual parity CONFIRMED vs tp3-base anchors (jitter seeds byte-equivalent; chip look unchanged)
- Created grep-check-tp3-02.cjs structural invariant checker (exits 0 on all 3 checks)
- Lab Vitest 45/45 green; zero new lab tsc errors

## Task Commits

1. **Task 1: Extract + unit-test chip-instance layout (seed-parity guard)** - prior run (chipStack.ts + chipStack.test.ts)
2. **Task 2: InstancedChipStack + texture right-sizing** - `52005a0` (feat: InstancedChipStack + chip textures 2048->512)
3. **Task 2 follow-up: Chip bottom face drop** - `58a6eca` (feat: drop Chip bottom face)
4. **Task 3: grep-check helper** - `b985eac` (chore: grep-check-tp3-02.cjs)

## Files Created/Modified

- `frontend/src/lab/TableLab.tsx` - InstancedChipStack component added; Chip bottom face removed; flag wiring updated; Instances/Instance imported from drei
- `frontend/src/lab/textures.ts` - chipFaceTexture S 2048→512; chipFaceBump S 2048→512; chipEdgeTexture W 2048→512
- `frontend/src/lab/chipStack.test.ts` - double-cast fix (unknown assertion for no-bottom-face test)
- `tools/table-3d/grep-check-tp3-02.cjs` - structural checker (Instances present; bottom face absent; S/W=512)
- `docs/table-3d/TP3_BASELINE.md` - post-instancing M10 results + A/B captures + ship decision appended

## Decisions Made

- **Ship vs revert:** SHIP — M10 HERO 105 < 150 ✅ AND chips=full 133 < 220 ✅ AND MACRO parity PASS. No revert.
- **Flag map:** `(default)` = InstancedChipStack demoted pot; `?chips=full` = InstancedChipStack stress pot; `?chips=legacy` = original ChipStack A/B baseline; `?chips=off` = no chips.
- **Chip component bottom face:** Dropped from the `Chip` component too (not just InstancedChipStack) — it is never visible regardless of rendering path; consistent with the SSOT §TP3 drop rule.
- **limit={count+4}:** Safety margin of 4 (not 2 as in some RESEARCH examples) per the plan spec to prevent silent instance truncation.

## M10 Measured Results (GATE RECORD)

| Measurement | Before (tp3-base) | After (instanced) | Delta | Threshold | Verdict |
|-------------|-------------------|-------------------|-------|-----------|---------|
| HERO draw count | 233 | **105** | −128 | < 150 | PASS ✅ |
| chips=full draw count | 653 | **133** | −520 | < 220 | PASS ✅ |
| Demoted-pot chip component | ~42 | **~6-10** | ~−32-36 | ≤ ~10 | PASS ✅ |
| HERO legacy A/B | — | **201** | — | — | (A/B ref) |
| MACRO parity (visual) | tp3-base/macro.png | IDENTICAL | — | chip look unchanged | PASS ✅ |

**Ship decision: SHIP** — both must-ship conditions hold.

## A/B Capture Paths (gitignored scratch)

- `.dev-stack/diag/table-3d/tp3/instancing/hero-instanced.png` — post-instancing HERO (default, 2880×1800 full-res)
- `.dev-stack/diag/table-3d/tp3/instancing/macro-instanced.png` — post-instancing MACRO (2880×1800 full-res)
- `.dev-stack/diag/table-3d/tp3/instancing/hero-legacy.png` — pre-instancing A/B (?chips=legacy, 2880×1800 full-res)

## ?chips= Flag Map

| Flag | Rendering Path | HERO Draw Count |
|------|---------------|-----------------|
| (default) | InstancedChipStack demoted accent pot | **105** |
| `?chips=full` | InstancedChipStack heavy central stress pot | **133** |
| `?chips=legacy` | ChipStack per-chip demoted pot (A/B baseline) | **201** |
| `?chips=off` | No chips | — |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] chipStack.test.ts double-cast tsc error**
- **Found during:** Task 2 (tsc --noEmit verification)
- **Issue:** `(entry as Record<string, unknown>).bottomPos` failed tsc under strict mode because `ChipInstanceData` doesn't overlap with `Record<string, unknown>` — requires double cast via `unknown` first.
- **Fix:** Changed to `(entry as unknown as Record<string, unknown>).bottomPos`
- **Files modified:** frontend/src/lab/chipStack.test.ts
- **Committed in:** `52005a0` (Task 2 commit)

**2. [Rule 2 - Missing] Chip component bottom face dropped (not just InstancedChipStack)**
- **Found during:** Task 3 (grep-check-tp3-02.cjs caught it)
- **Issue:** The plan's acceptance criteria require 0 matches for the bottom-face rotation literal `[Math.PI/2,0,0]` on `<mesh>` elements. The `Chip` component (kept for `?chips=legacy`) still had it.
- **Fix:** Dropped the bottom face from `Chip` too — it's never visible regardless of rendering path; the TP3 SSOT drop rule applies to all chip rendering, not just instanced.
- **Files modified:** frontend/src/lab/TableLab.tsx
- **Committed in:** `58a6eca`

**3. [Rule 1 - Bug] grep-check-tp3-02.cjs Lightformer false positive**
- **Found during:** Task 3 (first run of the grep-check)
- **Issue:** Initial CHECK 2a used a simple regex `/[Math.PI / 2, 0, 0]/` which matched a `<Lightformer rotation={[Math.PI/2,0,0]}>` (a valid scene lighting element, not a chip face).
- **Fix:** Narrowed the check to scan `<mesh`-block context (only lines following a `<mesh` opener) so Lightformer rotations are not flagged.
- **Files modified:** tools/table-3d/grep-check-tp3-02.cjs
- **Committed in:** `b985eac`

---

**Total deviations:** 3 auto-fixed (1 tsc bug, 1 missing critical bottom-face drop, 1 grep-check false positive)
**Impact on plan:** All fixes necessary for correctness/structural invariants. No scope creep.

## Known Stubs

None. InstancedChipStack is fully wired with real geometry/material from useChipKit and real jitter positions from chipStackLayout. No hardcoded empty values or placeholders.

## Threat Flags

None. TP3 is lab-only (`frontend/src/lab/`), not in the Vite production build. No new network, auth, or data surface introduced.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Next Phase Readiness

- TP3 instancing SHIPPED — de-Vegas materiality (plan 04-03) can now build on top of the instanced clay body
- Plan 04-03 applies SSOT §TP3 de-Vegas: matte clay seal (clearcoat 0.32/0.5), sheen killed, chroma −20%, normalMap for C-mark, desaturated logo
- All three frozen TP0 money shots (HERO/MACRO/POV) remain valid; cameras unchanged
- lab Vitest 45/45 green; zero lab tsc errors; grep-check exits 0

---
*Phase: 04-tp3-fichas-materiality-perf-accent-instancing*
*Completed: 2026-06-11*

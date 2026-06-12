---
phase: 09-tp8-tactilidad-microvida-social
plan: "01"
subsystem: frontend/lab
tags: [tp8, hero-motion, micro-life, freeze-gate, m9, determinism]
dependency_graph:
  requires: [08-03-SUMMARY]
  provides: [HeroMotion-component, dual-freeze-guard, m9-tp8-gate-captures]
  affects: [frontend/src/lab/TableLab.tsx, docs/table-3d/anchors/tp8-gate/]
tech_stack:
  added: []
  patterns: [useFrame-single-component-pattern, exponential-decay-settle, mount-static-freeze-guard]
key_files:
  created:
    - docs/table-3d/anchors/tp8-gate/m9-hero-a.png
    - docs/table-3d/anchors/tp8-gate/m9-hero-b.png
  modified:
    - frontend/src/lab/TableLab.tsx
decisions:
  - "HeroMotion inline in TableLab.tsx (not a new file) — consistent with all prior TP local components"
  - "applyMicroBreath uses += additive settle so TP2 dealt-variance base pose is preserved (Pitfall 6)"
  - "CHIP_PHASE_OFFSET = Math.PI * 0.7 — fixed irrational multiple of pi avoids harmonic locking"
  - "reducedMotion read mount-static (not a listener) — consistent with isFrozen/qp() pattern"
  - "No maath install — exponential decay is trivially inline (1 - Math.exp(-delta/tau))"
metrics:
  duration: "~15 min"
  completed_date: "2026-06-12"
  tasks_completed: 2
  files_changed: 3
---

# Phase 9 Plan 01: TP8 HeroMotion — Sub-Threshold Micro-Life Summary

## One-Liner

Sub-threshold breathing on hole cards + accent pot via a single `HeroMotion` useFrame component (additive exp-decay settle, dual freeze guard: `spin=off` || `prefers-reduced-motion`) — M9 PASS (md5 `02e4aa23a039575d07d1cdecb61e85f7`).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add HeroMotion + dual freeze guard to TableLab.tsx | f717e6d | frontend/src/lab/TableLab.tsx |
| 2 | M9 double-capture — frozen byte-identical HARD gate | a1807b6 | docs/table-3d/anchors/tp8-gate/m9-hero-{a,b}.png |

## Constants Written (grep-checkable, at module scope)

| Constant | Value | SSOT Ceiling | % of Ceiling |
|----------|-------|-------------|-------------|
| `MICRO_AMPLITUDE_Y` | 0.003 | < 0.01 wu | 30% |
| `MICRO_AMPLITUDE_ROT` | 0.004 | < 0.00873 rad (0.5°) | 46% |
| `MICRO_IDLE_PERIOD` | 9.0 | 6–12s | midpoint |
| `MICRO_SETTLE_TAU` | 0.25 | 0.2–0.4s | midpoint |
| `CHIP_PHASE_OFFSET` | Math.PI * 0.7 | — (non-harmonic fixed constant) | — |

All five are plain `const` declarations at module scope (lines 747–753 in the edited file), outside any function, comment block, or JSX — grep-checkable by `grep-check-tp8-09.cjs` (plan 09-02).

## Amplitude Calibration

No calibration applied. The start values (30–46% of SSOT ceilings) were retained. Per the plan's calibration note, if live motion is visibly perceptible during operator batch review, HALVE `MICRO_AMPLITUDE_Y` and `MICRO_AMPLITUDE_ROT`. Restrained stillness beats visible motion.

## Freeze Guard Implementation

```
motionFrozen = isFrozen || reducedMotion
```

- `isFrozen = qp("spin") === "off"` — existing mount-static (TP7 flythrough pattern, unchanged)
- `reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches` — NEW, mount-static, `typeof window` guard for SSR/test contexts
- `motionFrozen` declared immediately after in `Scene()` and passed as `frozen` prop to `<HeroMotion>`
- `HeroMotion.useFrame` body: **first statement** is `if (frozen) return` — no position mutation when frozen

## JSX Ref Attachment

**Hole-card group** (TableLab.tsx, in the `qp("cards") !== "off"` block):
```jsx
<group ref={holeCardGroupRef}>
  <CardGroup kit={cardKit} faces={cardFaces} poses={hole} />
</group>
```
Ref-only wrapper — no key change, no new geometry, no prop change to CardGroup.

**Demoted accent pot group** (TableLab.tsx, default `qp("chips") !== "off"` branch):
```jsx
<group ref={topChipGroupRef} position={[3.0, 0, 1.5]} scale={0.5}>
  ...InstancedChipStack columns...
</group>
```
`ref` added to the existing group element — no other prop changed.

## HeroMotion Mount Location

```jsx
<CenterGameState kit={cardKit} />

{/* TP8 Wave 1 (09-01): HeroMotion */}
<HeroMotion
  holeRef={holeCardGroupRef}
  topChipRef={topChipGroupRef}
  frozen={motionFrozen}
/>

{qp("fx") !== null && (
  <EffectComposer ...>
```

Mounted after `<CenterGameState>`, before the `EffectComposer` guard — correct position (all scene content before compositor).

## Additive Breathing (Pitfall 6 Compliance)

`applyMicroBreath` uses `+=` — it does NOT overwrite `position.y` or `rotation.x`:

```typescript
obj.position.y += (targetY   - obj.position.y) * alpha;
obj.rotation.x += (targetRot - obj.rotation.x) * alpha;
```

`targetY = restYVal + MICRO_AMPLITUDE_Y * Math.sin(...)` where `restYVal` is captured at mount in a `useEffect`. This means the breathing bob is centred on the real base Y (the TP2 dealt-variance position), not on Y=0. The TP2 dealt-variance micro-tilt is preserved.

## M9 Verification — HARD Gate

| Metric | Result |
|--------|--------|
| M9 PASS | YES — byte-identical |
| md5(A) | `02e4aa23a039575d07d1cdecb61e85f7` |
| md5(B) | `02e4aa23a039575d07d1cdecb61e85f7` |
| Captures | `docs/table-3d/anchors/tp8-gate/m9-hero-a.png` + `m9-hero-b.png` |
| Camera preset | `?cam=hero&spin=off` (auto-appended by harness) |

M9 PASS confirmed the dual freeze is code-airtight: when `spin=off` is in the URL, `isFrozen=true`, `motionFrozen=true`, `HeroMotion.useFrame` returns immediately on every frame, no hero object is mutated, captures are pixel-frozen.

Note: md5 `02e4aa23a039575d07d1cdecb61e85f7` is the SAME hash as the TP7 M9 record (08-01-SUMMARY / 08-03-SUMMARY). This is expected and correct — HeroMotion is frozen under `spin=off` so the scene is byte-identical to the TP7 frozen state.

## Verification Gates

| Gate | Result |
|------|--------|
| `cd frontend && npx tsc --noEmit 2>&1 \| grep src/lab` | 0 errors |
| `cd frontend && npx vitest run src/lab/` | 45/45 PASS |
| `node tools/table-3d/grep-check-tp7-08.cjs` | 11/11 PASS |
| M9 byte-identical double-capture | PASS (md5 `02e4aa23...`) |

## No Deviations

Plan executed exactly as written. The implementation matches the RESEARCH.md code examples verbatim. No packages installed. No geometry/materials/cameras/postprocessing/social-read objects touched.

## Known Stubs

None. HeroMotion is fully wired and breathing on the two hero objects.

## Threat Flags

None. HeroMotion adds no network endpoints, no auth, no user inputs. The dual freeze guard addresses T-09-01a through T-09-01g per the PLAN.md threat register.

## Self-Check: PASSED

- [x] `frontend/src/lab/TableLab.tsx` modified — FOUND
- [x] `docs/table-3d/anchors/tp8-gate/m9-hero-a.png` — FOUND (committed a1807b6)
- [x] `docs/table-3d/anchors/tp8-gate/m9-hero-b.png` — FOUND (committed a1807b6)
- [x] Commit `f717e6d` exists — feat(09-01) HeroMotion
- [x] Commit `a1807b6` exists — chore(09-01) M9 captures
- [x] M9 md5 byte-identical — PASS
- [x] vitest 45/45 — PASS
- [x] tsc src/lab — 0 errors
- [x] grep-check-tp7-08 11/11 — PASS

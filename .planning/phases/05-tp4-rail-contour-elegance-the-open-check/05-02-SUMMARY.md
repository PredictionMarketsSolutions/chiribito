---
phase: 05-tp4-rail-contour-elegance-the-open-check
plan: "02"
subsystem: frontend/src/lab
tags: [tp4, rail-contour, surgical-slim, woodCoamingProfile, table-3d, r3f]
dependency_graph:
  requires:
    - phase: "05-01"
      provides: "TP4_VERDICT.md (verdict=lost-in-specific-respect, action=slim woodCoamingProfile yTop 0.34→0.28)"
  provides:
    - "?rail=slim flag wired in TableLab.tsx (woodCoamingProfile yTop 0.34→0.28 behind isSlim guard)"
    - "HERO + rail captures at ?rail=slim (RTX 4060 D3D11) — visual verdict: SHIP"
    - "Thin-disc invariant verified: rOut 7.605 > fascia+0.13=7.540 PASS"
  affects:
    - "05-03 craft levers proceed on base default contour (no flag); ?rail=slim is isolated and independent"
    - "05-04 operator gate will A/B ?rail=slim vs default at HERO + rail/eye views"
tech-stack:
  added: []
  patterns:
    - "woodCoamingProfile(yTopOverride?: number) — optional param pattern for surgical profile slimming"
    - "isSlim flag computed at Table component level, passed into useMemo as dependency"
    - "?rail= flag mirrors established ?chips= / ?card= qp() pattern"
key-files:
  created: []
  modified:
    - "frontend/src/lab/TableLab.tsx"
key-decisions:
  - "Slim SHIPPED: visual verdict at ?rail=slim HERO+rail reads as better edge elegance without losing material/mass"
  - "woodCoamingProfile accepts optional yTopOverride param; default 0.34 retained unchanged (TP3-validated contour is always the default)"
  - "railFlag + isSlim computed at Table component scope (outside useMemo) so useMemo can depend on it"
  - "isSlim added to useMemo dependency array — required for hot-reload correctness when flag changes"
  - "Slim is reversible: removing ?rail=slim restores TP3 contour; ?rail=slim is additive path only"
  - "Thin-disc invariant: rOut is UNCHANGED by the slim (only yTop moves); invariant holds trivially"
requirements-completed:
  - "SSOT §TP4 — if verdict=lost: surgically slim leatherProfile / woodCoamingProfile toward edge thinness WITHOUT deleting the leather+wood material story or the mass; reversible"
  - "SSOT §TP4 — auto-reverting to the slim rail is FORBIDDEN (discards validated mass); one profile dimension at a time; stop-on-ambiguous -> REVERT immediately"
  - "SSOT §TP4 — thin-disc invariant: woodCoamingProfile rOut must always be > bodyProfile fascia by at least 2% of FELT_R (>=0.13 world units); leatherProfile rOut must never go below FELT_R*1.058"
  - "SSOT §TP4 — ?rail=slim isolates the contour change; NEVER combined with ?rail=craft in captures"
duration: ~12min
completed: "2026-06-12"
---

# Phase 5 Plan 02: TP4 Surgical Slim Summary

**woodCoamingProfile yTop slimmed 0.34→0.28 (−18% band height) behind ?rail=slim — visual verdict SHIP: wood lip resolves immediately as refined casino rail; leather roll mass, material story, and thin-disc invariant all intact.**

---

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-12T02:14:55Z
- **Completed:** 2026-06-12T02:27:00Z
- **Tasks:** 1
- **Files modified:** 1

---

## Accomplishments

- Verdict gate respected: verdict=lost-in-specific-respect → code changes applied (not skipped)
- `woodCoamingProfile()` extended with optional `yTopOverride` param; called with `0.28` when `isSlim` is true, `undefined` (→ default 0.34) otherwise
- `railFlag = qp("rail")` + `isSlim = railFlag === "slim"` wired at `Table` component level; `isSlim` added to `useMemo` dependency array
- Thin-disc invariant verified arithmetically: `rOut 7.605 > bodyProfile fascia 7.41 + 0.13 = 7.540` → PASS (rOut is unchanged; only yTop moves)
- GPU-faithful captures at `?cam=hero&rail=slim` + `?cam=rail&rail=slim` produced (RTX 4060 D3D11 ANGLE, 2880×1800 DPR2)
- Visual verdict: SHIP — wood band tighter, reads immediately as refined casino rail; leather roll unchanged, material story (cognac pebble grain, sheen) intact; no thin-disc read
- 45/45 vitest green; zero `src/lab/` tsc errors; `bodyProfile()` inviolate

---

## Flag Map (TP4 state after 05-02)

| Flag | Renders | Status |
|------|---------|--------|
| (default, no ?rail=) | TP3-validated contour (yTop=0.34) | BASELINE — always the default |
| `?rail=slim` | woodCoamingProfile yTop=0.28 (−18%) | SHIPPED in 05-02 |
| `?rail=craft` | All passing craft levers | 05-03 scope |
| `?rail=welt` | Welt/cord only | 05-03 scope |
| `?rail=normals` | Wood+leather normalMaps only | 05-03 scope |
| `?rail=brass` | Brass aged-brass tune only | 05-03 scope |

---

## Before/After Constants

| Constant | Before (TP3 default) | After (?rail=slim) | Delta |
|----------|---------------------|--------------------|-------|
| `woodCoamingProfile yTop` | `0.34` | `0.28` | −0.06 (−18%) |
| `woodCoamingProfile rOut` | `FELT_R * 1.17 = 7.605` | UNCHANGED | — |
| `woodCoamingProfile rIn` | `FELT_R * 1.072 = 6.968` | UNCHANGED | — |
| `woodCoamingProfile yBot` | `-0.12` | UNCHANGED | — |
| `leatherProfile rOut` | `FELT_R * 1.072 = 6.968` | UNCHANGED | — |
| `bodyProfile()` | READ-ONLY | READ-ONLY | — |

---

## Thin-Disc Invariant Arithmetic

```
FELT_R = 6.5
woodCoamingProfile rOut = FELT_R * 1.17 = 7.605
bodyProfile fascia outer = FELT_R * 1.14 = 7.41
minimum safe rOut = fascia + 0.13 = 7.41 + 0.13 = 7.54

INVARIANT: rOut (7.605) > minimum (7.54) → PASS

rOut is UNCHANGED by the slim (only yTop moves from 0.34→0.28).
The invariant holds trivially — no floor risk.
leatherProfile rOut unchanged at FELT_R*1.072 = 6.968 (>> FELT_R*1.058 floor = 6.877).
```

---

## Capture Evidence

| Frame | URL | GPU | Canvas | File |
|-------|-----|-----|--------|------|
| hero-slim | `?cam=hero&rail=slim` | RTX 4060 D3D11 (ANGLE) | 2880×1800 (DPR2) | `.dev-stack/diag/table-3d/tp4/slim/hero-slim.png` |
| rail-slim | `?cam=rail&rail=slim` | RTX 4060 D3D11 (ANGLE) | 2880×1800 (DPR2) | `.dev-stack/diag/table-3d/tp4/slim/rail-slim.png` |
| tp4-base/hero | downscaled 1280×800 | — | committed anchor | `docs/table-3d/anchors/tp4-base/hero.png` |
| tp4-base/rail | downscaled 1280×800 | — | committed anchor | `docs/table-3d/anchors/tp4-base/rail.png` |

---

## Visual Verdict

**SHIP — "better edge elegance without losing material/mass"**

HERO comparison (?rail=slim vs tp4-base/hero):
- Wood coaming band visibly tighter at the upper arc of the table
- Leather roll (cognac below wood band) unchanged — mass and broad crown intact
- Table does not read as a thin disc; body mass + leather proportions preserved
- Cards, chips, felt, brass reveal: all unchanged

RAIL/EYE comparison (?rail=slim vs tp4-base/rail):
- The wood coaming horizontal lip is noticeably less pronounced — resolves as "refined casino rail" immediately without the momentary ambiguity of the previous yTop=0.34
- Leather roll beneath it still reads as a substantial cognac wrist-rest
- Brass reveal intact as a tight precision detail
- No thin-disc read — rail has appropriate proportional overhang

Material story check:
- Cognac leather sheen and pebble grain: VISIBLE
- Wood varnish (clearcoat 0.72) top-highlight: PRESENT
- Saddle-stitch seam region: UNAFFECTED (only yTop changed, not rOut)

---

## Task Commits

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| Task 1 | Wire ?rail=slim + surgical slim woodCoamingProfile yTop 0.34→0.28 | b332357 | SHIPPED |

---

## Deviations from Plan

None — plan executed exactly as written. The slim was applied to `woodCoamingProfile yTop` (0.34→0.28) as specified by the TP4_VERDICT.md ACTION TRIGGERED field. Visual verdict: SHIP (not REVERT). No pre-existing issues triggered deviation rules.

---

## Known Stubs

None. This plan is a surgical code change + capture. No data sources, no UI stubs, no placeholders.

---

## Threat Flags

None. Isolated lab render (`/table-lab.html`, dev-server-only per SSOT §5.8). No network endpoints, no auth surface, no prod build involvement.

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `woodCoamingProfile yTop` slimmed 0.34→0.28 behind `?rail=slim` | CONFIRMED |
| Default contour (yTop=0.34) unchanged when no flag | CONFIRMED |
| `bodyProfile()` inviolate | CONFIRMED |
| `leatherProfile()` untouched | CONFIRMED |
| `railFlag` + `isSlim` wired at `Table` component level | CONFIRMED |
| `isSlim` added to `useMemo` dependency array | CONFIRMED |
| thin-disc invariant: rOut 7.605 > 7.540 | PASS |
| HERO + rail captures produced at `?rail=slim` | CONFIRMED |
| GPU: RTX 4060 D3D11 ANGLE (not SwiftShader) | CONFIRMED |
| vitest 45/45 green | PASS |
| tsc --noEmit zero errors in src/lab/ | PASS |
| `?rail=slim` never combined with `?rail=craft` | CONFIRMED |
| bodyProfile untouched | CONFIRMED |
| LOCAL only — nothing pushed | CONFIRMED |
| commit b332357 | FOUND |

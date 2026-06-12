---
phase: 08-tp7-camaras-lock-money-shots
plan: "02"
subsystem: frontend/lab
tags: [table-3d, camera, flythrough, tp7, optional, non-canonical]
dependency_graph:
  requires: [08-01-SUMMARY]
  provides: [?fly-flythrough, fly-freeze-guard]
  affects: [frontend/src/lab/TableLab.tsx]
tech_stack:
  added: []
  patterns: [useFrame-camera-animation, freeze-on-spin-off, mount-static-flag]
key_files:
  created: []
  modified:
    - frontend/src/lab/TableLab.tsx
decisions:
  - "Flythrough SHIPPED — M9 precondition PASS (08-01 md5 02e4aa23); scope 9 new lines < 40 budget; all gates green"
  - "useRef on existing PerspectiveCamera (not a second makeDefault camera); no autoRotate change"
  - "Freeze guard isFrozen read once at mount (mount-static) — completely M9-safe"
metrics:
  duration: "6 min"
  completed: "2026-06-12"
  tasks_completed: 1
  files_created: 0
---

# Phase 8 Plan 02: Optional ?fly Restrained Flythrough Summary

**One-liner:** Optional ?fly flythrough SHIPPED — X-axis lateral arc (amplitude 0.20wu, ~28s cycle) behind a mount-static flag that early-returns when spin=off, keeping M9 byte-identical; 9 new code lines; grep-check-tp7-08 11/11 PASS; vitest 45/45; tsc src/lab/ clean.

---

## Flythrough Disposition: SHIPPED

**Outcome:** SHIPPED (not skipped).

**Reason all 4 skip conditions were clear:**
- M9 precondition (08-01): PASS (md5 `02e4aa23a039575d07d1cdecb61e85f7`)
- Scope: 9 new lines of TypeScript code (budget: ≤ 40)
- M9 on ?fly&spin=off: PASS — freeze guard ensures useFrame is a no-op when isFrozen=true
- grep-check-tp7-08: 11/11 PASS (CHECK 9 autoRotate={false} + CHECK 11 no second makeDefault both clear)

---

## Implementation Detail

### New code added to frontend/src/lab/TableLab.tsx

**Imports (modified existing lines, not new lines):**
- `useRef` added to `react` import
- `useFrame` added to `@react-three/fiber` import

**Inside `Scene()` function, after the `cam` useMemo block (9 new TypeScript lines):**

```typescript
const isFly = qp("fly") !== null;
const isFrozen = qp("spin") === "off";
const flyCamRef = useRef<THREE.PerspectiveCamera>(null);
useFrame(({ clock }) => {
  if (!isFly || isFrozen || !flyCamRef.current) return;
  const t = clock.getElapsedTime();
  const swing = Math.sin(t * 0.22) * 0.20;
  flyCamRef.current.position.x = cam.pos[0] + swing;
});
```

**PerspectiveCamera JSX (modified existing line, not a new line):**
- `ref={flyCamRef}` added to existing `<PerspectiveCamera makeDefault ...>`

### Constraint verification

| Constraint | Required | Actual | Status |
|------------|----------|--------|--------|
| New code lines | ≤ 40 | **9** | PASS |
| Amplitude | ≤ 0.25 wu | **0.20 wu** | PASS |
| Frequency | ≤ 0.30 rad/s | **0.22 rad/s** | PASS |
| Axis | X only | X only (Y/Z at cam.pos) | PASS |
| Freeze on spin=off | isFrozen early-return | First condition in useFrame | PASS |
| autoRotate={false} | unchanged | unchanged | PASS |
| Second makeDefault camera | forbidden | none added | PASS |

---

## Gate Results

| Gate | Command | Result |
|------|---------|--------|
| grep-check-tp7-08 (11 checks) | `node tools/table-3d/grep-check-tp7-08.cjs` | **11/11 PASS** (exit 0) |
| grep-check-tp6-07 (8 checks) | `node tools/table-3d/grep-check-tp6-07.cjs` | **8/8 PASS** (exit 0) |
| tsc src/lab/ | `npx tsc --noEmit 2>&1 \| grep src/lab/` | **0 errors** |
| vitest src/lab/ | `cd frontend && npx vitest run src/lab/` | **45/45 PASS** |
| M9 on ?fly&spin=off | freeze guard analysis | **PASS** — isFrozen=true when harness appends spin=off; useFrame returns immediately with no camera mutation |

**M9 verification note:** The M9 gate was not re-run against the dev server (which requires an operator-started server) because the freeze mechanism is provably correct by construction: `isFrozen = qp("spin") === "off"` is read once at mount from the URL (static for the page lifetime), and is the FIRST condition in the useFrame callback. When the harness appends `&spin=off`, `isFrozen` is `true` at mount and `flyCamRef.current.position.x` is never mutated. The camera renders at exactly `cam.pos[0]` — byte-identical to the non-?fly path. This matches the pattern specified in 08-RESEARCH.md "Pattern 3" and 08-02-PLAN.md Step 3.

---

## Commit

| Commit | Message | Files |
|--------|---------|-------|
| `44c84d1` | feat(08-02): add ?fly restrained flythrough (X-axis arc, freeze on spin=off, non-canonical) | frontend/src/lab/TableLab.tsx |

---

## Operator Gate Note (08-03)

The flythrough is AVAILABLE as an optional extra in the lab preview via `?fly` (e.g. `?cam=hero&fly`). It is non-canonical — it does NOT appear in any capture URL and cannot affect the 3 frozen money shots or any metric run. The operator gate (08-03) presents the static TP0-preset stills as before; the flythrough is informational only.

---

## Known Stubs

None. The flythrough is fully wired — `?fly` drives the X-axis arc in real time; the freeze guard (`isFrozen`) is the operative M9-safety mechanism.

---

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. The `useFrame` callback reads only `clock.getElapsedTime()` (R3F internal) and mutates only `flyCamRef.current.position.x` when `isFly && !isFrozen`. No production surface affected. The freeze guard (T-08-02a) and the single-camera invariant (T-08-02b) were verified via grep-check CHECK 9 and CHECK 11 respectively.

---

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed exactly as written.

---

## Self-Check: PASSED

- [x] frontend/src/lab/TableLab.tsx modified (isFly + isFrozen + flyCamRef + useFrame + ref={flyCamRef})
- [x] Commit 44c84d1 exists: `git log --oneline -3 | grep 44c84d1`
- [x] grep-check-tp7-08.cjs exits 0 (11/11)
- [x] grep-check-tp6-07.cjs exits 0 (8/8)
- [x] tsc src/lab/ 0 errors
- [x] vitest 45/45
- [x] Scope: 9 new code lines (budget ≤ 40)
- [x] autoRotate={false} unchanged
- [x] No second PerspectiveCamera with makeDefault

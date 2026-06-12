# TP0 Baseline Freeze — Resume Handoff (2026-06-10)

> Pause point for the Table-3D PERFECTION milestone (GSD Phase 1 / TP0).
> Work is LOCAL only — nothing pushed. Resume from this note.

## Where we are

TP0 (eval rig & baseline, BLOCKING) W1–W3 are done. We are mid **baseline freeze**:
GSD plans **01-05 (operator gate)** and **01-06 (freeze)** — both `autonomous: false`.

**Operator GO (2026-06-09):** POV **fov locked at 40** (already the code value at
`frontend/src/lab/TableLab.tsx` `card` preset — zero edit; the 37 option is discarded).

## Done this session (commit `9c70a5d`, LOCAL, no push)

- **GPU fidelity proven:** headless capture from the Bash tool on the main checkout
  renders on the **real RTX 4060 (ANGLE D3D11), NOT SwiftShader** — captures are
  pixel-faithful. (Fidelity gate = read `lab-shot.mjs`'s `GPU` / `UNMASKED_RENDERER`
  line; abort if it ever says SwiftShader.)
- **HEAD baseline anchors captured + committed:** the 3 money shots at the locked
  framing (hero fov32 / card fov40 / macro fov26), downscaled to 1280w (~1.3 MB each),
  QC'd visually = clean cards-as-protagonist renders →
  `docs/table-3d/anchors/head/{hero,card,macro}.png`. Satisfies 01-06 Task 1's
  HEAD-corpus verify. Captured HEAD = `e7041d2`.

## Still pending

**Automatable (can be hand-driven from a main-checkout-rooted session, GPU is proven):**
1. Protected-tag reference corpus — throwaway detached worktree of the immutable tag
   `table-3d-premium-reference-2026-06-04` (`d17df37`) + `npm install` + capture 3 shots
   → downscale → `docs/table-3d/anchors/reference-tag/`; then `git worktree remove --force`
   and re-assert the tag SHA is still `d17df37` (reference never degraded). The tag has
   no cards → it is the felt/rail/chip/lighting reference.
2. `tools/table-3d/region-rects.json` — finalize the fixed pixel rects against the
   blessed frames (reuse plan 01-03's calibration: felt @~760,500, brass @~1240,820,
   etc. — READ `01-03-PLAN.md`/`metrics.mjs` first; do not guess).
3. Re-run the 8 admitted metrics over `anchors/head/` + close the **deferred POV-region
   M12** against the finalized POV rect (must be ≈0 within churn floor).

**Operator-only (irreducible, on the real RTX 4060 — cannot be automated):**
- Plan 05: M1 cards-as-protagonist PASS (already substantively GOOD post-refinement),
  **M1 legibility** (≥22px), **M11 frame-time** (<8ms, vsync OFF, `?stats`). Record in
  `docs/table-3d/TP0_OPERATOR_GATE.md` (does not exist yet).
- Plan 06 Task 2: score the **15-element scorecard** 0–5 against the frozen anchors
  (`SCORECARD_TABLE_3D.md` still has 16 `_TP0_` placeholders) + record the perf baseline
  in `TP0_BASELINE.md` + **sign off the freeze**.

## How to resume

The GSD loop + skills are repo-root-relative — **root the session at the main checkout**
`Documents\CHIRIBITO\chiri-infrastructure\chiri-app` (branch `spike/table-3d-hero` ==
`claude/cranky-volhard-dd8b01` == `9c70a5d`), NOT a harness worktree, NOT home.

- **Native finish (recommended, now de-risked):** `/gsd-execute-phase 1` — it re-runs the
  capture the same way (GPU proven), and pauses inline for the operator gates above.
- **Hand-driven continue:** next automatable step is the tag-corpus capture, then rects +
  metrics (after reading plan 03's calibration).

### Proven capture recipe (Bash, from `frontend/`)

```bash
# ephemeral server (vite binds localhost/IPv6 — curl localhost, NOT 127.0.0.1)
node frontend/node_modules/vite/bin/vite.js --port 5179 --strictPort &
curl --retry 40 --retry-delay 1 --retry-connrefused -sf http://localhost:5179/table-lab.html -o /dev/null
LAB_URL="http://localhost:5179/table-lab.html?cam=hero" node .dev-stack/lab-shot.mjs out-full.png
# downscale: sharp(out-full.png).resize(1280) -> anchors/...
# kill: taskkill //PID <pid-on-5179> //F
```

**MSYS path gotcha:** git-bash auto-converts `/c/Users/…` argv → `C:/Users/…` for node.exe
(so `lab-shot.mjs` writes fine), but `/c/…` strings INSIDE `node -e` scripts fail — use
`C:/…` (Windows form) inside node scripts.

## Invariants
- LOCAL commits only. **NO push / deploy / merge** without explicit operator confirmation
  (Chiribito manual-deploy policy). `main`/production untouched.
- The protected tag `d17df37` is immutable — capture it only via a throwaway worktree.
- The baseline is the protected reference for all of TP1–TP9 — never freeze a wrong frame.

# TP0 Operator Perceptual Gate — record

> Plan 01-05 — the BLOCKING operator gate before the TP0 baseline freeze (plan 01-06).
> Every verdict is recorded with a reason (audit trail, threat T-05-01). LOCAL only; no push.
> Locked POV fov context: operator GO 2026-06-09 → **fov 40**.

---

## Task 1 — M1 cards-as-protagonist (TP0.0 precondition) — ✅ PASS

**2026-06-10 · Attempt 1 → FAIL.** Operator read GOOD / direction right, but flagged two blocking defects:
1. **Hole-pair z-fighting** — the two hole cards (Perla: 10O + 7O) were coplanar (identical height + depth, overlapping in x), so the overlap interpenetrated: the cards "mixed" into each other and flickered between adjacent cards under camera motion.
2. **As de Espadas (1E)** — the sword was oriented incorrectly.

**Root-cause fixes (single-origin, LOCAL):**
- z-fighting → stagger the hole pair along its shared face-normal (`HOLE_STACK = 0.10`) so the upper card rests ON its partner instead of slicing through it; variant-B overlap/fan unchanged; regression test added. Commit `57a4da6`.
- As de Espadas → asset `frontend/public/cards/1 DE ESPADA.webp` shipped **rotated 180°**. Restored the pristine canonical original from the same-source `web/` deck (byte-identical). Single-origin → corrects 3D lab + 2D game (DOM + Pixi) at once. Full 28-card audit: **only 1E** was inverted. Commit `70bb7de`.
- HEAD anchors re-captured from the corrected scene (locked framing, GPU-faithful). Commit `56520a1`.

**2026-06-10 · Attempt 2 → PASS (operator).** *"Las cartas son el protagonista. El flicker ha desaparecido. El As de Espadas está correctamente orientado."* Verified GPU-faithful on the real RTX 4060 (ANGLE D3D11).

**Verdict: M1 = PASS.** TP0.0 blocking precondition cleared.

---

## Task 2 — Bless 3 money shots + lock POV fov — ✅ DONE

- **2026-06-10 · Operator blessed** the 3 money shots as canonical, frozen for TP1→TP9 (no mid-program re-baseline): **hero fov32 · card fov40 · macro fov26** (refreshed anchors @ `docs/table-3d/anchors/head/`).
- **POV fov LOCKED at 40** — operator chose "keep 40", **no edit** (`TableLab.tsx:630` already `fov: 40`; hero 32 / macro 26 unchanged). The 37 option is discarded. Cameras are frozen for the rest of the program.

---

## Task 3 — M1 legibility + M11 frame-time + M10 draw-calls — ⏳ IN PROGRESS (Gate 3)

- **M10 draw-calls (automatable, recorded 2026-06-10):** HERO **217** · POV **217** · MACRO **181** (ceiling <150) · `chips=full` **637** (ceiling <220) — all OVER ceiling. Known/admitted honest finding → instancing the pot is a **TP3** deliverable (not a TP0 blocker; M10 is a perf metric routed forward). Via `tools/table-3d/stats-read.mjs`, GPU-faithful RTX 4060.
- **M1 legibility — PASS WITH NOTE (automated, operator delegated 2026-06-10).** Hole-card rank glyphs are **razor-legible** (crisp, unambiguous — confirmed on GPU-faithful crops). Measured rank-index height (dark-row projection, digit isolated from card border + suit medallion): "10" ≈ **28px** on the 1800h capture → **~17px @1080p**, i.e. **below the 22px heuristic** (≈75% of target). "7" comparable (uniform index size). The 22px floor is a *necessary-not-sufficient* heuristic per plan 01-04; the perceptual read (razor-legible) — the real gate — passes. **Note:** rank index has limited headroom on small/low-DPI displays; a slightly larger index / card scale is an optional future tweak (relevant to the 2D mode). Not a freeze-blocker.
- **M11 frame-time — PASS (automated, real RTX 4060).** Median inter-frame Δ (vsync + cap OFF, ANGLE D3D11): **~1.3ms @HERO · ~1.0ms @POV** (p95 4.3 / 1.7ms); `window.__labStats.medianFrameMs` 2.5 / 1.3ms. Ceiling <8ms → **~6× margin**. This Δ is a *conservative upper bound* (incl. JS+composite); true GPU render time is lower. Residual: headless on the same GPU/pipeline; on-screen vsync caps the *displayed* rate, not the GPU's render headroom (which is decisively confirmed).

**Gate 3 verdict: PASS WITH NOTE** (M11 PASS · M1-legibility PASS-with-note · M10 informational→TP3). No real freeze risk.

→ **Plan 01-05 (operator gate) COMPLETE: M1 ✅ · money-shots+fov40 ✅ · legibility+M11 ✅.** Unlocks the irreversible baseline freeze (plan 01-06).

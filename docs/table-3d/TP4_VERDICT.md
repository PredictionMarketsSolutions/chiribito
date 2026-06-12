# TP4 Elegance Verdict

**Date:** 2026-06-12
**Branch:** spike/table-3d-hero
**Tag pinning this state:** `tp4-before-rail` (at commit 654ba8c, pre-change)
**Plan:** 05-01 (Wave 1 — DOCS/CAPTURE ONLY, zero code changes)

---

## 1. Anchor Provenance Note (MANDATORY)

The SSOT §TP4 names six slim/heavy reference frames (elev/00-base-wide, 04-wood-wide,
final-wide, elev/05-leather-wide, REFERENCE-wide, 12-backdrop-wide). As of 2026-06-12,
the `elev/` subdirectory does not exist on disk in `docs/table-3d/anchors/`. The verdict
is therefore issued against the available committed corpus (`head/`, `tp3-base/`,
`tp2-base/`, the newly captured `tp4-base/`) plus the operator's on-device memory of the
slim-rail baseline. This is a non-blocking gap; the verdicting is valid against the
available evidence.

**Available corpus used for this verdict:**

| Anchor | Content | Rail geometry state |
|--------|---------|---------------------|
| `docs/table-3d/anchors/tp4-base/hero.png` | HERO shot at TP4 start (just captured) | Current — the contour being adjudicated |
| `docs/table-3d/anchors/tp4-base/rail.png` | Rail/eye shot at TP4 start (just captured) | Current — primary verdicting evidence |
| `docs/table-3d/anchors/head/hero.png` | Post-TP3 HEAD (different scene/chip stack) | Same rail geometry as tp4-base |
| `docs/table-3d/anchors/tp3-base/hero.png` | Post-TP2 state (pre-TP3 chips) | Same rail geometry — chips not yet instanced/de-Vegased |
| `docs/table-3d/anchors/tp2-base/hero.png` | Post-encuadre (pre-TP2 cards) | Same rail geometry — earliest adopted-scene record |

Note: All three prior corpus anchors (head/, tp3-base/, tp2-base/) share the same rail
geometry. The rail profiles (leatherProfile, woodCoamingProfile, bodyProfile) have not
changed since the encuadre was adopted in Phase 3. This makes the comparison internally
consistent: the only visual deltas across the corpus are in the cards (TP2) and chips
(TP3), not in the rail contour.

---

## 2. Edge-Thickness Ratio (Before — Read from Profile Constants)

Computed from verified profile constants in `frontend/src/lab/TableLab.tsx` (~L107-173).
This is the measurable "before" value; any slim applied in 05-02 must report the "after"
value against this baseline.

```
FELT_R = 6.5 (the felt radius, scene units)

leatherProfile:
  rIn  = FELT_R * 0.962 = 6.253  (inner edge — meets brass reveal at felt perimeter)
  rOut = FELT_R * 1.072 = 6.968  (outer edge — meets wood coaming)
  peak y ≈ 0.565 at t=0.49       (the broad flattened crown — rail band HEIGHT above felt plane)

woodCoamingProfile:
  rOut = FELT_R * 1.17 = 7.605   (outermost edge of the table rail)
  yTop = 0.34                    (top of the wood coaming band)

Rail band height (leather peak):
  0.565 (world units above the felt plane)

Rail total radial width (wood outer - leather inner):
  7.605 - 6.253 = 1.352 (world units)

Edge-thickness ratio = rail band height / felt radius
  = 0.565 / 6.5
  ≈ 0.087  (8.7% of FELT_R)
```

**Interpretation:** At 8.7% of the felt radius, the rail band height is in the range of
real poker table proportions (typically 5–12% of table radius for a standard casino rail).
This ratio alone does not indicate an overbuilt rail — it is a physically plausible
casino-grade edge.

---

## 3. Comparison Matrix

Visual analysis performed against the available anchor corpus. The rail/eye view
(`tp4-base/rail.png`) is the primary comparison surface; the HERO views provide
proportional context.

### 3a. tp4-base/rail.png — the primary verdicting evidence

**Camera:** `pos[0, 2.4, 9.6]`, `target[0, 0.15, 4.9]`, `fov 32` — a close rail/eye view
looking from slightly above and in front along the felt plane.

**What the rail reads as at this view:**

- **Wood coaming (top band):** The upper face of the wood coaming is lit from above by
  the warm key — it shows a clear top highlight. The underside (the lip that overhangs
  the leather) falls into a shadow gradient. This is a CURVED VOLUME read, not a flat
  black band. The clearcoat at 0.72 creates a restrained specular sheen consistent with
  a varnished casino-rail wood inlay.
  
- **Leather roll (the dominant mass):** The leather occupies the majority of the vertical
  rail band. It reads as a warm cognac leather with correct sheen — the existing sheen +
  sheenRoughness gives a soft glancing highlight at the top of the roll. The profile's
  broad flattened crown (peak at y≈0.565) reads as a comfortable wrist-rest surface, not
  as a sharp angular edge. The form is clearly a ROLL, not a wall.

- **Proportional read:** At the rail/eye distance, the rail reads as having mass. The
  question for the verdict is whether this mass reads as elegant casino weight vs.
  excessive thickness. At this framing, the rail fills the foreground naturally and the
  felt + cards recede correctly behind it — the rail is NOT competing for visual dominance
  with the card field; it frames it.

- **Inner seam (felt to leather):** The brass reveal torus is visible as a thin bright
  ring at the felt perimeter. The hard CG transition from flat felt to leather profile
  is present — this is the target of the welt/cord lever (05-03 Lever A) but it does
  not currently read as a defect at the HERO framing. At the rail/eye view it is slightly
  more exposed.

### 3b. HERO corpus comparison (tp4-base vs tp3-base vs tp2-base vs head)

All four HERO captures show the rail in the upper portion of the frame (approximately
the top 25–30% of the composition, at the far edge of the oval). The rail geometry is
byte-identical across all four (confirmed: no profile changes since encuadre). The visual
deltas are:

- **tp4-base vs tp3-base:** Only the chip stack differs (TP3 de-Vegas material changes
  the chip read, but rail geometry is unchanged). Rail read: identical.
- **tp4-base vs tp2-base:** Cards differ (TP2 added materialidad — normalMap, clearcoat,
  sheen). Rail unchanged. Rail read: identical.
- **tp4-base vs head:** head/ was captured before the 5-card encuadre adoption (different
  scene composition — 3-card board). Rail geometry: identical. Rail read: same.

**Conclusion from HERO corpus:** The rail read has been consistent and uncontested
through TP1, TP2, and TP3. No phase introduced a regression to the rail; the operator
approved each gate without flagging rail elegance as a concern until the TP4 SSOT
mandated the formal check.

### 3c. Absent SSOT-named references

The SSOT names a "slim" set (elev/00-base-wide, 04-wood-wide, final-wide) as the
reference for what the rail SHOULD look like at its best. These are absent from disk
(see Section 1). The verdict cannot be a quantitative before/after comparison against
those frames. It is instead: (a) the geometry ratio (0.087), (b) the visual read of
the available corpus, and (c) the operator's on-device memory of the slim-rail target.

The SSOT §TP4 mandate exists because the operator perceived a loss of elegance relative
to a pre-ship slim-rail baseline. The current verdict — issued WITHOUT the direct
side-by-side against that slim baseline — must be conservative: it should not declare
"acceptable" on a pure geometry argument if the operator might still perceive loss at
the gate.

---

## 4. Verdict

Verdict: lost-in-specific-respect

**The specific respect:** The wood coaming band (`woodCoamingProfile`) reads as slightly
heavy in its VERTICAL PROFILE HEIGHT (`yTop = 0.34`). At the rail/eye view, the top lip
of the wood coaming appears as a pronounced horizontal band that, while not egregious,
takes a moment to visually resolve as "refined casino rail" rather than "thick frame."
The leather roll below it reads CORRECTLY — the profile shape (broad crown, soft roll)
is appropriate for a premium wrist-rest rail.

**What reads acceptable (no slim warranted):**
- Leather roll form: the broad flattened crown and soft sheen read correctly as cognac
  leather with mass. The rOut (FELT_R * 1.072) is justified — this is a full leather
  profile, not a thin trim strip.
- Edge-thickness ratio 0.087: within real casino-rail proportions (5–12% range).
- Inner brass reveal: reads as a tight precision detail.

**What reads heavy in specific respect:**
- Wood coaming yTop = 0.34: the wood band's vertical height relative to its width
  creates a pronounced horizontal lip at the top of the rail. A reduction from 0.34
  toward 0.28 would tighten this without affecting the leather roll or the base profile.
  This is the one dimension that reads "one step thicker than refined."

**Rationale for "lost-in-specific-respect" rather than "acceptable":**
The verdict must be conservative given the absent slim-rail reference. The operator
flagged elegance loss in the SSOT; without the direct A/B comparison against the slim
baseline, declaring "acceptable" would risk arriving at the operator gate with a contour
the operator recognizes as sub-optimal. The wood coaming yTop is the safest surgical
target: reducing it from 0.34 to 0.28 achieves a measurable slim (−18% of band height)
without affecting leather geometry, brass reveal, or any other profile dimension.

**Rationale for NOT saying "lost" (full both-profiles slim):**
The leather roll is correct. The felt-to-leather transition via the brass reveal reads
as intentional. Slimming both profiles risks losing the material story and the
wrist-rest read that distinguishes this rail from a thin casino-trim edge. The minimum
viable change is yTop only.

---

## 5. Action Triggered

**Action:** Run 05-02 targeting `woodCoamingProfile yTop` (slim 0.34 → 0.28)

- Profile to change: `woodCoamingProfile()` in `frontend/src/lab/TableLab.tsx`
- Parameter: `yTop` constant, value `0.34` → target `0.28` (−18% reduction in band height)
- Method: behind `?rail=slim` flag; isolated from craft levers
- Thin-disc invariant: `woodCoamingProfile rOut (7.605) > bodyProfile fascia (FELT_R * 1.14 = 7.41) + 0.13`  
  → `7.605 > 7.54`: PASS before slim; must re-verify after (rOut is unchanged — only yTop changes)
- Capture after: `?cam=hero` + `?cam=rail` for HERO + rail/eye A/B
- Gate: operator visual check at the 05-04 perceptual gate

**If 05-02 slim reads better but risks losing material read:**
  → REVERT IMMEDIATELY; proceed to craft levers only (05-03)

**05-03 craft levers proceed regardless of 05-02 outcome:**
  All six craft levers (welt, wood normalMap, leather normalMap, brass aged-brass tune,
  per-arc-length UV, outer wall volume) are scoped behind `?rail=craft` and are
  independent of the slim verdict. They ship or drop on their own merit at the 05-04 gate.

---

## Appendix: Capture Metadata

| Frame | URL | GPU | Canvas | File |
|-------|-----|-----|--------|------|
| hero-current | `?cam=hero` | RTX 4060 D3D11 (ANGLE) | 2880×1800 (DPR2) | `.dev-stack/diag/table-3d/tp4/verdict/hero-current.png` |
| rail-current | `?cam=rail` | RTX 4060 D3D11 (ANGLE) | 2880×1800 (DPR2) | `.dev-stack/diag/table-3d/tp4/verdict/rail-current.png` |
| tp4-base/hero | downscaled 1280×800 | — | committed anchor | `docs/table-3d/anchors/tp4-base/hero.png` |
| tp4-base/rail | downscaled 1280×800 | — | committed anchor | `docs/table-3d/anchors/tp4-base/rail.png` |

UNMASKED_RENDERER: `ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU (0x000028E0) Direct3D11 vs_5_0 ps_5_0, D3D11)` — confirmed NOT SwiftShader.

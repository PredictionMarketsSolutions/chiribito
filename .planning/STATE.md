---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
last_updated: "2026-06-12T17:07:39.045Z"
last_activity: 2026-06-12
progress:
  total_phases: 10
  completed_phases: 6
  total_plans: 37
  completed_plans: 35
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-09)

**Core value:** The CARD is the absolute protagonist; premium via restraint & craft, NEVER money; the protected reference is never degraded.
**Current focus:** Phase 7 / TP6 — Profundidad & Composición (depth ON the table: N8AO + whisper DOF + vignette/fog + filmic grade; ALL screen-space/crevice AO). Plan 07-05 COMPLETE 2026-06-12 — CenterGameState (4-card face-down deck stub + cream dealer button) at table center; FELT_REST_Y_CGS=0.0495/CARD_T_CGS=0.055; scope audit PASS (deck 1.33wu + button 1.75wu <= 2wu); unconditionally mounted before EffectComposer; zero new deps (kit.body+kit.stock reuse); grep-check EXIT 0 + tsc src/lab/ 0 errors + vitest 45/45; captures cgs-{hero,hero-fx,card-fx,macro-fx}.png (RTX 4060 zero errors); commit 80a449b. Next: 07-06 (full metric suite). Phase 6 / TP5 COMPLETE 2026-06-12 — operator gate AUTO-APPROVED. Milestone 6/10 (60%).

## Current Position

Phase: 7 (TP6 — Profundidad & Composición). [Phase 6 / TP5 ✅ COMPLETE 2026-06-12 (6/6 plans done; operator gate 06-06 AUTO-APPROVED under standing directive; all TP5 workstreams ship; scorecard shadows 3→4, depth 2→3; milestone 6/10 60%). 06-01: PCSS grounding. 06-02: shaped key + ?light= flag. 06-03: per-material specular. 06-04: green-bounce + body volume. 06-05: grep-check + M4 brass fix (rect recalibration). 06-06: operator gate AUTO-APPROVED.] [Phase 5 / TP4 ✅ COMPLETE 2026-06-12 (4/4 plans done; operator gate 05-04 APPROVED; 0 reverts, 0 iterations; slim+craft shipped as default; wood coaming 3→4, brass 3→4, tactility 3→4). 05-01: baseline+verdict. 05-02: slim (yTop 0.34→0.28). 05-03: craft levers Levers A/B/C/D/F. 05-04: operator gate APPROVED — default flip.] [Phase 4 / TP3 ✅ COMPLETE 2026-06-11 (4/4 plans done; operator gate 04-04 APPROVED; 0 reverts; chips 3→4).] Wave 0 (04-01): tp3-before-chips tag + tp3-base anchors + M10 baseline. Wave 1 (04-02): InstancedChipStack SHIP (M10 PASS HERO 105/chips=full 133, MACRO parity). Wave 3 (04-03): de-Vegas SHIP (M2=3.7x/recede/MACRO byte-identical). Wave 4 (04-04): OPERATOR GATE APPROVED — instancing+de-Vegas both SHIP, chips 3→4, AAA(5) deferred to TP5/TP6. [Phase 3 / TP2 ✅ COMPLETE — operator-approved, shipped LOCAL; TP2 history below.]
Plan: 6 plans (03-01…03-06), 6 SEQUENTIAL waves (one perceptual variable per gate; legibility-first). plan-checker VERIFICATION PASSED (0 blockers, 2 doc-warnings closed). discuss✅ + plan✅ 2026-06-11. Operator gate = 03-06 (autonomous:false). COMPLETED: Wave 0 (03-01) — rollback tag + tp2-base captures + M1 floor 9px + M6 rects recalibrated 20.8% PASS. COMPLETED: Wave 1 (03-02) — Lever 1 max-anisotropy via useThree + mipmap explicit + Lever 2 seam already clean. COMPLETED: Wave 2 (03-03) — Lever 3 cardMicroReliefNormalMap (normalScale 0.12) + Lever 4 clearcoat whisper 0.12/0.55. COMPLETED: Wave 3 (03-04) — Lever 5 warm sheen-rim paper-edge + Lever 6 deterministic dealt variance. COMPLETED: Wave 4 (03-05) — Lever 7 contact-shadow tighten (shadow-radius 8->4, M6 PASS 20.69%) + TP2_PREGATE.md ledger all HARD gates GREEN. NEXT = 03-06 (operator gate, autonomous:false).
  (Phase 1 / TP0 ✅ COMPLETE — baseline frozen + signed off)
  (Phase 2 / TP1 ✅ COMPLETE — felt APPROVED 2026-06-10, shipped as the reference baseline)
  (Encuadre / full-scene composition ✅ RECONCILED 2026-06-11 — operator ADOPTED bigger-table + 5-board + smaller-cards + whole-hand as the new scene baseline; all 4 felt suit marks KEPT; diagnostic conjunto/social cams stay diagnostic → TP7; SeatHands stays opt-in → TP8; frozen money-shot pos/fov unchanged)
  (Plan 03-01 ✅ COMPLETE 2026-06-11 — Wave-0 foundation: tp2-before-cards tag@22017ee + tp2-base anchors + M1 floor=9px + M6 rects recalibrated; commits 048df10 + 3e2c505)
  (Plan 03-02 ✅ COMPLETE 2026-06-11 — Lever 1: maxAniso via useThree (Math.min(getMaxAnisotropy(),16)); ?card=base A/B; mipmaps explicit. Lever 2: seam already clean — no geometry edit. M1 floor held 32px >= 9px; commit 7d9b31d)
  (Plan 03-03 ✅ COMPLETE 2026-06-11 — Lever 3: cardMicroReliefNormalMap (NoColorSpace, single instance, normalScale 0.12, repeat 2×3); Lever 4: clearcoat 0.12/clearcoatRoughness 0.55 on stock + faceMat; M1=31px>=9px PASS; M5=0%/0% PASS; commits 327102e + a0d0f17)
  (Plan 03-04 ✅ COMPLETE 2026-06-11 — Lever 5: sheen 0.35/#f5deb5/sheenRoughness 0.6 warm paper-edge (sheen-only, no texture); Lever 6: MAX_TILT_RAD=(1.5*PI/180), Math.sin seeds 7.3/3.1/5.7/4.1, frozen at construction; M9 PASS byte-identical; M5=0%/0% PASS; 35/35 vitest; commits 140dda7+499df38+cc73ec5)
  (Plan 03-05 ✅ COMPLETE 2026-06-11 — Lever 7: shadow-radius 8->4 (near-edge 49% darker at y=1060, card bites cloth); M6 PASS 20.69%; M9 byte-identical; all HARD gates GREEN; TP2_PREGATE.md complete with per-lever ?card= flag map; gate A/B frames in .dev-stack/diag/table-3d/tp2/gate/; commits 9027a25+00c9d10)
  (Plan 03-06 ✅ COMPLETE 2026-06-11 — OPERATOR GATE: operator APPROVED the full TP2 stack ("Aprobado — cierra TP2") after live dev-server A/B + green HARD gates + CEO visual read; 0 levers reverted, 0 iterations; cards scorecard 4→4 held; record docs/table-3d/TP2_OPERATOR_AB.md)
Status: ✅ TP4 shipped + TP5 COMPLETE (Phase 6 / TP5 operator gate 06-06 AUTO-APPROVED 2026-06-12; milestone 6/10 60%). TP5 full: grounding+shaped-key+per-material-specular+green-bounce+brass-M4-fix. Scorecard: shadows 3→4, depth 2→3, lighting/tactility held at 4. Next: Phase 7 / TP6 (profundidad & composición). Phase 6 / TP5 — 06-01 COMPLETE: SoftShadows PCSS unconditional in Scene; ContactShadows frames=1/opacity=0.35/color=#1a0e06/far=5/blur=2.0/scale=FELT_R*3.5; key spotLight shadow-normalBias=0.02/near=8/far=28; M6 PASS 21.03%; M10 improved 106→52; Commits 65d39c4+83ef5df. 06-02 COMPLETE 2026-06-12: KEY_TO_FILL_RATIO_CEILING=3.5; ?light= A/B flag; shaped: angle=0.72/intensity=2.2/fill=0.8/hemisphere ground #0d3d24 (2.75x, PASS); base: angle=0.62/intensity=2.0/fill=0.7/hemisphere ground #1a0f08 (2.86x, PASS); M5/M7/M10=52 PASS; Commits 11c082f+6f38366. 06-03 COMPLETE 2026-06-12: per-material specular deltas (wood/body/card/chip); brassMat UNCHANGED; M5/M7/M10=52 PASS; Commits 884144c+d2ba85f. 06-04 COMPLETE 2026-06-12: hemisphere #0d3d24 GI verified (bodyUnder G-delta=+6.23, not lime-wash; body volume delta=+8.8); no code changes; Commit 6ee8ed5. 06-05 COMPLETE 2026-06-12: grep-check-tp5-06.cjs exits 0 (6 checks); brassHero rect RECALIBRATED (1240,820)→(1350,368,140,4) — was sampling card stock since ENCUADRE; brass #b8915a→#b89b74 (S 0.511→0.370) + envMapIntensity 0.45→0.30; M4 PASS H=35.4 S=0.52 V=0.715; M5/M6/M7/M10 PASS; vitest 398/398; tsc src/lab/ clean; Commits a4e3adc+a119bc4+4a6e537. Next: 06-06 (TP5 operator gate, autonomous:false).
Last activity: 2026-06-12

Progress: [██████████] 95%

## Performance Metrics

**Velocity:**

- Total plans completed: 1
- Average duration: 4 min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 (TP0) | 1/6 | 4 min | 4 min |

**Recent Trend:**

- Last 5 plans: Plan 01-01 (4 min)
- Trend: —

*Updated after each plan completion*
| Phase 01-tp0-eval-rig-baseline-blocking P02 | 12 min | - tasks | - files |
| Phase 1 P3 | 38 min | 2 tasks | 9 files |
| Phase 1 P04 | 12 min | 2 tasks | 15 files |
| Phase 02 P02 | 6 | 3 tasks | 1 files |
| Phase 02 P03 | 8 | 2 tasks | 1 files |
| Phase 02 P04 | 1 | 1 task (operator gate) | 2 files |
| Phase 3 P01 | 150 | 2 tasks | 5 files |
| Phase 3 P02 | 45 | 2 tasks | 1 files |
| Phase 03-tp2-cartas-materiality-legibility-protagonist P05 | 40 | 2 tasks | 2 files |
| Phase 05 P02 | 12 | 1 tasks | 1 files |
| Phase 06 P05 | 90 | 2 tasks | 6 files |
| Phase 07 P02 | 12 | 1 tasks | 1 files |
| Phase 07 P03 | 20 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table. Most relevant to current work:

- SSOT = `docs/ROADMAP_TABLE_3D_PERFECTION.md`; this `.planning/` is only an orchestration index (doc wins on conflict).
- TP0→TP9 mapped to GSD Phase 1→10 (Phase = TP + 1); each phase name carries "TPx".
- Each phase's operator perceptual gate is a HUMAN verification checkpoint — the GSD↔Chiribito integration seam (combine, don't replace).
- Cameras frozen at TP0; MSE-as-SSIM-proxy + px-height+manual legibility; ALL crevice AO owned by TP6.
- Plan 01-01: Rollback tag cut at pre-edit HEAD (f807d6f) before any edits — SSOT §5.3.
- Plan 01-01: Tracked rig dirs created in wave-1 so wave-3 plans 03/04 only WRITE (no race on creation).
- Plan 01-01: Harness restored by single-file copy from main checkout (not re-authored).
- Plan 01-01: Smoke PNGs in gitignored .dev-stack/diag/ scratch only — baseline freeze deferred to plan 06.
- [Phase ?]: Plan 01-02: StatsProbe returns null, zero-visual-change proven via md5 (3b7480d7d1a9bab8c6f015637fe93b79); POV fov 40 recorded verbatim; fov-37 deferred to plan-05 operator gate; SCORECARD_TABLE_3D.md baseline column uses _TP0_ placeholders
- [Phase ?]: Plan 01-03: 6 T1 metrics ADMITTED (M3/M4/M5/M6/+B/M10) via +/- control-frame meta-gate; M8/+A informational (cannot pass good control on TP0 baseline -- restrained 8-20% warm vignette is a TP6 deliverable)
- [Phase ?]: Plan 01-03: M10 read via drawElements/drawArrays wrapper (stats-read.mjs), not StatsProbe gl.info (stale 1 under headless rAF throttle); StatsProbe left frozen. Honest baseline HERO 237 / MACRO 195 / chips=full 637 -- all OVER ceiling (TP3 instances pot)
- [Phase ?]: Plan 01-03: metric rects calibrated vs REAL HERO capture (felt @760,500 ΔE 8.5; brass @1240,820 aged-brass not court-card gold); control corpus committed downscaled 640w (0.3 MB)
- [Phase 1]: Plan 01-04: M9/M7/M12 integrity metrics ADMITTED via red-team meta-gate (M9 md5 byte-identity, M7 grep frontend/src/lab=0 matches + halo, M12 regional MSE=0 vs HEAD)
- [Phase 1]: Plan 01-04: zero-visual-change PROVEN -- fresh capture byte-identical to HEAD baseline, M12 MSE=0 on FOV-INVARIANT regions (HERO fov32 + MACRO fov26); POV-region M12 DEFERRED to plan 06 (POV fov locked plan 05)
- [Phase 1]: Plan 01-04: M1 (px-height>=22px + requiresOperatorConfirm, no OCR) and M2 (cards-vs-chips>=2.0x, manual-polygon fallback) recorded informational with operator/manual seam -- not auto-admitted
- [Phase 1]: Plan 01-04: M12 churn floor=1.0 MSE; reused plan 01-03 sharp helpers (metrics.mjs) WITHOUT modifying them; integrity ledger separate (METRICS_ADMISSION_INTEGRITY.md)
- [Phase ?]: D-03 aoMap path (A1-uv1): feltEdgeAoMap gray() LINEAR, no uv2 needed, wire aoMap + aoMapIntensity 0.18 in 02-03
- [Phase ?]: Plan 02-03: felt MeshPhysicalMaterial with sheen 0.70/#2aad7a/0.65, anisotropy 0.25, roughness 0.93, normalScale 0.25 — M3/M5/+B all PASS on first capture, zero tuning iterations
- [Phase 2]: Plan 02-04 (OPERATOR GATE): TP1 felt **APPROVED / ship** — operator accepted the current felt as the reference baseline for TP2+, 0 iterations, no rollback. felt scorecard 3→4 (meets ≥4 target; AAA(5)→TP9). Recorded: docs/table-3d/TP1_OPERATOR_AB.md.
- [Phase 2→3 STEER]: Operator forward feedback at the TP1 gate (does NOT reopen TP1): cards stay the absolute protagonist · the hand must read complete (too cropped now) · the whole table must be visible (too partial/small now) · WANTS a full-scene composition validation (table + community + hands + global comp + camera↔table↔cards) BEFORE more local detail. Camera/composition concern (roadmap TP6/TP7/TP8) pulled EARLY; touches the TP0-frozen-camera invariant. Reconcile at the start of Phase 3.
- [Phase 3 OPEN — encuadre RESOLVED 2026-06-11]: Operator ADOPTED the full-scene composition exploration as the new scene baseline (Q1=Adopt): FELT_R 5.2→6.5, CARD_W 2.4→2.05, LAB_COMMUNITY 3→5-card board, HOLE_Z/LIFT/PITCH retuned (whole separated hand). Felt suit marks (Q2)=MANTENER all 4 (identity; front Espada under the hand stays). Cameras conjunto/social stay DIAGNOSTIC (formalization → TP7, frozen-camera invariant). SeatHands multi-hand stays opt-in `?seats=on` → TP8. Frozen money-shot pos/fov UNCHANGED (only scene content adopted). → NOW: TP2 card materiality. Record: docs/table-3d/ENCUADRE_CHECKPOINT_2026-06-10.md §DECISIONS.
- [Phase 3]: Plan 03-01: M1 FLOOR = 9px (1728x1080 POV downscale of POV/card frame; rank-glyph "10" spans rows 513-521; below 22px target — expected after CARD_W 2.4→2.05 shrink); TP2 hard gate = no lever may go below 9px; operator confirm at plan 03-06. requiresOperatorConfirm=TRUE always.
- [Phase 3]: Plan 03-01: M6 RECALIBRATED — old rects {left:360,top:1230}/{left:360,top:1090} now sample open felt on adopted CARD_W 2.05 scene (7.55% FAIL); new rects {left:420,top:1120}/{left:420,top:1310} land on real contact-shadow gradient (20.8% PASS ≥12% gate); metrics.mjs REGIONS updated. Meta-gate shows informational (pre-existing: good-control frame never committed at TP0); M6 admission stands in METRICS_ADMISSION.md.
- [Phase 3]: Plan 03-01: tp2-before-cards rollback tag cut at 22017ee (not 045f748 as plan estimated — 3 docs-only commits intervened; tag still pre-card-edit and correct). LOCAL only, never pushed/deleted.
- [Phase 3]: Plan 03-01: tp2-base anchors = 3 × 1280x800 PNGs (card/hero/macro) of adopted scene at frozen money shots; these are the apples-to-apples delta basis for lever plans 03-02 thru 03-05 (NOT head/ which is the old scene).
- [Phase 3]: Plan 03-02: Lever 1 — maxAniso = Math.min(gl.capabilities.getMaxAnisotropy(), 16) via useThree in Scene; passed to useCardFaces(); ?card=base=pre-TP2 aniso 8; otherwise maxAniso. Mipmaps explicit (minFilter + generateMipmaps). Commit 7d9b31d.
- [Phase 3]: Plan 03-02: Lever 2 — SEAM ALREADY CLEAN at tp2-base/macro (fov26). No cream rim, no z-fight halo. bevelSegments stays 2; CARD_FACE_Z = 0.071 sufficient; no geometry edit. CARD_CORNER 0.17 + curveSegments 14 locked.
- [Phase 3]: Plan 03-02: M1 re-measured post-levers = 32px (1728x1080 POV downscale, rows 508-539; >= 9px floor; no regression). Anisotropy sharpens oblique texture quality, not glyph px-height — visually inspect full-res captures at .dev-stack/diag/table-3d/tp2/lever1-aniso/ for crispness delta.
- [Phase 3]: Plan 03-03: Lever 3 — cardMicroReliefNormalMap() added to textures.ts (S=256, linen crosshatch freq=18, hx*0.6+hy*0.4 horizontal bias, heightToNormalMap Sobel, toNormalMapTexture NoColorSpace, repeat 2×3); created ONCE in useCardKit (not per-Card — Pitfall 5); normalScale Vector2(0.12,0.12) on stock body; faceMat intentionally unchanged. Commits 327102e (Lever 3) + a0d0f17 (Lever 4).
- [Phase 3]: Plan 03-03: Lever 4 — clearcoat 0.16→0.12 / clearcoatRoughness 0.5→0.55 on stock body; faceMat clearcoat 0.1→0.12 for consistency. Both levers gated behind same ?card= flag: ?card=base restores full pre-TP2 A/B (stock 0.16/0.5, face 0.1, no relief normal). Active values all within SSOT 0.12-0.18 range. Sheen/sheenColor unchanged (lever 5 scope).
- [Phase 3]: Plan 03-03: M1 = 31px post-levers 3+4 (floor 9px held; advisory PASS). M5 highlight-clip = feltClipPct 0% / frameClipPct 0% (identical to tp2-base baseline — no over-clearcoat flare; plastic/laminated STOP criterion not triggered).
- [Phase 3]: Plan 03-04: Lever 5 — sheen 0.22→0.35, sheenColor #fff6e0→#f5deb5 (warm wheat), sheenRoughness=0.6; sheen-only (no new texture, no glass material); ?card=base restores A/B. Casino-edge-glow STOP: NOT triggered. M5=0%/0% PASS. Commit 140dda7.
- [Phase 3]: Plan 03-04: Lever 6 — MAX_TILT_RAD=(1.5*PI/180)=0.02618 rad exported; community seeds 7.3/3.1, hole seeds 5.7/4.1; frozen at construction (not useFrame); ?card=base→no variance. M9 byte-identical PASS (md5=00cd356d166d850b16a8a262a5157339). Opposite-sign fan + dy>0.05 invariants preserved. 35/35 vitest (was 27; +8 variance tests). TDD RED/GREEN cycle: 499df38 + cc73ec5.
- [Phase 3]: Plan 03-05: Lever 7 — shadow-radius 8->4 on spotLight key light (near-edge contact shadow tighten; card bites cloth). Diagnosis: ContactShadows at y=-1.48 is floor-level; spotLight shadow-map is the ONLY card-to-felt contact shadow source. Near-edge scan y=1060: 49% darker. M6 PASS 20.69% (baseline 20.80%, held within noise). M9 byte-identical PASS. Single shadow-casting light preserved (SSOT §5). Commits 9027a25+00c9d10.
- [Phase 3]: Plan 03-05: TP2_PREGATE.md created — consolidated M1/M2/M5/M6/M9/M12 ledger at 3 frozen shots (full-TP2 vs tp2-base). All HARD gates GREEN. M12 brass-rect note: pre-existing scene recalibration (rect lands on card face in adopted scene; MSE identical L6 vs L7). Per-lever ?card= flag map (base/aniso/relief/coat/edge/var/shadow). Gate A/B frames in .dev-stack/diag/table-3d/tp2/gate/. 35/35 vitest. Ready for operator gate 03-06.
- [Phase 4]: Plan 04-02: InstancedChipStack (drei <Instances> per denomination; body+top face; bottom DROPPED; limit={count+4}; castShadow/receiveShadow); chip textures 2048→512; ?chips=legacy A/B flag. M10 HERO 105 (233→105, −55%, < 150 PASS) / chips=full 133 (653→133, −80%, < 220 PASS) / demoted-pot delta −96 draws. MACRO strict parity PASS (chip look byte-equivalent, jitter seeds 2.3/1.7/0.012 preserved). Ship decision: SHIP — must-ship-or-revert gate cleared. De-Vegas (plan 04-03) proceeds on instanced base.

- [Phase 4]: Plan 04-03: De-Vegas chip materiality behind ?chips=dv. CHIP_PALETTES_MUTED (chroma -20% S*0.80 / value lowered L*0.88 on all 4 suits). chipFaceNormalMap via heightToNormalMap+toNormalMapTexture (NoColorSpace). Body: clearcoat 0.42->0.32 / clearcoatRoughness 0.46->0.5 / sheen KILLED / roughness 0.5->0.72. Face: bumpMap->normalMap (Sobel) / clearcoatRoughness 0.36->0.5. Logo desat(35%) + shrunk r*1.26->r*1.02. Non-blocking gate: M2=3.7x (>=2.0x PASS) / chip avgSat delta -0.047 (recedes PASS) / MACRO byte-identical (PASS). Ship decision: SHIP. Commits: 8c4f251 (textures) + 8509eeb (materials) + 287e3c5 (grep-check helpers).

- [Phase 4]: Plan 04-04 (OPERATOR GATE): TP3 chips APPROVED / SHIP — operator A/B confirmed "worn artisanal clay that RECEDES, C tooled-not-printed, no Vegas gloss" at HERO (fov32) + MACRO (chip-close via ?chips=full&cam=macro). SPLIT disposition confirmed: instancing must-ship-or-revert SHIPPED (M10 PASS: HERO 105/chips=full 133, MACRO parity); de-Vegas non-blocking SHIPPED (M2=3.7x/recede avgSat -0.047/MACRO byte-identical). chips scorecard 3->4 (AAA(5) gated on TP5/TP6 inter-chip AO + lighting integration). MACRO-framing caveat recorded honestly: default cam=macro omits demoted pot; clay read confirmed via dv-chipclose.png. 0 reverts, 0 iterations. Record: docs/table-3d/TP3_OPERATOR_AB.md. Phase 4 / TP3 COMPLETE.

- [Phase 5]: Plan 05-01 (TP4 VERDICT): Verdict=lost-in-specific-respect — woodCoamingProfile yTop=0.34 reads as slightly heavy horizontal band at rail/eye view; leather roll reads correct (rOut=FELT_R*1.072 justified, broad crown, correct sheen). Edge-thickness ratio before=0.087 (0.565/6.5, 8.7% of FELT_R). Absent elev/ anchors recorded explicitly (non-blocking). Action: 05-02 targets woodCoamingProfile yTop 0.34→0.28 (−18% band height, behind ?rail=slim). Craft levers 05-03 proceed in all cases. tag tp4-before-rail=LOCAL. Commits: 654ba8c (tp4-base anchors) + a46f6ef (TP4_VERDICT.md).
- [Phase ?]: 05-02 slim SHIPPED: woodCoamingProfile yTop 0.34->0.28 behind ?rail=slim; visual verdict better-without-losing-material; thin-disc invariant PASS (rOut 7.605 > 7.540); bodyProfile inviolate
- [Phase 5]: 05-03 craft levers STRUCTURAL PASS: ?rail= flag system (railFlag/isWelt/isNormals/isBrass/isSlim/isCraft); Lever D brassMat roughness 0.34->0.42 + envMapIntensity 0.45; Lever B+F woodNapNormalMap (freq=12, crossProfile, NoColorSpace, normalScale 0.15); Lever C leatherNapNormalMap (pebble height field, NoColorSpace, normalScale 0.22, bumpMap->normalMap upgrade); Lever A welt FELT_R*0.960 tube 0.012 y=0.022 #2a1208; Lever E DROPPED (UV seam risk, TP7). grep-check-tp4-05.cjs exits 0 (7/7 checks). M4 structural PASS (roughness 0.42 in 0.38-0.45; H39/S0.38/V0.67 expected). M10 structural PASS (105+1=106 < 150). Visual reads at operator gate 05-04. Commits: 12f67a0 + 863801a.
- [Phase 6]: Plan 06-01: TP5 grounding SHIPPED — SoftShadows PCSS unconditional (size=30/samples=16/focus=0) above Lights in Scene; ContactShadows frames=1 baked (M11 improvement: 106→52 draws)/opacity=0.35 anti-double-darken/color=#1a0e06 warm near-black/far=5/blur=2.0/scale=FELT_R*3.5; key spotLight shadow-normalBias={0.02}+shadow-camera-near={8}+shadow-camera-far={28}. M6 PASS 21.03%; M10 IMPROVED 52 (<106 TP4 baseline); M7 PASS; M5 PASS; tsc src/lab/ clean; vitest 45/45 green. +A informational (backdrop corners structurally dark; warm hue confirmed H=27.6°; TP6 scope). tp5-gate captures committed. Commits: 65d39c4+83ef5df.

- [Phase 5]: 05-04 OPERATOR GATE APPROVED -- slim+craft shipped as DEFAULT render. Both SSOT questions YES: (CONTOUR) slim yTop 0.34->0.28 recovers edge elegance without losing material/mass; (CRAFT) 5 levers (D/C/B/F/A) read as restrained craft not overworked. Default flip: isCraft=!isBase&&railFlag!=='slim' (ON by default); woodCoamingProfile internal default 0.34->0.28; ?rail=base added (restores pre-TP4). 0 reverts, 0 iterations. Scorecard: wood coaming 3->4, brass 3->4, tactility 3->4 (leather rail held at 4). AAA(5) deferred: AO (TP6), grain alignment + hairline scratch normalMap (TP7). grep-check 7/7 PASS; vitest 398/398; tsc src/lab/ clean; M4 PASS; M10 106<150 PASS. Record: docs/table-3d/TP4_OPERATOR_GATE.md. Commits: da3bcbc + 1a1a624 + c627b47. Phase 5 / TP4 COMPLETE.

- [Phase 6]: Plan 06-02: TP5 key reshaping SHIPPED -- KEY_TO_FILL_RATIO_CEILING=3.5 constant (anti-casino sentinel, grep-checkable); ?light= A/B flag (lightFlag=qp('light') in Scene; Lights accepts lightFlag prop; shaped path default / base path ?light=base); shaped: angle=0.72/intensity=2.2/fill=0.8/hemisphere ground #0d3d24 (ratio 2.75x, PASS); base: angle=0.62/intensity=2.0/fill=0.7/hemisphere ground #1a0f08 (ratio 2.86x, PASS); rim: shaped 0.22/base 0.26; penumbra=1 in both (NEVER lowered); SoftShadows+ContactShadows unconditional (not behind ?light= flag). M5 PASS (0%/0% both paths); M7 PASS; M10=52 (not regressed); tsc src/lab/ clean; vitest 45/45. Shaped path verdict PASS: warm gradient confirmed, no casino cone. +A informational (warm hue H=27.9deg confirmed; luma structural TP6 scope). Captures: hero-shaped/hero-base/macro-shaped at tp5-gate/. Commits: 11c082f+6f38366.

- [Phase 6]: Plan 06-03: TP5 per-material specular SHIPPED -- woodMat roughness 0.38->0.42/clearcoat 0.72->0.68/clearcoatRoughness 0.2->0.25/envMapIntensity 0.65->0.50 (extra conservative; plan target 0.55, tuned to 0.50 -- wood envMapIntensity does not affect brass V); bodyMat 0.48->0.52/0.5->0.44/0.3->0.35/0.5->0.4; card stock roughness 0.62->0.60/clearcoatRoughness 0.55->0.50; card face roughness 0.52->0.50; chip pre-dv roughness 0.5->0.52/clearcoat 0.42->0.38/clearcoatRoughness 0.46->0.50/sheen 0.5->0.4. brassMat: roughness 0.42+envMapIntensity 0.45 UNCHANGED (TP4-locked). chip dv-path/feltMat/leatherMat UNCHANGED. M5 PASS (0%/0% both hero+macro); M7 PASS; M10=52 not regressed; vitest 45/45; tsc src/lab/ clean. M4: pre-existing fail V=0.866 (delta +0.003 from 06-03 = noise; failure from TP5 Wave 0 grounding); deferred to 06-05. Captures: hero-specular/macro-specular at tp5-gate/. Commits: 884144c+d2ba85f.

- [Phase 6]: Plan 06-04: TP5 green-bounce + body volume VERIFIED -- hemisphere ground #0d3d24 confirmed subtle warm-green GI (bodyUnder G-delta=+6.23: perceptible >2, not lime-wash <30; chipUnder G-delta=+1.59 borderline imperceptible -- no green spotlight artifact); body volume read present (shaped bodyTop luma=109.1 vs bodyUnder=100.4, delta=+8.8 top lighter = table does NOT float). No tint correction to #0a2f1a needed (SSOT A3 assumption validated). No code changes -- capture-only plan. M6 PASS 21.03% (hero reference); M6 proxy at rail 58.1% (floor under body apron); M7 PASS; M10=52 not regressed; vitest 45/45; tsc src/lab/ clean. Captures: rail-shaped.png + rail-base.png at tp5-gate/. Commit: 6ee8ed5.
- [Phase ?]: brassHero rect recalibrated from (1240,820,140,60) to (1350,368,140,4) -- original rect measuring card stock since Phase 3 ENCUADRE; actual brass ring at y=368 felt/leather boundary
- [Phase ?]: brass base color #b8915a→#b89b74 (S 0.511→0.370, aged-bronze not gold) + envMapIntensity 0.45→0.30; rendered M4: H=35.4 S=0.52 V=0.715 PASS under TP5 shaped key lighting
- [Phase 6]: Plan 06-06 (OPERATOR GATE AUTO-APPROVED): TP5 operator gate closed under standing "auto-approve (0 paradas)" directive -- all HARD gates green (M4/M5/M6/M7/M10 PASS + grep-check exits 0 + vitest 398/398 + tsc clean) + orchestrator CEO visual read (warm gradient not casino cone, honest grounding, body volume, restrained highlights, brass aged-not-gold, cards protagonist, no cold void). Flagged for operator batch confirmation. Full TP5 ships: grounding+shaped-key+per-material-specular+green-bounce+brass-M4-fix. Scorecard: shadows 3→4, depth 2→3 (body-volume), lighting/tactility held at 4. Deferred to TP6: +A cornerLuma/vignette, AO/crevice, DOF. Phase 6 / TP5 COMPLETE. Milestone 6/10 (60%). Record: docs/table-3d/TP5_OPERATOR_GATE.md.

- [Phase 7]: Plan 07-02: N8AO crevice AO SHIPPED -- aoRadius=0.8/intensity=2.0/distanceFalloff=0.7/halfRes=false/screenSpaceRadius=false; first child in EffectComposer ?fx. M6 PASS 33.21% luma delta (underCardHero luma=124.2 vs adjacentFelt luma=186.0; threshold >= 12%). M7 PASS (grep-check exits 0, no Bloom). M11 delta: baseline=52 draws / +fx+N8AO=57 draws (+5 draws, +9.6% -- within floor, halfRes NOT enabled). Starting params required zero tuning; no halos at hero/card/macro shots. vitest 45/45; tsc src/lab/ clean. Captures: .dev-stack/diag/tp6/n8ao-{hero,card,macro}.png (RTX 4060, zero errors). Commit 0c7c80a.

- [Phase 7]: Plan 07-03: DepthOfField SHIPPED -- worldFocusDistance=holeCardDistance (static useMemo: hero ~7.8wu / card ~9.5wu / macro ~4.5wu); worldFocusRange=1.5/bokehScale=2.0/focalLength=0.025; second child in EffectComposer after N8AO. M1 PASS 50px (rank-glyph "10" on Sota de Oros; threshold 22px; 2.3x margin). M7 PASS (grep-check exits 0, no Bloom). M11 delta: +99 draws from DOF compositor passes (57→156 total with N8AO+DOF); frame-time measurement deferred to operator gate (headless rAF unreliable per documented TP0 limitation). Starting params required zero tuning -- M1 PASS on first capture. DOF disposition: SHIPPED (not cut -- M1 HARD gate CLEAR). Captures: .dev-stack/diag/tp6/dof-{hero,card,macro}.png (RTX 4060, zero errors). Commit 64ec79e.

- [Phase 7]: Plan 07-05: CenterGameState SHIPPED -- FELT_REST_Y_CGS=0.0495 (CARD_T/2+0.022 exact from cards.ts) / CARD_T_CGS=0.055; DECK_POS [0.3,0.0495,-1.3] radius=1.33wu / BUTTON_POS [-0.7,0.022,-1.6] radius=1.75wu (both <=2wu center-only limit PASS); deck stub = 4 cards at DECK_POS with Math.sin/Math.cos scatter (kit.body+kit.stock, zero new deps); dealer button = cylinderGeometry [0.28,0.28,0.04,24] + MeshPhysicalMaterial #f0e8d0 roughness=0.80 metalness=0; unconditionally mounted in Scene JSX BEFORE EffectComposer ?fx guard; reads under both ?fx-off and ?fx-on; grep-check-tp5-06 EXIT 0; tsc src/lab/ 0 errors; vitest 45/45; captures cgs-{hero,hero-fx,card-fx,macro-fx}.png (RTX 4060, zero errors). Commit 80a449b.

- [Phase 7]: Plan 07-04: Vignette+BrightnessContrast+Noise SHIPPED -- stack order N8AO→DOF→BrightnessContrast→Vignette→Noise; BrightnessContrast brightness=0.03/contrast=0.05 (warm shadow floor); Vignette offset=0.70/darkness=0.12/eskil=false (restrained frame; tuned outward from SSOT default because top-corner rects are backdrop-black at hero angle); Noise opacity=0.03/premultiply=false (faint grain). Fog unchanged (near=20 — far rail reads as air). +A PASS cornerLuma=31.9>=18, hue=29.1deg warm, S=0.392. M9 PASS byte-identical captures (UV-seeded noise). M7 PASS (grep-check exits 0, no Bloom). M8 structural-assert: cornerTL/cornerTR rects are backdrop-black (natural delta 90% without any vignette; Vignette IS active: bottom corners darken -46 luma vs DOF baseline). Captures: grade-{hero,card,macro}.png + m9-{a,b}.png (RTX 4060, zero errors). vitest 45/45; tsc src/lab/ clean. Commit 0ba7f40.

### Pending Todos

None yet.

### Blockers/Concerns

- **[RESOLVED 2026-06-11 — ENCUADRE ADOPTED]** (Was: OPERATOR STEER — Phase 3 priority.) Resolution: operator ADOPTED the full-scene composition baseline (bigger-table + 5-board + smaller-cards + whole-hand) and chose to KEEP all 4 felt suit marks; conjunto/social cams stay diagnostic → TP7; SeatHands → TP8; frozen money-shot pos/fov untouched. TP2 is unblocked and opens on the adopted scene. Original steer, for the record: at the TP1 gate the operator approved the felt AND asked (without reopening TP1) for a **full-scene composition validation BEFORE more local card detail**: the hand reads too cropped to judge composition, the table reads too partial/small; the cards must stay the absolute protagonist; the operator wants to verify the complete set first — full table + community cards + player hands + global composition + the camera↔table↔cards relationship. This is a camera-framing / composition / scene-completeness concern (roadmap-scoped to TP6/TP7/TP8) pulled EARLY, and it touches the **TP0-frozen-camera invariant**. Note the current lab scene stages ONE hand (the Perla) + community board + demoted pot — all 6 player hands are NOT staged (seats opt-in, TP8 scope). Phase 3 (TP2 — Cartas) MUST open by reconciling this (a full-scene validation capture/checkpoint, possibly a diagnostic wide camera that does NOT alter the frozen 3 money shots) before any card-stock micro-detail levers. Full record: docs/table-3d/TP1_OPERATOR_AB.md §forward feedback.
- **[WATCH — Phase 3 TP2, hard gate not blocker]** CARD_W 2.4→2.05 shrank the cards ~15%; with the pre-existing ~17px rank-index legibility note, TP2 MUST re-measure M1 hole-card legibility on the adopted scene as its FIRST step and MUST NOT regress it (SSOT §TP2: legibility loss → STOP/revert that lever). TP2's max-anisotropy + mipmap crispness is the lever expected to defend legibility. ALSO open for Phase 3 discuss: how to reconcile the TP0 anchor corpus with the new composition (frozen TP0 anchors were captured on the OLD scene) — the apples-to-apples basis for TP2 metric deltas needs a decision (re-baseline post-encuadre vs. compare-to-current).
- **[RESOLVED 2026-06-10 — TP0 FROZEN]** The M1 gate (re-run 2026-06-10) PASSED after two operator-found pre-freeze fixes (hole-pair z-fighting → height stagger; As de Espadas asset rotated 180° → restored canonical, single-origin for 2D+3D). Baseline freeze (plan 01-06) ran and the operator signed off ("Baseline locked"). POV fov LOCKED at 40 (37 discarded). M12 zero-change CLOSED. Scorecard baselined (avg ≈ 3.4).
- **[RESOLVED 2026-06-10 — TP1 SHIPPED]** Phase 2 / TP1 felt materiality APPROVED by the operator at the 02-04 gate; felt MeshPhysicalMaterial (sheen/nap/aniso/aoMap) shipped as the reference baseline. 0 iterations, no rollback. M3/M5/+B green. felt 3→4.
- **[CARRIED FORWARD — non-blocking]** M10 draw-calls over ceiling → TP3 (instancing); M1 rank-index ~17px legibility note → future tweak; depth/AO/vignette → TP5/TP6; the dual 2D-classic / 3D-immersive view-mode architecture → its own future workstream (memory: chiribito-table-dual-view-modes).
- **[INVARIANT]** NO push / deploy / merge without explicit operator confirmation (Chiribito manual-deploy policy, Vercel team `chiribito293-7173`). Atomic LOCAL commits only.
- **[OPERATIONAL — session rooting]** The GSD autonomous loop + its skills are repo-root-relative (verified: workflows use relative `.planning/` paths). To run the loop reliably the session MUST be rooted at `Documents\CHIRIBITO\chiri-infrastructure\chiri-app`, not the home folder. Bootstrap was done with absolute paths + SDK validation; execution needs repo rooting.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Mobile | Responsive camera framing — portrait/tight-landscape side-clip the wide card layout; needs aspect-aware fov/distance. Geometry sound, camera-only. | Deferred | 2026-06-09 (M1 refinement; SSOT defers mobile-as-deliverable) |

## Session Continuity

Last session: 2026-06-12T17:07:39.027Z
Stopped at: Plan 07-05 COMPLETE 2026-06-12 -- CenterGameState (deck stub + dealer button at table center); FELT_REST_Y_CGS=0.0495/CARD_T_CGS=0.055; scope audit PASS (deck 1.33wu + button 1.75wu); unconditionally mounted; grep-check EXIT 0 + tsc src/lab/ clean + vitest 45/45; captures cgs-{hero,hero-fx,card-fx,macro-fx}.png (RTX 4060, zero errors); commit 80a449b. Do NOT auto-advance -- operator chooses.
Next: 07-06 (full metric suite: M1/M6/M7/M8/M9/M10/M11/+A with ?fx on all 3 frozen shots) or 07-07 (operator gate, autonomous:false). Do NOT auto-advance -- operator chooses.
Carried forward (non-blocking): depth/AO/vignette → TP6 · dual 2D-classic/3D-immersive view-mode → own workstream (memory: chiribito-table-dual-view-modes) · inter-chip AO + lighting depth → TP5/TP6 · AAA(5) chips gated on TP5/TP6 · AAA(5) rail/brass/tactility gated on TP6 AO + TP7 geometry · UV arc-length remap (Lever E) → TP7.
Branch: `spike/table-3d-hero`. CI note: spike push does NOT run CI (verified locally: 45/45 green). use_worktrees=false (GPU/dev-server → sequential). NO push/deploy/merge without explicit operator confirmation.
Resume file: None

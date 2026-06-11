/**
 * Chiribito · Mesa Lab — 3D table hero spike (React Three Fiber).
 *
 * Purpose: validate whether a real 3D scene (real geometry + PBR materials + ONE
 * coherent warm light + real reflections) clears the "this is no longer a prototype"
 * bar — before committing to the full table rebuild.
 *
 * Isolated: served only on /table-lab.html. Touches nothing in the game.
 *
 * Direction: "El objeto Chiribito" — material-forward, castizo, anti-casino.
 * Clay chips with worked edges, varnished wood rail, recessed baize, the mark
 * inlaid into the felt (born inside the table, not pasted on top).
 */
import { useMemo, Suspense } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { StatsProbe } from "./StatsProbe";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

import {
  CHIP_SUITS,
  type SuitCode,
  CHIP_PALETTES,
  chipFaceTexture,
  chipFaceBump,
  chipEdgeTexture,
  feltTexture,
  feltNapNormalMap,
  feltEdgeAoMap,
  cardMicroReliefNormalMap,
  woodTexture,
  leatherTexture,
  leatherBump,
  floorTexture,
  backdropTexture,
} from "./textures";
import { TableVariant } from "./TableVariant";
import type { Silhouette } from "./silhouettes";
import {
  CARD_FACE_Z,
  cardBodyGeometry,
  cardFaceGeometry,
  communityLayout,
  holeLayout,
  labCardFaceUrl,
  type CardPose,
} from "./cards";

// --- proportions (chip radius = 1 world unit) ---
const R = 1;
const H = 0.1; // chip thickness — thin, so a stack reads as many crisp layers
const BEVEL = 0.03;
const FELT_R = 6.5; // ENCUADRE diag: bigger table — more felt around the cards + the 6 occupants spread apart
const OVAL_X = 1.22; // table stretched on X into an oval (chips stay un-stretched)

// --- M1 staged hand — real Fournier faces. The player holds the Perla de Oros (Sota + 7
// of Oros, the strongest hole pair); three community cards sit on the board. ---
const LAB_COMMUNITY = ["1E", "12C", "11B", "5C", "7E"]; // ENCUADRE diag: full 5-card board (As Espadas · Rey Copas · Caballo Bastos · 5 Copas · 7 Espadas)
const LAB_HOLE = ["10O", "7O"]; // La Perla de Oros — Sota + 7 de Oros
const LAB_HAND_IDS = [...LAB_COMMUNITY, ...LAB_HOLE];

/** read a query param — debug toggles for isolating issues in the lab */
function qp(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** Lathe cross-section for one chip: flat faces with rounded, worked outer edges. */
function chipProfile(steps = 6): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const hy = H / 2;
  pts.push(new THREE.Vector2(0, -hy));
  pts.push(new THREE.Vector2(R - BEVEL, -hy));
  for (let i = 0; i <= steps; i++) {
    const t = -Math.PI / 2 + (Math.PI / 2) * (i / steps);
    pts.push(new THREE.Vector2(R - BEVEL + BEVEL * Math.cos(t), -hy + BEVEL + BEVEL * Math.sin(t)));
  }
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI / 2) * (i / steps);
    pts.push(new THREE.Vector2(R - BEVEL + BEVEL * Math.cos(t), hy - BEVEL + BEVEL * Math.sin(t)));
  }
  pts.push(new THREE.Vector2(0, hy));
  return pts;
}

// A real card-table rail is TWO parts: an inner padded leather bumper (the cushioned roll
// you rest your arms on) framed by an outer turned-wood coaming. Two revolved cross-sections.

/**
 * Cross-section of the padded leather armrest bumper — a broken-in, COMPRESSED roll:
 * a tight crease at the inner edge (the dark valley), a broad, gently flattened crown
 * (the part arms press — restable, not a taut showroom tube), tucking down to the wood
 * outside. The comfort reads from the shape; gloss is not what sells it.
 */
function leatherProfile(): THREE.Vector2[] {
  const rIn = FELT_R * 0.962; // ~5.0, meets the brass reveal at the felt edge
  const rOut = FELT_R * 1.072; // ~5.57, meets the wood coaming
  const span = rOut - rIn;
  const p = (t: number, y: number) => new THREE.Vector2(rIn + span * t, y);
  return [
    new THREE.Vector2(rIn, 0.0),
    p(0.03, 0.07), // tight inner wall → a real crease/valley at the base
    p(0.09, 0.24),
    p(0.17, 0.4),
    p(0.26, 0.49), // inner shoulder — the saddle-stitch seam sits here
    p(0.37, 0.545),
    p(0.49, 0.565),
    p(0.6, 0.56), // broad, slightly flattened crown — compressed by use
    p(0.71, 0.535),
    p(0.81, 0.46), // outer shoulder
    p(0.9, 0.3),
    p(0.97, 0.12),
    new THREE.Vector2(rOut, 0.0),
    new THREE.Vector2(rIn, 0.0), // close the section
  ];
}

/** Cross-section of the outer turned-wood coaming that frames the leather. */
function woodCoamingProfile(): THREE.Vector2[] {
  const rIn = FELT_R * 1.072; // meets the leather outer
  const rOut = FELT_R * 1.17; // ~6.08
  const yTop = 0.34; // sits below the leather peak so the cushion reads proud
  const yBot = -0.12;
  const b = 0.08;
  const v = (x: number, y: number) => new THREE.Vector2(x, y);
  const pts: THREE.Vector2[] = [v(rIn, yBot), v(rIn, yTop - b)];
  for (let i = 0; i <= 6; i++) {
    const t = Math.PI - (Math.PI / 2) * (i / 6);
    pts.push(v(rIn + b + b * Math.cos(t), yTop - b + b * Math.sin(t)));
  }
  for (let i = 0; i <= 6; i++) {
    const t = (Math.PI / 2) * (1 - i / 6);
    pts.push(v(rOut - b + b * Math.cos(t), yTop - b + b * Math.sin(t)));
  }
  pts.push(v(rOut, yBot));
  return pts;
}

/**
 * Cross-section of the table BODY — a molded wood apron + plinth foot, so the table reads
 * as a real piece of furniture with mass UNDER the rail, not a thin disc floating in a void.
 * The rail's wood lip overhangs the fascia slightly (a shadow reveal); a stepped molding,
 * a tapered apron, then a plinth foot resting on the floor. Revolved + scaled into the oval.
 */
function bodyProfile(): THREE.Vector2[] {
  const fascia = FELT_R * 1.14; // ~5.93, sits just inside the rail's outer lip
  const stepIn = FELT_R * 1.1; // the molding reveal under the rail
  const waist = FELT_R * 1.085; // the apron tapers gently to its waist
  const plinth = FELT_R * 1.135; // flares back out into a plinth foot
  const v = (x: number, y: number) => new THREE.Vector2(x, y);
  return [
    v(fascia, -0.12), // top, tucked under the rail lip
    v(fascia, -0.36), // upper fascia
    v(stepIn, -0.44), // step in — a reveal/shadow line (structural, not decoration)
    v(stepIn, -0.54),
    v(waist, -1.05), // the apron body, gently tapered
    v(plinth, -1.2), // flare into the plinth
    v(plinth, -1.44), // plinth fascia (the foot)
    v(plinth - 0.16, -1.5), // chamfer onto the floor
  ];
}

interface ChipKit {
  body: THREE.LatheGeometry;
  face: THREE.PlaneGeometry;
  mats: Record<string, { body: THREE.Material; face: THREE.Material }>;
}

function useChipKit(cImg: HTMLImageElement | null): ChipKit {
  return useMemo(() => {
    const body = new THREE.LatheGeometry(chipProfile(), 72);
    // PlaneGeometry (uniform UVs), NOT CircleGeometry — a circle's triangle-fan UVs
    // moiré the radial C texture into a sunburst. The face texture is already circular
    // (transparent corners), so alphaTest crops it to a disc.
    const face = new THREE.PlaneGeometry(R * 1.72, R * 1.72);
    const mats: ChipKit["mats"] = {};
    for (const suit of CHIP_SUITS) {
      const p = CHIP_PALETTES[suit];
      // the rolled clay edge carries its shading + cream inserts in the texture, so the
      // tint is white (the map IS the colour); double-darkening would muddy it.
      const edge = chipEdgeTexture(suit);
      edge.repeat.set(1, 1);
      const bodyMat = new THREE.MeshPhysicalMaterial({
        map: edge,
        color: new THREE.Color("#ffffff"),
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.42,
        clearcoatRoughness: 0.46,
        sheen: 0.5,
        sheenColor: new THREE.Color(p.faceLit),
      });
      const faceMat = new THREE.MeshPhysicalMaterial({
        map: chipFaceTexture(suit, cImg),
        // the C + rim are tooled into the clay (recessed) — a real edge of light, not a print
        bumpMap: chipFaceBump(cImg),
        bumpScale: 0.025,
        roughness: 0.46,
        metalness: 0,
        clearcoat: 0.32,
        clearcoatRoughness: 0.36,
        alphaTest: 0.5,
      });
      mats[suit] = { body: bodyMat, face: faceMat };
    }
    return { body, face, mats };
  }, [cImg]);
}

function Chip({
  kit,
  denom,
  position,
  rotationY = 0,
}: {
  kit: ChipKit;
  denom: SuitCode;
  position: [number, number, number];
  rotationY?: number;
}) {
  const m = kit.mats[denom];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={kit.body} material={m.body} castShadow receiveShadow />
      <mesh
        geometry={kit.face}
        material={m.face}
        position={[0, H / 2 + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
      />
      <mesh
        geometry={kit.face}
        material={m.face}
        position={[0, -H / 2 - 0.002, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

function ChipStack({
  kit,
  denom,
  count,
  position,
}: {
  kit: ChipKit;
  denom: SuitCode;
  count: number;
  position: [number, number, number];
}) {
  const chips = [];
  for (let i = 0; i < count; i++) {
    // hand-stacked: tiny per-chip jitter so it is never a perfect machined cylinder
    const jx = Math.sin(i * 2.3) * 0.012;
    const jz = Math.cos(i * 1.7) * 0.012;
    chips.push(
      <Chip
        key={i}
        kit={kit}
        denom={denom}
        position={[position[0] + jx, position[1] + i * H, position[2] + jz]}
        rotationY={i * 0.55}
      />,
    );
  }
  return <group>{chips}</group>;
}

// --- M1: the cards — the absolute protagonist ---------------------------------------
// Real Fournier faces on warm card stock with rounded corners + a real beveled edge, so a
// card reads as a physical object (catches rim light, casts a contact shadow). Mirrors the
// chip-kit pattern: shared body + face geometry, a shared stock material, per-card face map.

interface CardKit {
  body: THREE.ExtrudeGeometry;
  face: THREE.ShapeGeometry;
  stock: THREE.Material;
}

function useCardKit(): CardKit {
  // TP2 Lever 3: create the card-stock micro-relief normal map ONCE here (shared by
  // reference across all card body meshes — Pitfall 5: never create per-Card).
  // ?card=base → pre-TP2 baseline (no normal map); any other value → lever 3 active.
  const cardFlag = qp("card");
  const normalMap = useMemo(
    () => (cardFlag === "base" ? null : cardMicroReliefNormalMap()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // TP2 Lever 4: clearcoat whisper — lower from 0.16 (pre-TP2) to 0.12 (restraint-first).
  // clearcoatRoughness 0.55 reduces plastic-read risk vs 0.5 (Pitfall 7 — stay coated-not-laminated).
  // ?card=base keeps pre-TP2 clearcoat 0.16 / clearcoatRoughness 0.5 for A/B comparison.
  // Cap HARD at 0.18 (operator STOP above); never exceed without explicit gate approval.
  const clearcoat = cardFlag === "base" ? 0.16 : 0.12; // TP2 Lever 4 — restraint-first
  const clearcoatRoughness = cardFlag === "base" ? 0.5 : 0.55; // TP2 Lever 4
  // TP2 Lever 5: paper-edge warm sheen-rim — reuse the sheen lobe only (NO new texture,
  // sheen-only approach, NOT a glass/resin material — SSOT-locked). The beveled card rim
  // catches a warm wheat glow under the key light → reads as printed-stock paper edge, not casino neon.
  // Stay restrained: sheen 0.35 is barely perceptible; sheenColor warm wheat #f5deb5.
  // sheenRoughness 0.6 = soft diffuse rim (matches leather/warm convention → no hard ring).
  // STOP criterion: if the rim reads as a glowing border → lower sheen or revert (non-blocking).
  // ?card=base → pre-TP2 sheen 0.22 / #fff6e0 (no sheenRoughness change) for A/B comparison.
  const sheen = cardFlag === "base" ? 0.22 : 0.35; // TP2 Lever 5
  const sheenColor = cardFlag === "base" ? new THREE.Color("#fff6e0") : new THREE.Color("#f5deb5"); // TP2 Lever 5
  const sheenRoughness = cardFlag === "base" ? undefined : 0.6; // TP2 Lever 5: soft warm rim

  return useMemo(() => {
    const stock = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f1e7cf"), // warm ivory card stock
      roughness: 0.62,
      metalness: 0,
      clearcoat, // TP2 Lever 4: 0.12 (was 0.16); ?card=base → 0.16 A/B baseline
      clearcoatRoughness, // TP2 Lever 4: 0.55 (was 0.5); ?card=base → 0.5 A/B baseline
      sheen, // TP2 Lever 5: 0.35 (was 0.22); ?card=base → 0.22 A/B baseline
      sheenColor, // TP2 Lever 5: warm wheat #f5deb5 (was #fff6e0); ?card=base → #fff6e0
      ...(sheenRoughness !== undefined ? { sheenRoughness } : {}), // TP2 Lever 5: 0.6 soft rim
      // TP2 Lever 3: faint card-stock micro-relief (linen/emboss grain) on the body.
      // normalScale ~0.12 = "faint" (CONTEXT — restraint-first; face stays crisp).
      // NOT applied to the per-card faceMat so the printed Fournier face reads clean.
      ...(normalMap
        ? { normalMap, normalScale: new THREE.Vector2(0.12, 0.12) }
        : {}),
    });
    return { body: cardBodyGeometry(), face: cardFaceGeometry(), stock };
  }, [normalMap, clearcoat, clearcoatRoughness, sheen, sheenColor, sheenRoughness]);
}

/** Load the real Fournier faces for a set of card ids → { id: texture } (sRGB, crisp).
 * maxAniso: Math.min(gl.capabilities.getMaxAnisotropy(), 16) from Scene via useThree.
 * ?card=base → pre-TP2 baseline (anisotropy 8); any other value (incl. no param) → maxAniso.
 */
function useCardFaces(ids: string[], maxAniso: number): Record<string, THREE.Texture> {
  const texs = useLoader(THREE.TextureLoader, ids.map(labCardFaceUrl)) as THREE.Texture[];
  // ?card=base → keep pre-TP2 anisotropy 8 for A/B comparison; otherwise use GPU-capped max.
  const cardFlag = qp("card");
  const aniso = cardFlag === "base" ? 8 : maxAniso;
  return useMemo(() => {
    const map: Record<string, THREE.Texture> = {};
    ids.forEach((id, i) => {
      const t = texs[i];
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = aniso; // TP2 Lever 1: GPU-capped max (cap 16) except on ?card=base
      t.minFilter = THREE.LinearMipmapLinearFilter; // explicit mipmap chain (default, assertion-visible)
      t.generateMipmaps = true; // explicit (default in three 0.169 — making intent clear)
      t.needsUpdate = true;
      map[id] = t;
    });
    return map;
  }, [ids, texs, aniso]);
}

function Card({ kit, faceTex, pose }: { kit: CardKit; faceTex: THREE.Texture; pose: CardPose }) {
  // TP2 Lever 4: align faceMat clearcoat to 0.12 (was 0.1) for consistency with stock body.
  // ?card=base → 0.1 (pre-TP2); any other value → 0.12 whisper coat, coated-not-plastic.
  const faceClearcoat = qp("card") === "base" ? 0.1 : 0.12;
  const faceMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: faceTex,
        roughness: 0.52,
        metalness: 0,
        clearcoat: faceClearcoat, // TP2 Lever 4: 0.12 (was 0.1); ?card=base → 0.1 A/B baseline
        clearcoatRoughness: 0.55, // unchanged — already at the target
        side: THREE.DoubleSide, // never cull the face — the card is read from either side
      }),
    [faceTex, faceClearcoat],
  );
  return (
    <group position={pose.position} rotation={pose.rotation}>
      <mesh geometry={kit.body} material={kit.stock} castShadow receiveShadow />
      <mesh geometry={kit.face} material={faceMat} position={[0, 0, CARD_FACE_Z]} castShadow />
    </group>
  );
}

function CardGroup({
  kit,
  faces,
  poses,
}: {
  kit: CardKit;
  faces: Record<string, THREE.Texture>;
  poses: CardPose[];
}) {
  return (
    <group>
      {poses.map((pose, i) => (
        <Card key={i} kit={kit} faceTex={faces[pose.id]} pose={pose} />
      ))}
    </group>
  );
}

function Table({
  logoImg,
  aceImgs,
}: {
  logoImg: HTMLImageElement | null;
  aceImgs: Partial<Record<SuitCode, HTMLImageElement | null>>;
}) {
  const { felt, leatherMat, woodMat, brassMat, bodyMat, leatherPoints, woodPoints, bodyPoints } = useMemo(() => {
    const feltKind = qp("felt");
    const feltMat =
      feltKind === "magenta"
        ? new THREE.MeshBasicMaterial({ color: 0xff00ff })
        : feltKind === "basic"
          ? new THREE.MeshBasicMaterial({ map: feltTexture(logoImg, aceImgs), alphaTest: 0.5 })
          : new THREE.MeshPhysicalMaterial({
              map: feltTexture(logoImg, aceImgs),
              normalMap: feltNapNormalMap(),
              normalScale: new THREE.Vector2(0.25, 0.25),
              aoMap: feltEdgeAoMap(),
              aoMapIntensity: 0.18,
              sheen: 0.70,
              sheenColor: new THREE.Color("#2aad7a"),
              sheenRoughness: 0.65,
              anisotropy: 0.25,
              anisotropyRotation: 0,
              roughness: 0.93,
              metalness: 0,
              envMapIntensity: 0.3,
              alphaTest: 0.5,
            });
    const wood = woodTexture();
    wood.repeat.set(13, 1);
    const woodMat = new THREE.MeshPhysicalMaterial({
      map: wood,
      color: new THREE.Color("#ffffff"), // tone is baked in the texture
      roughness: 0.38,
      metalness: 0,
      clearcoat: 0.72, // varnish — a real polished highlight runs along the rail
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.65,
      side: THREE.DoubleSide,
    });
    const leatherMat = new THREE.MeshPhysicalMaterial({
      map: leatherTexture(),
      bumpMap: leatherBump(),
      bumpScale: 0.016,
      color: new THREE.Color("#ffffff"), // cordobán tone is baked in the texture
      roughness: 0.64, // matter — a broken-in, much-touched roll, not showroom gloss
      metalness: 0,
      sheen: 0.4, // a whisper of waxed sheen, no more (richness is not the point)
      sheenColor: new THREE.Color("#b08a64"),
      sheenRoughness: 0.6,
      clearcoat: 0.08,
      clearcoatRoughness: 0.7,
      side: THREE.DoubleSide,
    });
    const leatherPoints = leatherProfile();
    const woodPoints = woodCoamingProfile();
    const brassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b8915a"),
      metalness: 1,
      roughness: 0.34,
    });
    // the body is the same mahogany as the rail, scaled for the larger apron surface,
    // a touch matter (it sits in shadow below the lit rail)
    const bodyWood = woodTexture();
    bodyWood.repeat.set(24, 4);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      map: bodyWood,
      color: new THREE.Color("#ffffff"),
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.5,
      side: THREE.DoubleSide,
    });
    const bodyPoints = bodyProfile();
    return { felt: feltMat, leatherMat, woodMat, brassMat, bodyMat, leatherPoints, woodPoints, bodyPoints };
  }, [logoImg, aceImgs]);

  return (
    <group scale={[OVAL_X, 1, 1]}>
      {/* recessed baize */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[FELT_R * 2, FELT_R * 2, 1, 1]} />
        <primitive object={felt} attach="material" />
      </mesh>

      {/* brass reveal where the felt meets the leather */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <torusGeometry args={[FELT_R * 0.957, 0.02, 16, 180]} />
        <primitive object={brassMat} attach="material" />
      </mesh>

      {/* padded leather armrest bumper — the cushioned inner roll */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[leatherPoints, 220]} />
        <primitive object={leatherMat} attach="material" />
      </mesh>

      {/* outer turned-wood coaming framing the leather */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[woodPoints, 220]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* the table BODY — a molded wood apron + plinth foot: a piece of furniture with
         real mass under the rail, not a thin disc floating in a void. */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[bodyPoints, 96]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
    </group>
  );
}

// --- seating: the FIRST appearance of human presence around the oval ---
// Not "a chair" — soft masses that read as people gathered: backs rising above the rail,
// hugging the table, evenly spaced. A massing/presence study; detail + material come later.
const SEAT_COUNT = 6;

interface SeatPose {
  x: number;
  z: number;
  rot: number;
  lean: number;
  tilt: number;
  scale: number;
}

function seatLayout(): SeatPose[] {
  const ax = FELT_R * 1.17 * OVAL_X + 0.2; // hug the rail close — the presence accompanies it
  const az = FELT_R * 1.17 + 0.2;
  const out: SeatPose[] = [];
  for (let i = 0; i < SEAT_COUNT; i++) {
    const a = (i / SEAT_COUNT) * Math.PI * 2 + Math.PI / SEAT_COUNT; // offset: none dead-centre
    const wob = Math.sin(i * 2.3) * 0.05; // a little human irregularity, not a robotic ring
    const x = Math.cos(a) * ax * (1 + wob);
    const z = Math.sin(a) * az * (1 + wob);
    out.push({
      x,
      z,
      rot: Math.atan2(x, z) + Math.sin(i * 1.7) * 0.09, // each turned a touch differently
      lean: 0.2 + Math.sin(i * 3.1) * 0.06, // leaning INTO the game (engaged hunch)
      tilt: Math.sin(i * 5.3) * 0.08, // a slight side-lean — nobody sits perfectly square
      scale: 0.93 + Math.sin(i * 1.9) * 0.1, // different builds, not identical clones
    });
  }
  return out;
}

// The suggestion of a back + shoulders — NOT a person, NOT a chair. Narrow at the base,
// widening to a soft shoulder line, rounding to a headless top. Revolved, then flattened
// front-to-back so it reads as a torso, and leaned into the table. The aim: "people playing",
// not "six pretty chairs".
function occupantProfile(): THREE.Vector2[] {
  const v = (r: number, y: number) => new THREE.Vector2(r, y);
  return [
    v(0.0, 0.0),
    v(0.56, 0.04),
    v(0.72, 0.42),
    v(0.95, 0.84),
    v(1.12, 1.2), // shoulders — wider + higher, a clear shoulder line
    v(1.0, 1.46),
    v(0.6, 1.68), // upper back / nape rounding in (no head)
    v(0.0, 1.8),
  ];
}

function Occupant({ pose, geo, mat }: { pose: SeatPose; geo: THREE.BufferGeometry; mat: THREE.Material }) {
  return (
    <group position={[pose.x, -0.05, pose.z]} rotation={[0, pose.rot, 0]}>
      {/* lean into the table + a slight side-lean; flattened front-to-back = a torso, not a column */}
      <group rotation={[-pose.lean, 0, pose.tilt]}>
        <mesh
          geometry={geo}
          material={mat}
          scale={[1.12 * pose.scale, pose.scale, 0.6 * pose.scale]}
          castShadow
          receiveShadow
        />
      </group>
    </group>
  );
}

function Seats() {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#47262a"), roughness: 0.9, metalness: 0 }),
    [],
  );
  const geo = useMemo(() => new THREE.LatheGeometry(occupantProfile(), 40), []);
  const seats = useMemo(seatLayout, []);
  return (
    <group>
      {seats.map((s, i) => (
        <Occupant key={i} pose={s} geo={geo} mat={mat} />
      ))}
    </group>
  );
}

// Face-down opponent hands at the seats — a ROUGH multi-hand social-staging preview.
// Opt-in (rendered only with ?seats=on), reversible, isolated: just the card STOCK body laid flat
// (no face mesh, no opponent textures) = a believable face-down back. Never alters the default
// scene or the frozen money shots.
function SeatHands({ kit }: { kit: CardKit }) {
  const seats = useMemo(seatLayout, []);
  return (
    <group>
      {seats.map((s, i) => {
        if (i === 1) return null; // skip the protagonist's front seat — the Perla lives there
        const hx = s.x * 0.7; // sit near the rail, in front of the occupant (not crowding the board)
        const hz = s.z * 0.72;
        const yaw = Math.atan2(s.x, s.z); // turn the pair to face its occupant
        // scale < 1 keeps opponent hands subordinate to the protagonist Perla (visual hierarchy)
        return (
          <group key={i} position={[hx, 0.04, hz]} rotation={[0, yaw, 0]} scale={0.62}>
            {[-0.78, 0.78].map((dx, j) => (
              <mesh
                key={j}
                geometry={kit.body}
                material={kit.stock}
                position={[dx, 0, 0]}
                rotation={[-Math.PI / 2, 0, j === 0 ? 0.16 : -0.16]}
                castShadow
                receiveShadow
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Lights() {
  return (
    <>
      {/* warm room bounce — a lit tavern, not a black void with one casino spotlight.
         Generous fill is what kills the harsh radial light-shafts between the stacks. */}
      <ambientLight intensity={0.32} color="#ffdfb0" />
      <hemisphereLight args={["#fff1d8", "#1a0f08", 0.45]} />
      {/* THE warm overhead key — the tavern lamp. High + broad + soft so it pools
         gently over the whole table instead of stabbing rays past the chips. */}
      <spotLight
        position={[1.2, 15, 2]}
        angle={0.62}
        penumbra={1}
        intensity={2.0}
        decay={0}
        color="#fff1d6"
        castShadow={qp("sh") !== "off"}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-radius={8}
      />
      {/* soft warm fill from the opposite side */}
      <spotLight position={[-7, 6, -1]} angle={0.8} penumbra={1} intensity={0.7} decay={0} color="#ffd9a0" />
      {/* gentle back rim for separation against the dark room (lightly cool, low) */}
      <directionalLight position={[-3, 4, -7]} intensity={0.26} color="#bcc6dc" />
      {/* low warm wash raking the table BODY — reveals the apron + plinth so the
         furniture reads as mass (a warm floor bounce, never a casino uplight) */}
      <pointLight position={[0, -0.25, 11]} intensity={0.5} distance={34} decay={0} color="#ffcd95" />
    </>
  );
}

type CamPreset = { pos: [number, number, number]; target: [number, number, number]; fov: number };

function Scene() {
  // Load the LITERAL official assets: the medallion logo (felt centre) and the
  // green-C favicon (chip heart). Suspense (in TableLab) covers the brief load.
  const [logoTex, cTex, oTex, cuTex, eTex, bTex] = useLoader(THREE.TextureLoader, [
    "/brand/logo-circular.png",
    "/brand/chiri-c.png",
    "/brand/suits/oros.png",
    "/brand/suits/copas.png",
    "/brand/suits/espada.png",
    "/brand/suits/bastos.png",
  ]);
  const logoImg = (logoTex.image as HTMLImageElement) ?? null;
  const aceImgs = useMemo<Partial<Record<SuitCode, HTMLImageElement | null>>>(
    () =>
      qp("marks") === "off"
        ? {} // ENCUADRE diag: hide the felt suit-emblem decals for a clean composition read (felt material untouched)
        : {
            O: (oTex.image as HTMLImageElement) ?? null,
            C: (cuTex.image as HTMLImageElement) ?? null,
            E: (eTex.image as HTMLImageElement) ?? null,
            B: (bTex.image as HTMLImageElement) ?? null,
          },
    [oTex, cuTex, eTex, bTex],
  );
  // ?c=literal → the literal 48px favicon (soft). Default → faithful HD rebuild (crisp).
  const cImg = qp("c") === "literal" ? ((cTex.image as HTMLImageElement) ?? null) : null;
  const chipKit = useChipKit(cImg);

  // TP2 Lever 1: read renderer capabilities inside Scene (where gl is mounted and valid).
  // gl.capabilities is only safe to call in a mounted R3F component — never outside Canvas.
  const gl = useThree((s) => s.gl);
  const maxAniso = useMemo(() => Math.min(gl.capabilities.getMaxAnisotropy(), 16), [gl]);

  // M1 — the cards: shared kit + the staged hand's real faces, laid out on the felt.
  const cardKit = useCardKit();
  const cardFaces = useCardFaces(LAB_HAND_IDS, maxAniso);
  // TP2 Lever 6: dealt variance — deterministic per-card micro-tilt/yaw (≤ MAX_TILT_RAD each).
  // Seeds are integer-constant Math.sin(i * prime) — frozen at construction, M9-safe.
  // ?card=base → no variance (pre-TP2 A/B); ?card=var (or any non-base value) → variance on.
  const cardFlag = qp("card");
  const dealVariance = cardFlag !== "base";
  const community = useMemo(() => communityLayout(LAB_COMMUNITY, { variance: dealVariance }), [dealVariance]);
  // hole-pair composition: defaults to the baked constants; ?hpitch/?hfan/?hz/?hlift override
  // them for variant exploration (default scene unchanged when no param is present).
  const hole = useMemo(() => {
    const num = (k: string) => (qp(k) != null ? Number(qp(k)) : undefined);
    return holeLayout(LAB_HOLE, {
      pitch: num("hpitch"),
      fan: num("hfan"),
      z: num("hz"),
      lift: num("hlift"),
      stack: num("hstack"),
      variance: dealVariance,
    });
  }, [dealVariance]);

  // camera preset via ?cam=wide|hero|close|top — lets us capture several angles
  const cam = useMemo<CamPreset>(() => {
    const key = new URLSearchParams(window.location.search).get("cam") || "card";
    const presets: Record<string, CamPreset> = {
      // M1 player POV — hole cards large in the foreground, the board read beyond them
      card: { pos: [0, 4.7, 10.6], target: [0, 0.25, 1.2], fov: 40 },
      wide: { pos: [0, 7.0, 11.5], target: [0, 0.1, 0], fov: 34 },
      hero: { pos: [1.2, 5.0, 8.2], target: [0, 0.5, 0], fov: 32 },
      close: { pos: [1.6, 3.0, 5.4], target: [0.1, 0.6, 0.2], fov: 36 },
      top: { pos: [0, 12, 0.001], target: [0, 0, 0], fov: 30 },
      macro: { pos: [-1.7, 1.7, 2.4], target: [-1.55, 0.05, 1.05], fov: 26 },
      room: { pos: [0, 9.5, 16], target: [0, -0.3, 0], fov: 35 },
      // low grazing look at the near rail edge — judges the rail's mass, materials + section
      rail: { pos: [0, 2.4, 9.6], target: [0, 0.15, 4.9], fov: 32 },
      // pulled back to read the whole gathering — table + the presence around it
      gather: { pos: [0, 6.8, 20.5], target: [0, 0.2, 0], fov: 40 },
      // eye-level among the players — the most telling angle for "are people playing?"
      eye: { pos: [4.5, 2.7, 12.5], target: [-0.5, 0.5, -1], fov: 44 },
      // —— ENCUADRE-PRIMERO diagnostic framings (NOT money shots; the frozen 3 card/hero/macro untouched) ——
      conjunto: { pos: [1.0, 8.0, 16.5], target: [0, 0.05, 1.9], fov: 37 },
      social: { pos: [0, 9.0, 17.6], target: [0, 0, 1.6], fov: 39 },
    };
    return presets[key] || presets.wide;
  }, []);

  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.9, metalness: 0 }),
    [],
  );
  const backdropMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: backdropTexture(), side: THREE.BackSide, fog: false }),
    [],
  );

  return (
    <>
      <color attach="background" args={["#060403"]} />
      <fog attach="fog" args={["#141009", 20, 60]} />

      {/* warm-dark room backdrop wrapping the scene — depth instead of a flat black void */}
      <mesh>
        <sphereGeometry args={[44, 32, 16]} />
        <primitive object={backdropMat} attach="material" />
      </mesh>

      <PerspectiveCamera makeDefault position={cam.pos} fov={cam.fov} />
      {/* Azimuth CLAMPED to the readable front arc (±~0.85 rad around the preset). The old 360°
          auto-rotate swung the camera behind the board, where the player-oriented cards read
          upside down — physically unavoidable from the far side. Default is now a static hero
          front view; manual orbit stays within the arc where the cards read correctly. */}
      <OrbitControls
        makeDefault
        target={cam.target}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={false}
        minPolarAngle={0.62}
        maxPolarAngle={1.12}
        minAzimuthAngle={Math.atan2(cam.pos[0] - cam.target[0], cam.pos[2] - cam.target[2]) - 0.5}
        maxAzimuthAngle={Math.atan2(cam.pos[0] - cam.target[0], cam.pos[2] - cam.target[2]) + 0.5}
        minDistance={5}
        maxDistance={13}
      />

      <Lights />

      <group>
        {qp("table") ? (
          <TableVariant type={qp("table") as Silhouette} aceTexs={{ O: oTex, C: cuTex, E: eTex, B: bTex }} />
        ) : (
          <Table logoImg={logoImg} aceImgs={aceImgs} />
        )}

        {/* M1 — the cards are the protagonist (default on; ?cards=off restores the pre-card
           table). Community cards on the board + the player's hole cards (the Perla) up front. */}
        {qp("cards") !== "off" && (
          <>
            <CardGroup kit={cardKit} faces={cardFaces} poses={community} />
            <CardGroup kit={cardKit} faces={cardFaces} poses={hole} />
          </>
        )}

        {/* the pot — clay stacks, each denomination a Spanish suit. M1 DEMOTES it to a modest
           accent so the cards dominate. ?chips=full restores the old heavy central pot;
           ?chips=off clears it. Chips are identity — demoted, never deleted. */}
        {qp("chips") === "full" ? (
          <>
            <ChipStack kit={chipKit} denom="C" count={17} position={[-0.55, 0.06, 0.2]} />
            <ChipStack kit={chipKit} denom="B" count={12} position={[0.7, 0.06, -0.35]} />
            <ChipStack kit={chipKit} denom="E" count={14} position={[0.1, 0.06, 0.95]} />
            <ChipStack kit={chipKit} denom="O" count={9} position={[1.05, 0.06, 0.7]} />
            <Chip kit={chipKit} denom="O" position={[-1.7, 0.055, 1.0]} rotationY={0.6} />
            <Chip kit={chipKit} denom="C" position={[-1.4, 0.055, 1.25]} rotationY={1.4} />
          </>
        ) : qp("chips") !== "off" ? (
          // demoted accent pot — fewer, smaller stacks set off to the side
          <group position={[3.0, 0, 1.5]} scale={0.5}>
            {/* demoted accent — three SHORT stacks, centers ~3 units apart in local space so even
               at this scale they keep a clear ~0.45-world gap and never interpenetrate from any
               reachable orbit angle. No loose chip (it muddied the read). They recede behind the
               cards as quiet stakes. */}
            <ChipStack kit={chipKit} denom="C" count={5} position={[-1.6, 0.06, -0.7]} />
            <ChipStack kit={chipKit} denom="E" count={3} position={[1.6, 0.06, -0.7]} />
            <ChipStack kit={chipKit} denom="B" count={4} position={[0.0, 0.06, 1.7]} />
          </group>
        ) : null}

        {/* human presence around the oval — OPT-IN (?seats=on) and fully isolated, so the
           default lab view is always the protected premium table. Occupant/seat work is an
           experimental, reversible layer; it must never degrade the table reference. */}
        {qp("seats") === "on" && (
          <>
            <Seats />
            <SeatHands kit={cardKit} />
          </>
        )}
      </group>

      {/* the floor as a warm pool of light — the table stands in an intimate room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* grounded contact shadow under the table */}
      {qp("cs") !== "off" && (
        <ContactShadows
          position={[0, -1.48, 0]}
          scale={FELT_R * 3}
          resolution={1024}
          blur={2.8}
          opacity={0.55}
          far={4}
          color="#000000"
        />
      )}

      {/* real reflections: a warm overhead softbox + dim side fills, baked once */}
      {qp("env") !== "off" && (
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={1.7}
            color="#ffe3b0"
            position={[0, 7, 1]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[9, 6, 1]}
          />
          <Lightformer form="rect" intensity={0.5} color="#ffd49a" position={[-7, 3, -4]} scale={[5, 5, 1]} />
          <Lightformer form="ring" intensity={0.35} color="#9fb8ff" position={[6, 4, -5]} scale={[4, 4, 1]} />
        </Environment>
      )}

      {/* M10/M11 instrumentation — renders null (zero pixels); writes window.__labStats.
          Mounted ONLY when ?stats is present so the default captured scene is untouched. */}
      {qp("stats") !== null && <StatsProbe />}
    </>
  );
}

export function TableLab() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* minimal overlay — the chrome steps back; the table is the product */}
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 24,
          color: "rgba(243,234,208,0.9)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          pointerEvents: "none",
          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 600 }}>CHIRIBITO</div>
        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.7, marginTop: 2 }}>MESA · LAB 3D</div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 24,
          color: "rgba(243,234,208,0.45)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 11,
          letterSpacing: 1,
          pointerEvents: "none",
        }}
      >
        arrastra para girar · rueda para acercar
      </div>
    </div>
  );
}

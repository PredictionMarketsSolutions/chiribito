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
import { Canvas, useLoader } from "@react-three/fiber";
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
  woodTexture,
  leatherTexture,
  leatherBump,
} from "./textures";
import { TableVariant } from "./TableVariant";
import type { Silhouette } from "./silhouettes";

// --- proportions (chip radius = 1 world unit) ---
const R = 1;
const H = 0.1; // chip thickness — thin, so a stack reads as many crisp layers
const BEVEL = 0.03;
const FELT_R = 5.2;
const OVAL_X = 1.22; // table stretched on X into an oval (chips stay un-stretched)

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
          : new THREE.MeshStandardMaterial({
              map: feltTexture(logoImg, aceImgs),
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
    () => ({
      O: (oTex.image as HTMLImageElement) ?? null,
      C: (cuTex.image as HTMLImageElement) ?? null,
      E: (eTex.image as HTMLImageElement) ?? null,
      B: (bTex.image as HTMLImageElement) ?? null,
    }),
    [oTex, cuTex, eTex, bTex],
  );
  // ?c=literal → the literal 48px favicon (soft). Default → faithful HD rebuild (crisp).
  const cImg = qp("c") === "literal" ? ((cTex.image as HTMLImageElement) ?? null) : null;
  const kit = useChipKit(cImg);

  // camera preset via ?cam=wide|hero|close|top — lets us capture several angles
  const cam = useMemo<CamPreset>(() => {
    const key = new URLSearchParams(window.location.search).get("cam") || "wide";
    const presets: Record<string, CamPreset> = {
      wide: { pos: [0, 7.0, 11.5], target: [0, 0.1, 0], fov: 34 },
      hero: { pos: [1.2, 5.0, 8.2], target: [0, 0.5, 0], fov: 32 },
      close: { pos: [1.6, 3.0, 5.4], target: [0.1, 0.6, 0.2], fov: 36 },
      top: { pos: [0, 12, 0.001], target: [0, 0, 0], fov: 30 },
      macro: { pos: [-1.7, 1.7, 2.4], target: [-1.55, 0.05, 1.05], fov: 26 },
      room: { pos: [0, 9.5, 16], target: [0, -0.3, 0], fov: 35 },
      // low grazing look at the near rail edge — judges the rail's mass, materials + section
      rail: { pos: [0, 2.4, 9.6], target: [0, 0.15, 4.9], fov: 32 },
    };
    return presets[key] || presets.wide;
  }, []);

  return (
    <>
      <color attach="background" args={["#0a0806"]} />
      <fog attach="fog" args={["#0a0806", 16, 38]} />

      <PerspectiveCamera makeDefault position={cam.pos} fov={cam.fov} />
      <OrbitControls
        makeDefault
        target={cam.target}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={qp("spin") !== "off"}
        autoRotateSpeed={0.4}
        minPolarAngle={0.45}
        maxPolarAngle={1.45}
        minDistance={4}
        maxDistance={18}
      />

      <Lights />

      <group>
        {qp("table") ? (
          <TableVariant type={qp("table") as Silhouette} aceTexs={{ O: oTex, C: cuTex, E: eTex, B: bTex }} />
        ) : (
          <Table logoImg={logoImg} aceImgs={aceImgs} />
        )}

        {qp("chips") !== "off" && (
          <>
            {/* the pot — hand-stacked clay stacks. Each denomination IS a Spanish suit. */}
            <ChipStack kit={kit} denom="C" count={17} position={[-0.55, 0.06, 0.2]} />
            <ChipStack kit={kit} denom="B" count={12} position={[0.7, 0.06, -0.35]} />
            <ChipStack kit={kit} denom="E" count={14} position={[0.1, 0.06, 0.95]} />
            <ChipStack kit={kit} denom="O" count={9} position={[1.05, 0.06, 0.7]} />
            {/* two loose chips lying flat — show a face */}
            <Chip kit={kit} denom="O" position={[-1.7, 0.055, 1.0]} rotationY={0.6} />
            <Chip kit={kit} denom="C" position={[-1.4, 0.055, 1.25]} rotationY={1.4} />
          </>
        )}
      </group>

      {/* warm wooden floor — the table now sits in a room, not a black void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#140d08" roughness={0.92} metalness={0} />
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

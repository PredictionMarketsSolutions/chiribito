/**
 * Silhouette exploration — a table built from a parameterised outline so we can compare
 * distinct shapes WITH seats: oval / capsule (racetrack) / hexagon (one flat side per
 * player). Rail = ExtrudeGeometry of the outline (annular, beveled); felt = ShapeGeometry;
 * 6 leather butacas with a Spanish suit on each back. Throwaway spike for comparison.
 */
import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { silhouettePoints, makeShape, seatTransforms, type Silhouette } from "./silhouettes";

const AX = 6.0;
const AZ = 4.7;
const RAIL_W = 0.85;
const SEAT_SUITS = ["O", "C", "E", "B", "O", "C"] as const;

function Seat({ x, z, rot, suitTex }: { x: number; z: number; rot: number; suitTex?: THREE.Texture | null }) {
  return (
    <group position={[x * 1.07, 0, z * 1.07]} rotation={[0, rot, 0]}>
      {/* seat cushion (toward the table) */}
      <RoundedBox args={[1.5, 0.3, 1.25]} radius={0.1} smoothness={3} position={[0, -0.5, 0.2]} castShadow receiveShadow>
        <meshStandardMaterial color="#5a2230" roughness={0.55} />
      </RoundedBox>
      {/* tall leather back (outward), leaning back a touch */}
      <RoundedBox args={[1.5, 1.8, 0.28]} radius={0.13} smoothness={3} position={[0, 0.45, 0.95]} rotation={[-0.12, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#6b2838" roughness={0.5} />
      </RoundedBox>
      {/* the Spanish suit embossed on the back, facing the table centre */}
      {suitTex && (
        <mesh position={[0, 0.62, 0.78]} rotation={[-0.12, Math.PI, 0]}>
          <planeGeometry args={[0.62, 0.96]} />
          <meshStandardMaterial map={suitTex} transparent alphaTest={0.5} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

export function TableVariant({
  type,
  aceTexs,
}: {
  type: Silhouette;
  aceTexs: Partial<Record<string, THREE.Texture | null>>;
}) {
  const { railGeo, feltGeo, baseGeo, seats, mats } = useMemo(() => {
    // capsule is elongated into a clear racetrack; plaza-driven forms are round so the
    // 6 plazas sit evenly; the rest use the base extents
    const plaza = type === "bays" || type === "petal" || type === "embrace";
    const ax = type === "capsule" ? 7.8 : plaza ? 5.6 : AX;
    const az = type === "capsule" ? 3.9 : plaza ? 5.6 : AZ;
    const innerPts = silhouettePoints(type, ax - RAIL_W, az - RAIL_W);
    const railShape = makeShape(silhouettePoints(type, ax, az));
    railShape.holes.push(makeShape(innerPts));
    const railGeo = new THREE.ExtrudeGeometry(railShape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 5,
      steps: 1,
    });
    railGeo.rotateX(-Math.PI / 2);
    const feltGeo = new THREE.ShapeGeometry(makeShape(innerPts));
    feltGeo.rotateX(-Math.PI / 2);
    const baseGeo = new THREE.ExtrudeGeometry(makeShape(silhouettePoints(type, ax - 0.12, az - 0.12)), {
      depth: 1.0,
      bevelEnabled: false,
      steps: 1,
    });
    baseGeo.rotateX(-Math.PI / 2);
    const seats = seatTransforms(type, ax, az);
    const wood = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#9a5f33"),
      roughness: 0.42,
      clearcoat: 0.3,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.5,
      side: THREE.DoubleSide,
    });
    const felt = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#157a51"),
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const base = new THREE.MeshStandardMaterial({ color: new THREE.Color("#241712"), roughness: 0.6, side: THREE.DoubleSide });
    return { railGeo, feltGeo, baseGeo, seats, mats: { wood, felt, base } };
  }, [type]);

  return (
    <group>
      <mesh geometry={feltGeo} material={mats.felt} position={[0, 0.03, 0]} receiveShadow />
      <mesh geometry={railGeo} material={mats.wood} position={[0, 0, 0]} castShadow receiveShadow />
      <mesh geometry={baseGeo} material={mats.base} position={[0, -1.0, 0]} castShadow />
      {seats.map((s, i) => (
        <Seat key={i} x={s.x} z={s.z} rot={s.rot} suitTex={aceTexs[SEAT_SUITS[i]]} />
      ))}
    </group>
  );
}

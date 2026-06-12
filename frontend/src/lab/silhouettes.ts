/**
 * Table silhouette geometry — outline points for distinct table shapes, so the rail
 * (ExtrudeGeometry) and felt (ShapeGeometry) can follow ANY form, not just an oval.
 * Three directions to compare: oval (evolved), capsule (racetrack), hexagon (faceted,
 * one flat side per player). Throwaway spike exploration.
 */
import * as THREE from "three";

export type Silhouette = "oval" | "capsule" | "hexagon" | "bays" | "petal" | "embrace";
export const SILHOUETTES: Silhouette[] = ["oval", "capsule", "hexagon", "bays", "petal", "embrace"];

// Plaza-driven forms: the outline radius is modulated by the 6 plazas, so the shape is
// BORN from where people sit. bays/petal = a bulge (station) at each seat; embrace = the
// table curves inward to hug each player. amp>0 bulge at seat angle, amp<0 concave scoop.
function plazaAmp(type: Silhouette): number {
  return type === "petal" ? 0.22 : type === "embrace" ? -0.13 : 0.14;
}
function isPlaza(type: Silhouette): boolean {
  return type === "bays" || type === "petal" || type === "embrace";
}

function quad(a: THREE.Vector2, c: THREE.Vector2, b: THREE.Vector2, t: number): THREE.Vector2 {
  const mt = 1 - t;
  return new THREE.Vector2(
    mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
    mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
  );
}

/** Outline points in shape-space (x,y) — becomes world (x,z) when the mesh is laid flat. */
export function silhouettePoints(type: Silhouette, ax: number, az: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  if (type === "capsule") {
    const r = az;
    const sx = Math.max(0.001, ax - r);
    const N = 30;
    for (let i = 0; i <= N; i++) {
      const t = -Math.PI / 2 + Math.PI * (i / N);
      pts.push(new THREE.Vector2(sx + Math.cos(t) * r, Math.sin(t) * r));
    }
    for (let i = 0; i <= N; i++) {
      const t = Math.PI / 2 + Math.PI * (i / N);
      pts.push(new THREE.Vector2(-sx + Math.cos(t) * r, Math.sin(t) * r));
    }
  } else if (type === "hexagon") {
    const corners: THREE.Vector2[] = [];
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2 + Math.PI / 6;
      corners.push(new THREE.Vector2(Math.cos(t) * ax, Math.sin(t) * az));
    }
    const round = 0.18;
    for (let i = 0; i < 6; i++) {
      const p0 = corners[(i + 5) % 6];
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 6];
      const a = new THREE.Vector2().lerpVectors(p1, p0, round);
      const b = new THREE.Vector2().lerpVectors(p1, p2, round);
      pts.push(a);
      for (let s = 1; s <= 5; s++) pts.push(quad(a, p1, b, s / 6));
      pts.push(b);
    }
  } else if (isPlaza(type)) {
    const amp = plazaAmp(type);
    const N = 168;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const rr = 1 + amp * Math.cos(6 * t);
      pts.push(new THREE.Vector2(Math.cos(t) * ax * rr, Math.sin(t) * az * rr));
    }
  } else {
    const N = 100;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector2(Math.cos(t) * ax, Math.sin(t) * az));
    }
  }
  return pts;
}

export function makeShape(pts: THREE.Vector2[]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
  s.closePath();
  return s;
}

/** 6 player seats (world x,z + facing rotation toward the centre). */
export function seatTransforms(type: Silhouette, ax: number, az: number): { x: number; z: number; rot: number }[] {
  const seats: { x: number; z: number }[] = [];
  if (type === "capsule") {
    const sx = ax - az;
    const xs = [-sx * 0.66, 0, sx * 0.66];
    for (const side of [-1, 1]) for (const x of xs) seats.push({ x, z: side * az });
  } else if (type === "hexagon") {
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2 + Math.PI / 3;
      seats.push({ x: Math.cos(t) * ax * 0.92, z: Math.sin(t) * az * 0.92 });
    }
  } else if (isPlaza(type)) {
    const amp = plazaAmp(type);
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2;
      const rr = 1 + amp * Math.cos(6 * t);
      seats.push({ x: Math.cos(t) * ax * rr, z: Math.sin(t) * az * rr });
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2 + Math.PI / 6;
      seats.push({ x: Math.cos(t) * ax, z: Math.sin(t) * az });
    }
  }
  return seats.map((s) => ({ x: s.x, z: s.z, rot: Math.atan2(s.x, s.z) }));
}

/** OWNER: packages/template-engine — 2.5D device box (no WebGL) */
import type { DeviceInstance } from "../template.types";
import type { Rect } from "../constraints/aabb";
import { deviceAabb, screenAabb } from "../constraints/aabb";
import { toWorldInstance } from "../constraints/world";

export type Pt2 = { x: number; y: number };
export type Pt3 = { x: number; y: number; z: number };
export type Quad = [Pt2, Pt2, Pt2, Pt2];

export const DEFAULT_DEPTH = 0.045;
const FOCAL_K = 2.6;

export function hasPerspective(inst: Pick<DeviceInstance, "rotateXDeg" | "rotateYDeg">): boolean {
  return Math.abs(inst.rotateXDeg || 0) > 0.4 || Math.abs(inst.rotateYDeg || 0) > 0.4;
}

function rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function rotZ(p: Pt3, a: number): Pt3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
}

function rotY(p: Pt3, a: number): Pt3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotX(p: Pt3, a: number): Pt3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function project(p: Pt3, focal: number, cx: number, cy: number): Pt2 {
  const den = Math.max(40, focal - p.z);
  return { x: cx + (p.x * focal) / den, y: cy + (p.y * focal) / den };
}

function aabbOf(pts: Pt2[]): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function transformLocal(
  p: Pt3,
  inst: DeviceInstance,
  world: { x: number; y: number; w: number; h: number },
  focal: number
): { p2: Pt2; p3: Pt3 } {
  let q = rotZ(p, rad(inst.rotationDeg || 0));
  q = rotY(q, rad(inst.rotateYDeg || 0));
  q = rotX(q, rad(inst.rotateXDeg || 0));
  return { p2: project(q, focal, world.x, world.y), p3: q };
}

function outwardNz(a: Pt3, b: Pt3, c: Pt3): number {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  return ux * vy - uy * vx;
}

export type ProjectedFace = {
  pts: Quad;
  z: number;
  kind: "back" | "side" | "front";
  visible: boolean;
};

export type ProjectedBox = {
  front: Quad;
  back: Quad;
  screen: Quad;
  faces: ProjectedFace[];
  aabb: Rect;
};

function face(
  kind: ProjectedFace["kind"],
  a: { p2: Pt2; p3: Pt3 },
  b: { p2: Pt2; p3: Pt3 },
  c: { p2: Pt2; p3: Pt3 },
  d: { p2: Pt2; p3: Pt3 }
): ProjectedFace {
  return {
    pts: [a.p2, b.p2, c.p2, d.p2],
    z: (a.p3.z + b.p3.z + c.p3.z + d.p3.z) / 4,
    kind,
    visible: outwardNz(a.p3, b.p3, d.p3) > 1e-3,
  };
}

/** World-pixel projection of the device box + screen hole on the front face. */
export function projectDeviceBox(
  inst: DeviceInstance,
  sliceW: number,
  sliceH: number,
  inset?: { x: number; y: number; w: number; h: number }
): ProjectedBox {
  const world = toWorldInstance(inst, sliceW, sliceH);
  const d = (inst.depth ?? DEFAULT_DEPTH) * sliceW;
  const hw = world.w / 2;
  const hh = world.h / 2;
  const hz = d / 2;
  const focal = FOCAL_K * Math.max(world.w, world.h);
  const ins = inset || { x: 0.055, y: 0.06, w: 0.89, h: 0.88 };

  const corner = (x: number, y: number, z: number) => transformLocal({ x, y, z }, inst, world, focal);

  const fTL = corner(-hw, -hh, hz);
  const fTR = corner(hw, -hh, hz);
  const fBR = corner(hw, hh, hz);
  const fBL = corner(-hw, hh, hz);
  const bTL = corner(-hw, -hh, -hz);
  const bTR = corner(hw, -hh, -hz);
  const bBR = corner(hw, hh, -hz);
  const bBL = corner(-hw, hh, -hz);

  const front: Quad = [fTL.p2, fTR.p2, fBR.p2, fBL.p2];
  const back: Quad = [bTL.p2, bTR.p2, bBR.p2, bBL.p2];

  const sx0 = -hw + ins.x * world.w;
  const sy0 = -hh + ins.y * world.h;
  const sx1 = sx0 + ins.w * world.w;
  const sy1 = sy0 + ins.h * world.h;
  const sTL = corner(sx0, sy0, hz);
  const sTR = corner(sx1, sy0, hz);
  const sBR = corner(sx1, sy1, hz);
  const sBL = corner(sx0, sy1, hz);
  const screen: Quad = [sTL.p2, sTR.p2, sBR.p2, sBL.p2];

  const faces: ProjectedFace[] = [
    face("back", bTL, bBL, bBR, bTR),
    face("side", bTL, fTL, fBL, bBL),
    face("side", fTR, bTR, bBR, fBR),
    face("side", bTL, bTR, fTR, fTL),
    face("side", fBL, fBR, bBR, bBL),
    face("front", fTL, fTR, fBR, fBL),
  ];
  faces.sort((a, b) => a.z - b.z);

  const aabb = aabbOf([...front, ...back]);
  return { front, back, screen, faces, aabb };
}

export function instanceAabb(inst: DeviceInstance, sliceW: number, sliceH: number): Rect {
  if (!hasPerspective(inst)) {
    const world = toWorldInstance(inst, sliceW, sliceH);
    return deviceAabb(world.x, world.y, world.w, world.h, world.rotationDeg);
  }
  return projectDeviceBox(inst, sliceW, sliceH).aabb;
}

export function instanceScreenAabb(
  inst: DeviceInstance,
  sliceW: number,
  sliceH: number,
  inset: { x: number; y: number; w: number; h: number }
): Rect {
  if (!hasPerspective(inst)) {
    const world = toWorldInstance(inst, sliceW, sliceH);
    return screenAabb(world.x, world.y, world.w, world.h, world.rotationDeg, inset);
  }
  return aabbOf(projectDeviceBox(inst, sliceW, sliceH, inset).screen);
}

function tri(p: Pt2, a: Pt2, b: Pt2, c: Pt2): boolean {
  const v0x = c.x - a.x;
  const v0y = c.y - a.y;
  const v1x = b.x - a.x;
  const v1y = b.y - a.y;
  const v2x = p.x - a.x;
  const v2y = p.y - a.y;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const den = dot00 * dot11 - dot01 * dot01;
  if (Math.abs(den) < 1e-9) return false;
  const u = (dot11 * dot02 - dot01 * dot12) / den;
  const v = (dot00 * dot12 - dot01 * dot02) / den;
  return u >= -0.02 && v >= -0.02 && u + v <= 1.02;
}

export function pointInQuad(p: Pt2, q: Quad): boolean {
  return tri(p, q[0], q[1], q[2]) || tri(p, q[0], q[2], q[3]);
}

export function lerpPt(a: Pt2, b: Pt2, t: number): Pt2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Vertical strips of a quad (TL, TR, BR, BL) for affine screenshot warp. */
export function warpStrips(quad: Quad, n = 18): Array<{ tl: Pt2; tr: Pt2; br: Pt2; bl: Pt2; t0: number; t1: number }> {
  const count = Math.max(8, n);
  const out: Array<{ tl: Pt2; tr: Pt2; br: Pt2; bl: Pt2; t0: number; t1: number }> = [];
  for (let i = 0; i < count; i++) {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    out.push({
      tl: lerpPt(quad[0], quad[1], t0),
      tr: lerpPt(quad[0], quad[1], t1),
      br: lerpPt(quad[3], quad[2], t1),
      bl: lerpPt(quad[3], quad[2], t0),
      t0,
      t1,
    });
  }
  return out;
}

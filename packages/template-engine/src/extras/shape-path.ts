/** OWNER: packages/template-engine — procedural extra shape points (local box 0..w × 0..h) */
import type { ExtraShape } from "../template.types";

export type Pt = { x: number; y: number };

export function blobPoints(w: number, h: number): Pt[] {
  const cx = w / 2;
  const cy = h / 2;
  const n = 8;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rx = (0.4 + (i % 2) * 0.1) * w;
    const ry = (0.36 + ((i + 1) % 2) * 0.12) * h;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

export function wavePoints(w: number, h: number): Pt[] {
  const pts: Pt[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      x: t * w,
      y: h / 2 + Math.sin(t * Math.PI * 2) * h * 0.32,
    });
  }
  return pts;
}

export function starPoints(w: number, h: number, spikes = 8): Pt[] {
  const cx = w / 2;
  const cy = h / 2;
  const outer = Math.min(w, h) * 0.48;
  const inner = outer * 0.42;
  const pts: Pt[] = [];
  const n = spikes * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

export function scribblePoints(w: number, h: number): Pt[] {
  const pts: Pt[] = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wobble = ((i % 3) - 1) * 0.18;
    pts.push({
      x: t * w * 0.92 + w * 0.04,
      y: h * (0.35 + wobble + Math.sin(t * Math.PI) * 0.25),
    });
  }
  return pts;
}

export function dotCenters(w: number, h: number): Array<Pt & { r: number }> {
  const cols = 4;
  const rows = 3;
  const r = Math.min(w / cols, h / rows) * 0.16;
  const out: Array<Pt & { r: number }> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      out.push({
        x: ((col + 0.5) / cols) * w,
        y: ((row + 0.5) / rows) * h,
        r,
      });
    }
  }
  return out;
}

export function pointsForShape(shape: ExtraShape, w: number, h: number): Pt[] {
  if (shape === "wave") return wavePoints(w, h);
  if (shape === "star") return starPoints(w, h);
  if (shape === "scribble") return scribblePoints(w, h);
  return blobPoints(w, h);
}

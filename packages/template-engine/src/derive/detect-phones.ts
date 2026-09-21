/** OWNER: packages/template-engine — find phones by their outline, independent of background colour.
 *
 *  A phone in a store screenshot is a rounded rectangle at a fixed aspect ratio. A candidate
 *  rectangle (centre, width, tilt) is scored by how well its visible outline follows real image
 *  edges: every visible side must be edge-supported, the support must run continuously along the
 *  side, and the contrast direction (bezel darker or lighter than what is outside it) must stay
 *  the same along the side. Text and UI edges fail those tests. Sides that fall outside the
 *  panel (a cropped phone) are not counted, so cropped and full phones use the same test. */
import { PHONE_ASPECT } from "./types";

export type Phone = {
  cx: number;
  cy: number;
  /** Width in analysed pixels. */
  w: number;
  h: number;
  /** Clockwise degrees from upright. */
  rotationDeg: number;
  /** 0-1: how well the checked outline follows edges (long sides weigh more). */
  support: number;
  /** 0-1: share of the outline that could be checked (not cropped/outside). */
  visible: number;
};

export type EdgeField = {
  w: number;
  h: number;
  lab: Float32Array;
  gx: Float32Array[];
  gy: Float32Array[];
  /** 1 where the pixel belongs to a panel interior (not a gap or screenshot frame). */
  valid: Uint8Array;
};

export function edgeField(lab: Float32Array, w: number, h: number, valid: Uint8Array): EdgeField {
  const gx = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)];
  const gy = [new Float32Array(w * h), new Float32Array(w * h), new Float32Array(w * h)];
  for (let c = 0; c < 3; c++) {
    const at = (x: number, y: number) => lab[(y * w + x) * 3 + c];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        gx[c][y * w + x] =
          (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)) / 8;
        gy[c][y * w + x] =
          (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)) / 8;
      }
    }
  }
  return { w, h, lab, gx, gy, valid };
}

/** Signed contrast across direction (nx, ny): how different the colour is a few pixels to either side.
 *  Measured over a short span so soft edges (a white phone on light grey) still register. */
function across(f: EdgeField, x: number, y: number, nx: number, ny: number): number {
  let best = 0;
  for (const d of [1.5, 3]) {
    const x1 = Math.round(x + nx * d);
    const y1 = Math.round(y + ny * d);
    const x2 = Math.round(x - nx * d);
    const y2 = Math.round(y - ny * d);
    if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0 || x1 >= f.w || x2 >= f.w || y1 >= f.h || y2 >= f.h) continue;
    const i = (y1 * f.w + x1) * 3;
    const j = (y2 * f.w + x2) * 3;
    for (let c = 0; c < 3; c++) {
      const v = f.lab[i + c] - f.lab[j + c];
      if (Math.abs(v) > Math.abs(best)) best = v;
    }
  }
  return best;
}

const EDGE_T = 7;
const CORNER = 0.1; // skip samples this close (fraction of a side) to a rounded corner

type SideStat = { seen: number; total: number; support: number; run: number; sign: number };
type Score = {
  /** Combined 0-1 quality of the visible outline. */
  value: number;
  visible: number;
  /** false when a visible side is unsupported, broken up, or changes contrast direction. */
  ok: boolean;
};

function sideStat(f: EdgeField, ox: number, oy: number, dx: number, dy: number, len: number, nx: number, ny: number, step: number): SideStat {
  const n = Math.max(4, Math.round(len / step));
  let total = 0;
  let seen = 0;
  let hits = 0;
  let run = 0;
  let bestRun = 0;
  let pos = 0;
  let neg = 0;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    if (t < CORNER || t > 1 - CORNER) continue;
    total++;
    const along = (t - 0.5) * len;
    const x = ox + dx * along;
    const y = oy + dy * along;
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 1 || yi < 1 || xi >= f.w - 1 || yi >= f.h - 1 || !f.valid[yi * f.w + xi]) {
      run = 0;
      continue;
    }
    seen++;
    const v = across(f, x, y, nx, ny);
    if (Math.abs(v) >= EDGE_T) {
      hits++;
      run++;
      if (run > bestRun) bestRun = run;
      if (v > 0) pos++;
      else neg++;
    } else run = 0;
  }
  return {
    seen,
    total,
    support: seen ? hits / seen : 0,
    run: seen ? bestRun / seen : 0,
    sign: hits ? Math.max(pos, neg) / hits : 0,
  };
}

function scoreRect(f: EdgeField, cx: number, cy: number, W: number, H: number, deg: number, step: number): Score {
  const r = (deg * Math.PI) / 180;
  const ux = Math.cos(r);
  const uy = Math.sin(r);
  const vx = -uy;
  const vy = ux;
  const top = sideStat(f, cx - (vx * H) / 2, cy - (vy * H) / 2, ux, uy, W, -vx, -vy, step);
  const bottom = sideStat(f, cx + (vx * H) / 2, cy + (vy * H) / 2, ux, uy, W, vx, vy, step);
  const left = sideStat(f, cx - (ux * W) / 2, cy - (uy * W) / 2, vx, vy, H, -ux, -uy, step);
  const right = sideStat(f, cx + (ux * W) / 2, cy + (uy * W) / 2, vx, vy, H, ux, uy, step);
  const total = top.total + bottom.total + left.total + right.total;
  const seen = top.seen + bottom.seen + left.seen + right.seen;
  const visible = total ? seen / total : 0;

  const longs = [left, right].filter((s) => s.seen >= 5);
  const shorts = [top, bottom].filter((s) => s.seen >= 3);
  // A phone needs at least one long side to judge, and both long sides unless the panel cut one off.
  let ok = longs.length >= 1 && visible >= 0.4;
  for (const s of longs) if (s.support < 0.66 || s.run < 0.5 || s.sign < 0.8) ok = false;
  for (const s of shorts) if (s.support < 0.45) ok = false;
  const lv = longs.length ? longs.reduce((a, s) => a + s.support, 0) / longs.length : 0;
  const sv = shorts.length ? shorts.reduce((a, s) => a + s.support, 0) / shorts.length : lv;
  const runv = longs.length ? longs.reduce((a, s) => a + s.run, 0) / longs.length : 0;
  return { value: 0.5 * lv + 0.2 * sv + 0.3 * runv, visible, ok };
}

function labAtPx(f: EdgeField, x: number, y: number): [number, number, number] | null {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= f.w || yi >= f.h || !f.valid[yi * f.w + xi]) return null;
  const i = (yi * f.w + xi) * 3;
  return [f.lab[i], f.lab[i + 1], f.lab[i + 2]];
}

/** Share of the rectangle's inside that differs from the colour just outside its outline.
 *  A phone's screen does; the empty space around a block of text does not. */
function interiorContrast(f: EdgeField, cx: number, cy: number, W: number, H: number, deg: number): number {
  const r = (deg * Math.PI) / 180;
  const ux = Math.cos(r);
  const uy = Math.sin(r);
  const vx = -uy;
  const vy = ux;
  const outside: [number, number, number][] = [];
  const pad = 3;
  for (let k = 0; k < 14; k++) {
    const t = ((k + 0.5) / 14 - 0.5) * 0.8;
    for (const [px, py] of [
      [cx + ux * t * W - vx * (H / 2 + pad), cy + uy * t * W - vy * (H / 2 + pad)],
      [cx + ux * t * W + vx * (H / 2 + pad), cy + uy * t * W + vy * (H / 2 + pad)],
      [cx - ux * (W / 2 + pad) + vx * t * H, cy - uy * (W / 2 + pad) + vy * t * H],
      [cx + ux * (W / 2 + pad) + vx * t * H, cy + uy * (W / 2 + pad) + vy * t * H],
    ]) {
      const l = labAtPx(f, px, py);
      if (l) outside.push(l);
    }
  }
  if (outside.length < 8) return 1; // nothing to compare against (cropped away): don't reject
  const med = (k: 0 | 1 | 2) => [...outside].map((o) => o[k]).sort((a, b) => a - b)[Math.floor(outside.length / 2)];
  const ref: [number, number, number] = [med(0), med(1), med(2)];
  let diff = 0;
  let n = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 18; j++) {
      const lx = ((i + 0.5) / 9 - 0.5) * W * 0.86;
      const ly = ((j + 0.5) / 18 - 0.5) * H * 0.86;
      const l = labAtPx(f, cx + ux * lx + vx * ly, cy + uy * lx + vy * ly);
      if (!l) continue;
      n++;
      if (Math.hypot(l[0] - ref[0], l[1] - ref[1], l[2] - ref[2]) > 5) diff++;
    }
  }
  return n ? diff / n : 1;
}

function overlapFraction(a: Phone, b: Phone): number {
  // Share of a's area that lies inside b.
  const ar = (a.rotationDeg * Math.PI) / 180;
  const br = (b.rotationDeg * Math.PI) / 180;
  let inside = 0;
  let n = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 16; j++) {
      const lx = ((i + 0.5) / 8 - 0.5) * a.w;
      const ly = ((j + 0.5) / 16 - 0.5) * a.h;
      const x = a.cx + lx * Math.cos(ar) - ly * Math.sin(ar);
      const y = a.cy + lx * Math.sin(ar) + ly * Math.cos(ar);
      const dx = x - b.cx;
      const dy = y - b.cy;
      const u = dx * Math.cos(br) + dy * Math.sin(br);
      const v = -dx * Math.sin(br) + dy * Math.cos(br);
      n++;
      if (Math.abs(u) <= b.w / 2 && Math.abs(v) <= b.h / 2) inside++;
    }
  }
  return inside / n;
}

export type DetectOptions = {
  maxPerPanel?: number;
};

/** Find phones for one panel's x-range (they may extend past it, e.g. a phone crossing a gap). */
export function detectPhonesInPanel(f: EdgeField, x0: number, x1: number, opts: DetectOptions = {}): Phone[] {
  const maxPer = opts.maxPerPanel ?? 3;
  const pw = x1 - x0;
  type Cand = Phone & { s: number };
  const cands: Cand[] = [];

  // Coarse sweep over position, size and tilt with a cheap test; keep the promising ones.
  const widths = [0.45, 0.55, 0.65, 0.75, 0.85, 0.92].map((k) => k * pw);
  for (const W of widths) {
    const H = W * PHONE_ASPECT;
    for (let deg = -70; deg <= 70; deg += 10) {
      for (let ix = -1; ix <= 11; ix++) {
        const cx = x0 + (ix / 10) * pw;
        for (let iy = -1; iy <= 11; iy++) {
          const cy = (iy / 10) * f.h;
          const sc = scoreRect(f, cx, cy, W, H, deg, 5);
          if (sc.visible < 0.35 || sc.value < 0.45) continue;
          cands.push({ cx, cy, w: W, h: H, rotationDeg: deg, support: sc.value, visible: sc.visible, s: sc.value * Math.sqrt(sc.visible) });
        }
      }
    }
  }
  cands.sort((a, b) => b.s - a.s);

  // Refine each top candidate by local search; accept only those that pass the strict test.
  const refined: (Cand & { ok: boolean })[] = [];
  for (const c of cands.slice(0, 150)) {
    let cur = { ...c };
    let ok = false;
    let step = { p: pw * 0.06, w: pw * 0.05, a: 4 };
    for (let it = 0; it < 6; it++) {
      let improved = true;
      while (improved) {
        improved = false;
        const trials: [number, number, number, number][] = [
          [step.p, 0, 0, 0], [-step.p, 0, 0, 0], [0, step.p, 0, 0], [0, -step.p, 0, 0],
          [0, 0, step.w, 0], [0, 0, -step.w, 0], [0, 0, 0, step.a], [0, 0, 0, -step.a],
        ];
        for (const [dx, dy, dw, da] of trials) {
          const W = cur.w + dw;
          if (W < pw * 0.42 || W > pw * 0.95 || Math.abs(cur.rotationDeg + 0) > 78) continue;
          const H = W * PHONE_ASPECT;
          const sc = scoreRect(f, cur.cx + dx, cur.cy + dy, W, H, cur.rotationDeg + da, 2.5);
          const s = sc.value * Math.sqrt(sc.visible) + 0.01 * (W / pw); // a slight pull toward the outer edge
          if (s > cur.s + 1e-6) {
            cur = { cx: cur.cx + dx, cy: cur.cy + dy, w: W, h: H, rotationDeg: cur.rotationDeg + da, support: sc.value, visible: sc.visible, s };
            ok = sc.ok;
            improved = true;
          }
        }
      }
      step = { p: step.p / 2, w: step.w / 2, a: step.a / 2 };
    }
    if (!ok) ok = scoreRect(f, cur.cx, cur.cy, cur.w, cur.h, cur.rotationDeg, 2.5).ok;
    refined.push({ ...cur, ok });
  }
  refined.sort((a, b) => b.s - a.s);

  const out: Cand[] = [];
  for (const c of refined) {
    if (!c.ok) continue;
    if (Math.abs(c.rotationDeg) > 75 || c.w > 0.94 * pw) continue; // wider than any phone: that is the panel's own border
    // A phone belongs to the panel its centre is in (one crossing a gap sits near the boundary).
    if (c.cx < x0 + 0.05 * pw || c.cx > x1 - 0.05 * pw) continue;
    // Its centre sits well inside the frame; one whose centre is at the very top or bottom is the panel's edge line.
    if (c.cy < 0.12 * f.h || c.cy > 0.9 * f.h) continue;
    if (interiorContrast(f, c.cx, c.cy, c.w, c.h, c.rotationDeg) < 0.55) continue;
    // Inside an accepted phone (a card on its screen): skip. Around an accepted box: it was the inner edge, replace it.
    if (out.some((o) => overlapFraction(c, o) > 0.8 && o.w >= c.w * 0.95)) continue;
    const inner = out.findIndex((o) => overlapFraction(o, c) > 0.8 && c.w > o.w * 1.12);
    if (inner >= 0) out.splice(inner, 1);
    if (out.some((o) => overlapFraction(c, o) > 0.45 || overlapFraction(o, c) > 0.6)) continue;
    // Extra phones in a panel must be nearly as convincing as the first.
    if (out.length && c.s < 0.8 * out[0].s) continue;
    out.push(c);
    if (out.length >= maxPer) break;
  }
  return out.map(({ s: _s, ...p }) => p);
}

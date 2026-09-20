/** OWNER: packages/template-engine — find phone shapes and text bands in a screenshot strip.
 *
 *  Works from a foreground mask (pixels that differ from each panel's read
 *  background), so it only runs where the background was readable. A shape
 *  that does not fit one phone is reported as unresolved instead of guessed. */
import { edgeMargin, type BgModel } from "./read-background";
import type { PanelRange } from "./split-panels";
import { PHONE_ASPECT, type DeviceRead } from "./types";

export type PanelDevices = {
  devices: DeviceRead[];
  unresolved: string[];
  textBand: "top" | "bottom" | "split" | "none" | "unknown";
};

type Pt = [number, number];

function cross(o: Pt, a: Pt, b: Pt): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function convexHull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function polyArea(h: Pt[]): number {
  let a = 0;
  for (let i = 0; i < h.length; i++) {
    const [x1, y1] = h[i];
    const [x2, y2] = h[(i + 1) % h.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

type Rect = { cx: number; cy: number; long: number; short: number; ax: number; ay: number; area: number };

/** Smallest rotated rectangle around a convex hull. */
function minAreaRect(hull: Pt[]): Rect {
  let best: Rect | null = null;
  for (let i = 0; i < hull.length; i++) {
    const [x1, y1] = hull[i];
    const [x2, y2] = hull[(i + 1) % hull.length];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [x, y] of hull) {
      const u = x * dx + y * dy;
      const v = -x * dy + y * dx;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const du = maxU - minU + 1;
    const dv = maxV - minV + 1;
    const area = du * dv;
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2;
      const cv = (minV + maxV) / 2;
      const cx = cu * dx - cv * dy;
      const cy = cu * dy + cv * dx;
      if (du >= dv) best = { cx, cy, long: du, short: dv, ax: dx, ay: dy, area };
      else best = { cx, cy, long: dv, short: du, ax: -dy, ay: dx, area };
    }
  }
  return best as Rect;
}

/** Clockwise degrees of the long axis from vertical, in (-90, 90]. */
function rotationOf(ax: number, ay: number): number {
  let vx = ax;
  let vy = ay;
  if (vy > 0) {
    vx = -vx;
    vy = -vy;
  }
  return (Math.atan2(vx, -vy) * 180) / Math.PI;
}

/** Erode then dilate with a square of side 2r+1: removes anything thinner than that (frame rings, text)
 *  while keeping phone-sized shapes intact. */
function open(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const pass = (input: Uint8Array, horizontal: boolean, erode: boolean): Uint8Array => {
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let all = 1;
        let any = 0;
        for (let k = -r; k <= r; k++) {
          const xx = horizontal ? x + k : x;
          const yy = horizontal ? y : y + k;
          const v = xx < 0 || xx >= w || yy < 0 || yy >= h ? (erode ? 1 : 0) : input[yy * w + xx];
          if (v) any = 1;
          else all = 0;
        }
        out[y * w + x] = erode ? all : any;
      }
    }
    return out;
  };
  const eroded = pass(pass(src, true, true), false, true);
  return pass(pass(eroded, true, false), false, false);
}

function fitOk(fit: number): boolean {
  return fit >= 0.92;
}

function bandFraction(mask: Uint8Array, owner: Int32Array, w: number, x0: number, x1: number, y0: number, y1: number): number {
  let on = 0;
  let total = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      total++;
      const i = y * w + x;
      if (mask[i] && owner[i] <= 0) on++;
    }
  }
  return total ? on / total : 0;
}

function innerRect(region: Uint8Array, w: number, h: number, x0: number, x1: number) {
  const pw = x1 - x0;
  const m = edgeMargin(pw);
  const cap = Math.round(Math.min(pw, h) * 0.2);
  const rowFrac = (y: number) => {
    let on = 0;
    let n = 0;
    for (let x = x0 + cap; x < x1 - cap; x++) {
      n++;
      if (region[y * w + x]) on++;
    }
    return n ? on / n : 0;
  };
  const colFrac = (x: number) => {
    let on = 0;
    let n = 0;
    for (let y = cap; y < h - cap; y++) {
      n++;
      if (region[y * w + x]) on++;
    }
    return n ? on / n : 0;
  };
  // The panel edge is the first line in from the outside that is nearly as much background as the
  // panel interior is (the frame ring around a screenshot is almost none).
  const scan = (from: number, to: number, step: number, frac: (i: number) => number, fallback: number) => {
    const idx: number[] = [];
    for (let i = from, k = 0; k <= cap; i += step, k++) {
      if (i === to) break;
      idx.push(i);
    }
    const fr = idx.map(frac);
    const mx = Math.max(0, ...fr);
    if (mx < 0.05) return fallback;
    const at = fr.findIndex((f) => f >= 0.6 * mx);
    return at < 0 ? fallback : idx[at];
  };
  return {
    y0: scan(0, h, 1, rowFrac, m),
    y1: scan(h - 1, -1, -1, rowFrac, h - 1 - m),
    x0: scan(x0, x1, 1, colFrac, x0 + m),
    x1: scan(x1 - 1, x0 - 1, -1, colFrac, x1 - 1 - m),
  };
}

export function readDevices(
  lab: Float32Array,
  w: number,
  h: number,
  panels: PanelRange[],
  models: BgModel[],
  debug?: { mask?: Uint8Array }
): PanelDevices[] {
  const n = panels.length;
  const out: PanelDevices[] = panels.map(() => ({ devices: [], unresolved: [], textBand: "unknown" }));
  const mask = new Uint8Array(w * h);
  
  for (let p = 0; p < n; p++) {
    const region = models[p].region;
    if (!region) continue;
    const { x0, x1 } = panels[p];
    // Skip the screenshot's own frame/shadow/rounded corner: the first line in from each edge
    // that is mostly background marks where the panel really starts. A phone that runs off the
    // panel keeps its shape by carrying the nearest inner pixel outward.
    const inner = innerRect(region, w, h, x0, x1);
    for (let y = 0; y < h; y++) {
      const yy = Math.min(inner.y1, Math.max(inner.y0, y));
      for (let x = x0; x < x1; x++) {
        const xx = Math.min(inner.x1, Math.max(inner.x0, x));
        if (!region[yy * w + xx]) mask[y * w + x] = 1;
      }
    }
  }
  // Bridge the gap between two panels where a phone runs across it. A phone that really crosses
  // does so over a long stretch; a short run is just the frame or rounded corners of two panels touching.
  for (let p = 0; p < n - 1; p++) {
    const a = panels[p].x1 - 1;
    const b = panels[p + 1].x0;
    if (b - a < 2) continue;
    let runStart = -1;
    for (let y = 0; y <= h; y++) {
      const both = y < h && mask[y * w + a] && mask[y * w + b];
      if (both && runStart < 0) runStart = y;
      if (!both && runStart >= 0) {
        if (y - runStart >= 0.12 * h) {
          for (let yy = runStart; yy < y; yy++) for (let x = a + 1; x < b; x++) mask[yy * w + x] = 1;
        }
        runStart = -1;
      }
    }
  }

  // Fill holes: a phone with a white screen on a white panel is a ring until its inside is filled.
  const reach = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (i: number) => {
    if (!mask[i] && !reach[i]) {
      reach[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop() as number;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }
  for (let i = 0; i < mask.length; i++) if (!mask[i] && !reach[i]) mask[i] = 1;

  if (debug) debug.mask = Uint8Array.from(mask);
  // Shapes thinner than a phone (the screenshot's frame, rounded panel edges, text) are dropped
  // for device finding; the raw mask is kept for finding text.
  const core = open(mask, w, h, Math.max(3, Math.round(0.075 * (w / n))));
  // One pixel of dilation joins thin outlines; then label connected shapes.
  const dil = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!core[y * w + x]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && xx < w && yy >= 0 && yy < h) dil[yy * w + xx] = 1;
        }
      }
    }
  }
  const label = new Int32Array(w * h);
  const comps: { pts: Pt[]; minX: number; maxX: number; minY: number; maxY: number }[] = [];
  for (let s = 0; s < dil.length; s++) {
    if (!dil[s] || label[s]) continue;
    const id = comps.length + 1;
    const c = { pts: [] as Pt[], minX: w, maxX: 0, minY: h, maxY: 0 };
    const st = [s];
    label[s] = id;
    while (st.length) {
      const i = st.pop() as number;
      const x = i % w;
      const y = (i - x) / w;
      c.pts.push([x, y]);
      if (x < c.minX) c.minX = x;
      if (x > c.maxX) c.maxX = x;
      if (y < c.minY) c.minY = y;
      if (y > c.maxY) c.maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const j = yy * w + xx;
          if (dil[j] && !label[j]) {
            label[j] = id;
            st.push(j);
          }
        }
      }
    }
    comps.push(c);
  }

  const panelOf = (x: number) => {
    let best = 0;
    let bestD = Infinity;
    for (let p = 0; p < n; p++) {
      const dist = x < panels[p].x0 ? panels[p].x0 - x : x >= panels[p].x1 ? x - panels[p].x1 + 1 : 0;
      if (dist < bestD) {
        bestD = dist;
        best = p;
      }
    }
    return best;
  };
  const panelW = Math.max(1, Math.round(w / n));
  const minArea = 0.012 * panelW * h;
  const deviceOwner = new Int32Array(w * h);

  for (let ci = 0; ci < comps.length; ci++) {
    const c = comps[ci];
    if (c.pts.length < minArea) continue;
    const hull = convexHull(c.pts);
    if (hull.length < 3) continue;
    const rect = minAreaRect(hull);
    const hullArea = polyArea(hull);
    const fit = hullArea / Math.max(1, rect.area);
    const aspect = rect.long / Math.max(1, rect.short);
    const p = panelOf(rect.cx);
    const panel = panels[p];
    const pw = panel.x1 - panel.x0;
    const where = `${Math.round(((rect.cx - panel.x0) / pw) * 100)}% across, ${Math.round((rect.cy / h) * 100)}% down`;

    if (rect.long < 0.28 * h) continue; // headline text or a small graphic — handled as text below
    if (aspect >= 3.2) continue; // a wide band or wave, not a phone
    // Anything this big is not headline text, whether or not it turns out to be a phone.
    for (const [x, y] of c.pts) deviceOwner[y * w + x] = ci + 1;

    const firstP = panelOf(c.minX);
    const lastP = panelOf(c.maxX);
    const clippedTop = c.minY <= 1;
    const clippedBottom = c.maxY >= h - 2;
    const clippedLeft = c.minX <= panels[firstP].x0 + 1;
    const clippedRight = c.maxX >= panels[lastP].x1 - 2;
    // A phone whose panel edge is invisible (same colour as the frame around it) looks short and
    // fat where the crop cut it; a very rectangular, too-short shape is treated as cropped.
    const stubby = fitOk(fit) && aspect < 1.85;
    const clipped = clippedTop || clippedBottom || clippedLeft || clippedRight || stubby;
    const spansNext = lastP > p;

    if (fit < (clipped ? 0.84 : 0.9) || aspect < 1.4 || (!clipped && aspect > 2.6)) {
      out[p].unresolved.push(
        `A shape ${where} doesn't fit a single phone (proportions ${aspect.toFixed(1)}:1, ${Math.round(fit * 100)}% rectangular) — likely overlapping phones, a hand or an image. Not read.`
      );
      continue;
    }

    // Size: the short side is the phone's width unless the crop cut it.
    let width = rect.short;
    let longSide = rect.long;
    let note: string | undefined;
    let cx = rect.cx;
    let cy = rect.cy;
    if (clipped) {
      if (aspect > 2.4) width = rect.long / PHONE_ASPECT;
      const trueLong = width * PHONE_ASPECT;
      const missing = Math.max(0, trueLong - longSide);
      if (missing > 1) {
        // Push the centre outward, away from the edge that cut the phone.
        const ux = rect.ax;
        const uy = rect.ay;
        const endA: Pt = [rect.cx + (ux * rect.long) / 2, rect.cy + (uy * rect.long) / 2];
        const endB: Pt = [rect.cx - (ux * rect.long) / 2, rect.cy - (uy * rect.long) / 2];
        const edgeDist = (q: Pt) => Math.min(q[0] - panels[firstP].x0, panels[lastP].x1 - q[0], q[1], h - q[1]);
        const dir = edgeDist(endA) < edgeDist(endB) ? 1 : -1;
        cx += dir * ux * (missing / 2);
        cy += dir * uy * (missing / 2);
        longSide = trueLong;
      }
      note = "Cut off by the panel edge; full size and position inferred from phone proportions.";
    }

    // A real phone in a store screenshot is never wider than its panel or centred far outside it.
    if (width / pw > 1.05 || cx < panel.x0 - 0.35 * pw || cx > panel.x1 + 0.35 * pw) {
      out[p].unresolved.push(
        `A shape ${where} is larger than the panel itself (a phone wider than its frame doesn't occur), so it is probably an image, a hand or several overlapping phones. Not read.`
      );
      continue;
    }

    out[p].devices.push({
      cx: (cx - panel.x0) / pw,
      cy: cy / h,
      w: width / pw,
      rotationDeg: Math.round(rotationOf(rect.ax, rect.ay) * 10) / 10,
      clipped,
      spansNext,
      status: clipped ? "estimated" : "measured",
      note,
    });
  }

  for (let p = 0; p < n; p++) {
    if (!models[p].region) {
      out[p].unresolved.push("Devices and text were not read: the background is a photo or busy pattern, so phones can't be separated from it.");
      out[p].textBand = "unknown";
      continue;
    }
    if (!out[p].devices.length && !out[p].unresolved.length) {
      out[p].unresolved.push("No phone was found in this panel. If it has one, it blends into the background or is too small to separate.");
    }
    const { x0, x1 } = panels[p];
    const top = bandFraction(mask, deviceOwner, w, x0, x1, 0, Math.round(h * 0.28));
    const bottom = bandFraction(mask, deviceOwner, w, x0, x1, Math.round(h * 0.74), h);
    const hasTop = top > 0.015;
    const hasBottom = bottom > 0.015;
    out[p].textBand = hasTop && hasBottom ? "split" : hasTop ? "top" : hasBottom ? "bottom" : "none";
  }
  return out;
}

/** OWNER: packages/template-engine — read one panel's background.
 *
 *  The background is the smooth region that touches the panel's border: pixels
 *  are joined to their neighbour while the colour barely changes, so a gradient
 *  is followed but a phone edge, a headline or a photo's texture stops the
 *  region. If that region can't cover a fair share of the panel, the
 *  background is reported as unreadable instead of guessed. */
import { dE, labToHex, medianLab, type Lab } from "./pixels";
import type { BackgroundRead } from "./types";

export type BgModel = {
  read: BackgroundRead;
  /** 1 where the pixel (global index) is this panel's background; null when unreadable. */
  region: Uint8Array | null;
};

const STEP = 3.2;

/** Pixels this close to a panel edge are ignored when reading it: screenshots carry a frame, shadow or rounded corner there. */
export function edgeMargin(panelWidth: number): number {
  return Math.max(3, Math.round(panelWidth * 0.06));
}

function fitPlane(pts: { u: number; v: number; z: number }[]): [number, number, number] {
  let n = 0;
  let su = 0;
  let sv = 0;
  let suu = 0;
  let svv = 0;
  let suv = 0;
  let sz = 0;
  let suz = 0;
  let svz = 0;
  for (const p of pts) {
    n++;
    su += p.u;
    sv += p.v;
    suu += p.u * p.u;
    svv += p.v * p.v;
    suv += p.u * p.v;
    sz += p.z;
    suz += p.u * p.z;
    svz += p.v * p.z;
  }
  const m = [
    [n, su, sv, sz],
    [su, suu, suv, suz],
    [sv, suv, svv, svz],
  ];
  for (let i = 0; i < 3; i++) {
    let p = i;
    for (let r = i + 1; r < 3; r++) if (Math.abs(m[r][i]) > Math.abs(m[p][i])) p = r;
    [m[i], m[p]] = [m[p], m[i]];
    if (Math.abs(m[i][i]) < 1e-9) return [sz / n, 0, 0];
    for (let r = i + 1; r < 3; r++) {
      const f = m[r][i] / m[i][i];
      for (let c = i; c < 4; c++) m[r][c] -= f * m[i][c];
    }
  }
  const ay = m[2][3] / m[2][2];
  const ax = (m[1][3] - m[1][2] * ay) / m[1][1];
  return [(m[0][3] - m[0][1] * ax - m[0][2] * ay) / m[0][0], ax, ay];
}

export function readBackground(
  lab: Float32Array,
  w: number,
  h: number,
  x0: number,
  x1: number
): BgModel {
  const pw = x1 - x0;
  const N = pw * h;
  const comp = new Int32Array(N).fill(-1);
  const at = (i: number): Lab => [lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]];
  const gi = (lx: number, y: number) => y * w + x0 + lx;

  // Count each region's pixels in a band just inside the panel edge. The very edge is
  // skipped: screenshots carry a frame, shadow or rounded corner there that is not the background.
  const d1 = edgeMargin(pw);
  const d2 = Math.max(d1 + 3, Math.round(pw * 0.16));
  const inBand = (lx: number, y: number) => {
    const d = Math.min(lx, pw - 1 - lx, y, h - 1 - y);
    return d >= d1 && d <= d2;
  };
  let bandTotal = 0;
  for (let y = 0; y < h; y++) for (let lx = 0; lx < pw; lx++) if (inBand(lx, y)) bandTotal++;

  // Join neighbouring pixels whose colour barely changes.
  const sizes: number[] = [];
  const borderCount: number[] = [];
  const sumL: number[] = [];
  const sumA: number[] = [];
  const sumB: number[] = [];
  const sumX: number[] = [];
  const sumY: number[] = [];
  for (let s = 0; s < N; s++) {
    if (comp[s] !== -1) continue;
    const id = sizes.length;
    sizes.push(0);
    borderCount.push(0);
    sumL.push(0);
    sumA.push(0);
    sumB.push(0);
    sumX.push(0);
    sumY.push(0);
    const st = [s];
    comp[s] = id;
    while (st.length) {
      const q = st.pop() as number;
      const lx = q % pw;
      const y = (q - lx) / pw;
      sizes[id]++;
      if (inBand(lx, y)) borderCount[id]++;
      const here = at(gi(lx, y));
      sumL[id] += here[0];
      sumA[id] += here[1];
      sumB[id] += here[2];
      sumX[id] += lx;
      sumY[id] += y;
      const tryN = (nx: number, ny: number) => {
        if (nx < 0 || nx >= pw || ny < 0 || ny >= h) return;
        const j = ny * pw + nx;
        if (comp[j] !== -1) return;
        if (dE(here, at(gi(nx, ny))) < STEP) {
          comp[j] = id;
          st.push(j);
        }
      };
      tryN(lx - 1, y);
      tryN(lx + 1, y);
      tryN(lx, y - 1);
      tryN(lx, y + 1);
    }
  }

  let bg = 0;
  for (let c = 1; c < sizes.length; c++) if (borderCount[c] > borderCount[bg]) bg = c;

  const anchorsFor = (member: (c: number) => boolean) => {
    const anchors: [number, number][] = [
      [0.08, 0.05], [0.92, 0.05], [0.08, 0.95], [0.92, 0.95], [0.08, 0.5], [0.92, 0.5],
    ];
    const out: { u: number; v: number; lab: Lab }[] = [];
    for (const [u, v] of anchors) {
      const cx = u * pw;
      const cy = v * h;
      const r = Math.max(3, Math.round(pw * 0.12));
      const got: Lab[] = [];
      for (let y = Math.max(0, Math.round(cy - r)); y < Math.min(h, Math.round(cy + r)); y++) {
        for (let x = Math.max(0, Math.round(cx - r)); x < Math.min(pw, Math.round(cx + r)); x++) {
          if (member(comp[y * pw + x])) got.push(at(gi(x, y)));
        }
      }
      if (got.length >= 6) out.push({ u, v, lab: medianLab(got) });
    }
    return out;
  };
  const planeOf = (pts: { u: number; v: number; lab: Lab }[]) => {
    const pl = [0, 1, 2].map((ch) => fitPlane(pts.map((p) => ({ u: p.u, v: p.v, z: p.lab[ch] }))));
    return (u: number, v: number): Lab => [
      pl[0][0] + pl[0][1] * u + pl[0][2] * v,
      pl[1][0] + pl[1][1] * u + pl[1][2] * v,
      pl[2][0] + pl[2][1] * u + pl[2][2] * v,
    ];
  };

  // The background is often split by a phone crossing the panel; rejoin pieces that match
  // the colour the main region predicts at their position.
  const seedPts = anchorsFor((c) => c === bg);
  const isBg = new Uint8Array(sizes.length);
  isBg[bg] = 1;
  if (seedPts.length >= 3) {
    const seedModel = planeOf(seedPts);
    for (let c = 0; c < sizes.length; c++) {
      // Only pieces that reach the panel edge can be background; a phone screen that happens to match the colour sits inside.
      if (c === bg || sizes[c] < 40 || borderCount[c] === 0) continue;
      const mean: Lab = [sumL[c] / sizes[c], sumA[c] / sizes[c], sumB[c] / sizes[c]];
      const u = sumX[c] / sizes[c] / pw;
      const v = sumY[c] / sizes[c] / h;
      if (dE(mean, seedModel(u, v)) < 5) isBg[c] = 1;
    }
  }
  let bgSize = 0;
  let bgBand = 0;
  for (let c = 0; c < sizes.length; c++) {
    if (isBg[c]) {
      bgSize += sizes[c];
      bgBand += borderCount[c];
    }
  }
  const share = bgSize / N;
  const border = bgBand / Math.max(1, bandTotal);
  const pts = anchorsFor((c) => c >= 0 && isBg[c] === 1);
  const all: Lab[] = [];
  for (let q = 0; q < N; q += 3) if (isBg[comp[q]]) all.push(at(gi(q % pw, Math.floor(q / pw))));
  const overall = all.length ? medianLab(all) : ([50, 0, 0] as Lab);

  if (share < 0.3 || border < 0.25 || pts.length < 3) {
    return {
      read: {
        kind: "unreadable",
        colorA: labToHex(overall),
        status: "unreadable",
        note: "The background here isn't one smooth colour or gradient (a photo, pattern or several colour areas), so it can't be read.",
      },
      region: null,
    };
  }

  const region = new Uint8Array(w * h);
  for (let q = 0; q < N; q++) if (isBg[comp[q]]) region[gi(q % pw, Math.floor(q / pw))] = 1;

  const planes = [0, 1, 2].map((ch) => fitPlane(pts.map((p) => ({ u: p.u, v: p.v, z: p.lab[ch] }))));
  const model = (u: number, v: number): Lab => [
    planes[0][0] + planes[0][1] * u + planes[0][2] * v,
    planes[1][0] + planes[1][1] * u + planes[1][2] * v,
    planes[2][0] + planes[2][1] * u + planes[2][2] * v,
  ];
  const resid = Math.max(...pts.map((p) => dE(p.lab, model(p.u, p.v))));
  const spread = Math.max(...pts.map((p) => dE(p.lab, overall)));
  if (spread < 7) {
    return { read: { kind: "solid", colorA: labToHex(overall), status: "measured" }, region };
  }
  if (resid < 9) {
    const dx = dE(model(0, 0.5), model(1, 0.5));
    const dy = dE(model(0.5, 0), model(0.5, 1));
    const diagonal = Math.min(dx, dy) / Math.max(dx, dy, 0.001) > 0.45;
    return {
      read: {
        kind: "gradient",
        colorA: labToHex(model(0, 0)),
        colorB: labToHex(model(1, 1)),
        status: diagonal ? "measured" : "estimated",
        note: diagonal
          ? undefined
          : `The gradient runs ${dy > dx ? "top to bottom" : "left to right"}; the app paints gradients corner to corner, so it is approximated.`,
      },
      region,
    };
  }
  return {
    read: {
      kind: "gradient",
      colorA: labToHex(model(0, 0)),
      colorB: labToHex(model(1, 1)),
      status: "estimated",
      note: "The background has more than a simple two-colour gradient; approximated from its corners.",
    },
    region,
  };
}

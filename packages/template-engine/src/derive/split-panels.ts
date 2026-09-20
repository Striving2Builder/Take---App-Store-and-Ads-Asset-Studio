/** OWNER: packages/template-engine — find the panels in a listing-strip screenshot */
import { dE, type Lab } from "./pixels";
import type { Finding, SplitMethod } from "./types";

export type PanelRange = { x0: number; x1: number };
export type SplitResult = {
  panels: PanelRange[];
  gutters: PanelRange[];
  method: SplitMethod;
  findings: Finding[];
};

/** Store-screenshot panels are roughly 9:19.5 (w/h). Used as a prior only. */
const PANEL_ASPECT = 0.4614;

type Run = { x0: number; x1: number; lab: Lab };

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

/** Columns where every pixel is (nearly) the same colour top to bottom. */
function uniformRuns(lab: Float32Array, w: number, h: number, joinDE: number): Run[] {
  const runs: Run[] = [];
  let cur: Run | null = null;
  for (let x = 0; x < w; x++) {
    let L = 0;
    let A = 0;
    let B = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 3;
      L += lab[i];
      A += lab[i + 1];
      B += lab[i + 2];
    }
    const mean: Lab = [L / h, A / h, B / h];
    let off = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 3;
      if (dE([lab[i], lab[i + 1], lab[i + 2]], mean) > 8) off++;
    }
    const uniform = off / h < 0.015;
    if (uniform && cur && dE(cur.lab, mean) < joinDE) {
      cur.x1 = x + 1;
    } else if (uniform) {
      cur = { x0: x, x1: x + 1, lab: mean };
      runs.push(cur);
    } else {
      cur = null;
    }
  }
  return runs;
}

function equalSplit(width: number, n: number): PanelRange[] {
  return Array.from({ length: n }, (_, i) => ({
    x0: Math.round((i * width) / n),
    x1: Math.round(((i + 1) * width) / n),
  }));
}

type GutterSplit = { panels: PanelRange[]; gutters: PanelRange[]; pitch: number; quality: number; notes: Finding[] };

/** Look for gaps between panels at one colour-sensitivity. */
function gutterSplit(lab: Float32Array, w: number, h: number, joinDE: number): GutterSplit | null {
  const pw0 = h * PANEL_ASPECT;
  const gmax = Math.max(3, 0.12 * pw0);
  const runs = uniformRuns(lab, w, h, joinDE);
  const candidates = runs.filter((r) => r.x0 > 0 && r.x1 < w && r.x1 - r.x0 <= gmax && r.x1 - r.x0 >= 3);

  // Real gaps share one colour and repeat at one spacing; a phone's own empty
  // side margins are also uniform but alternate wide/narrow.
  type Group = { runs: Run[]; lab: Lab };
  const groups: Group[] = [];
  for (const r of candidates) {
    const g = groups.find((x) => dE(x.lab, r.lab) < 4);
    if (g) g.runs.push(r);
    else groups.push({ runs: [r], lab: r.lab });
  }

  let best: { group: Group; score: number; pitch: number } | null = null;
  for (const g of groups) {
    const centers = g.runs.map((r) => (r.x0 + r.x1) / 2);
    const spans: number[] = [];
    for (let i = 1; i < centers.length; i++) spans.push(centers[i] - centers[i - 1]);
    const m = spans.length ? median(spans) : median([centers[0], w - centers[0]].filter((v) => v > 0));
    const aspect = m / h;
    if (aspect < 0.3 || aspect > 0.8) continue;
    const consistent = spans.filter((s) => s > 0.75 * m && s < 1.25 * m).length;
    const score =
      g.runs.length === 1 ? 1 : consistent - (spans.length - consistent) + 1 - Math.abs(aspect - PANEL_ASPECT);
    if (!best || score > best.score) best = { group: g, score, pitch: m };
  }
  if (!best) return null;

  const gutters: PanelRange[] = best.group.runs.map((r) => ({ x0: r.x0, x1: r.x1 }));
  // A margin run at an image edge in the gutter colour is an outer border, not a panel.
  let start = 0;
  let end = w;
  const first = runs[0];
  const last = runs[runs.length - 1];
  if (first && first.x0 === 0 && dE(first.lab, best.group.lab) < 4 && first.x1 < best.pitch * 0.35) start = first.x1;
  if (last && last.x1 === w && dE(last.lab, best.group.lab) < 4 && w - last.x0 < best.pitch * 0.35) end = last.x0;

  const bounds: PanelRange[] = [];
  let cursor = start;
  for (const g of gutters) {
    if (g.x0 - cursor > 2) bounds.push({ x0: cursor, x1: g.x0 });
    cursor = g.x1;
  }
  if (end - cursor > 2) bounds.push({ x0: cursor, x1: end });

  const m = best.pitch;
  const notes: Finding[] = [];
  const out: PanelRange[] = [];
  for (const b of bounds) {
    const wd = b.x1 - b.x0;
    if (wd < 0.25 * m) continue;
    if (wd > 1.6 * m) {
      const k = Math.round(wd / m);
      out.push(...equalSplit(wd, k).map((s) => ({ x0: b.x0 + s.x0, x1: b.x0 + s.x1 })));
      notes.push({
        scope: "Panels",
        status: "estimated",
        detail: `A stretch ${Math.round(wd)}px wide had no visible gap; it was divided into ${k} panels.`,
      });
    } else if (wd > 1.28 * m) {
      // Neither one panel nor two: this reading of the gaps is not trustworthy.
      return null;
    } else out.push(b);
  }
  if (!out.length) return null;

  // How evenly sized the panels came out (a cropped last panel is allowed to be short).
  const widths = out.map((p) => p.x1 - p.x0);
  const full = widths.slice(0, widths.length > 2 ? -1 : undefined);
  const mean = full.reduce((a, b) => a + b, 0) / full.length;
  const cv = Math.sqrt(full.reduce((a, b) => a + (b - mean) ** 2, 0) / full.length) / mean;
  const quality = -cv - Math.abs(mean / h - PANEL_ASPECT);
  return { panels: out, gutters, pitch: m, quality, notes };
}

export function splitPanels(
  lab: Float32Array,
  w: number,
  h: number,
  forcedCount?: number
): SplitResult {
  const findings: Finding[] = [];
  if (forcedCount && forcedCount > 0) {
    findings.push({
      scope: "Panels",
      status: "measured",
      detail: `Split into ${forcedCount} equal panels, as you set.`,
    });
    return { panels: equalSplit(w, forcedCount), gutters: [], method: "manual", findings };
  }

  const pw0 = h * PANEL_ASPECT;
  // A strip is often cropped mid-panel at the right edge: count a visible partial
  // panel once it is more than a sliver.
  const ratio = w / pw0;
  const frac = ratio - Math.floor(ratio);
  const estCount = Math.max(1, Math.min(12, frac >= 0.12 ? Math.ceil(ratio) : Math.max(1, Math.floor(ratio))));

  let best: GutterSplit | null = null;
  for (const joinDE of [2.5, 4.5, 6]) {
    const attempt = gutterSplit(lab, w, h, joinDE);
    if (attempt && (!best || attempt.quality > best.quality)) best = attempt;
  }

  if (!best || (best.panels.length < 2 && estCount > 1)) {
    const n = estCount;
    findings.push({
      scope: "Panels",
      status: n === 1 ? "measured" : "estimated",
      detail:
        n === 1
          ? "One panel."
          : `No clear gaps between panels, so the strip was split into ${n} equal panels from its proportions. Check the count and correct it if wrong.`,
    });
    return { panels: equalSplit(w, n), gutters: [], method: n === 1 ? "single" : "aspect", findings };
  }

  findings.push(...best.notes);
  findings.push({
    scope: "Panels",
    status: "measured",
    detail: `${best.panels.length} panel${best.panels.length === 1 ? "" : "s"} found from the gaps between them.`,
  });
  return {
    panels: best.panels,
    gutters: best.gutters,
    method: best.panels.length === 1 ? "single" : "gutters",
    findings,
  };
}

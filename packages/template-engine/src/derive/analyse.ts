/** OWNER: packages/template-engine — read the layout of a listing screenshot (no branding kept) */
import { downscale, labField, type Pixels } from "./pixels";
import { edgeMargin, readBackground } from "./read-background";
import { detectPhonesInPanel, edgeField } from "./detect-phones";
import { readDevices } from "./read-devices";
import { splitPanels } from "./split-panels";
import { type Analysis, type DeviceRead, type Finding, type PanelRead } from "./types";

export type AnalyseOptions = {
  /** Which phone finder to use: outline-based ("edge"), background-based ("mask"), or edge first with the mask as fallback. */
  engine?: "mask" | "edge" | "both";
  /** Test/debug only: receives the foreground mask. */
  debug?: { mask?: Uint8Array };
  /** Force the panel count when the automatic split is wrong. */
  panelCount?: number;
};

export function analyseScreenshot(source: Pixels, opts: AnalyseOptions = {}): Analysis {
  const { img } = downscale(source, 1400, 420);
  const w = img.width;
  const h = img.height;
  const lab = labField(img);
  const split = splitPanels(lab, w, h, opts.panelCount);
  const findings: Finding[] = [...split.findings];

  const models = split.panels.map((p) => readBackground(lab, w, h, p.x0, p.x1));
  const devs = readDevices(lab, w, h, split.panels, models, opts.debug);

  const engine = opts.engine ?? "both";
  if (engine !== "mask") {
    const valid = new Uint8Array(w * h);
    for (const p of split.panels) {
      const m = edgeMargin(p.x1 - p.x0);
      for (let y = m; y < h - m; y++) for (let x = p.x0 + m; x < p.x1 - m; x++) valid[y * w + x] = 1;
    }
    const field = edgeField(lab, w, h, valid);
    split.panels.forEach((p, i) => {
      const found = detectPhonesInPanel(field, p.x0, p.x1);
      const pw = p.x1 - p.x0;
      const edgeDevices: DeviceRead[] = found.map((f) => {
        let deg = f.rotationDeg;
        while (deg > 90) deg -= 180;
        while (deg <= -90) deg += 180;
        const r = (f.rotationDeg * Math.PI) / 180;
        const halfX = (Math.abs(Math.cos(r)) * f.w + Math.abs(Math.sin(r)) * f.h) / 2;
        const clipped = f.visible < 0.85;
        return {
          cx: (f.cx - p.x0) / pw,
          cy: f.cy / h,
          w: f.w / pw,
          rotationDeg: Math.round(deg * 10) / 10,
          clipped,
          spansNext: f.cx + halfX > p.x1 + 0.1 * pw,
          status: f.support >= 0.75 && !clipped ? "measured" : "estimated",
          note: clipped ? "Part of the outline is cut off by the panel edge; size and position follow the visible edges." : undefined,
        };
      });
      // The background-based read is precise where it works, so it is kept when it found phones
      // without complaint; the outline finder covers the panels it gave up on.
      const maskSettled = devs[i].devices.length > 0 && devs[i].unresolved.length === 0;
      if (engine === "edge" || (engine === "both" && edgeDevices.length && !maskSettled)) {
        devs[i].devices = edgeDevices;
        if (edgeDevices.length > 1) {
          devs[i].unresolved = [`${edgeDevices.length} phones were found here, close together or overlapping. Their boxes are estimates from the outlines; check them.`];
        }
        if (!edgeDevices.length) devs[i].unresolved = ["No phone outline was found in this panel."];
        else if (edgeDevices.length === 1) devs[i].unresolved = [];
      }
    });
  }

  const widths = split.panels.map((p) => p.x1 - p.x0).sort((a, b) => a - b);
  const medianW = widths[Math.floor(widths.length / 2)] || 1;

  const panels: PanelRead[] = split.panels.map((p, i) => {
    const cropped = i === split.panels.length - 1 && p.x1 - p.x0 < 0.8 * medianW;
    return {
      index: i,
      x0: p.x0,
      x1: p.x1,
      bg: models[i].read,
      devices: devs[i].devices,
      unresolved: devs[i].unresolved,
      textBand: devs[i].textBand,
      cropped,
    };
  });

  for (const pan of panels) {
    const label = `Panel ${pan.index + 1}`;
    if (pan.cropped) {
      findings.push({
        scope: label,
        status: "estimated",
        detail: "This panel is cut off at the edge of the screenshot, so its layout is only partly visible.",
      });
    }
    findings.push({
      scope: `${label} · background`,
      status: pan.bg.status,
      detail:
        pan.bg.kind === "solid"
          ? `Flat colour ${pan.bg.colorA}.`
          : pan.bg.kind === "gradient"
            ? `Gradient ${pan.bg.colorA} → ${pan.bg.colorB}.${pan.bg.note ? " " + pan.bg.note : ""}`
            : `Not read. ${pan.bg.note ?? ""}`,
    });
    for (const d of pan.devices) {
      findings.push({
        scope: `${label} · phone`,
        status: d.status,
        detail: `${Math.round(d.rotationDeg)}° tilt, ${Math.round(d.w * 100)}% of the panel wide${d.spansNext ? ", runs across into the next panel" : ""}.${d.note ? " " + d.note : ""}`,
      });
    }
    for (const u of pan.unresolved) findings.push({ scope: `${label} · phone`, status: "unreadable", detail: u });
    if (pan.textBand !== "unknown") {
      findings.push({
        scope: `${label} · text`,
        status: "measured",
        detail:
          pan.textBand === "none"
            ? "No headline area found."
            : `Text or graphics ${pan.textBand === "split" ? "at the top and bottom" : "at the " + pan.textBand}. Only the position is kept, never the words.`,
      });
    }
  }

  return {
    source: { width: source.width, height: source.height },
    analysed: { width: w, height: h },
    splitMethod: split.method,
    panels,
    findings,
  };
}

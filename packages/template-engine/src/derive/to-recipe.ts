/** OWNER: packages/template-engine — turn a read layout into a recipe (geometry + colour only, no source branding) */
import type { DeviceInstance, TemplateRecord, TypeBandKind } from "../template.types";
import { dE, hexLuminance, hexToRgb, rgbToLab } from "./pixels";
import { PHONE_ASPECT, type Analysis, type BackgroundRead, type PanelRead } from "./types";

export type DeriveOptions = {
  id: string;
  name: string;
  /** Put a plain centred phone on panels whose phone could not be read. Default: leave those panels out. */
  fillUnread?: boolean;
};

export type DeriveResult = {
  recipe: TemplateRecord;
  /** One line per thing that was left out or stood in, for the report. */
  notes: string[];
  /** True when there is nothing to build from (no phone read on any panel). */
  empty: boolean;
};

const labOf = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToLab(r, g, b);
};

/** Panel colour band as an SVG data URL: one solid or diagonal-gradient rect per panel. */
export function panelBand(bgs: BackgroundRead[]): string {
  const n = bgs.length;
  const defs: string[] = [];
  const rects = bgs
    .map((bg, i) => {
      if (bg.kind === "gradient" && bg.colorB) {
        defs.push(
          `<linearGradient id='g${i}' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${bg.colorA}'/><stop offset='1' stop-color='${bg.colorB}'/></linearGradient>`
        );
        return `<rect x='${i * 1290}' y='0' width='1290' height='2796' fill='url(#g${i})'/>`;
      }
      return `<rect x='${i * 1290}' y='0' width='1290' height='2796' fill='${bg.colorA}'/>`;
    })
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${n * 1290}' height='2796' viewBox='0 0 ${n * 1290} 2796'><defs>${defs.join("")}</defs>${rects}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function sameBackground(a: BackgroundRead, b: BackgroundRead): boolean {
  if (a.kind !== b.kind) return false;
  if (dE(labOf(a.colorA), labOf(b.colorA)) > 9) return false;
  if (a.kind === "gradient" && a.colorB && b.colorB) return dE(labOf(a.colorB), labOf(b.colorB)) <= 9;
  return true;
}

/** First palette colour becomes the CTA button fill under dark text, so it must be light or bright. */
function accentFrom(bgs: BackgroundRead[]): string {
  let best = "";
  let bestSat = -1;
  for (const bg of bgs) {
    for (const hex of [bg.colorA, bg.colorB].filter(Boolean) as string[]) {
      const [, a, b] = labOf(hex);
      const sat = Math.hypot(a, b);
      if (hexLuminance(hex) >= 0.35 && sat > bestSat) {
        best = hex;
        bestSat = sat;
      }
    }
  }
  return best || "#f3f1ec";
}

function modeOf<T>(vals: T[], fallback: T): T {
  const counts = new Map<T, number>();
  for (const v of vals) counts.set(v, (counts.get(v) || 0) + 1);
  let best = fallback;
  let n = 0;
  for (const [v, c] of counts) {
    if (c > n) {
      best = v;
      n = c;
    }
  }
  return best;
}

function bandOf(p: PanelRead): TypeBandKind | null {
  return p.textBand === "unknown" ? null : p.textBand;
}

export function recipeFromAnalysis(a: Analysis, opts: DeriveOptions): DeriveResult {
  const notes: string[] = [];
  let panels = a.panels.slice(0, 12);
  if (a.panels.length > 12) notes.push(`Only the first 12 of ${a.panels.length} panels were used.`);
  // A layout can't have an empty panel, so panels with no phone read are left out unless asked for.
  if (!opts.fillUnread) {
    const left = panels.filter((p) => p.devices.length === 0).map((p) => p.index + 1);
    if (left.length) {
      notes.push(`Panel${left.length === 1 ? "" : "s"} ${left.join(", ")} left out of the template: no phone could be read there.`);
      panels = panels.filter((p) => p.devices.length > 0);
    }
  }
  const n = panels.length;

  // Backgrounds: one shared background when every panel agrees, else a per-panel colour band.
  const bgs = panels.map((p) => p.bg);
  const unreadBg = panels.filter((p) => p.bg.kind === "unreadable");
  for (const p of unreadBg) {
    notes.push(`Panel ${p.index + 1}: background not read; its average edge colour ${p.bg.colorA} was used as a stand-in.`);
  }
  const standIn = (bg: BackgroundRead): BackgroundRead =>
    bg.kind === "unreadable" ? { kind: "solid", colorA: bg.colorA, status: "unreadable" } : bg;
  const use = bgs.map(standIn);
  const uniform = use.every((b) => sameBackground(b, use[0]));

  const devices: DeviceInstance[] = [];
  const sliceCount: number[] = Array.from({ length: n }, () => 0);
  panels.forEach((p, i) => {
    for (const d of p.devices) {
      if (sliceCount[i] >= 3) {
        notes.push(`Panel ${p.index + 1}: more than 3 phones; extra ones left out (the layout allows 3 per panel).`);
        break;
      }
      sliceCount[i]++;
      devices.push({
        id: `d${i}-${sliceCount[i]}`,
        x: +(i + d.cx).toFixed(3),
        y: +d.cy.toFixed(3),
        w: +d.w.toFixed(3),
        h: +(d.w * PHONE_ASPECT).toFixed(3),
        rotationDeg: d.rotationDeg,
        z: sliceCount[i],
        shotIndex: i,
        placement: d.spansNext && panels[i + 1]?.index === p.index + 1 ? "bleed-next" : "center",
        authored: true,
      });
    }
    if (!p.devices.length) {
      devices.push({
        id: `d${i}-fill`,
        x: i + 0.5,
        y: 0.58,
        w: 0.56,
        h: +(0.56 * PHONE_ASPECT).toFixed(3),
        rotationDeg: 0,
        z: 1,
        shotIndex: i,
        placement: "center",
        authored: true,
      });
      notes.push(`Panel ${p.index + 1}: no phone could be read; a plain centred phone stands in, as you chose.`);
    }
  });

  const spans = devices.some((d) => d.placement === "bleed-next");
  const composition = uniform && !spans ? "isolated" : "strip";
  const bands = panels.map(bandOf);
  const known = bands.filter((b): b is TypeBandKind => b !== null);
  const typeFamily = modeOf(
    known.filter((b) => b !== "none"),
    "top" as TypeBandKind
  );
  const typeBand: TypeBandKind[] = bands.map((b) => b ?? typeFamily);
  panels.forEach((p, i) => {
    if (p.textBand === "unknown") notes.push(`Panel ${p.index + 1}: text position not read; used the set's usual (${typeFamily}).`);
  });

  const first = use[0];
  const background: TemplateRecord["background"] = uniform
    ? first.kind === "gradient" && first.colorB
      ? { kind: "gradient", colorA: first.colorA, colorB: first.colorB }
      : { kind: "solid", colorA: first.colorA }
    : { kind: "image", colorA: first.colorA, imageUrl: panelBand(use), fit: "cover" };

  const accent = accentFrom(use);
  const dark = hexLuminance(first.colorA) < 0.4;
  const recipe: TemplateRecord = {
    id: opts.id,
    name: opts.name,
    tags: ["mobile", "layout", "screenshots", "derived"],
    version: 1,
    composition,
    deviceId: "apple.iphone-16-pro-max",
    defaultOrientation: "portrait",
    frameCount: n,
    typeFamily: typeFamily === "split" ? "split" : typeFamily === "none" ? "top" : typeFamily,
    typeBand,
    typeScale: "m",
    background,
    devices,
    extras: [],
    lockBrand: false,
    style: "derived",
    palette: [accent, first.colorA, dark ? "#f3f1ec" : "#161512", "#888888", "#ffffff"],
    provenance: { source: "user" },
  };
  return { recipe, notes, empty: devices.length === 0 };
}

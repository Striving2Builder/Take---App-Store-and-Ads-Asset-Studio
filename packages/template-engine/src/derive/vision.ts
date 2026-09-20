/** OWNER: packages/template-engine — schema, checking and merging for a vision model's read of the panels the
 *  local reader couldn't handle. Anything from here is labelled "vision", never "measured". */
import type { Analysis, BackgroundRead, DeviceRead, Finding, PanelRead } from "./types";

export const VISION_PROMPT = `You are reading the LAYOUT of an app-store screenshot set so it can be rebuilt as a reusable template.
The image is a strip of side-by-side panels (each panel is one store screenshot). Describe only geometry and colour.
Never transcribe text, names, logos, photos or app content.

For every panel, left to right, report:
- background: "solid" with colorA, or "gradient" with colorA (top-left) and colorB (bottom-right), as #rrggbb. If the panel background is a photo or pattern, use the single most representative flat colour and set kind "solid".
- textBand: where the headline text sits: "top", "bottom", "split" (both) or "none".
- devices: every phone in the panel. cx and cy are the phone's centre as fractions of THAT panel (cx from its left edge, cy from its top edge; a phone cut off by the panel edge should still report its full estimated centre, which may fall outside 0-1). width is the phone's width as a fraction of the panel width. rotationDeg is the clockwise tilt from upright in degrees (-90 to 90). spansNext is true only if the same phone continues across the cut into the next panel.

Count panels carefully: report exactly the panels you can see, including a partly cropped last one. Report at most 3 phones per panel.`;

const HEX = /^#[0-9a-fA-F]{6}$/;
const BANDS = ["top", "bottom", "split", "none"] as const;

/** JSON Schema for the model's structured answer. */
export const VISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["panels"],
  properties: {
    panels: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["background", "textBand", "devices"],
        properties: {
          background: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "colorA"],
            properties: {
              kind: { type: "string", enum: ["solid", "gradient"] },
              colorA: { type: "string" },
              colorB: { type: "string" },
            },
          },
          textBand: { type: "string", enum: [...BANDS] },
          devices: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["cx", "cy", "width", "rotationDeg", "spansNext"],
              properties: {
                cx: { type: "number" },
                cy: { type: "number" },
                width: { type: "number" },
                rotationDeg: { type: "number" },
                spansNext: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export type VisionPanel = {
  background: { kind: "solid" | "gradient"; colorA: string; colorB?: string };
  textBand: (typeof BANDS)[number];
  devices: { cx: number; cy: number; width: number; rotationDeg: number; spansNext: boolean }[];
};
export type VisionRead = { panels: VisionPanel[] };

const num = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null;

/** Check a model answer field by field. Returns the read, or the reason it was rejected. */
export function parseVision(text: string): { ok: true; read: VisionRead } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "The model's answer wasn't valid JSON." };
  }
  const panelsRaw = (raw as { panels?: unknown })?.panels;
  if (!Array.isArray(panelsRaw) || panelsRaw.length < 1 || panelsRaw.length > 12) {
    return { ok: false, error: "The model's answer had no panels (or more than 12)." };
  }
  const panels: VisionPanel[] = [];
  for (let i = 0; i < panelsRaw.length; i++) {
    const p = panelsRaw[i] as Record<string, unknown>;
    const bg = p?.background as Record<string, unknown> | undefined;
    if (!bg || (bg.kind !== "solid" && bg.kind !== "gradient") || typeof bg.colorA !== "string" || !HEX.test(bg.colorA)) {
      return { ok: false, error: `Panel ${i + 1}: background colour was missing or not #rrggbb.` };
    }
    if (bg.kind === "gradient" && !(typeof bg.colorB === "string" && HEX.test(bg.colorB))) {
      return { ok: false, error: `Panel ${i + 1}: gradient had no valid second colour.` };
    }
    if (!BANDS.includes(p.textBand as (typeof BANDS)[number])) {
      return { ok: false, error: `Panel ${i + 1}: text position wasn't one of top, bottom, split, none.` };
    }
    const devsRaw = p.devices;
    if (!Array.isArray(devsRaw) || devsRaw.length > 3) {
      return { ok: false, error: `Panel ${i + 1}: phones list was missing or longer than 3.` };
    }
    const devices: VisionPanel["devices"] = [];
    for (const dv of devsRaw as Record<string, unknown>[]) {
      const cx = num(dv.cx, -0.6, 1.6);
      const cy = num(dv.cy, -0.6, 1.6);
      const width = num(dv.width, 0.1, 1.05);
      const rot = num(dv.rotationDeg, -90, 90);
      if (cx === null || cy === null || width === null || rot === null || typeof dv.spansNext !== "boolean") {
        return { ok: false, error: `Panel ${i + 1}: a phone had a missing or out-of-range number.` };
      }
      devices.push({ cx, cy, width, rotationDeg: rot, spansNext: dv.spansNext });
    }
    panels.push({
      background: {
        kind: bg.kind,
        colorA: bg.colorA.toLowerCase(),
        ...(bg.kind === "gradient" ? { colorB: (bg.colorB as string).toLowerCase() } : {}),
      },
      textBand: p.textBand as VisionPanel["textBand"],
      devices,
    });
  }
  return { ok: true, read: { panels } };
}

/** Panels the local reader could not finish: unreadable background, or shapes it refused to guess. */
export function panelsNeedingHelp(a: Analysis): number[] {
  return a.panels
    .filter((p) => p.bg.kind === "unreadable" || p.unresolved.length > 0 || p.devices.length === 0)
    .map((p) => p.index);
}

export function mergeVision(
  a: Analysis,
  v: VisionRead,
  only: number[] = panelsNeedingHelp(a)
): { analysis: Analysis; error?: string } {
  if (v.panels.length !== a.panels.length) {
    return {
      analysis: a,
      error: `The model counted ${v.panels.length} panels but the local read found ${a.panels.length}, so nothing was merged. Set the panel count to match the image and try again.`,
    };
  }
  const findings: Finding[] = [...a.findings];
  const panels: PanelRead[] = a.panels.map((p) => {
    if (!only.includes(p.index)) return p;
    const vp = v.panels[p.index];
    const bg: BackgroundRead =
      p.bg.kind === "unreadable"
        ? { ...vp.background, status: "vision", note: "Read by the vision model; not measured." }
        : p.bg;
    const devices: DeviceRead[] =
      p.unresolved.length > 0 || p.devices.length === 0
        ? vp.devices.map((d) => ({
            cx: d.cx,
            cy: d.cy,
            w: d.width,
            rotationDeg: d.rotationDeg,
            clipped: d.cx < 0 || d.cx > 1 || d.cy < 0 || d.cy > 1,
            spansNext: d.spansNext,
            status: "vision" as const,
            note: "Read by the vision model; not measured.",
          }))
        : p.devices;
    findings.push({
      scope: `Panel ${p.index + 1}`,
      status: "vision",
      detail: `Filled in by the vision model: ${devices.length} phone${devices.length === 1 ? "" : "s"}${p.bg.kind === "unreadable" ? ", background" : ""}. These are estimates, not pixel measurements.`,
    });
    return {
      ...p,
      bg,
      devices,
      unresolved: [],
      textBand: p.textBand === "unknown" ? vp.textBand : p.textBand,
    };
  });
  return { analysis: { ...a, panels, findings } };
}

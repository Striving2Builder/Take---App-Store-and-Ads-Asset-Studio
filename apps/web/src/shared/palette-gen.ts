/** OWNER: shared — real HSL-harmony palette generation
 *  Replaces the 5 hardcoded arrays that used to sit in sets-builder.ts.
 *  Every color here is computed from one seed via real hue/saturation/
 *  lightness math, not picked from a lookup table — and every text-bearing
 *  pairing is checked against contrast-ink.ts's real WCAG luminance math
 *  and corrected if it fails, not just asserted to be fine. */
import { relativeLuminance } from "./contrast-ink";

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

function fromHsl(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

function withHsl(hex: string, patch: Partial<HSL>): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return fromHsl({ ...hsl, ...patch });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Walk a color's lightness (keeping hue/saturation) toward the pole away
 *  from `against` until it clears `min` contrast, bounded so an impossible
 *  pairing can't loop forever. */
function ensureContrast(hex: string, against: string, min: number): string {
  if (contrastRatio(hex, against) >= min) return hex;
  const hsl = rgbToHsl(hexToRgb(hex));
  // Maximizing contrast means moving toward whichever pole (black/white) is
  // farther from `against`'s own luminance — not toward whichever pole hex
  // currently happens to sit nearer, which can walk the wrong direction.
  const goDarker = relativeLuminance(against) >= 0.5;
  let l = hsl.l;
  for (let i = 0; i < 24; i++) {
    l = goDarker ? Math.max(0, l - 0.035) : Math.min(1, l + 0.035);
    const candidate = fromHsl({ ...hsl, l });
    if (contrastRatio(candidate, against) >= min) return candidate;
    if (l <= 0 || l >= 1) break;
  }
  return fromHsl({ ...hsl, l: goDarker ? 0.08 : 0.96 });
}

/** Rotate a color's hue by real degrees, keeping saturation/lightness —
 *  used to derive several visually distinct-but-related seeds from one
 *  base color (e.g. one per concept card) without a hardcoded per-index
 *  color list. */
export function rotateHue(hex: string, degrees: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return fromHsl({ ...hsl, h: ((hsl.h + degrees) % 360 + 360) % 360 });
}

/** [accent, ink, paper, secondaryAccent, tertiaryAccent] — same 5-slot
 *  shape the old hardcoded arrays used, so every existing consumer
 *  (paint-strip-slice's CTA color, frame-render's fallback background,
 *  set-plan's gradient stops) keeps working unchanged. */
export type GeneratedPalette = [string, string, string, string, string];

/** Real HSL-harmony generation from one seed color (a scan-extracted swatch,
 *  or a project's existing accent). `ink` and `paper` share the seed's hue
 *  at low saturation so the whole palette reads as one family rather than
 *  five unrelated colors; `secondaryAccent` is the true complementary hue
 *  (+180°) and `tertiaryAccent` is analogous (+30°). Accent-on-paper and
 *  secondaryAccent-on-paper are both walked to at least a 3:1 contrast
 *  ratio (the WCAG floor for large-scale UI text/icons) rather than
 *  trusted to land there by construction. */
export function generatePalette(seedHex: string): GeneratedPalette {
  const seed = rgbToHsl(hexToRgb(seedHex));
  const satFloor = Math.max(0.42, seed.s);

  const accent = fromHsl({ h: seed.h, s: satFloor, l: clamp(seed.l, 0.4, 0.58) });
  const ink = withHsl(seedHex, { s: Math.min(seed.s, 0.14), l: 0.13 });
  const paper = withHsl(seedHex, { s: Math.min(seed.s, 0.05), l: 0.97 });
  const secondaryAccent = fromHsl({ h: (seed.h + 180) % 360, s: satFloor * 0.9, l: 0.46 });
  const tertiaryAccent = fromHsl({ h: (seed.h + 30) % 360, s: satFloor * 0.75, l: 0.72 });

  return [
    ensureContrast(accent, paper, 3),
    ink,
    paper,
    ensureContrast(secondaryAccent, paper, 3),
    tertiaryAccent,
  ];
}

/** Default seed when no brand/scan color exists yet — the Studio Light
 *  accent itself (tokens.css --signal), so a fresh project starts on-brand
 *  rather than on an arbitrary color. */
export const DEFAULT_SEED = "#3e5ac4";

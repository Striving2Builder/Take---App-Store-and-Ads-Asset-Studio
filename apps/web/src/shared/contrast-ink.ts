/** OWNER: shared — background-aware text ink shared by canvas export + DOM edit overlay */

/** WCAG relative luminance, 0 (black) – 1 (white). Shared with palette-gen.ts
 *  so contrast checking has one implementation, not two. */
export function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two hex colors, 1 (identical) – 21 (black/white). */
export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG grade for a foreground/background pair — same thresholds
 *  Library's palette showcase and the Style tab's palette wheel both grade
 *  swatches by, kept in one place so the two never drift apart. */
export type ContrastGrade = "AAA" | "AA" | "AA-LARGE" | "LOW";

export function contrastGrade(a: string, b: string): { grade: ContrastGrade; ratio: number } {
  const ratio = contrastRatio(a, b);
  if (ratio >= 7) return { grade: "AAA", ratio };
  if (ratio >= 4.5) return { grade: "AA", ratio };
  if (ratio >= 3) return { grade: "AA-LARGE", ratio };
  return { grade: "LOW", ratio };
}

export type Ink = { text: string; dim: string; accent: string };

const ON_DARK_BG: Ink = { text: "#f3f1ec", dim: "#c8c4bb", accent: "#3de0ff" };
const ON_LIGHT_BG: Ink = { text: "#161512", dim: "#4a4740", accent: "#0f6478" };

/** Pick readable kicker/headline/caption colors for a given background fill. */
export function inkForBackground(colorA?: string, colorB?: string): Ink {
  if (!colorA) return ON_DARK_BG;
  const lumA = relativeLuminance(colorA);
  const lumB = colorB ? relativeLuminance(colorB) : lumA;
  return (lumA + lumB) / 2 > 0.5 ? ON_LIGHT_BG : ON_DARK_BG;
}

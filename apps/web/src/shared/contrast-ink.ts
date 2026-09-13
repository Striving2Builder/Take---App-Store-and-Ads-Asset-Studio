/** OWNER: shared — background-aware text ink shared by canvas export + DOM edit overlay */

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
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

import { generatePalette, DEFAULT_SEED } from "./palette-gen";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function isHex(s: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(s);
}

const seeds = [DEFAULT_SEED, "#ff4d1a", "#1f7a4d", "#111111", "#ffffff", "#b23a2e"];

for (const seed of seeds) {
  const palette = generatePalette(seed);
  assert(palette.length === 5, `${seed}: palette has 5 entries`);
  palette.forEach((c, i) => assert(isHex(c), `${seed}: slot ${i} (${c}) is a real hex color`));

  const [accent, ink, paper, secondaryAccent] = palette;
  assert(accent !== ink && ink !== paper && accent !== paper, `${seed}: accent/ink/paper are distinct`);

  // The two roles every consumer actually paints text/CTAs on top of paper
  // with — accent and secondaryAccent — must clear a real 3:1 contrast
  // ratio against paper, not just look plausible.
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const contrast = (a: string, b: string) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  assert(contrast(accent, paper) >= 3, `${seed}: accent (${accent}) meets 3:1 against paper (${paper})`);
  assert(
    contrast(secondaryAccent, paper) >= 3,
    `${seed}: secondaryAccent (${secondaryAccent}) meets 3:1 against paper (${paper})`
  );
}

// Same seed twice → same palette (deterministic, not random per call).
const a = generatePalette("#3e5ac4");
const b = generatePalette("#3e5ac4");
assert(JSON.stringify(a) === JSON.stringify(b), "generation is deterministic for a given seed");

// Different seeds → different accents (it's actually reading the seed).
const orange = generatePalette("#ff4d1a")[0];
const green = generatePalette("#1f7a4d")[0];
assert(orange !== green, "different seeds produce different accents");

console.log("palette-gen.test ok");

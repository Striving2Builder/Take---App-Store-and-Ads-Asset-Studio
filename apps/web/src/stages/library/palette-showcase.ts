/** OWNER: stages/library — brand palette showcase card
 *  Real generated palette (palette-gen.ts) + real WCAG contrast math
 *  (contrast-ink.ts), not a static swatch list. The seed honestly reflects
 *  whatever brand color data actually exists this session — a scanned
 *  icon, the active project's accent, or the studio default — and says
 *  which one it is rather than implying "from your icon" when nothing
 *  has been scanned yet. */
import { generatePalette, DEFAULT_SEED, type GeneratedPalette } from "../../shared/palette-gen";
import { relativeLuminance, contrastGrade, type ContrastGrade } from "../../shared/contrast-ink";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";

const SLOT_LABEL = ["Accent", "Ink", "Paper", "Secondary", "Tertiary"] as const;

function seedAndSource(): { seed: string; heading: string; sub: string } {
  const scanSwatch = state.scanPalette?.swatches?.[0]?.hex;
  if (scanSwatch) {
    return {
      seed: scanSwatch,
      heading: "Generated from your scanned icon",
      sub: "One extracted seed color, expanded with contrast-checked harmony rules — every export uses this palette.",
    };
  }
  const activeSeed = state.sets[state.selectedSet]?.palette?.[0];
  if (activeSeed) {
    return {
      seed: activeSeed,
      heading: "Generated from your active project",
      sub: "This project's accent, expanded with contrast-checked harmony rules.",
    };
  }
  return {
    seed: DEFAULT_SEED,
    heading: "Studio default accent",
    sub: "Scan an app or start a take to generate your own brand palette instead of this default.",
  };
}

const GRADE_LABEL: Record<ContrastGrade, string> = {
  AAA: "AAA",
  AA: "AA",
  "AA-LARGE": "AA·L",
  LOW: "LOW",
};

function swatchHtml(hex: string, role: string): string {
  const ink = relativeLuminance(hex) > 0.5 ? "#14151b" : "#ffffff";
  const badge = contrastGrade(hex, ink);
  return `
    <div class="palette-swatch" style="background:${hex};color:${ink}" title="${role} · ${escapeHtml(hex)} · contrast ${badge.ratio.toFixed(1)}:1">
      <span class="palette-swatch-badge">${GRADE_LABEL[badge.grade]}</span>
      <span class="palette-swatch-hex mono">${escapeHtml(hex)}</span>
    </div>`;
}

export function renderPaletteShowcase(): void {
  const host = $("#palette-showcase");
  if (!host) return;
  const { seed, heading, sub } = seedAndSource();
  const colors: GeneratedPalette = generatePalette(seed);
  host.innerHTML = `
    <div class="palette-showcase-lead">
      <p class="eyebrow">Brand palette</p>
      <h3>${escapeHtml(heading)}</h3>
      <p>${escapeHtml(sub)}</p>
    </div>
    <div class="palette-swatch-row">
      ${colors.map((hex, i) => swatchHtml(hex, SLOT_LABEL[i])).join("")}
    </div>`;
}

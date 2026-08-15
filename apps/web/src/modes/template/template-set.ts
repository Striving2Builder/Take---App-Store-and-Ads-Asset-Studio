/** OWNER: modes/template — ProjectSet from an applied recipe */
import type { InferenceBrief, ProjectSet } from "@take/core";
import type { TemplateRecord } from "@take/template-engine";
import { applyTemplate } from "@take/template-engine";
import { buildCopy } from "../wizard/copy-builder";

const FALLBACK_PALETTE = ["#ff4d1a", "#0c0d10", "#f3f1ec", "#3de0ff", "#1e2129"];

export function paletteFor(
  lockBrand: boolean | undefined,
  recipePalette: string[] | undefined,
  seed?: string[]
): string[] {
  if (lockBrand && recipePalette?.length) return recipePalette.slice(0, 5);
  const raw = (seed || []).filter(Boolean);
  if (!raw.length) return recipePalette?.length ? recipePalette.slice(0, 5) : FALLBACK_PALETTE;
  return [...raw, ...FALLBACK_PALETTE.filter((c) => !raw.includes(c))].slice(0, 5);
}

export function projectSetFromRecipe(
  recipe: TemplateRecord,
  brief: InferenceBrief,
  opts: { deviceId?: string; seedPalette?: string[]; index?: number }
): ProjectSet {
  const applied = applyTemplate({ recipe, brief, shotCount: recipe.frameCount });
  const generated = recipe.provenance?.source === "generated";
  const fallback = !!recipe.provenance?.fallback;
  const strip = recipe.composition === "strip";
  const blurb = fallback
    ? "Isolated-center fallback — grammar draws were illegal. Combinatorics, not AI."
    : generated
      ? `${strip ? "Strip" : "Isolated"} layout from grammar ${recipe.provenance?.grammarVersion || ""} · seed ${recipe.provenance?.seed || "—"}. Not LLM.`
      : strip
        ? `Strip recipe — export clips one world into ${recipe.frameCount} PNGs.`
        : `Recipe “${recipe.name}” applied with ordered shots.`;
  return {
    id: `set-tpl-${recipe.id}-${opts.index ?? 0}`,
    name: recipe.name,
    styleLabel: generated
      ? `Generated · ${recipe.composition}${fallback ? " · fallback" : ""}`
      : `Template · ${recipe.name}`,
    style: recipe.style || brief.style,
    blurb,
    frames: applied.frames,
    copy: buildCopy(brief, opts.index ?? 0),
    palette: paletteFor(recipe.lockBrand, recipe.palette, opts.seedPalette),
    deviceId: recipe.deviceId || opts.deviceId,
    composition: recipe.composition,
    layout: { composition: recipe.composition, recipe },
  };
}

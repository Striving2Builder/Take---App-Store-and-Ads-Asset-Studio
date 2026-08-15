/** OWNER: packages/template-engine — hand-authored strip seed (generator is AFTER strip paint) */
import type { TemplateRecord } from "../template.types";

/**
 * Sleep-row style seed: 5 slices, device 0 bleeds 0→1, slice 1 also has a local device.
 * Coords: x/w/h in slice-widths, y in slice-heights. Generator is not this file.
 */
export const STRIP_BLEED_HOOK: TemplateRecord = {
  id: "seed-strip-bleed-hook",
  name: "Strip · bleed hook",
  tags: ["strip", "bleed", "ios"],
  version: 1,
  composition: "strip",
  deviceId: "apple.iphone-16-pro-max",
  defaultOrientation: "portrait",
  frameCount: 5,
  typeFamily: "top",
  typeScale: "m",
  background: { kind: "gradient", colorA: "#3d1a5c", colorB: "#e07a3a" },
  lockBrand: false,
  style: "premium",
  provenance: { source: "seed", grammarVersion: "2026.08-plan" },
  devices: [
    {
      id: "bleed-0",
      x: 1.0,
      y: 0.62,
      w: 0.78,
      h: 0.78 * (844 / 390),
      rotationDeg: -12,
      z: 1,
      shotIndex: 0,
      placement: "bleed-next",
    },
    {
      id: "local-1",
      x: 1.5,
      y: 0.58,
      w: 0.52,
      h: 0.52 * (844 / 390),
      rotationDeg: 4,
      z: 2,
      shotIndex: 1,
      placement: "center",
    },
    {
      id: "local-2",
      x: 2.5,
      y: 0.55,
      w: 0.62,
      h: 0.62 * (844 / 390),
      rotationDeg: -3,
      z: 1,
      shotIndex: 2,
      placement: "center",
    },
    {
      id: "local-3",
      x: 3.5,
      y: 0.55,
      w: 0.62,
      h: 0.62 * (844 / 390),
      rotationDeg: 2,
      z: 1,
      shotIndex: 3,
      placement: "center",
    },
    {
      id: "local-4",
      x: 4.5,
      y: 0.55,
      w: 0.62,
      h: 0.62 * (844 / 390),
      rotationDeg: -2,
      z: 1,
      shotIndex: 4,
      placement: "center",
    },
  ],
};

export function listSeedRecipes(): TemplateRecord[] {
  return [STRIP_BLEED_HOOK];
}

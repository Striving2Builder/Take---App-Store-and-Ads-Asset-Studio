/** OWNER: packages/template-engine — isolated: one device per slice, no bleed */
import type { DeviceInstance, DevicePlacement } from "../template.types";
import type { Grammar } from "../grammar/tokens";
import { pickWeighted } from "../rng/seed";
import { jitterInstance } from "./place-token";
import type { DeviceMetrics } from "./types";

export function placeIsolated(
  rng: () => number,
  grammar: Grammar,
  n: number,
  metrics: DeviceMetrics
): DeviceInstance[] {
  const out: DeviceInstance[] = [];
  for (let i = 0; i < n; i++) {
    const placement = pickWeighted(rng, grammar.productions.isolatedPlacement) as DevicePlacement;
    out.push(
      jitterInstance(rng, grammar, placement, {
        id: `iso-${i}`,
        sliceIndex: i,
        shotIndex: i,
        z: 1,
        metrics,
        xBase: i,
      })
    );
  }
  return out;
}

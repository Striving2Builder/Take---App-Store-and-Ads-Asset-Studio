/** OWNER: packages/template-engine — strip: locals + 0–2 bleeds at integer cuts */
import type { DeviceInstance, DevicePlacement } from "../template.types";
import type { Grammar } from "../grammar/tokens";
import { slicesTouched } from "../constraints/bleed";
import { pickUniqueInts, pickWeighted } from "../rng/seed";
import { jitterInstance } from "./place-token";
import type { DeviceMetrics } from "./types";

function countSlice(
  devices: DeviceInstance[],
  i: number,
  n: number,
  metrics: DeviceMetrics
): number {
  return devices.filter((d) => slicesTouched(d, n, metrics.sliceW, metrics.sliceH).includes(i)).length;
}

export function placeStrip(
  rng: () => number,
  grammar: Grammar,
  n: number,
  bleedBudget: 0 | 1 | 2,
  metrics: DeviceMetrics
): DeviceInstance[] {
  const out: DeviceInstance[] = [];
  const maxBleed = Math.min(bleedBudget, Math.max(0, n - 1));
  const bounds = maxBleed > 0 ? pickUniqueInts(rng, maxBleed, 1, n - 1) : [];

  bounds.forEach((b, bi) => {
    // A fair coin flip — was rng() > 0.72, silently making bleed-next ~2.6x
    // more common than bleed-prev, so the one visually distinctive element
    // in a strip layout (a phone tilted hard at a slice boundary) leaned the
    // same direction most of the time instead of varying freely.
    const usePrev = rng() > 0.5;
    const placement: DevicePlacement = usePrev ? "bleed-prev" : "bleed-next";
    out.push(
      jitterInstance(rng, grammar, placement, {
        id: `bleed-${bi}`,
        sliceIndex: usePrev ? b : b - 1,
        shotIndex: b - 1,
        z: 1,
        metrics,
        xBase: usePrev ? b : b - 1,
      })
    );
  });

  for (let i = 0; i < n; i++) {
    const c = countSlice(out, i, n, metrics);
    if (c >= 2) continue;
    const rightOfBleed = bounds.includes(i);
    if (c === 0 || (c === 1 && rightOfBleed)) {
      const placement = pickWeighted(rng, grammar.productions.stripLocalPlacement) as DevicePlacement;
      out.push(
        jitterInstance(rng, grammar, placement, {
          id: `loc-${i}`,
          sliceIndex: i,
          shotIndex: i,
          z: 2,
          metrics,
          xBase: i,
        })
      );
    }
  }
  return out;
}

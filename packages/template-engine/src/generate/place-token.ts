/** OWNER: packages/template-engine — jitter a device from a grammar token */
import type { DeviceInstance, DevicePlacement } from "../template.types";
import type { Grammar, TokenRange } from "../grammar/tokens";
import { lerp } from "../rng/seed";
import type { DeviceMetrics } from "./types";

export function jitterInstance(
  rng: () => number,
  grammar: Grammar,
  placement: DevicePlacement,
  opts: {
    id: string;
    sliceIndex: number;
    shotIndex: number;
    z: number;
    metrics: DeviceMetrics;
    /** World x = sliceIndex + token.x  (bleed-next token.x ≈ 1) */
    xBase?: number;
  }
): DeviceInstance {
  const token: TokenRange = grammar.tokens.placements[placement];
  const xBase = opts.xBase ?? opts.sliceIndex;
  const w = lerp(rng, token.w[0], token.w[1]);
  return {
    id: opts.id,
    x: xBase + lerp(rng, token.x[0], token.x[1]),
    y: lerp(rng, token.y[0], token.y[1]),
    w,
    h: w * opts.metrics.shellAspect,
    rotationDeg: lerp(rng, token.rot[0], token.rot[1]),
    z: opts.z,
    shotIndex: opts.shotIndex,
    placement,
  };
}

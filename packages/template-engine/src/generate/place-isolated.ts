/** OWNER: packages/template-engine — isolated: one device per slice, optional one fan-3 */
import type { DeviceInstance, DevicePlacement } from "../template.types";
import type { Grammar } from "../grammar/tokens";
import { pickWeighted } from "../rng/seed";
import { jitterFromRange, jitterInstance } from "./place-token";
import type { DeviceMetrics } from "./types";

export function placeIsolated(
  rng: () => number,
  grammar: Grammar,
  n: number,
  metrics: DeviceMetrics
): DeviceInstance[] {
  const fanOn = grammar.productions.fan3 && grammar.tokens.fan3
    ? pickWeighted(rng, grammar.productions.fan3) === "1"
    : false;
  const fanSlice = fanOn ? Math.min(n - 1, Math.floor(rng() * n)) : -1;
  const out: DeviceInstance[] = [];
  for (let i = 0; i < n; i++) {
    if (i === fanSlice && grammar.tokens.fan3) {
      const fan = grammar.tokens.fan3;
      const roles = [
        { id: `fan-${i}-l`, token: fan.backLeft, z: 1, shot: i },
        { id: `fan-${i}-c`, token: fan.front, z: 3, shot: Math.min(i + 1, n - 1) },
        { id: `fan-${i}-r`, token: fan.backRight, z: 2, shot: Math.min(i + 2, n - 1) },
      ] as const;
      for (const role of roles) {
        out.push(
          jitterFromRange(rng, role.token, {
            id: role.id,
            sliceIndex: i,
            shotIndex: role.shot,
            z: role.z,
            metrics,
            xBase: i,
            placement: "center",
            authored: true,
          })
        );
      }
      continue;
    }
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

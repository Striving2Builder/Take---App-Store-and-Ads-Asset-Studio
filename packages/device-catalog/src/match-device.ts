/** OWNER: packages/device-catalog — pick the device that fits the user's actual screenshots */
import { listDevices } from "./catalog";
import type { DeviceProfile, PxSize } from "./device.types";

/** Groups near-identical sizes together — real device screenshots repeat their
 *  native size; a stray capture from a different source rarely matches exactly. */
function dominantSize(sizes: PxSize[]): PxSize {
  const counts = new Map<string, { size: PxSize; count: number }>();
  for (const s of sizes) {
    const key = `${s.w}x${s.h}`;
    const hit = counts.get(key);
    if (hit) hit.count++;
    else counts.set(key, { size: s, count: 1 });
  }
  let best = sizes[0];
  let bestCount = 0;
  let bestArea = 0;
  for (const { size, count } of counts.values()) {
    const area = size.w * size.h;
    if (count > bestCount || (count === bestCount && area > bestArea)) {
      best = size;
      bestCount = count;
      bestArea = area;
    }
  }
  return best;
}

/**
 * Pick the catalog device whose store screen needs the least upscaling from the
 * screenshots a user actually uploaded — instead of always defaulting to the
 * largest store slot regardless of source resolution.
 *
 * Uses the most common resolution in the batch (real device screenshots repeat
 * their native size) so one odd-sized outlier doesn't skew the pick.
 */
export function matchDeviceToScreenshots(
  sizes: PxSize[],
  platform: string
): DeviceProfile | undefined {
  const usable = sizes.filter((s) => s.w > 0 && s.h > 0);
  if (!usable.length) return undefined;
  const sample = dominantSize(usable);
  const portraitSample = sample.h >= sample.w ? sample : { w: sample.h, h: sample.w };

  const candidates = listDevices({ platform, status: "current" }).filter(
    (d) => d.formFactor === "phone"
  );
  if (!candidates.length) return undefined;

  let best: DeviceProfile | undefined;
  let bestScore = Infinity;
  for (const d of candidates) {
    const scale = Math.max(
      d.exportPx.w / portraitSample.w,
      d.exportPx.h / portraitSample.h
    );
    // No-upscale candidates always beat upscale candidates; among either group,
    // prefer the closest match (least wasted resolution / least stretching).
    const score = scale <= 1 ? 1 - scale : 10 + (scale - 1);
    if (score < bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

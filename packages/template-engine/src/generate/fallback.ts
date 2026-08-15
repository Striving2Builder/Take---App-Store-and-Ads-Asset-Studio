/** OWNER: packages/template-engine — isolated-center fallback (always legal) */
import type { DeviceInstance, TemplateRecord } from "../template.types";
import { GRAMMAR_VERSION } from "../grammar/load-grammar";
import type { DeviceMetrics } from "./types";
import type { SetPlan } from "./set-plan";

export function isolatedCenterFallback(
  plan: SetPlan,
  metrics: DeviceMetrics,
  seed: string,
  extras: {
    deviceId: string;
    orientation?: "portrait" | "landscape";
    palette?: string[];
    name?: string;
    lockBrand?: boolean;
  }
): TemplateRecord {
  const w = 0.56;
  const devices: DeviceInstance[] = Array.from({ length: plan.n }, (_, i) => ({
    id: `fb-${i}`,
    x: i + 0.5,
    y: 0.62,
    w,
    h: w * metrics.shellAspect,
    rotationDeg: 0,
    z: 1,
    shotIndex: i,
    placement: "center",
  }));
  return {
    id: `gen-${seed}`,
    name: extras.name || "Generated · isolated",
    tags: ["generated", "isolated", "fallback"],
    version: 1,
    composition: "isolated",
    deviceId: extras.deviceId,
    defaultOrientation: extras.orientation,
    frameCount: plan.n,
    typeFamily: plan.typeFamily,
    typeScale: plan.typeScale,
    background: plan.background,
    devices,
    palette: extras.palette,
    lockBrand: extras.lockBrand,
    provenance: {
      source: "generated",
      seed,
      grammarVersion: GRAMMAR_VERSION,
      fallback: true,
    },
  };
}

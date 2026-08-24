/** OWNER: packages/template-engine — sample-five store canvases (authoring helpers) */
import type { DeviceInstance, TemplateRecord } from "../template.types";
import { STRIP_BLEED_HOOK } from "./strip-bleed-hook";

const IOS = "apple.iphone-16-pro-max";
const PLAY = "google.pixel-9";
const IOS_ASPECT = 844 / 390;
const PLAY_ASPECT = 832 / 384;

function isoDevices(n: number, aspect: number, w = 0.58): DeviceInstance[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `iso-${i}`,
    x: i + 0.5,
    y: 0.52,
    w,
    h: w * aspect,
    rotationDeg: 0,
    z: 1,
    shotIndex: i,
    placement: "center" as const,
  }));
}

function isolatedRecipe(opts: {
  id: string;
  name: string;
  tags: string[];
  deviceId: string;
  n: number;
  aspect: number;
  style: string;
  typeFamily: TemplateRecord["typeFamily"];
  palette: string[];
  colorA: string;
  colorB?: string;
}): TemplateRecord {
  return {
    id: opts.id,
    name: opts.name,
    tags: opts.tags,
    version: 1,
    composition: "isolated",
    deviceId: opts.deviceId,
    defaultOrientation: "portrait",
    frameCount: opts.n,
    typeFamily: opts.typeFamily,
    typeScale: "m",
    background: opts.colorB
      ? { kind: "gradient", colorA: opts.colorA, colorB: opts.colorB }
      : { kind: "solid", colorA: opts.colorA },
    devices: isoDevices(opts.n, opts.aspect),
    extras: [],
    lockBrand: false,
    style: opts.style,
    palette: opts.palette,
    provenance: { source: "seed", grammarVersion: "2026.08" },
  };
}

function strip8(): TemplateRecord {
  const locals: DeviceInstance[] = Array.from({ length: 7 }, (_, k) => {
    const i = k + 1;
    const w = 0.58;
    return {
      id: `local-${i}`,
      x: i + 0.5,
      y: 0.56,
      w,
      h: w * IOS_ASPECT,
      rotationDeg: k % 2 === 0 ? 3 : -3,
      z: 1,
      shotIndex: i,
      placement: "center" as const,
    };
  });
  return {
    id: "sys-ios-strip-8",
    name: "Strip · eight-up",
    tags: ["strip", "ios", "screenshots"],
    version: 1,
    composition: "strip",
    deviceId: IOS,
    defaultOrientation: "portrait",
    frameCount: 8,
    typeFamily: "top",
    typeScale: "m",
    background: { kind: "gradient", colorA: "#0b1020", colorB: "#e07a3a" },
    devices: [
      {
        id: "bleed-0",
        x: 1.0,
        y: 0.62,
        w: 0.76,
        h: 0.76 * IOS_ASPECT,
        rotationDeg: -10,
        z: 1,
        shotIndex: 0,
        placement: "bleed-next",
      },
      ...locals,
    ],
    extras: [],
    lockBrand: false,
    style: "premium",
    palette: ["#e07a3a", "#0b1020", "#f3f1ec", "#3de0ff", "#1e2129"],
    provenance: { source: "seed", grammarVersion: "2026.08" },
  };
}

/** Five hand-authored store canvases for Library. */
export function listSystemRecipes(): TemplateRecord[] {
  return [
    STRIP_BLEED_HOOK,
    isolatedRecipe({
      id: "sys-ios-isolated-5",
      name: "iOS · isolated 5",
      tags: ["ios", "isolated", "screenshots"],
      deviceId: IOS,
      n: 5,
      aspect: IOS_ASPECT,
      style: "premium",
      typeFamily: "top",
      palette: ["#ff4d1a", "#0c0d10", "#f3f1ec", "#3de0ff", "#1e2129"],
      colorA: "#0c0d10",
      colorB: "#1a1030",
    }),
    isolatedRecipe({
      id: "sys-ios-isolated-10",
      name: "iOS · isolated 10",
      tags: ["ios", "isolated", "screenshots"],
      deviceId: IOS,
      n: 10,
      aspect: IOS_ASPECT,
      style: "minimal",
      typeFamily: "top",
      palette: ["#f3f1ec", "#111111", "#ff4d1a", "#888888", "#222222"],
      colorA: "#111111",
    }),
    isolatedRecipe({
      id: "sys-play-isolated-8",
      name: "Play · isolated 8",
      tags: ["android", "isolated", "screenshots"],
      deviceId: PLAY,
      n: 8,
      aspect: PLAY_ASPECT,
      style: "bold",
      typeFamily: "top",
      palette: ["#3de0ff", "#0b1018", "#eef6ff", "#ff4d1a", "#151c28"],
      colorA: "#0b1018",
      colorB: "#ff4d1a",
    }),
    strip8(),
  ];
}

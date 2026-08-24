/** OWNER: packages/template-engine — layout-only refs (geometry, not competitor art) */
import type { DeviceInstance, TemplateRecord } from "../template.types";
import { SAMPLE_ATTRIBUTION, SAMPLE_QUOTE, SAMPLE_STORE_LABEL } from "../extras/widget-copy";
import { copyMark, phone, rec, shapeSlot } from "./layout-ref-helpers";
import { listLayoutPackRecipes } from "./layout-refs-pack";

/** Prism/Charcoal stagger: phones high/low alternate, still one type family. */
function staggerCrop(): TemplateRecord {
  const ys = [0.76, 0.5, 0.76, 0.5, 0.76];
  const rots = [-5, 4, -3, 5, -4];
  return rec({
    id: "layout-stagger-crop-5",
    name: "Layout · stagger crop",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "minimal",
    background: { kind: "gradient", colorA: "#111318", colorB: "#2a2038" },
    palette: ["#f3f1ec", "#111318", "#ff4d1a", "#888888", "#1e2129"],
    devices: ys.map((y, i) => phone(`st-${i}`, i + 0.5, y, 0.56, i, { rotationDeg: rots[i] })),
    extras: [],
  });
}

/** Studio White: every phone sits low, cropped by the bottom edge. */
function lowCrop(): TemplateRecord {
  return rec({
    id: "layout-low-crop-5",
    name: "Layout · low crop",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "minimal",
    background: { kind: "solid", colorA: "#ece8e1" },
    palette: ["#1a1a1a", "#ece8e1", "#c4b8a8", "#888888", "#ffffff"],
    devices: Array.from({ length: 5 }, (_, i) =>
      phone(`lo-${i}`, i + 0.5, 0.78, 0.55, i, { rotationDeg: i % 2 === 0 ? -2 : 2 })
    ),
    extras: [],
  });
}

/** Two phones on the mid slice: one cropped top, one cropped bottom. */
function twoUpMid(): TemplateRecord {
  return rec({
    id: "layout-two-up-mid-5",
    name: "Layout · two-up mid",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "gradient", colorA: "#0b1020", colorB: "#1a1440" },
    palette: ["#e8dff5", "#0b1020", "#7b6cff", "#f3f1ec", "#1e2129"],
    devices: [
      phone("a0", 0.5, 0.54, 0.56, 0),
      phone("a1", 1.5, 0.54, 0.56, 1),
      phone("a2-top", 2.5, 0.22, 0.48, 2, { z: 1 }),
      phone("a2-bot", 2.5, 0.82, 0.48, 2, { z: 2 }),
      phone("a3", 3.5, 0.54, 0.56, 3),
      phone("a4", 4.5, 0.72, 0.56, 4),
    ],
    extras: [],
  });
}

/** Two overlapping tilted phones on slice 1. */
function overlapPair(): TemplateRecord {
  return rec({
    id: "layout-overlap-pair-5",
    name: "Layout · overlap pair",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "bold",
    background: { kind: "gradient", colorA: "#1a3d32", colorB: "#0d1f1a" },
    palette: ["#f3f1ec", "#1a3d32", "#6dffb0", "#111111", "#ffffff"],
    devices: [
      phone("p0", 0.5, 0.54, 0.56, 0, { rotationDeg: 6 }),
      phone("p1-front", 1.42, 0.56, 0.52, 1, { rotationDeg: 10, z: 2 }),
      phone("p1-back", 1.62, 0.58, 0.48, 1, { rotationDeg: -8, z: 1 }),
      phone("p2", 2.5, 0.54, 0.56, 2),
      phone("p3", 3.5, 0.54, 0.56, 3),
      phone("p4", 4.5, 0.54, 0.56, 4, { rotationDeg: -6 }),
    ],
    extras: [],
  });
}

/** Strip: yawed bleed 0→1 plus a shape extra across cut 2. */
function blobAcross(): TemplateRecord {
  const locals: DeviceInstance[] = [2, 3, 4].map((i) => phone(`loc-${i}`, i + 0.5, 0.56, 0.56, i));
  return rec({
    id: "layout-blob-across-5",
    name: "Layout · bleed + shape",
    composition: "strip",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "gradient", colorA: "#3d1a5c", colorB: "#e07a3a" },
    palette: ["#f3f1ec", "#3d1a5c", "#e07a3a", "#ff4d1a", "#1e2129"],
    devices: [
      phone("bleed-0", 1.0, 0.62, 0.76, 0, {
        placement: "bleed-next",
        rotationDeg: -8,
        rotateYDeg: 22,
        depth: 0.05,
        z: 1,
      }),
      phone("local-1", 1.5, 0.56, 0.5, 1, { rotationDeg: 4, z: 2 }),
      ...locals,
    ],
    extras: [
      shapeSlot("shape-cut", 2, 3.0, 0.16, 0.7, 0.2, "rgba(243,241,236,0.35)"),
      shapeSlot("shape-low", 3, 3.5, 0.88, 0.4, 0.14, "rgba(243,241,236,0.2)"),
    ],
  });
}

/** Three overlapping phones on slice 2, scribble rule, type marks. */
function fanThree(): TemplateRecord {
  return rec({
    id: "layout-fan-3-5",
    name: "Layout · fan 3",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "bold",
    background: { kind: "gradient", colorA: "#102018", colorB: "#1a3d32" },
    palette: ["#f3f1ec", "#102018", "#6dffb0", "#111111", "#ffffff"],
    devices: [
      phone("f0", 0.5, 0.54, 0.56, 0),
      phone("f1", 1.5, 0.54, 0.56, 1),
      phone("f2-l", 2.32, 0.58, 0.4, 2, { rotationDeg: -12, z: 1 }),
      phone("f2-c", 2.5, 0.6, 0.46, 2, { rotationDeg: 4, z: 3 }),
      phone("f2-r", 2.68, 0.58, 0.4, 2, { rotationDeg: 12, z: 2 }),
      phone("f3", 3.5, 0.54, 0.56, 3),
      phone("f4", 4.5, 0.55, 0.72, 4, { orientation: "landscape", rotationDeg: -6 }),
    ],
    extras: [
      shapeSlot("dot-line", 2, 2.5, 0.88, 0.72, 0.08, "rgba(243,241,236,0.4)", "scribble"),
      copyMark("fan-copy", 0, "Three **angles**"),
    ],
  });
}

/** Slice 2 is widgets only — no phone. */
function proofMid(): TemplateRecord {
  return rec({
    id: "layout-proof-mid-5",
    name: "Layout · proof mid",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    typeBand: ["top", "top", "none", "top", "top"],
    style: "premium",
    background: { kind: "solid", colorA: "#1a1440" },
    palette: ["#f3f1ec", "#1a1440", "#7b6cff", "#e8c36a", "#ffffff"],
    devices: [
      phone("p0", 0.5, 0.56, 0.56, 0),
      phone("p1", 1.5, 0.56, 0.56, 1),
      phone("p3", 3.5, 0.56, 0.56, 3),
      phone("p4", 4.5, 0.56, 0.56, 4),
    ],
    extras: [
      {
        id: "rate-2",
        kind: "visual",
        sliceIndex: 2,
        x: 2.5,
        y: 0.22,
        w: 0.72,
        h: 0.16,
        rotationDeg: 0,
        z: 22,
        fill: "#f3f1ec",
        widget: "rating",
        stars: 5,
        storeLabel: SAMPLE_STORE_LABEL,
        authored: true,
      },
      {
        id: "rev-2a",
        kind: "copy",
        sliceIndex: 2,
        x: 2.5,
        y: 0.48,
        w: 0.78,
        h: 0.2,
        rotationDeg: 0,
        z: 22,
        fill: "#f3f1ec",
        widget: "review",
        quote: SAMPLE_QUOTE,
        attribution: SAMPLE_ATTRIBUTION,
        stars: 5,
        authored: true,
      },
      {
        id: "pills-2",
        kind: "copy",
        sliceIndex: 2,
        x: 2.5,
        y: 0.78,
        w: 0.82,
        h: 0.1,
        rotationDeg: 0,
        z: 22,
        fill: "#f3f1ec",
        widget: "pills",
        pills: ["Focus", "Goals", "Habits"],
        authored: true,
      },
    ],
  });
}

/** Strip: bleed 0→1 with yaw so the right edge is visible across the cut. */
function yawBleed(): TemplateRecord {
  return rec({
    id: "layout-yaw-bleed-5",
    name: "Layout · yaw bleed",
    composition: "strip",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "gradient", colorA: "#0c1220", colorB: "#1a2840" },
    palette: ["#f3f1ec", "#0c1220", "#4d7cff", "#888888", "#1e2129"],
    devices: [
      phone("yaw-bleed", 1.0, 0.62, 0.76, 0, {
        placement: "bleed-next",
        rotateYDeg: 28,
        depth: 0.05,
        authored: true,
      }),
      phone("local-1", 1.5, 0.56, 0.5, 1, { rotationDeg: 4, z: 2 }),
      phone("loc-2", 2.5, 0.56, 0.56, 2),
      phone("loc-3", 3.5, 0.56, 0.56, 3),
      phone("loc-4", 4.5, 0.56, 0.56, 4),
    ],
    extras: [],
  });
}

/** Extra copy with pill / underline marks. Headline stays system-ui. */
function typeMarks(): TemplateRecord {
  return rec({
    id: "layout-type-marks-5",
    name: "Layout · type marks",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "bold",
    background: { kind: "gradient", colorA: "#1a1440", colorB: "#0c0d10" },
    palette: ["#f3f1ec", "#1a1440", "#e8c36a", "#ff4d1a", "#ffffff"],
    devices: Array.from({ length: 5 }, (_, i) => phone(`m-${i}`, i + 0.5, 0.58, 0.56, i)),
    extras: [
      copyMark("mk-0", 0, "Build **habits** that last"),
      copyMark("mk-1", 1, "++Every morning++ starts here"),
      copyMark("mk-2", 2, "Make **time** ++for you++", "script"),
      copyMark("mk-3", 3, "Stay **focused**"),
      copyMark("mk-4", 4, "Keep ++going++"),
    ],
  });
}

function listCoreLayoutRefs(): TemplateRecord[] {
  return [
    staggerCrop(),
    lowCrop(),
    twoUpMid(),
    overlapPair(),
    blobAcross(),
    fanThree(),
    proofMid(),
    yawBleed(),
    typeMarks(),
  ];
}

/** Geometry-only system cards. No competitor screenshots, logos, or photos. */
export function listLayoutRefRecipes(): TemplateRecord[] {
  return [...listCoreLayoutRefs(), ...listLayoutPackRecipes()];
}

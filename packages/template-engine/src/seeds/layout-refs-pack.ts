/** OWNER: packages/template-engine — Epic E geometry pack (no competitor art) */
import type { TemplateRecord } from "../template.types";
import {
  copyMark,
  miniScreen,
  phone,
  photoPlate,
  rec,
  shapeSlot,
  widgetSlot,
} from "./layout-ref-helpers";
import { SAMPLE_ATTRIBUTION, SAMPLE_QUOTE, SAMPLE_STORE_LABEL } from "../extras/widget-copy";

function tiltCrop(): TemplateRecord {
  return rec({
    id: "layout-tilt-crop-5",
    name: "Layout · tilt crop",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "bold",
    background: { kind: "gradient", colorA: "#f3f1ec", colorB: "#d9d2c5" },
    palette: ["#ff4d1a", "#f3f1ec", "#1a1a1a", "#888888", "#ffffff"],
    devices: [
      phone("t0", 0.5, 0.28, 0.58, 0, { rotationDeg: -10 }),
      phone("t1", 1.5, 0.78, 0.58, 1, { rotationDeg: 8 }),
      phone("t2", 2.5, 0.28, 0.58, 2, { rotationDeg: 6 }),
      phone("t3", 3.5, 0.78, 0.58, 3, { rotationDeg: -8 }),
      phone("t4", 4.5, 0.52, 0.56, 4, { rotationDeg: -4 }),
    ],
    extras: [
      shapeSlot("star-0", 0, 0.78, 0.72, 0.22, 0.14, "rgba(26,26,26,0.2)", "star"),
      shapeSlot("blob-2", 2, 2.22, 0.78, 0.28, 0.16, "rgba(255,77,26,0.28)"),
      copyMark("tilt-copy", 4, "Tilt **and** crop"),
    ],
  });
}

function proofPills(): TemplateRecord {
  return rec({
    id: "layout-proof-pills-5",
    name: "Layout · proof pills",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    typeBand: ["top", "top", "none", "top", "top"],
    style: "premium",
    background: { kind: "solid", colorA: "#0c1220" },
    palette: ["#f3f1ec", "#0c1220", "#4d7cff", "#e8c36a", "#ffffff"],
    devices: [
      phone("pp0", 0.5, 0.56, 0.56, 0),
      phone("pp1", 1.5, 0.56, 0.56, 1),
      phone("pp3", 3.5, 0.56, 0.56, 3),
      phone("pp4", 4.5, 0.56, 0.56, 4),
    ],
    extras: [
      widgetSlot("pills-cloud", 2, "pills", 2.5, 0.28, 0.84, 0.28, {
        pills: ["Search", "Save", "Share", "Focus", "Goals"],
      }),
      widgetSlot("rate-2", 2, "rating", 2.5, 0.62, 0.7, 0.16, {
        storeLabel: SAMPLE_STORE_LABEL,
      }),
      copyMark("pill-copy", 2, "A **tag** wall — no phone", undefined, 0.88),
    ],
  });
}

function photoSpan(): TemplateRecord {
  return rec({
    id: "layout-photo-span-5",
    name: "Layout · photo span",
    composition: "strip",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "gradient", colorA: "#1e2129", colorB: "#111318" },
    palette: ["#f3f1ec", "#1e2129", "#ff4d1a", "#888888", "#ffffff"],
    devices: [
      phone("ps0", 0.5, 0.62, 0.5, 0),
      phone("ps1", 1.5, 0.62, 0.5, 1),
      phone("ps2", 2.5, 0.58, 0.56, 2),
      phone("ps3", 3.5, 0.58, 0.56, 3),
      phone("ps4", 4.5, 0.58, 0.56, 4),
    ],
    extras: [
      photoPlate("photo-cut", 0, 1.0, 0.22, 0.86, 0.28),
      copyMark("photo-hint", 0, "Your photo ++spans++ this cut", undefined, 0.88, true),
    ],
  });
}

function yawExtra(): TemplateRecord {
  return rec({
    id: "layout-yaw-extra-5",
    name: "Layout · yaw extra",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "bold",
    background: { kind: "gradient", colorA: "#102018", colorB: "#0c1220" },
    palette: ["#f3f1ec", "#102018", "#6dffb0", "#e8c36a", "#ffffff"],
    devices: [
      phone("ye0", 0.5, 0.56, 0.54, 0, { rotateYDeg: -22, depth: 0.05 }),
      phone("ye1", 1.5, 0.56, 0.54, 1, { rotateYDeg: 26, depth: 0.05 }),
      phone("ye2", 2.5, 0.56, 0.54, 2, { rotateYDeg: -16, depth: 0.045 }),
      phone("ye3", 3.5, 0.56, 0.54, 3, { rotateYDeg: 20, depth: 0.045 }),
      phone("ye4", 4.5, 0.56, 0.54, 4, { rotateYDeg: -24, depth: 0.05 }),
    ],
    extras: [
      shapeSlot("obj-1", 1, 1.22, 0.24, 0.2, 0.12, "rgba(232,195,106,0.55)", "star"),
      shapeSlot("obj-3", 3, 3.78, 0.78, 0.24, 0.14, "rgba(109,255,176,0.35)"),
    ],
  });
}

function overlayPhoto(): TemplateRecord {
  return rec({
    id: "layout-overlay-photo-5",
    name: "Layout · overlay photo",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "minimal",
    background: { kind: "solid", colorA: "#ece8e1" },
    palette: ["#c4b8a8", "#ece8e1", "#1a1a1a", "#888888", "#ffffff"],
    devices: Array.from({ length: 5 }, (_, i) => phone(`op-${i}`, i + 0.5, 0.58, 0.56, i)),
    extras: [
      photoPlate("overlay-2", 2, 2.5, 0.42, 0.72, 0.36),
      copyMark("ov-hint", 2, "Drop **your** photo", undefined, 0.16),
    ],
  });
}

function bleedIllust(): TemplateRecord {
  return rec({
    id: "layout-bleed-illust-5",
    name: "Layout · bleed + plate",
    composition: "strip",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "gradient", colorA: "#1a1440", colorB: "#0b1020" },
    palette: ["#e8dff5", "#1a1440", "#7b6cff", "#f3f1ec", "#ffffff"],
    devices: [
      phone("bi-bleed", 1.0, 0.62, 0.72, 0, {
        placement: "bleed-next",
        rotateYDeg: 18,
        depth: 0.045,
      }),
      phone("bi-1", 1.5, 0.56, 0.48, 1, { z: 2 }),
      phone("bi-2", 2.5, 0.56, 0.56, 2),
      phone("bi-3", 3.5, 0.56, 0.56, 3),
      phone("bi-4", 4.5, 0.56, 0.56, 4),
    ],
    extras: [
      photoPlate("illust", 2, 2.5, 0.2, 0.7, 0.22),
      copyMark("illust-hint", 2, "Your illustration ++here++", undefined, 0.88),
    ],
  });
}

function yawStack(): TemplateRecord {
  return rec({
    id: "layout-yaw-stack-5",
    name: "Layout · yaw stack",
    composition: "strip",
    frameCount: 5,
    typeFamily: "top",
    style: "bold",
    background: { kind: "gradient", colorA: "#0c1220", colorB: "#1a2840" },
    palette: ["#f3f1ec", "#0c1220", "#4d7cff", "#888888", "#ffffff"],
    devices: [
      phone("ys0", 0.5, 0.56, 0.56, 0),
      phone("ys-back", 1.92, 0.52, 0.4, 1, {
        placement: "bleed-next",
        rotateYDeg: -20,
        depth: 0.05,
        z: 1,
      }),
      phone("ys-mid", 2.0, 0.58, 0.44, 1, {
        placement: "bleed-next",
        rotateYDeg: 8,
        depth: 0.05,
        z: 2,
      }),
      phone("ys-front", 2.08, 0.64, 0.4, 1, {
        placement: "bleed-next",
        rotateYDeg: 24,
        depth: 0.05,
        z: 3,
      }),
      phone("ys3", 3.5, 0.56, 0.56, 3),
      phone("ys4", 4.5, 0.56, 0.56, 4),
    ],
    extras: [],
  });
}

function panoYaw(): TemplateRecord {
  return rec({
    id: "layout-pano-yaw-5",
    name: "Layout · pano yaw",
    composition: "strip",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "image", colorA: "#111318", fit: "cover" },
    palette: ["#f3f1ec", "#111318", "#3de0ff", "#888888", "#ffffff"],
    devices: [
      phone("py0", 0.5, 0.58, 0.52, 0, { rotateYDeg: 20, depth: 0.05 }),
      phone("py1", 1.5, 0.58, 0.52, 1, { rotateYDeg: -16, depth: 0.045 }),
      phone("py2", 2.5, 0.58, 0.52, 2, { rotateYDeg: 22, depth: 0.05 }),
      phone("py3", 3.5, 0.58, 0.52, 3, { rotateYDeg: -18, depth: 0.045 }),
      phone("py4", 4.5, 0.58, 0.52, 4, { rotateYDeg: 14, depth: 0.04 }),
    ],
    extras: [copyMark("pano-hint", 0, "Strip panorama — ++your++ image", undefined, 0.88)],
  });
}

function proofFloat(): TemplateRecord {
  return rec({
    id: "layout-proof-float-5",
    name: "Layout · proof float",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    typeBand: ["top", "none", "top", "none", "top"],
    style: "premium",
    background: { kind: "gradient", colorA: "#0b1020", colorB: "#1a1440" },
    palette: ["#e8dff5", "#0b1020", "#7b6cff", "#f3f1ec", "#ffffff"],
    devices: [
      phone("pf0", 0.5, 0.56, 0.56, 0),
      phone("pf2", 2.5, 0.56, 0.56, 2),
      phone("pf4", 4.5, 0.56, 0.56, 4),
    ],
    extras: [
      widgetSlot("fl-rate", 1, "rating", 1.5, 0.22, 0.7, 0.16, {
        storeLabel: SAMPLE_STORE_LABEL,
      }),
      widgetSlot("fl-rev", 1, "review", 1.5, 0.52, 0.78, 0.22, {
        quote: SAMPLE_QUOTE,
        attribution: SAMPLE_ATTRIBUTION,
      }),
      widgetSlot("fl-pills", 1, "pills", 1.5, 0.82, 0.8, 0.1),
      widgetSlot("fl-rate-3", 3, "rating", 3.5, 0.28, 0.7, 0.18, {
        storeLabel: SAMPLE_STORE_LABEL,
      }),
      copyMark("fl-copy", 3, "Proof **floats** here", undefined, 0.58),
      widgetSlot("fl-pills-3", 3, "pills", 3.5, 0.8, 0.8, 0.1, {
        pills: ["Quiet", "Clear", "Fast"],
      }),
    ],
  });
}

function twoUpBadge(): TemplateRecord {
  return rec({
    id: "layout-two-up-badge-5",
    name: "Layout · two-up badges",
    composition: "isolated",
    frameCount: 5,
    typeFamily: "top",
    style: "premium",
    background: { kind: "gradient", colorA: "#0b1020", colorB: "#1a1440" },
    palette: ["#e8dff5", "#0b1020", "#7b6cff", "#e8c36a", "#ffffff"],
    devices: [
      phone("tb0", 0.5, 0.54, 0.56, 0),
      phone("tb1", 1.5, 0.54, 0.56, 1),
      phone("tb2-top", 2.5, 0.22, 0.48, 2, { z: 1 }),
      phone("tb2-bot", 2.5, 0.82, 0.48, 2, { z: 2 }),
      phone("tb3", 3.5, 0.54, 0.56, 3),
      phone("tb4", 4.5, 0.72, 0.56, 4),
    ],
    extras: [
      shapeSlot("badge-blob", 2, 2.5, 0.5, 0.36, 0.14, "rgba(232,195,106,0.4)"),
      widgetSlot("badge-rate", 4, "rating", 4.5, 0.2, 0.64, 0.14, {
        storeLabel: SAMPLE_STORE_LABEL,
      }),
      copyMark("badge-copy", 1, "Two-up ++with++ chrome"),
    ],
  });
}

export function listLayoutPackRecipes(): TemplateRecord[] {
  return [
    tiltCrop(),
    proofPills(),
    photoSpan(),
    yawExtra(),
    overlayPhoto(),
    bleedIllust(),
    yawStack(),
    panoYaw(),
    proofFloat(),
    twoUpBadge(),
  ];
}

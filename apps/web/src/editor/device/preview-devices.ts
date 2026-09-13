/** OWNER: editor/device — open Edit with stub set (no Generate required) */
import type { InferenceBrief } from "@take/core";
import { resolveDefaultDevice } from "@take/device-catalog";
import { state } from "../../app/app-state";
import { showStage } from "../../app/stage-machine";
import { renderEditor } from "../canvas/edit-canvas";
import { toast } from "../../shell/toast";
import { syncDevicePickerValue } from "./device-picker";
import { syncFitControlUi } from "./fit-control";
import { syncOrientationUi } from "./orientation-control";
import { syncShellViewUi } from "./shell-view-control";

function stubInference(): InferenceBrief {
  return {
    name: "Device preview",
    category: "Utilities",
    audience: "Catalog QA",
    where: "Editor",
    when: "Now",
    how: "Stub set",
    features: [],
    positioning: "Preview shells without Generate",
    narrative: "PARTIAL preview set for Device Catalog QA.",
    value: "Pick devices, fit, orientation, front/back.",
    differentiators: [],
    style: "minimal",
    platform: state.platform || "ios",
    locale: "en-US",
    goal: "install",
    host: "preview.local",
    mode: state.mode || "wizard",
    donot: "",
    tone: "",
    ux: "",
    refs: "",
  };
}

/** Seed a minimal set + brief so Edit/export validation can run. */
export function ensurePreviewProject() {
  if (!state.deviceId) {
    state.deviceId = resolveDefaultDevice(state.platform)?.id || "apple.iphone-16-pro-max";
  }
  if (!state.inference) state.inference = stubInference();
  if (!state.sets.length) {
    state.sets = [
      {
        id: "preview-set",
        name: "Device preview",
        styleLabel: "Preview",
        style: "minimal",
        blurb: "Stub set for catalog QA — not a generated take.",
        deviceId: state.deviceId,
        palette: ["#ff4d1a", "#0c0d10", "#3de0ff", "#f3f1ec"],
        frames: [
          {
            id: "preview-f0",
            index: 0,
            role: "HOOK",
            kicker: "01 · HOOK",
            headline: "Clarity before the scroll",
            caption: "One calm ritual. Zero noise.",
            cta: "Get the app",
          },
        ],
        copy: {
          iosTitle: "Device preview",
          iosSubtitle: "Catalog QA",
          iosPromo: "",
          iosKeywords: "",
          playTitle: "Device preview",
          playShort: "Preview device shells without Generate",
          playFull: "Stub project for Device Catalog.",
          cta: "Get the app",
        },
      },
    ];
    state.selectedSet = 0;
    state.activeFrame = 0;
  }
}

export function openDevicePreview() {
  ensurePreviewProject();
  syncDevicePickerValue();
  syncFitControlUi();
  syncOrientationUi();
  syncShellViewUi();
  // Show before painting — renderEditor() measures on-screen canvas sizes to
  // raster sharply; while the stage is still hidden, that reads 0.
  showStage("edit");
  renderEditor();
  toast("Device preview — shells & sizes (no Generate)");
}

/** OWNER: editor/device — apply catalog aspect + shell assets to #phone-mock (NOT style) */
import {
  getDevice,
  resolveDefaultDevice,
  resolveExportSize,
  resolveShellAsset,
} from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";

function platformMismatchHint(devicePlatform: string): string | null {
  const intake = state.platform;
  if (!intake || intake === "both") return null;
  if (intake === devicePlatform) return null;
  return "Cross-OS geometric fit — not OS UI conversion";
}

/**
 * Drive editor chrome from catalog: aspect, inset %, front/back shell asset.
 * Layout / ZIP also bake geometric chrome from DeviceProfile.hardware (island / punch).
 */
export function applyDeviceFrame() {
  const phone = $("#phone-mock") as HTMLElement | null;
  const screen = $("#phone-screen") as HTMLElement | null;
  const notch = $(".phone-notch") as HTMLElement | null;
  const hint = $("#device-fit-hint") as HTMLElement | null;
  const shellImg = $("#shell-asset") as HTMLImageElement | null;
  if (!phone || !screen) return;

  const resolved = resolveExportSize(
    state.deviceId,
    state.platform,
    state.orientation
  );
  if (resolved.fellBack && resolved.deviceId !== state.deviceId) {
    state.deviceId = resolved.deviceId;
  }

  const device = getDevice(state.deviceId);
  const { w, h } = resolved.size;
  const landscape = state.orientation === "landscape";

  let shellW = device?.shellPx.w ?? w;
  let shellH = device?.shellPx.h ?? h;
  let inset = device?.screenInset ?? { x: 0, y: 0, w: shellW, h: shellH };

  if (landscape) {
    if (device?.shellPxLandscape && device?.screenInsetLandscape) {
      shellW = device.shellPxLandscape.w;
      shellH = device.shellPxLandscape.h;
      inset = device.screenInsetLandscape;
    } else if (device?.shellPx) {
      // Fallback: swap portrait shell metrics
      shellW = device.shellPx.h;
      shellH = device.shellPx.w;
      const si = device.screenInset;
      inset = { x: si.y, y: si.x, w: si.h, h: si.w };
    } else {
      shellW = w;
      shellH = h;
      inset = { x: 0, y: 0, w: shellW, h: shellH };
    }
  }

  phone.style.setProperty("--shell-aspect", `${shellW} / ${shellH}`);
  phone.style.setProperty("--screen-inset-left", `${(inset.x / shellW) * 100}%`);
  phone.style.setProperty("--screen-inset-top", `${(inset.y / shellH) * 100}%`);
  phone.style.setProperty("--screen-inset-width", `${(inset.w / shellW) * 100}%`);
  phone.style.setProperty("--screen-inset-height", `${(inset.h / shellH) * 100}%`);
  phone.dataset.deviceId = state.deviceId;
  phone.dataset.formFactor = device?.formFactor || "phone";
  phone.dataset.shellKind = device?.shellKind || "frame";
  phone.dataset.shellView = state.shellView;
  phone.dataset.orientation = state.orientation;
  phone.dataset.shellFamily = device?.shellFamily || "";
  phone.classList.toggle("is-landscape", landscape);
  phone.classList.toggle("is-back", state.shellView === "back");

  if (notch) notch.hidden = true;

  const asset = resolveShellAsset(device, state.shellView, state.orientation);
  if (shellImg) {
    if (asset && (device?.shellKind === "asset" || asset)) {
      shellImg.src = asset;
      shellImg.hidden = false;
      phone.classList.add("has-shell-asset");
    } else {
      shellImg.removeAttribute("src");
      shellImg.hidden = true;
      phone.classList.remove("has-shell-asset");
    }
  }

  screen.classList.toggle("is-back-view", state.shellView === "back");

  // Screen corner radius tuned per family
  const radius =
    device?.shellFamily === "ipad"
      ? "10px"
      : device?.shellFamily?.includes("flip")
        ? "48px"
        : landscape
          ? "36px"
          : "40px";
  screen.style.borderRadius = radius;

  const mismatch = device ? platformMismatchHint(device.platform) : null;
  if (hint) {
    if (mismatch) {
      hint.hidden = false;
      hint.textContent = mismatch;
    } else if (device?.formFactor === "foldable") {
      hint.hidden = false;
      hint.textContent =
        device.shellFamily === "galaxy-fold-cover"
          ? "Foldable cover shell — inner display not modeled"
          : "Flip shell — hinge is illustrative only";
    } else {
      hint.hidden = true;
      hint.textContent = "";
    }
  }

  updateExportPresetSizeLabel(w, h);
}

export function updateExportPresetSizeLabel(w: number, h: number) {
  const iosLabel = document.querySelector(
    '#export-presets label.preset:has(input[value="ios-screens"]) em.mono'
  ) as HTMLElement | null;
  if (iosLabel) iosLabel.textContent = `${w}×${h}`;

  const playLabel = document.querySelector(
    '#export-presets label.preset:has(input[value="play-screens"]) em.mono'
  ) as HTMLElement | null;
  const device = getDevice(state.deviceId);
  if (playLabel && device?.platform === "android") {
    playLabel.textContent = `${w}×${h}`;
  } else if (playLabel) {
    const and = resolveDefaultDevice("android");
    const s = and ? resolveExportSize(and.id, "android", state.orientation).size : null;
    playLabel.textContent = s ? `${s.w}×${s.h}` : "from device catalog";
  }
}

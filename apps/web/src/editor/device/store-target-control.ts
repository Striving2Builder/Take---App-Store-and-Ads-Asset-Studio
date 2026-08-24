/** OWNER: editor/device — iOS | Android store-target (shell + export size) */
import { getDevice, resolveDefaultDevice } from "@take/device-catalog";
import { screenshotCountOk } from "@take/core";
import {
  applyShellBind,
  IOS_ASPECT,
  storeShellFromPlatform,
  type StoreShell,
  type TemplateRecord,
} from "@take/template-engine";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { toast } from "../../shell/toast";
import { attachRecipeToSet } from "../layout/attach-recipe";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { refreshDevicePickerForPlatform, setAfterDevicePick, syncDevicePickerValue } from "./device-picker";

export type StoreTargetCallbacks = {
  onChange?: () => void;
};

function asStoreShell(platform: string): StoreShell {
  return platform === "android" ? "android" : "ios";
}

function warnPlayFrameCap(frameCount: number): void {
  const check = screenshotCountOk("android", frameCount);
  if (!check.ok) {
    toast(
      `Play Store allows max ${check.frameMax} screens — this set has ${frameCount}. Trim frames before a Play ZIP.`
    );
  }
}

/** Remap slot heights to a catalog device’s shell aspect (keeps that deviceId). */
export function remapRecipeToDevice(recipe: TemplateRecord, deviceId: string): void {
  const profile = getDevice(deviceId);
  const aspect =
    profile && profile.shellPx.w > 0 ? profile.shellPx.h / profile.shellPx.w : IOS_ASPECT;
  for (const d of recipe.devices) {
    d.h = d.orientation === "landscape" ? d.w / aspect : d.w * aspect;
  }
  recipe.deviceId = deviceId;
}

/** Remap attached layout recipe + session device to the store shell default. */
export function applyStoreTarget(platform: StoreShell, opts?: { silent?: boolean }): void {
  state.platform = platform;
  refreshDevicePickerForPlatform(platform);
  const recipe = stripRecipeOfSet();
  if (recipe) {
    applyShellBind(recipe, platform);
    attachRecipeToSet(recipe);
    if (platform === "android" && !opts?.silent) {
      warnPlayFrameCap(recipe.frameCount);
    }
  }
  const set = state.sets[state.selectedSet];
  if (set) set.deviceId = state.deviceId;
  syncDevicePickerValue();
}

export function mountStoreTargetControl(cbs?: StoreTargetCallbacks) {
  const host = $("#store-target-control") as HTMLElement | null;
  if (!host) return;

  host.innerHTML = `
    <button type="button" class="fit-mode-btn" data-store-target="ios" aria-pressed="false">iOS</button>
    <button type="button" class="fit-mode-btn" data-store-target="android" aria-pressed="false">Android</button>
  `;

  setAfterDevicePick(onDevicePicked);

  host.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-store-target]") as HTMLElement | null;
    if (!btn) return;
    const next = asStoreShell(btn.dataset.storeTarget || "ios");
    if (asStoreShell(state.platform) === next) return;
    applyStoreTarget(next);
    syncStoreTargetUi();
    cbs?.onChange?.();
  });

  syncStoreTargetUi();
}

export function syncStoreTargetUi() {
  const host = $("#store-target-control") as HTMLElement | null;
  if (!host) return;
  const cur = asStoreShell(state.platform);
  host.querySelectorAll("[data-store-target]").forEach((el) => {
    const on = (el as HTMLElement).dataset.storeTarget === cur;
    el.classList.toggle("is-active", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

/**
 * Device picker landed on another OS — update platform + recipe aspect for that SKU.
 * Does not rebuild the picker (caller already changed the select).
 */
export function onDevicePicked(deviceId: string): void {
  const p = getDevice(deviceId)?.platform;
  if (p === "ios" || p === "android") {
    state.platform = p;
  }
  const recipe = stripRecipeOfSet();
  if (recipe) {
    remapRecipeToDevice(recipe, deviceId);
    attachRecipeToSet(recipe);
    if (state.platform === "android") warnPlayFrameCap(recipe.frameCount);
  }
  syncStoreTargetUi();
}

/** Prefer brief/intake platform when applying a mobile Library card; session is fallback. */
export function resolveApplyStoreShell(briefPlatform?: string): StoreShell {
  if (briefPlatform === "android") return "android";
  if (briefPlatform === "ios") return "ios";
  if (state.platform === "android") return "android";
  if (state.platform === "ios") return "ios";
  return storeShellFromPlatform(briefPlatform, state.deviceId);
}

export function defaultDeviceIdForShell(platform: StoreShell): string {
  return resolveDefaultDevice(platform)?.id || (platform === "android" ? "google.pixel-9" : "apple.iphone-16-pro-max");
}

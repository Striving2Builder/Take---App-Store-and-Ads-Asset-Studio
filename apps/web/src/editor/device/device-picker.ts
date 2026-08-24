/** OWNER: editor/device — device picker (NOT style/palette) */
import {
  getDevice,
  listDevices,
  resolveDefaultDevice,
  resolvePickerGroup,
} from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { toast } from "../../shell/toast";
import { applyDeviceFrame } from "./apply-device-frame";

export type DevicePickerCallbacks = {
  onChange?: () => void;
};

/** Set from store-target-control mount to avoid a circular import. */
let afterDevicePick: ((deviceId: string) => void) | null = null;

export function setAfterDevicePick(fn: ((deviceId: string) => void) | null) {
  afterDevicePick = fn;
}

function optionHtml(id: string, name: string, w: number, h: number, extra = "") {
  return `<option value="${id}">${name} · ${w}×${h}${extra}</option>`;
}

function sortPlatformFirst<T extends { platform: string; formFactor: string }>(
  list: T[],
  platform: string
): T[] {
  const pref = platform === "android" ? "android" : "ios";
  return [...list].sort((a, b) => {
    const ap = a.platform === pref ? 0 : 1;
    const bp = b.platform === pref ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const af = a.formFactor === "foldable" ? 1 : 0;
    const bf = b.formFactor === "foldable" ? 1 : 0;
    return af - bf;
  });
}

function fillDevicePickerOptions(select: HTMLSelectElement) {
  const asOf = new Date();
  const devices = sortPlatformFirst(listDevices({ asOf }), state.platform);
  const current = devices.filter((d) => resolvePickerGroup(d, asOf) === "current");
  const older = devices.filter((d) => resolvePickerGroup(d, asOf) === "older");

  const parts: string[] = [];
  if (current.length) {
    parts.push(
      `<optgroup label="Current (≤3y)">${current
        .map((d) =>
          optionHtml(
            d.id,
            d.name,
            d.exportPx.w,
            d.exportPx.h,
            d.formFactor === "foldable" ? " · stub" : ""
          )
        )
        .join("")}</optgroup>`
    );
  }
  if (older.length) {
    parts.push(
      `<optgroup label="Older in catalog (3–5y)">${older
        .map((d) => optionHtml(d.id, d.name, d.exportPx.w, d.exportPx.h))
        .join("")}</optgroup>`
    );
  }
  select.innerHTML = parts.join("");
}

export function mountDevicePicker(cbs?: DevicePickerCallbacks) {
  const select = $("#device-picker") as HTMLSelectElement | null;
  if (!select) return;

  fillDevicePickerOptions(select);

  if (!getDevice(state.deviceId)) {
    const def = resolveDefaultDevice(state.platform);
    if (state.deviceId) {
      toast(`Unknown device — using ${def?.name || "default"}`);
    }
    state.deviceId = def?.id || "";
  }
  select.value = state.deviceId;
  applyDeviceFrame();

  select.addEventListener("change", () => {
    state.deviceId = select.value;
    const set = state.sets[state.selectedSet];
    if (set) set.deviceId = state.deviceId;
    afterDevicePick?.(state.deviceId);
    applyDeviceFrame();
    cbs?.onChange?.();
  });
}

/** Default device for platform + rebuild picker order (store-target toggle). */
export function refreshDevicePickerForPlatform(platform: string) {
  const def = resolveDefaultDevice(platform);
  if (!def) return;
  state.deviceId = def.id;
  const select = $("#device-picker") as HTMLSelectElement | null;
  if (select) {
    fillDevicePickerOptions(select);
    if (getDevice(def.id)) select.value = def.id;
  }
  applyDeviceFrame();
}

export function syncDevicePickerToPlatform(platform: string) {
  refreshDevicePickerForPlatform(platform);
}

export function syncDevicePickerValue() {
  const select = $("#device-picker") as HTMLSelectElement | null;
  if (!select) return;
  if (getDevice(state.deviceId)) {
    select.value = state.deviceId;
  }
  applyDeviceFrame();
}

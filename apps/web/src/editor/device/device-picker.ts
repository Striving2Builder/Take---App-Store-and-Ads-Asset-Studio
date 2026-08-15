/** OWNER: editor/device — device picker (NOT style/palette) */
import { listDevices, getDevice, resolveDefaultDevice } from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";

export function mountDevicePicker() {
  const select = $("#device-picker") as HTMLSelectElement | null;
  if (!select) return;

  const devices = listDevices();
  select.innerHTML = devices
    .map(
      (d) =>
        `<option value="${d.id}">${d.name} · ${d.exportPx.w}×${d.exportPx.h}</option>`
    )
    .join("");

  if (!getDevice(state.deviceId)) {
    state.deviceId = resolveDefaultDevice(state.platform)?.id || devices[0]?.id || "";
  }
  select.value = state.deviceId;

  select.addEventListener("change", () => {
    state.deviceId = select.value;
    const set = state.sets[state.selectedSet];
    if (set) set.deviceId = state.deviceId;
  });
}

export function syncDevicePickerToPlatform(platform: string) {
  const def = resolveDefaultDevice(platform);
  if (!def) return;
  state.deviceId = def.id;
  const select = $("#device-picker") as HTMLSelectElement | null;
  if (select) select.value = def.id;
}

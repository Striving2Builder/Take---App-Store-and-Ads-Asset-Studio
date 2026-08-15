/** OWNER: editor/device — portrait / landscape toggle */
import type { DeviceOrientation } from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { applyDeviceFrame } from "./apply-device-frame";

export type OrientationCallbacks = { onChange?: () => void };

export function mountOrientationControl(cbs?: OrientationCallbacks) {
  const host = $("#orientation-control") as HTMLElement | null;
  if (!host) return;
  host.innerHTML = `
    <button type="button" class="fit-mode-btn" data-orient="portrait" title="Portrait">Port</button>
    <button type="button" class="fit-mode-btn" data-orient="landscape" title="Landscape">Land</button>
  `;
  syncOrientationUi();
  host.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-orient]") as HTMLElement | null;
    if (!btn?.dataset.orient) return;
    const o = btn.dataset.orient as DeviceOrientation;
    if (o !== "portrait" && o !== "landscape") return;
    state.orientation = o;
    syncOrientationUi();
    applyDeviceFrame();
    cbs?.onChange?.();
  });
}

export function syncOrientationUi() {
  const host = $("#orientation-control") as HTMLElement | null;
  if (!host) return;
  host.querySelectorAll(".fit-mode-btn").forEach((el) => {
    el.classList.toggle(
      "is-active",
      (el as HTMLElement).dataset.orient === state.orientation
    );
  });
}

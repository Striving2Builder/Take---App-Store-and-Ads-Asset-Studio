/** OWNER: editor/device — Cover / Contain / Safe-area control (thin) */
import type { DeviceFitMode } from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { applyDeviceFrame } from "./apply-device-frame";

const MODES: { id: DeviceFitMode; label: string }[] = [
  { id: "cover", label: "Cover" },
  { id: "contain", label: "Contain" },
  { id: "safe-area", label: "Safe-area" },
];

export type FitControlCallbacks = {
  onChange?: () => void;
};

export function mountFitControl(cbs?: FitControlCallbacks) {
  const host = $("#fit-mode-control") as HTMLElement | null;
  if (!host) return;

  host.innerHTML = MODES.map(
    (m) =>
      `<button type="button" class="fit-mode-btn${state.fitMode === m.id ? " is-active" : ""}" data-fit="${m.id}" title="Geometric ${m.label}">${m.label}</button>`
  ).join("");

  host.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-fit]") as HTMLElement | null;
    if (!btn?.dataset.fit) return;
    const mode = btn.dataset.fit as DeviceFitMode;
    if (!MODES.some((m) => m.id === mode)) return;
    state.fitMode = mode;
    syncFitControlUi();
    applyDeviceFrame();
    cbs?.onChange?.();
  });
}

export function syncFitControlUi() {
  const host = $("#fit-mode-control") as HTMLElement | null;
  if (!host) return;
  host.querySelectorAll(".fit-mode-btn").forEach((el) => {
    el.classList.toggle("is-active", (el as HTMLElement).dataset.fit === state.fitMode);
  });
}

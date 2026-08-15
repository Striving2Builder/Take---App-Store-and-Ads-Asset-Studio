/** OWNER: editor/device — Front | Back shell view */
import type { ShellView } from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { applyDeviceFrame } from "./apply-device-frame";

export type ShellViewCallbacks = { onChange?: () => void };

export function mountShellViewControl(cbs?: ShellViewCallbacks) {
  const host = $("#shell-view-control") as HTMLElement | null;
  if (!host) return;
  host.innerHTML = `
    <button type="button" class="fit-mode-btn" data-shell-view="front" title="Front shell">Front</button>
    <button type="button" class="fit-mode-btn" data-shell-view="back" title="Back shell">Back</button>
  `;
  syncShellViewUi();
  host.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-shell-view]") as HTMLElement | null;
    if (!btn?.dataset.shellView) return;
    const v = btn.dataset.shellView as ShellView;
    if (v !== "front" && v !== "back") return;
    state.shellView = v;
    syncShellViewUi();
    applyDeviceFrame();
    cbs?.onChange?.();
  });
}

export function syncShellViewUi() {
  const host = $("#shell-view-control") as HTMLElement | null;
  if (!host) return;
  host.querySelectorAll(".fit-mode-btn").forEach((el) => {
    el.classList.toggle(
      "is-active",
      (el as HTMLElement).dataset.shellView === state.shellView
    );
  });
}

/** OWNER: modes — mount CreationMode plugins into Review / Edit slots */
import { getMode } from "@take/modes-sdk";
import { state } from "../app/app-state";
import { $ } from "../shared/dom";
import { applyExportHints } from "./apply-export-hints";

function fillSlot(sel: string, plugins: { title: string; render: (el: HTMLElement) => void }[]): void {
  const host = $(sel) as HTMLElement | null;
  if (!host) return;
  if (!plugins.length) {
    host.innerHTML = "";
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.innerHTML = "";
  for (const p of plugins) {
    const wrap = document.createElement("div");
    wrap.className = "mode-plugin";
    wrap.dataset.plugin = p.title;
    host.appendChild(wrap);
    p.render(wrap);
  }
}

export function updateModeChrome(): void {
  const mode = getMode(state.mode);
  const label = mode?.label || state.mode;
  document.body.dataset.mode = state.mode;
  document.querySelectorAll("[data-mode-chrome]").forEach((el) => {
    el.textContent = label;
  });
  const link = $("#mode-panel-link") as HTMLElement | null;
  const inspectorPlugins = mode?.getEditorPlugins?.().filter((p) => p.slot === "inspector") ?? [];
  if (link) link.hidden = inspectorPlugins.length === 0;
  const title = $("#mode-inspector-title");
  if (title && inspectorPlugins[0]) title.textContent = inspectorPlugins[0].title;
}

export function mountModePlugins(): void {
  const mode = getMode(state.mode);
  const plugins = mode?.getEditorPlugins?.() ?? [];
  fillSlot(
    "#mode-review-slot",
    plugins.filter((p) => p.slot === "review")
  );
  fillSlot(
    "#mode-inspector-slot",
    plugins.filter((p) => p.slot === "inspector")
  );
  updateModeChrome();
  applyExportHints();
}

export function syncModePluginHighlights(): void {
  document.querySelectorAll("[data-plugin-frame]").forEach((el) => {
    const i = Number((el as HTMLElement).dataset.pluginFrame);
    el.classList.toggle("is-active", i === state.activeFrame);
  });
}

/** OWNER: modes/replicator — compare lane (labels only, never competitor pixels) */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { currentSet, state } from "../../app/app-state";
import { escapeHtml } from "../../shared/escape";
import { renderEditor, syncFrameFromDom } from "../../editor/canvas/edit-canvas";
import { syncModePluginHighlights } from "../mode-plugins";
import { competitorBeatsFromPack } from "./competitor-beats";

function compareHtml(): string {
  const beats = competitorBeatsFromPack(state.lastPack);
  const frames = currentSet()?.frames || [];
  if (!beats.length && !frames.length) {
    return `<p class="hint tight">Add a competitor Extra Source or upload refs, then Generate.</p>`;
  }
  const rows = frames
    .map((f, i) => {
      const beat = beats[i % Math.max(1, beats.length)];
      const vs = beat ? escapeHtml(beat.label) : "upload ref";
      return `<li data-plugin-frame="${i}" class="${i === state.activeFrame ? "is-active" : ""}">
        <span class="mono">${escapeHtml(f.kicker || f.role)}</span>
        <span>${escapeHtml(f.headline)}</span>
        <span class="hint tight">vs ${vs}</span>
      </li>`;
    })
    .join("");
  return `
    <p class="hint tight">Structure map only — competitor screenshots never land on your canvas (brand merge is compare-only).</p>
    <ol class="mode-compare-list">${rows}</ol>
  `;
}

export const replicatorReviewPlugin: ModeEditorPlugin = {
  id: "replicator-review",
  title: "Replicator",
  slot: "review",
  render(host) {
    const beats = competitorBeatsFromPack(state.lastPack);
    const note = beats.length
      ? `Compare lane: ${beats.map((b) => b.label).join(", ")}`
      : "No competitor pack — using upload refs for beat count.";
    host.innerHTML = `<p class="hint tight">${escapeHtml(note)}</p>`;
  },
};

export const replicatorInspectorPlugin: ModeEditorPlugin = {
  id: "replicator-inspector",
  title: "Compare",
  slot: "inspector",
  render(host) {
    host.innerHTML = compareHtml();
    host.querySelectorAll("[data-plugin-frame]").forEach((el) => {
      el.addEventListener("click", () => {
        const i = Number((el as HTMLElement).dataset.pluginFrame);
        if (Number.isNaN(i)) return;
        syncFrameFromDom();
        state.activeFrame = i;
        renderEditor();
        syncModePluginHighlights();
      });
    });
  },
};

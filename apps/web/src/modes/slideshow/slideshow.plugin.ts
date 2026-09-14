/** OWNER: modes/slideshow — storyboard rail + dwell + playhead */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { currentSet, state } from "../../app/app-state";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { renderEditor, roleLabel, syncFrameFromDom } from "../../editor/canvas/edit-canvas";
import { syncModePluginHighlights } from "../mode-plugins";
import { frameDwellMs, SLIDE_ROLES } from "./slideshow-builder";

let playTimer: number | undefined;

function stopPlay() {
  if (playTimer !== undefined) {
    window.clearTimeout(playTimer);
    playTimer = undefined;
  }
}

function totalMs(): number {
  const frames = currentSet()?.frames || [];
  return frames.reduce((n, f) => n + frameDwellMs(f.dwellMs, frames.length), 0);
}

/** Filmstrip storyboard row — one dwell input per real frame, aligned under
 *  the generic #frame-list buttons above it (same order, same min-width).
 *  data-plugin-frame matches those buttons' convention so the shared
 *  syncModePluginHighlights() keeps both rows' active state in sync. */
function storyboardRowHtml(): string {
  const set = currentSet();
  const frames = set?.frames || [];
  if (!frames.length) return "";
  const items = frames
    .map((f, i) => {
      const ms = frameDwellMs(f.dwellMs, frames.length);
      return `<div class="story-dwell${i === state.activeFrame ? " is-active" : ""}" data-plugin-frame="${i}" title="${escapeHtml(f.kicker || f.role)}">
        <input type="number" min="400" step="100" value="${ms}" data-dwell="${i}" aria-label="Dwell ms for ${escapeHtml(f.kicker || f.role)}" />
        <span class="mono">ms</span>
      </div>`;
    })
    .join("");
  const sec = (totalMs() / 1000).toFixed(1);
  return `
    <div class="story-controls">
      <button type="button" class="icon-btn" data-slide-play title="Play"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg></button>
      <button type="button" class="icon-btn" data-slide-stop title="Stop"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg></button>
      <span class="story-total mono">Total ~${sec}s · min 0.4s per beat</span>
    </div>
    <div class="story-dwell-row">${items}</div>
  `;
}

function jumpTo(i: number) {
  syncFrameFromDom();
  state.activeFrame = i;
  renderEditor();
  syncModePluginHighlights();
}

function playFrom(start: number) {
  stopPlay();
  const frames = currentSet()?.frames || [];
  if (!frames.length) return;
  const step = (i: number) => {
    if (i >= frames.length) {
      stopPlay();
      toast("Storyboard play finished");
      return;
    }
    jumpTo(i);
    const ms = frameDwellMs(frames[i].dwellMs, frames.length);
    playTimer = window.setTimeout(() => step(i + 1), ms);
  };
  step(start);
}

export const slideshowReviewPlugin: ModeEditorPlugin = {
  id: "slideshow-review",
  title: "Slideshow",
  slot: "review",
  render(host) {
    const n = currentSet()?.frames.length || 0;
    host.innerHTML = `<p class="hint tight">${n} beats · total ~${(totalMs() / 1000).toFixed(1)}s. Edit dwells in the storyboard strip below the canvas.</p>`;
  },
};

/** Filmstrip slot — play/stop + one dwell input per beat, docked under the
 *  frame list instead of duplicating it as a second vertical rail. */
export const slideshowFilmstripPlugin: ModeEditorPlugin = {
  id: "slideshow-filmstrip",
  title: "Storyboard",
  slot: "filmstrip",
  render(host) {
    stopPlay();
    host.innerHTML = storyboardRowHtml();
    host.querySelector("[data-slide-play]")?.addEventListener("click", () => playFrom(state.activeFrame));
    host.querySelector("[data-slide-stop]")?.addEventListener("click", () => {
      stopPlay();
      toast("Play stopped");
    });
    host.querySelectorAll<HTMLInputElement>("[data-dwell]").forEach((el) => {
      el.addEventListener("change", () => {
        const i = Number(el.dataset.dwell);
        const set = currentSet();
        if (!set?.frames[i]) return;
        const v = Math.max(400, Number(el.value) || 2000);
        set.frames[i].dwellMs = v;
        const total = host.querySelector(".story-total");
        if (total) total.textContent = `Total ~${(totalMs() / 1000).toFixed(1)}s · min 0.4s per beat`;
      });
    });
    host.querySelectorAll<HTMLElement>(".story-dwell").forEach((el) => {
      el.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        const i = Number(el.dataset.pluginFrame);
        if (!Number.isNaN(i)) jumpTo(i);
      });
    });
  },
};

/** Inspector slot (Mode tab) — the fixed beat cycle is reference info, not
 *  a control; kicker/headline/caption are already real, editable fields
 *  on the canvas + Content tab, so this doesn't duplicate them. */
export const slideshowInspectorPlugin: ModeEditorPlugin = {
  id: "slideshow-inspector",
  title: "Slideshow",
  slot: "inspector",
  render(host) {
    host.innerHTML = `
      <p class="hint tight">Kicker, headline, and dwell are per-beat — edit them on the canvas and in the storyboard strip below it.</p>
      <p class="label-caps">Beat roles (fixed cycle)</p>
      <div class="role-chain">
        ${SLIDE_ROLES.map(
          (r, i) =>
            `<span class="role-chip${i === state.activeFrame ? " is-active" : ""}" data-plugin-frame="${i}">${escapeHtml(roleLabel(r))}</span>`
        ).join("")}
      </div>
      <p class="hint tight">The same six roles every slideshow uses, built from your Wizard sequence.</p>
    `;
  },
};

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

/** Filmstrip storyboard row — matches the mockup's single beat-thumbnail
 *  row (role label baked into the thumb, dwell input below it) instead of
 *  a generic frame-num row plus a separate dwell-only row. Each beat is a
 *  real <button> (keyboard-reachable), matching data-plugin-frame so the
 *  shared syncModePluginHighlights() keeps it in sync with any other
 *  frame-jump control. */
function storyboardRowHtml(): string {
  const set = currentSet();
  const frames = set?.frames || [];
  if (!frames.length) return "";
  const items = frames
    .map((f, i) => {
      const ms = frameDwellMs(f.dwellMs, frames.length);
      const label = f.kicker || roleLabel(f.role);
      return `<div class="beat${i === state.activeFrame ? " is-active" : ""}">
        <button type="button" class="beat-thumb" data-plugin-frame="${i}" aria-label="Jump to ${escapeHtml(label)}">
          <span class="role">${escapeHtml(roleLabel(f.role))}</span>
        </button>
        <label class="dwell-input">
          <input type="number" min="0.4" step="0.1" value="${(ms / 1000).toFixed(1)}" data-dwell="${i}" aria-label="Dwell seconds for ${escapeHtml(label)}" />
          <span>s</span>
        </label>
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
    <div class="story-beat-row">${items}</div>
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
        const seconds = Math.max(0.4, Number(el.value) || 2);
        set.frames[i].dwellMs = Math.round(seconds * 1000);
        el.value = seconds.toFixed(1);
        const total = host.querySelector(".story-total");
        if (total) total.textContent = `Total ~${(totalMs() / 1000).toFixed(1)}s · min 0.4s per beat`;
      });
    });
    host.querySelectorAll<HTMLButtonElement>(".beat-thumb").forEach((el) => {
      el.addEventListener("click", () => {
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

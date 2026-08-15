/** OWNER: modes/slideshow — storyboard rail + dwell + playhead */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { currentSet, state } from "../../app/app-state";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { renderEditor, syncFrameFromDom } from "../../editor/canvas/edit-canvas";
import { syncModePluginHighlights } from "../mode-plugins";
import { frameDwellMs } from "./slideshow-builder";

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

function railHtml(): string {
  const set = currentSet();
  const frames = set?.frames || [];
  const rows = frames
    .map((f, i) => {
      const ms = frameDwellMs(f.dwellMs, frames.length);
      return `<li data-plugin-frame="${i}" class="${i === state.activeFrame ? "is-active" : ""}">
        <button type="button" class="mode-beat-jump" data-plugin-frame="${i}">${escapeHtml(f.kicker || f.role)}</button>
        <label class="mode-dwell-label">
          <span class="mono">ms</span>
          <input type="number" min="400" step="100" value="${ms}" data-dwell="${i}" />
        </label>
      </li>`;
    })
    .join("");
  const sec = (totalMs() / 1000).toFixed(1);
  return `
    <p class="hint tight">Pacing feeds MediaRecorder holds. Total ~${sec}s.</p>
    <div class="mode-play-row">
      <button type="button" class="btn ghost small" data-slide-play>Play</button>
      <button type="button" class="btn ghost small" data-slide-stop>Stop</button>
    </div>
    <ol class="mode-storyboard">${rows}</ol>
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
    host.innerHTML = `<p class="hint tight">${n} beats · total ~${(totalMs() / 1000).toFixed(1)}s. Edit dwells in the Mode inspector.</p>`;
  },
};

export const slideshowInspectorPlugin: ModeEditorPlugin = {
  id: "slideshow-inspector",
  title: "Storyboard",
  slot: "inspector",
  render(host) {
    stopPlay();
    host.innerHTML = railHtml();
    host.querySelector("[data-slide-play]")?.addEventListener("click", () => playFrom(state.activeFrame));
    host.querySelector("[data-slide-stop]")?.addEventListener("click", () => {
      stopPlay();
      toast("Play stopped");
    });
    host.querySelectorAll("[data-dwell]").forEach((el) => {
      el.addEventListener("change", () => {
        const i = Number((el as HTMLInputElement).dataset.dwell);
        const set = currentSet();
        if (!set?.frames[i]) return;
        const v = Math.max(400, Number((el as HTMLInputElement).value) || 2000);
        set.frames[i].dwellMs = v;
        const hint = host.querySelector(".hint.tight");
        if (hint) hint.textContent = `Pacing feeds MediaRecorder holds. Total ~${(totalMs() / 1000).toFixed(1)}s.`;
      });
    });
    host.querySelectorAll(".mode-beat-jump").forEach((el) => {
      el.addEventListener("click", () => {
        const i = Number((el as HTMLElement).dataset.pluginFrame);
        if (!Number.isNaN(i)) jumpTo(i);
      });
    });
  },
};

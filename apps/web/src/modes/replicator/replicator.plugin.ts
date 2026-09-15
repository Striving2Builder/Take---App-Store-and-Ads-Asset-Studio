/** OWNER: modes/replicator — competitor rail + role-cycle reference (labels only, never competitor pixels) */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { currentSet, state } from "../../app/app-state";
import { escapeHtml } from "../../shared/escape";
import { renderEditor, roleLabel, syncFrameFromDom } from "../../editor/canvas/edit-canvas";
import { syncModePluginHighlights } from "../mode-plugins";
import { competitorBeatsFromPack, type CompetitorBeat } from "./competitor-beats";
import { TRACE_ROLES } from "./replicator-builder";

function jumpTo(i: number) {
  syncFrameFromDom();
  state.activeFrame = i;
  renderEditor();
  syncModePluginHighlights();
}

/** Left rail — real competitor sources from the scanned pack (name, real
 *  scanned-screenshot count), plus the real frame-count-derivation note.
 *  Clicking a source jumps to the first frame whose compare beat cycles to
 *  it (competitorBeatsFromPack's own i % beats.length assignment). */
export const replicatorRailPlugin: ModeEditorPlugin = {
  id: "replicator-rail",
  title: "Competitor sources",
  slot: "rail",
  render(host) {
    const beats = competitorBeatsFromPack(state.lastPack);
    const frames = currentSet()?.frames || [];
    if (!beats.length) {
      host.innerHTML = `<p class="label-caps">Competitor sources</p><p class="hint tight">Add a competitor Extra Source, then Generate — frame count and sequence come from its scanned screenshots.</p>`;
      return;
    }
    const activeBeatIndex = state.activeFrame % beats.length;
    const rows = beats
      .map((b: CompetitorBeat, i) => {
        const initial = (b.label.trim()[0] || "?").toUpperCase();
        return `<div class="comp-row${i === activeBeatIndex ? " is-active" : ""}" data-comp-source="${i}">
          <span class="comp-avatar">${escapeHtml(initial)}</span>
          <span class="comp-info">
            <span class="name">${escapeHtml(b.label)}</span>
            <span class="n mono">${b.screenshotCount} screenshot${b.screenshotCount === 1 ? "" : "s"} scanned</span>
          </span>
        </div>`;
      })
      .join("");
    const totalShots = beats.reduce((n, b) => n + b.screenshotCount, 0);
    host.innerHTML = `
      <p class="label-caps">Competitor sources</p>
      ${rows}
      <p class="hint tight">Frame count comes from the competitor's own scanned screenshot count, clamped 3–12.${
        totalShots ? ` ${totalShots} scanned screenshot${totalShots === 1 ? "" : "s"} → ${frames.length} frame${frames.length === 1 ? "" : "s"} here.` : ""
      }</p>
    `;
    host.querySelectorAll<HTMLElement>("[data-comp-source]").forEach((row) => {
      row.addEventListener("click", () => {
        const bi = Number(row.dataset.compSource);
        const fi = frames.findIndex((_, i) => i % beats.length === bi);
        if (fi !== -1) jumpTo(fi);
      });
    });
  },
};

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

/** Mode tab — the fixed role cycle is reference info; kicker/headline stay
 *  the real, already-editable Content-tab/canvas fields, not duplicated
 *  here (same shape as the Slideshow inspector). */
export const replicatorInspectorPlugin: ModeEditorPlugin = {
  id: "replicator-inspector",
  title: "Replicator",
  slot: "inspector",
  render(host) {
    host.innerHTML = `
      <p class="hint tight">Kicker and headline are per-frame — edit them on the canvas and in the Content tab.</p>
      <p class="label-caps">Beat roles (fixed cycle)</p>
      <div class="role-chain">
        ${TRACE_ROLES.map(
          (r) =>
            `<span class="role-chip${r === currentSet()?.frames[state.activeFrame]?.role ? " is-active" : ""}" data-role-chip="${r}">${escapeHtml(roleLabel(r))}</span>`
        ).join("")}
      </div>
      <p class="hint tight">Structure only, never competitor pixels — this cycle sets sequence, not content.</p>
    `;
  },
};

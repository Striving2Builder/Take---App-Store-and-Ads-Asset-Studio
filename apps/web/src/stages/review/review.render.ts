/** OWNER: stages/review — render concept sets + mode chrome */
import { getMode } from "@take/modes-sdk";
import type { TemplateRecord } from "@take/template-engine";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { mountModePlugins } from "../../modes/mode-plugins";
import { paintStripSlice } from "../export/paint-strip-slice";
import { resolveExportSize } from "@take/device-catalog";

const REVIEW_TITLES: Record<string, string> = {
  wizard: "Choose a concept",
  template: "Template set",
  replicator: "Replicator structure",
  slideshow: "Slideshow storyboard",
  ads: "Ad units generated",
};

function asRecipe(raw: unknown): TemplateRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as TemplateRecord;
  if (!Array.isArray(r.devices) || !r.devices.length) return null;
  return r;
}

export function renderReview() {
  const inf = state.inference;
  if (!inf) return;

  const mode = getMode(state.mode);
  const title = $("#review-title");
  if (title) title.textContent = REVIEW_TITLES[state.mode] || "Choose a concept";

  const sub = $("#review-sub");
  if (sub) {
    if (state.mode === "wizard") {
      const look = state.templateId;
      sub.textContent = look
        ? `Armed Library look for ${inf.name}. Generate filled this canvas — not a new grammar layout.`
        : `${state.sets.length} directed take${
            state.sets.length === 1 ? "" : "s"
          } for ${inf.name}. Pick the story that fits.`;
    } else if (state.mode === "ads") {
      const n = state.sets[0]?.frames.filter((f) => f.adUnitId).length || 0;
      sub.textContent = `${n} ad unit${n === 1 ? "" : "s"} for ${inf.name}. Native previews below — not a concept to pick between.`;
    } else {
      sub.textContent = `${mode?.label || state.mode} · ${state.sets[0]?.frames.length || 0} frames for ${inf.name}.`;
    }
  }

  const regen = $("#btn-regen-all");
  if (regen) regen.textContent = state.mode === "wizard" ? "Refresh all sets" : "Regenerate";

  const chips = $("#infer-chips");
  if (chips) {
    chips.innerHTML = [inf.category, inf.style, inf.platform.toUpperCase(), inf.locale, inf.mode]
      .map((c) => `<span class="chip">${escapeHtml(c)}</span>`)
      .join("");
  }

  const rail = $("#set-rail") as HTMLElement | null;
  if (!rail) return;

  if (state.mode === "ads") {
    // Ads mode always builds exactly one set — there's nothing to "choose between," and this
    // rail can only paint TemplateRecord layout recipes, which ads sets don't have (it falls
    // back to fake placeholder tiles). The real native previews live in #mode-review-slot.
    rail.hidden = true;
    rail.innerHTML = "";
    mountModePlugins();
    return;
  }
  rail.hidden = false;

  rail.innerHTML = state.sets
    .map((set, i) => {
      const recipe = asRecipe(set.layout?.recipe);
      const frames = set.frames
        .slice(0, 6)
        .map(
          (f, fi) => `
          <div class="story-frame">
            <span class="sf-label">${escapeHtml(f.role.slice(0, 4))}</span>
            ${
              recipe
                ? `<canvas data-review-set="${i}" data-review-frame="${fi}"></canvas>`
                : `<div class="sf-fill" style="opacity:${0.4 + (fi % 3) * 0.2}"></div>`
            }
          </div>`
        )
        .join("");
      return `
        <button type="button" class="set-card ${i === state.selectedSet ? "is-selected" : ""}" data-set="${i}">
          <div class="set-card-head">
            <span class="set-name">${escapeHtml(set.name)}</span>
            <span class="set-style">${escapeHtml(set.styleLabel)}</span>
          </div>
          <div class="storyboard">${frames}</div>
          <p class="set-blurb">${escapeHtml(set.blurb)} · ${set.frames.length} frames</p>
        </button>`;
    })
    .join("");

  mountModePlugins();
  void paintReviewThumbs();
}

async function paintReviewThumbs() {
  const { w, h } = resolveExportSize(state.deviceId, state.platform, state.orientation).size;
  const tw = 72;
  const th = Math.round(tw * (h / w));
  const canvases = document.querySelectorAll<HTMLCanvasElement>("[data-review-set]");
  for (const canvas of canvases) {
    const si = Number(canvas.dataset.reviewSet);
    const fi = Number(canvas.dataset.reviewFrame);
    const set = state.sets[si];
    const recipe = asRecipe(set?.layout?.recipe);
    if (!set || !recipe) continue;
    await paintStripSlice(canvas, fi, {
      w: tw,
      h: th,
      recipe,
      frames: set.frames,
      palette: set.palette,
      deviceId: set.deviceId || state.deviceId,
      skipType: true,
    });
  }
}

/** OWNER: stages/review — render concept sets + mode chrome */
import { getMode } from "@take/modes-sdk";
import { hasRealLayout, type TemplateRecord } from "@take/template-engine";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { mountModePlugins } from "../../modes/mode-plugins";
import { paintStripSlice } from "../export/paint-strip-slice";
import { rasterSizeFor } from "../../shared/hidpi-raster";

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
  if (!Array.isArray(r.devices) || !hasRealLayout(r)) return null;
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
            <span class="sf-label">${escapeHtml(f.role)}</span>
            ${
              recipe
                ? `<canvas data-review-set="${i}" data-review-frame="${fi}"></canvas>`
                : `<div class="sf-fill" style="opacity:${0.4 + (fi % 3) * 0.2}"></div>`
            }
          </div>`
        )
        .join("");
      // A "strip" recipe is one joined world clipped into N PNGs — a device
      // can deliberately straddle the seam so it looks continuous across
      // adjacent App Store screenshots. The default gap+border between tiles
      // (correct for "isolated", where each PNG is meant to stand alone)
      // visually chops that device in half here, making the intended bleed
      // effect look like a rendering bug. #strip-preview already renders
      // "strip" recipes with no gap for exactly this reason — match it here.
      const isStrip = recipe?.composition === "strip";
      return `
        <button type="button" class="set-card ${i === state.selectedSet ? "is-selected" : ""}" data-set="${i}">
          <div class="set-card-head">
            <span class="set-name">${escapeHtml(set.name)}</span>
            <span class="set-style">${escapeHtml(set.styleLabel)}</span>
          </div>
          <div class="storyboard${isStrip ? " is-strip" : ""}">${frames}</div>
          <p class="set-blurb">${escapeHtml(set.blurb)} · ${set.frames.length} frames</p>
        </button>`;
    })
    .join("");

  mountModePlugins();
  void paintReviewThumbs();
}

async function paintReviewThumbs() {
  const dpr = window.devicePixelRatio || 1;
  const canvases = document.querySelectorAll<HTMLCanvasElement>("[data-review-set]");
  for (const canvas of canvases) {
    const si = Number(canvas.dataset.reviewSet);
    const fi = Number(canvas.dataset.reviewFrame);
    const set = state.sets[si];
    const recipe = asRecipe(set?.layout?.recipe);
    if (!set || !recipe) continue;
    // Raster at the tile's actual on-screen width AND height (not derived from
    // the selected device's aspect ratio) — .story-frame is a CSS-fixed 9:16
    // box regardless of orientation, so a landscape device's real aspect would
    // under-raster the height and blur. A lone set-card also stretches to
    // fill the whole rail, so a small fixed width would get blown up too.
    const tw = rasterSizeFor(canvas.parentElement?.clientWidth || 0, dpr, 72);
    const th = rasterSizeFor(canvas.parentElement?.clientHeight || 0, dpr, 128);
    await paintStripSlice(canvas, fi, {
      w: tw,
      h: th,
      recipe,
      frames: set.frames,
      palette: set.palette,
      deviceId: set.deviceId || state.deviceId,
      // Was skipType: true — that hid the one thing that actually
      // distinguishes candidate layouts (headline/caption/kicker text and
      // the type band's top/bottom/split position), making every card in
      // this picker look identical regardless of real underlying variety.
    });
  }
}

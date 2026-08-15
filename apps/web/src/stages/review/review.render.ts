/** OWNER: stages/review — render concept sets */
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";

export function renderReview() {
  const inf = state.inference;
  if (!inf) return;

  const sub = $("#review-sub");
  if (sub) {
    sub.textContent = `${state.sets.length} directed take${
      state.sets.length === 1 ? "" : "s"
    } for ${inf.name}. Pick the story that fits.`;
  }

  const chips = $("#infer-chips");
  if (chips) {
    chips.innerHTML = [inf.category, inf.style, inf.platform.toUpperCase(), inf.locale, inf.mode]
      .map((c) => `<span class="chip">${escapeHtml(c)}</span>`)
      .join("");
  }

  const rail = $("#set-rail");
  if (!rail) return;

  rail.innerHTML = state.sets
    .map((set, i) => {
      const frames = set.frames
        .slice(0, 6)
        .map(
          (f, fi) => `
          <div class="story-frame">
            <span class="sf-label">${escapeHtml(f.role.slice(0, 4))}</span>
            <div class="sf-fill" style="opacity:${0.4 + (fi % 3) * 0.2}"></div>
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
}

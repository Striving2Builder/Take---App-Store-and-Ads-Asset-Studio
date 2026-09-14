/** OWNER: modes/ads — ad-unit picker, AdCopy fields, live thumbnail preview */
import type { AdCopy } from "@take/core";
import type { ModeEditorPlugin } from "@take/modes-sdk";
import {
  listAdUnits,
  listAdUnitFamilies,
  getAdUnit,
  fmtUnitSpec,
  type AdUnitFamily,
} from "@take/ad-unit-catalog";
import { wireframesForFamily, getAdWireframe } from "@take/template-engine";
import {
  checkLegalCompliance,
  rulesForCategory,
  listRegulatedCategories,
  listJurisdictions,
  type ComplianceRequirement,
  type Jurisdiction,
} from "@take/ad-compliance";
import { state, currentSet } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { loadImg } from "../../stages/export/canvas-text";
import { paintAdFrame } from "../../stages/export/paint-ad-frame";
import { rasterSizeFor } from "../../shared/hidpi-raster";

export const FAMILY_LABEL: Record<AdUnitFamily, string> = {
  leaderboard: "Leaderboard",
  billboard: "Billboard",
  mpu: "Medium Rectangle",
  skyscraper: "Skyscraper / Half Page",
  "mobile-banner": "Mobile Banner",
  interstitial: "Interstitial / Square",
  "video-landscape": "Video · Landscape",
  "video-vertical": "Video · Vertical",
  "social-feed": "Social Feed",
  pinterest: "Pinterest",
};

type AdCopyTextKey = Exclude<keyof AdCopy, "regulatedCategory" | "jurisdiction">;

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  us: "United States",
  eu: "European Union",
  uk: "United Kingdom",
  ca: "Canada",
};

const FIELDS: [AdCopyTextKey, string, number][] = [
  ["headline", "Headline", 60],
  ["description", "Description", 160],
  ["cta", "CTA", 24],
  ["clickThroughUrl", "Click-through URL", 300],
  ["advertiserName", "Advertiser name", 60],
  ["legalLine", "Legal / disclosure line", 120],
];

async function paintThumb(canvas: HTMLCanvasElement, adUnitId: string, wireframeId: string | undefined, copy: AdCopy) {
  const unit = getAdUnit(adUnitId);
  const wireframe = wireframeId ? getAdWireframe(wireframeId) : undefined;
  if (!unit || !wireframe) return;
  const imgUrl = state.uploads.find((u) => u.kind === "image")?.url;
  const image = imgUrl ? await loadImg(imgUrl) : null;
  paintAdFrame(canvas, {
    size: unit.exportPx,
    wireframe,
    copy,
    image,
    logo: null,
    palette: currentSet()?.palette || [],
  });
}

function thumbGridHtml(): string {
  const set = currentSet();
  const frames = set?.frames || [];
  if (!frames.length) {
    return `<p class="hint tight">Generate to see native ad-unit previews here.</p>`;
  }
  return `<div class="ads-thumb-grid">${frames
    .map((f, i) => {
      const unit = f.adUnitId ? getAdUnit(f.adUnitId) : undefined;
      const wf = f.wireframeId ? getAdWireframe(f.wireframeId) : undefined;
      const family = unit?.family;
      const options = family
        ? wireframesForFamily(family)
            .map((w) => `<option value="${w.id}"${w.id === f.wireframeId ? " selected" : ""}>${escapeHtml(w.name)}</option>`)
            .join("")
        : "";
      return `<figure class="ads-thumb" data-ads-thumb="${i}">
        <canvas data-ads-canvas="${i}"></canvas>
        <figcaption>
          <b>${escapeHtml(unit?.label || f.adUnitId || "?")}</b>
          <span class="mono">${unit ? `${unit.exportPx.w}×${unit.exportPx.h}` : ""}</span>
          ${options ? `<select data-ads-wireframe="${i}">${options}</select>` : ""}
          <span class="hint tight">${escapeHtml(wf?.name || "")}</span>
        </figcaption>
      </figure>`;
    })
    .join("")}</div>`;
}

async function repaintThumbs(host: ParentNode) {
  const set = currentSet();
  if (!set?.adCopy) return;
  const copy = set.adCopy;
  const canvases = host.querySelectorAll<HTMLCanvasElement>("[data-ads-canvas]");
  for (const canvas of Array.from(canvases)) {
    const i = Number(canvas.dataset.adsCanvas);
    const frame = set.frames[i];
    if (!frame?.adUnitId) continue;
    await paintThumb(canvas, frame.adUnitId, frame.wireframeId, copy);
  }
}

/** Shared by the Review rail plugin and the Edit-stage canvas swap — one real implementation,
 *  not two divergent copies. This IS the native preview; #phone-mock/#layout-stage are hidden
 *  for Ads mode instead of showing a wrong phone-shaped mock alongside it. */
export function renderAdsThumbGrid(host: HTMLElement): void {
  host.innerHTML = thumbGridHtml();
  void repaintThumbs(host);
  host.querySelectorAll<HTMLSelectElement>("[data-ads-wireframe]").forEach((el) => {
    el.addEventListener("change", () => {
      const i = Number(el.dataset.adsWireframe);
      const set = currentSet();
      if (!set?.frames[i]) return;
      set.frames[i].wireframeId = el.value;
      void repaintThumbs(host);
    });
  });
}

export const adsReviewPlugin: ModeEditorPlugin = {
  id: "ads-review",
  title: "Ads",
  slot: "review",
  render(host) {
    renderAdsThumbGrid(host);
  },
};

/** Which set.frames index the Edit-stage single preview shows — the active
 *  frame if it carries a real ad unit, else the first frame that does. */
function focusedAdsFrameIndex(): number {
  const frames = currentSet()?.frames || [];
  if (frames[state.activeFrame]?.adUnitId) return state.activeFrame;
  const i = frames.findIndex((f) => f.adUnitId);
  return i === -1 ? state.activeFrame : i;
}

/** Edit-stage focused preview — one ad unit at real scale with its dims
 *  label, not the Review screen's small-thumbnail grid (renderAdsThumbGrid
 *  stays a grid there; this is the Edit-stage-only single view). */
export async function renderAdsFocusedPreview(host: HTMLElement): Promise<void> {
  const set = currentSet();
  const frames = set?.frames || [];
  if (!frames.length) {
    host.innerHTML = `<p class="hint tight">Check ad units on the left, then Generate to see a native preview here.</p>`;
    return;
  }
  const i = focusedAdsFrameIndex();
  const frame = frames[i];
  const unit = frame?.adUnitId ? getAdUnit(frame.adUnitId) : undefined;
  if (!frame?.adUnitId || !unit) {
    host.innerHTML = `<p class="hint tight">No ad unit on this frame — pick one on the left, then Regenerate.</p>`;
    return;
  }
  host.innerHTML = `<div class="ads-focus-wrap">
    <span class="ads-focus-dims mono">${unit.exportPx.w} × ${unit.exportPx.h} · ${escapeHtml(unit.label)}</span>
    <canvas class="ads-focus-canvas" style="aspect-ratio:${unit.exportPx.w}/${unit.exportPx.h}"></canvas>
  </div>`;
  const canvas = host.querySelector<HTMLCanvasElement>(".ads-focus-canvas");
  if (!canvas || !set?.adCopy) return;
  const cw = rasterSizeFor(canvas.clientWidth, window.devicePixelRatio || 1, 420);
  canvas.width = cw;
  canvas.height = Math.round(cw * (unit.exportPx.h / unit.exportPx.w));
  await paintThumb(canvas, frame.adUnitId!, frame.wireframeId, set.adCopy);
}

/** Rail rows are checkboxes for inclusion (unitCheckboxesHtml, unchanged) —
 *  clicking a row's info text instead focuses that unit's frame in the
 *  single preview, when it already has one. Not a selection change. */
export function bindAdsRailFocus(host: ParentNode, onFocus: () => void): void {
  host.querySelectorAll<HTMLElement>(".ads-unit-row").forEach((row) => {
    const info = row.querySelector(".ads-unit-focus-hit");
    info?.addEventListener("click", () => {
      const id = row.querySelector("input")?.value;
      const frames = currentSet()?.frames || [];
      const i = frames.findIndex((f) => f.adUnitId === id);
      if (i === -1) return;
      state.activeFrame = i;
      onFocus();
    });
  });
}

export function unitCheckboxesHtml(): string {
  const selected = new Set(state.adUnitIds);
  const families = listAdUnitFamilies();
  const frames = currentSet()?.frames || [];
  const focusedUnitId = frames.length ? frames[focusedAdsFrameIndex()]?.adUnitId : undefined;
  return families
    .map((fam) => {
      const units = listAdUnits({ family: fam });
      return `<fieldset class="ads-family-group">
        <legend class="mono">${escapeHtml(FAMILY_LABEL[fam] || fam)}</legend>
        ${units
          .map((u) => {
            const spec = u.kind !== "display" ? fmtUnitSpec(u) : "";
            return `<label class="ads-unit-check">
              <span class="ads-unit-row${u.id === focusedUnitId ? " is-focused" : ""}">
                <input type="checkbox" value="${u.id}"${selected.has(u.id) ? " checked" : ""} />
                <span class="ads-unit-focus-hit">
                  <span>${escapeHtml(u.label)}</span>
                  <em class="mono">${u.exportPx.w}×${u.exportPx.h}</em>
                </span>
              </span>
              ${spec ? `<small class="ads-unit-spec mono">${escapeHtml(spec)}</small>` : ""}
            </label>`;
          })
          .join("")}
      </fieldset>`;
    })
    .join("");
}

const FIELDS_BEFORE_CATEGORY = FIELDS.filter(([key]) => key !== "legalLine");
const LEGAL_FIELD = FIELDS.find(([key]) => key === "legalLine")!;

function metaFieldHtml([key, label, max]: [AdCopyTextKey, string, number], copy: AdCopy): string {
  const val = copy[key] || "";
  const over = val.length > max;
  const isArea = key === "description";
  const control = isArea
    ? `<textarea data-ad-copy="${key}" rows="3">${escapeHtml(val)}</textarea>`
    : `<input type="text" data-ad-copy="${key}" value="${escapeHtml(val)}" placeholder="${key === "clickThroughUrl" ? "https://…" : ""}" />`;
  return `<div class="meta-field">
    <label><span>${label}</span><span class="count ${over ? "over" : ""}">${val.length}/${max}</span></label>
    ${control}
  </div>`;
}

function categoryAndJurisdictionHtml(copy: AdCopy): string {
  const categoryOptions = [{ category: "none" as const, label: "None" }, ...listRegulatedCategories(copy.jurisdiction)]
    .map((c) => `<option value="${c.category}"${c.category === copy.regulatedCategory ? " selected" : ""}>${escapeHtml(c.label)}</option>`)
    .join("");
  const jurisdictionOptions = listJurisdictions()
    .map((j) => `<option value="${j}"${j === copy.jurisdiction ? " selected" : ""}>${escapeHtml(JURISDICTION_LABEL[j])}</option>`)
    .join("");
  return `<div class="meta-field">
    <label><span>Regulated category</span></label>
    <select data-ad-category>${categoryOptions}</select>
  </div>
  <div class="meta-field">
    <label><span>Jurisdiction</span></label>
    <select data-ad-jurisdiction>${jurisdictionOptions}</select>
    <p class="hint tight">Checks your copy against that jurisdiction's disclosure norms below — a checklist against documented policy, not legal advice. Only US/EU/UK/Canada are covered today.</p>
  </div>`;
}

// Inline SVG, not dingbat glyphs — a canvas-drawn icon renders identically
// everywhere; a unicode symbol depends on whatever the viewer's system font
// happens to ship. currentColor inherits each row's existing status color.
const MARK_WARNING =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 21 19H3z"/><line x1="12" y1="9" x2="12" y2="13.5"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/></svg>';
const MARK_CHECK =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const MARK_MISSING =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
const MARK_INFO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>';

function requirementRow(req: ComplianceRequirement, cls: string, mark: string): string {
  return `<li class="${cls}" title="${escapeHtml(req.description)} — ${escapeHtml(req.source)}"><span class="mark">${mark}</span> ${escapeHtml(req.label)}</li>`;
}

function checklistListItems(result: ReturnType<typeof checkLegalCompliance>): string {
  return [
    ...result.prohibitions.map((r) => requirementRow(r, "prohibit", MARK_WARNING)),
    ...result.satisfied.map((r) => requirementRow(r, "ok", MARK_CHECK)),
    ...result.missing.map((r) => requirementRow(r, "warn", MARK_MISSING)),
    ...result.advisories.map((r) => requirementRow(r, "info", MARK_INFO)),
  ].join("");
}

function complianceChecklistHtml(copy: AdCopy): string {
  if (copy.regulatedCategory === "none") return "";
  const rules = rulesForCategory(copy.jurisdiction, copy.regulatedCategory);
  const result = checkLegalCompliance(copy.regulatedCategory, copy.jurisdiction, copy);
  return `<div class="ads-compliance-checklist" data-compliance-checklist>
    <p class="hint tight">${escapeHtml(rules?.label || "")} · ${escapeHtml(JURISDICTION_LABEL[copy.jurisdiction])} checklist — not legal advice, verify with counsel.</p>
    <ul class="ads-compliance-list">${checklistListItems(result)}</ul>
  </div>`;
}

function copyFieldsHtml(copy: AdCopy): string {
  return `<div class="meta-fields">
    ${FIELDS_BEFORE_CATEGORY.map((f) => metaFieldHtml(f, copy)).join("")}
    ${categoryAndJurisdictionHtml(copy)}
    ${metaFieldHtml(LEGAL_FIELD, copy)}
    ${complianceChecklistHtml(copy)}
  </div>`;
}

/** Edit-stage left rail — unit-inclusion checkboxes (unitCheckboxesHtml,
 *  same real data as the Intake picker) plus click-to-focus onto the
 *  single preview. Distinct DOM/host from the Intake and inspector uses,
 *  same underlying functions — one source of truth, three mount points. */
export function renderAdsUnitRail(): void {
  const host = $("#ads-unit-rail") as HTMLElement | null;
  if (!host) return;
  host.hidden = false;
  host.innerHTML = `
    <p class="label-caps">Ad units</p>
    <p class="hint tight">Check units, then Regenerate to rebuild the set. Click a unit's name to preview it.</p>
    <div class="ads-unit-grid">${unitCheckboxesHtml()}</div>
  `;
  bindUnitCheckboxes(host);
  bindAdsRailFocus(host, () => {
    void renderAdsFocusedPreview($("#ads-edit-stage") as HTMLElement);
    renderAdsUnitRail();
  });
}

/** Shared by the intake picker and the post-Generate inspector — same binding, one source of truth. */
export function bindUnitCheckboxes(host: ParentNode, onChange?: () => void): void {
  host.querySelectorAll<HTMLInputElement>(".ads-unit-check input").forEach((el) => {
    el.addEventListener("change", () => {
      const id = el.value;
      const next = new Set(state.adUnitIds);
      if (el.checked) next.add(id);
      else next.delete(id);
      state.adUnitIds = [...next];
      onChange?.();
    });
  });
}

export const adsInspectorPlugin: ModeEditorPlugin = {
  id: "ads-inspector",
  title: "Ads",
  slot: "inspector",
  render(host) {
    const set = currentSet();
    const copy = set?.adCopy;
    const missingUrl = copy && !copy.clickThroughUrl.trim();
    host.innerHTML = `
      ${missingUrl ? `<p class="hint tight" style="color:var(--warn)">No click-through URL — export will warn.</p>` : ""}
      ${copy ? copyFieldsHtml(copy) : `<p class="hint tight">Check ad units on the left, then Generate to edit ad copy.</p>`}
    `;

    const refreshChecklist = () => {
      const s = currentSet();
      const list = host.querySelector(".ads-compliance-list");
      if (!s?.adCopy || !list) return;
      const result = checkLegalCompliance(s.adCopy.regulatedCategory, s.adCopy.jurisdiction, s.adCopy);
      list.innerHTML = checklistListItems(result);
    };

    const maxByKey = new Map(FIELDS.map(([key, , max]) => [key, max]));
    host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-ad-copy]").forEach((el) => {
      el.addEventListener("input", () => {
        const s = currentSet();
        if (!s?.adCopy) return;
        const key = (el as HTMLElement).dataset.adCopy as AdCopyTextKey;
        s.adCopy[key] = el.value;
        const countEl = el.closest(".meta-field")?.querySelector(".count");
        const max = maxByKey.get(key) || 0;
        if (countEl) {
          countEl.textContent = `${el.value.length}/${max}`;
          countEl.classList.toggle("over", el.value.length > max);
        }
        if (key === "headline" || key === "cta" || key === "description") {
          s.frames.forEach((f) => {
            if (key === "headline") f.headline = el.value;
            if (key === "cta") f.cta = el.value;
            if (key === "description") f.caption = el.value;
          });
        }
        if (key === "headline" || key === "description" || key === "legalLine") refreshChecklist();
        if (key === "headline" || key === "description" || key === "cta") {
          void renderAdsFocusedPreview($("#ads-edit-stage") as HTMLElement);
        }
      });
    });

    host.querySelector<HTMLSelectElement>("[data-ad-category]")?.addEventListener("change", (e) => {
      const s = currentSet();
      if (!s?.adCopy) return;
      s.adCopy.regulatedCategory = (e.target as HTMLSelectElement).value as AdCopy["regulatedCategory"];
      // Different categories show a different checklist entirely — simplest correct fix is a
      // full panel re-render rather than trying to patch just the checklist in place.
      adsInspectorPlugin.render(host);
    });

    host.querySelector<HTMLSelectElement>("[data-ad-jurisdiction]")?.addEventListener("change", (e) => {
      const s = currentSet();
      if (!s?.adCopy) return;
      s.adCopy.jurisdiction = (e.target as HTMLSelectElement).value as AdCopy["jurisdiction"];
      // Category list itself is jurisdiction-scoped (labels/coverage can differ) — full re-render.
      adsInspectorPlugin.render(host);
    });
  },
};

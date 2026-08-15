/** OWNER: editor/inspectors — store metadata fields */
import { META_LIMITS, type StoreCopy } from "@take/core";
import { currentSet } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";

const FIELDS: [keyof StoreCopy, string, number][] = [
  ["iosTitle", "iOS title", META_LIMITS.iosTitle],
  ["iosSubtitle", "iOS subtitle", META_LIMITS.iosSubtitle],
  ["iosPromo", "iOS promotional text", META_LIMITS.iosPromo],
  ["iosKeywords", "iOS keywords", META_LIMITS.iosKeywords],
  ["playTitle", "Google Play title", META_LIMITS.playTitle],
  ["playShort", "Play short description", META_LIMITS.playShort],
  ["playFull", "Play full description", META_LIMITS.playFull],
  ["cta", "Primary CTA", 40],
];

export function renderMetaFields(copy: StoreCopy) {
  const host = $("#meta-fields");
  if (!host) return;
  host.innerHTML = FIELDS.map(([key, label, max]) => {
    const val = copy[key] || "";
    const over = val.length > max;
    const isArea = key === "playFull" || key === "iosPromo";
    const control = isArea
      ? `<textarea data-meta="${key}" rows="${key === "playFull" ? 6 : 3}">${escapeHtml(val)}</textarea>`
      : `<input type="text" data-meta="${key}" value="${escapeHtml(val)}" />`;
    return `<div class="meta-field">
      <label><span>${label}</span><span class="count ${over ? "over" : ""}">${val.length}/${max}</span></label>
      ${control}
    </div>`;
  }).join("");
}

export function bindMetaFields() {
  $("#meta-fields")?.addEventListener("input", (e) => {
    const el = (e.target as Element).closest("[data-meta]") as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!el) return;
    const set = currentSet();
    if (!set) return;
    const key = el.dataset.meta as keyof StoreCopy;
    set.copy[key] = el.value;
    const pos = "selectionStart" in el ? el.selectionStart : null;
    renderMetaFields(set.copy);
    const again = $(`[data-meta="${key}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
    if (again) {
      again.focus();
      if (pos != null && again.setSelectionRange) again.setSelectionRange(pos, pos);
    }
  });
}

/** OWNER: modes/template — intake recipe arming */
import { listLayoutTemplates } from "@take/storage";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { getDevice } from "@take/device-catalog";

export function fillTemplatePick(): void {
  const sel = $("#template-pick") as HTMLSelectElement | null;
  if (!sel) return;
  const recipes = listLayoutTemplates();
  sel.innerHTML =
    `<option value="">First library recipe</option>` +
    recipes
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}" ${t.id === state.templateId ? "selected" : ""}>${escapeHtml(t.name)}</option>`
      )
      .join("");
  if (state.templateId) sel.value = state.templateId;
}

export function syncTemplateArm(): void {
  const arm = $("#template-arm") as HTMLElement | null;
  if (arm) arm.hidden = state.mode !== "template";
  fillTemplatePick();
  const hint = $("#template-arm-hint");
  if (!hint) return;
  if (state.mode !== "template") {
    hint.textContent = "";
    return;
  }
  const tpl = listLayoutTemplates().find((t) => t.id === state.templateId);
  const device = tpl?.deviceId ? getDevice(tpl.deviceId) : undefined;
  hint.textContent = tpl
    ? `Armed “${tpl.name}”${device ? ` · ${device.name}` : ""}${tpl.defaultOrientation ? ` · ${tpl.defaultOrientation}` : ""}`
    : "Generate uses the first library recipe (user save wins over system).";
}

export function bindTemplateArm(): void {
  fillTemplatePick();
  syncTemplateArm();
  $("#template-pick")?.addEventListener("change", () => {
    const sel = $("#template-pick") as HTMLSelectElement;
    state.templateId = sel.value;
    syncTemplateArm();
  });
}

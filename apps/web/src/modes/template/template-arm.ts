/** OWNER: modes/template — intake recipe arming */
import { listLayoutTemplates } from "@take/storage";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { getDevice } from "@take/device-catalog";

export function fillTemplatePick(): void {
  const sel = $("#template-pick") as HTMLSelectElement | null;
  if (!sel) return;
  sel.innerHTML = "";
}

export function syncTemplateArm(): void {
  const arm = $("#template-arm") as HTMLElement | null;
  const armed = !!state.templateId;
  if (arm) arm.hidden = !armed;
  const hint = $("#template-arm-hint");
  if (!hint) return;
  if (!armed) {
    hint.textContent = "";
    return;
  }
  const tpl = listLayoutTemplates().find((t) => t.id === state.templateId);
  const device = tpl?.deviceId ? getDevice(tpl.deviceId) : undefined;
  hint.textContent = tpl
    ? `Scan to fill “${tpl.name}”${device ? ` · ${device.name}` : ""}. Generate applies this look — it does not invent a new layout.`
    : "A Library look is armed. Generate applies it after scan.";
}

export function bindTemplateArm(): void {
  syncTemplateArm();
}

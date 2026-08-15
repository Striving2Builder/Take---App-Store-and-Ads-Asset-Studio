/** OWNER: library-ui — save template modal (update vs save as new) */
import { saveUserTemplate, updateUserTemplate, pushHistory, getTemplates } from "@take/storage";
import { currentSet, state } from "../app/app-state";
import { $ } from "../shared/dom";
import { toast } from "../shell/toast";
import type { TemplateRecord } from "@take/template-engine";

function armedUserId(): string | null {
  if (!state.templateId.startsWith("user-")) return null;
  return getTemplates().some((t) => t.id === state.templateId && t.kind === "user")
    ? state.templateId
    : null;
}

function payload(name: string, id: string) {
  const set = currentSet();
  if (!set) return null;
  const recipe = set.layout?.recipe as TemplateRecord | undefined;
  if (recipe) {
    recipe.lockBrand = ($("#tpl-lock-brand") as HTMLInputElement).checked;
    recipe.name = name;
  }
  return {
    id,
    name,
    tags: ($("#tpl-tags") as HTMLInputElement).value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    platform: state.inference?.platform || "ios",
    kind: "user" as const,
    style: set.style,
    frames: set.frames.length,
    lockBrand: ($("#tpl-lock-brand") as HTMLInputElement).checked,
    palette: set.palette,
    copy: set.copy,
    frameData: set.frames,
    prompt: state.inference,
    deviceId: state.deviceId,
    defaultOrientation: state.orientation,
    composition: set.composition,
    layout: recipe,
    updated: new Date().toISOString().slice(0, 10),
    version: 1,
  };
}

export function openSaveTemplateModal() {
  const set = currentSet();
  if (!set) return;
  ($("#tpl-name") as HTMLInputElement).value = `${state.inference?.name || "App"} · ${set.name}`;
  ($("#tpl-tags") as HTMLInputElement).value = [state.inference?.platform, set.style, "sequence"]
    .filter(Boolean)
    .join(", ");
  const lock = $("#tpl-lock-brand") as HTMLInputElement | null;
  if (lock) {
    const recipe = set.layout?.recipe as TemplateRecord | undefined;
    lock.checked = !!(recipe?.lockBrand);
  }
  const updateBtn = $("#tpl-update") as HTMLButtonElement | null;
  if (updateBtn) updateBtn.hidden = !armedUserId();
  ($("#template-modal") as HTMLDialogElement).showModal();
}

export function bindTemplateModal() {
  $("#tpl-cancel")?.addEventListener("click", () => {
    ($("#template-modal") as HTMLDialogElement).close();
  });

  $("#tpl-update")?.addEventListener("click", (e) => {
    e.preventDefault();
    const name = ($("#tpl-name") as HTMLInputElement).value.trim();
    const id = armedUserId();
    if (!name || !id) return;
    const row = payload(name, id);
    if (!row) return;
    if (!updateUserTemplate(row)) {
      toast("Armed recipe is not a user card — use Save as new");
      return;
    }
    pushHistory("template.update", id);
    ($("#template-modal") as HTMLDialogElement).close();
    toast("Updated armed library recipe");
  });

  $("#template-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const set = currentSet();
    const name = ($("#tpl-name") as HTMLInputElement).value.trim();
    if (!name || !set) return;
    const id = `user-${Date.now()}`;
    const row = payload(name, id);
    if (!row) return;
    saveUserTemplate(row);
    state.templateId = id;
    pushHistory("template.save", name);
    ($("#template-modal") as HTMLDialogElement).close();
    toast("Saved as new library recipe");
  });
}

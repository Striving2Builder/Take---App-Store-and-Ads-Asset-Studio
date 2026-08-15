/** OWNER: library-ui — save template modal */
import { saveUserTemplate, pushHistory } from "@take/storage";
import { currentSet, state } from "../app/app-state";
import { $ } from "../shared/dom";
import { toast } from "../shell/toast";

export function openSaveTemplateModal() {
  const set = currentSet();
  if (!set) return;
  ($("#tpl-name") as HTMLInputElement).value = `${state.inference?.name || "App"} · ${set.name}`;
  ($("#tpl-tags") as HTMLInputElement).value = [state.inference?.platform, set.style, "sequence"]
    .filter(Boolean)
    .join(", ");
  ($("#template-modal") as HTMLDialogElement).showModal();
}

export function bindTemplateModal() {
  $("#tpl-cancel")?.addEventListener("click", () => {
    ($("#template-modal") as HTMLDialogElement).close();
  });

  $("#template-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const set = currentSet();
    const name = ($("#tpl-name") as HTMLInputElement).value.trim();
    if (!name || !set) return;
    saveUserTemplate({
      id: `user-${Date.now()}`,
      name,
      tags: ($("#tpl-tags") as HTMLInputElement).value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      platform: state.inference?.platform || "ios",
      kind: "user",
      style: set.style,
      frames: set.frames.length,
      lockBrand: ($("#tpl-lock-brand") as HTMLInputElement).checked,
      palette: set.palette,
      copy: set.copy,
      frameData: set.frames,
      prompt: state.inference,
      updated: new Date().toISOString().slice(0, 10),
      version: 1,
    });
    pushHistory("template.save", name);
    ($("#template-modal") as HTMLDialogElement).close();
    toast("Saved to your personal library");
  });
}

/** OWNER: stages/intake — local upload previews (data URLs so refresh survives) */
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { updateMissing } from "./intake.missing";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error || new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function paintUploadPreview() {
  const prev = $("#upload-preview") as HTMLElement | null;
  if (!prev) return;
  if (!state.uploads.length) {
    prev.hidden = true;
    prev.innerHTML = "";
    return;
  }
  prev.hidden = false;
  prev.innerHTML = state.uploads
    .map((u) => `<img class="upload-thumb" src="${u.url}" alt="${escapeHtml(u.name)}" />`)
    .join("");
}

export async function handleFiles(files: FileList | null) {
  if (!files) return;
  const images = [...files].filter((f) => f.type.startsWith("image/"));
  for (const file of images) {
    try {
      const url = await fileToDataUrl(file);
      state.uploads.push({ name: file.name, url });
    } catch {
      toast(`Could not read ${file.name}`);
    }
  }
  paintUploadPreview();
  updateMissing();
}

export function bindUploads() {
  ["#upload-shots", "#upload-icon", "#upload-brand", "#upload-comp"].forEach((sel) => {
    $(sel)?.addEventListener("change", (e) => {
      void handleFiles((e.target as HTMLInputElement).files);
    });
  });
}

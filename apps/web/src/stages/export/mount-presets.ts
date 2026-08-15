/** OWNER: stages/export — render #export-presets from @take/export-presets */
import { allPresets } from "@take/export-presets";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { persistExportPresetIds, resolvedExportPresetIds } from "./persist-presets";

export function selectedPresetIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>("#export-presets input:checked")).map(
    (el) => el.value
  );
}

export function syncExportPresetChecks(): void {
  const selected = new Set(resolvedExportPresetIds());
  for (const el of document.querySelectorAll<HTMLInputElement>("#export-presets input[type=checkbox]")) {
    el.checked = selected.has(el.value);
  }
}

export function captureExportPresetIds(): void {
  persistExportPresetIds(selectedPresetIds());
}

export function mountExportPresets(opts?: { onChange?: () => void }): void {
  const root = $<HTMLElement>("#export-presets");
  if (!root) return;
  if (root.dataset.mounted !== "1") {
    const selected = new Set(resolvedExportPresetIds());
    root.innerHTML = allPresets()
      .map((p) => {
        const checked = selected.has(p.id) ? " checked" : "";
        return `<label class="preset"><input type="checkbox"${checked} value="${escapeHtml(p.id)}" /><span>${escapeHtml(p.label)}</span><em class="mono">${escapeHtml(p.sizes)}</em></label>`;
      })
      .join("");
    root.dataset.mounted = "1";
    root.addEventListener("change", () => {
      captureExportPresetIds();
      opts?.onChange?.();
    });
  } else {
    syncExportPresetChecks();
  }
}

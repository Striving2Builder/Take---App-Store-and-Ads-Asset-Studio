/** OWNER: modes/template — recipe picker + generate vs apply */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { listLayoutTemplates } from "@take/storage";
import { getDevice } from "@take/device-catalog";
import { recipeFromSaved, refreshCopy, bindRecipeShell, type TemplateRecord } from "@take/template-engine";
import { currentSet, state } from "../../app/app-state";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { renderReview } from "../../stages/review/review.render";
import { renderEditor } from "../../editor/canvas/edit-canvas";
import { mountModePlugins } from "../mode-plugins";
import {
  refreshDevicePickerForPlatform,
  syncDevicePickerValue,
} from "../../editor/device/device-picker";
import { syncOrientationUi } from "../../editor/device/orientation-control";
import {
  resolveApplyStoreShell,
  syncStoreTargetUi,
} from "../../editor/device/store-target-control";
import { pickTemplate } from "./template-pick";
import { projectSetFromRecipe } from "./template-set";

function boundLine(): string {
  const tpl = listLayoutTemplates().find((t) => t.id === state.templateId);
  const id = tpl?.deviceId || state.deviceId;
  const device = id ? getDevice(id) : undefined;
  const orient = tpl?.defaultOrientation || state.orientation;
  const name = tpl?.name || "first library recipe";
  return `Armed: ${name} · ${device?.name || id || "current device"} · ${orient}`;
}

function currentRecipe(): TemplateRecord | null {
  const raw = currentSet()?.layout?.recipe;
  if (raw && typeof raw === "object") return raw as TemplateRecord;
  return null;
}

function afterApply() {
  syncDevicePickerValue();
  syncOrientationUi();
  renderReview();
  renderEditor();
  mountModePlugins();
}

export const templateReviewPlugin: ModeEditorPlugin = {
  id: "template-review",
  title: "Template",
  slot: "review",
  render(host) {
    host.innerHTML = `<p class="hint tight">${escapeHtml(boundLine())}</p>
      <p class="hint tight">Generate builds new legal layouts from the grammar (not LLM). Pick a library card to apply a saved recipe.</p>`;
  },
};

export const templateInspectorPlugin: ModeEditorPlugin = {
  id: "template-inspector",
  title: "Recipe",
  slot: "inspector",
  render(host) {
    const recipes = listLayoutTemplates();
    const opts = recipes
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}" ${t.id === state.templateId ? "selected" : ""}>${escapeHtml(t.name)}</option>`
      )
      .join("");
    const rec = currentRecipe();
    const seedLine = rec?.provenance?.seed
      ? `Seed ${rec.provenance.seed} · grammar ${rec.provenance.grammarVersion || "—"}`
      : "No generated seed on this set";
    host.innerHTML = `
      <p class="hint tight">${escapeHtml(boundLine())}</p>
      <p class="hint tight">${escapeHtml(seedLine)}</p>
      <label class="block-label">Library recipe
        <select id="mode-template-pick">${opts}</select>
      </label>
      <button type="button" class="btn ghost small block" id="tpl-apply-library">Apply library recipe</button>
      <button type="button" class="btn ghost small block" id="tpl-refresh-copy">Refresh copy</button>
      <p class="hint tight">Generate (intake) = new geometry. Refresh copy keeps placement. Drag devices on the export slice; Save stores x/y/w/h.</p>
    `;
    host.querySelector("#mode-template-pick")?.addEventListener("change", (e) => {
      const id = (e.target as HTMLSelectElement).value;
      state.templateId = id;
    });
    host.querySelector("#tpl-apply-library")?.addEventListener("click", () => {
      const brief = state.inference;
      if (!brief) {
        toast("Scan first");
        return;
      }
      const tpl = pickTemplate(state.templateId);
      let recipe = recipeFromSaved({ ...tpl, layout: tpl?.layout });
      const mobile = (recipe.tags || []).includes("mobile") || tpl?.platform === "mobile";
      if (mobile) {
        const shell = resolveApplyStoreShell(brief.platform);
        recipe = bindRecipeShell(recipe, shell);
        state.platform = shell;
        // Only reset to the shell's default device when the current one
        // isn't already on that platform — otherwise this silently threw
        // away a real, resolution-matched device (applyAutoDeviceMatch())
        // in favor of the recipe's hardcoded default, forcing an upscale.
        if (getDevice(state.deviceId)?.platform !== shell) {
          refreshDevicePickerForPlatform(shell);
        }
      }
      const set = projectSetFromRecipe(recipe, brief, {
        // Raw state.deviceId, not pre-resolved against recipe.deviceId — see
        // projectSetFromRecipe's own platform-aware resolveDeviceId().
        deviceId: state.deviceId,
        seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
        index: 0,
      });
      state.sets = [set];
      state.selectedSet = 0;
      state.activeFrame = 0;
      if (set.deviceId) state.deviceId = set.deviceId;
      if (recipe.defaultOrientation) state.orientation = recipe.defaultOrientation;
      syncDevicePickerValue();
      syncStoreTargetUi();
      afterApply();
      toast("Library recipe applied");
    });
    host.querySelector("#tpl-refresh-copy")?.addEventListener("click", () => {
      const brief = state.inference;
      const set = currentSet();
      const recipe = currentRecipe();
      if (!brief || !set || !recipe) {
        toast("No layout to refresh");
        return;
      }
      const applied = refreshCopy(recipe, brief);
      set.frames = applied.frames;
      afterApply();
      toast("Copy refreshed — layout unchanged");
    });
  },
};

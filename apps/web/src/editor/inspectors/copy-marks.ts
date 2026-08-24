/** OWNER: editor/inspectors — ExtraSlot copy marks + face (not store headline) */
import { EXTRA_FACES, type ExtraFace, type ExtraSlot } from "@take/template-engine";
import { $ } from "../../shared/dom";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
import { selectedLayoutExtraId, selectLayoutExtra } from "../layout/layout-drag";
import { paintLayoutSliceNow, scheduleLayoutPaint } from "../layout/layout-live-paint";

function selectedCopy(): ExtraSlot | null {
  const recipe = stripRecipeOfSet();
  const id = selectedLayoutExtraId();
  if (!recipe || !id) return null;
  const slot = recipe.extras?.find((e) => e.id === id);
  if (!slot || slot.kind !== "copy" || slot.widget) return null;
  return slot;
}

function patchSelected(partial: Partial<ExtraSlot>) {
  const recipe = ensureSetRecipe();
  const id = selectedLayoutExtraId();
  if (!recipe || !id || !recipe.extras) return;
  const i = recipe.extras.findIndex((e) => e.id === id);
  if (i < 0) return;
  recipe.extras[i] = { ...recipe.extras[i], ...partial, authored: true };
  attachRecipeToSet(recipe);
}

export function renderCopyMarksRow() {
  const row = $("#copy-marks-row") as HTMLElement | null;
  const area = $("#extra-copy-text") as HTMLTextAreaElement | null;
  if (!row || !area) return;
  const slot = selectedCopy();
  row.hidden = !slot;
  if (!slot) return;
  if (document.activeElement !== area) area.value = slot.text || "";
  const face = slot.face === "script" ? "script" : "display";
  row.querySelectorAll<HTMLElement>("[data-extra-face]").forEach((btn) => {
    const on = btn.dataset.extraFace === face;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

export function bindCopyMarks() {
  const area = $("#extra-copy-text") as HTMLTextAreaElement | null;
  area?.addEventListener("input", () => {
    if (!selectedCopy()) return;
    patchSelected({ text: area.value });
    scheduleLayoutPaint();
  });
  $("#extra-face-row")?.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-extra-face]") as HTMLElement | null;
    const raw = btn?.dataset.extraFace;
    if (!EXTRA_FACES.includes(raw as ExtraFace)) return;
    if (!selectedCopy()) return;
    patchSelected({ face: raw as ExtraFace });
    renderCopyMarksRow();
    void paintLayoutSliceNow();
  });
}

export function selectNewestCopy(recipeExtras: ExtraSlot[] | undefined) {
  const last = recipeExtras?.[recipeExtras.length - 1];
  if (last?.kind === "copy" && !last.widget) selectLayoutExtra(last.id);
}

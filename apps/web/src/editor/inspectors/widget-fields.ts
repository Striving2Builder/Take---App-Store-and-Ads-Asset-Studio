/** OWNER: editor/inspectors — edit selected proof widget (score / quote / pills) */
import type { ExtraSlot } from "@take/template-engine";
import { $ } from "../../shared/dom";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
import { selectedLayoutExtraId, selectLayoutExtra } from "../layout/layout-drag";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";

function selectedWidget(): ExtraSlot | null {
  const recipe = stripRecipeOfSet();
  const id = selectedLayoutExtraId();
  if (!recipe || !id) return null;
  const slot = recipe.extras?.find((e) => e.id === id);
  if (!slot?.widget) return null;
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

function show(el: HTMLElement | null, on: boolean) {
  if (el) el.hidden = !on;
}

export function renderWidgetFields() {
  const row = $("#widget-fields-row") as HTMLElement | null;
  if (!row) return;
  const slot = selectedWidget();
  row.hidden = !slot;
  if (!slot) return;
  const score = $("#widget-score") as HTMLInputElement | null;
  const label = $("#widget-store-label") as HTMLInputElement | null;
  const quote = $("#widget-quote") as HTMLTextAreaElement | null;
  const attr = $("#widget-attribution") as HTMLInputElement | null;
  const pills = $("#widget-pills") as HTMLInputElement | null;
  const isRating = slot.widget === "rating";
  const isReview = slot.widget === "review";
  const isPills = slot.widget === "pills";
  show(score, isRating);
  show(label, isRating);
  show(quote, isReview);
  show(attr, isReview);
  show(pills, isPills);
  if (isRating && score && document.activeElement !== score) {
    score.value = slot.score != null && Number.isFinite(slot.score) ? String(slot.score) : "";
  }
  if (isRating && label && document.activeElement !== label) label.value = slot.storeLabel || "";
  if (isReview && quote && document.activeElement !== quote) quote.value = slot.quote || slot.text || "";
  if (isReview && attr && document.activeElement !== attr) attr.value = slot.attribution || "";
  if (isPills && pills && document.activeElement !== pills) {
    pills.value = (slot.pills || []).join(", ");
  }
}

export function bindWidgetFields() {
  const score = $("#widget-score") as HTMLInputElement | null;
  score?.addEventListener("input", () => {
    if (!selectedWidget()) return;
    const n = score.value.trim() === "" ? undefined : Number(score.value);
    patchSelected({ score: n != null && Number.isFinite(n) ? n : undefined });
    scheduleLayoutPaint();
  });
  $("#widget-store-label")?.addEventListener("input", (e) => {
    if (!selectedWidget()) return;
    patchSelected({ storeLabel: (e.target as HTMLInputElement).value });
    scheduleLayoutPaint();
  });
  $("#widget-quote")?.addEventListener("input", (e) => {
    if (!selectedWidget()) return;
    const text = (e.target as HTMLTextAreaElement).value;
    patchSelected({ quote: text, text });
    scheduleLayoutPaint();
  });
  $("#widget-attribution")?.addEventListener("input", (e) => {
    if (!selectedWidget()) return;
    patchSelected({ attribution: (e.target as HTMLInputElement).value });
    scheduleLayoutPaint();
  });
  $("#widget-pills")?.addEventListener("input", (e) => {
    if (!selectedWidget()) return;
    const raw = (e.target as HTMLInputElement).value;
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    patchSelected({ pills: list, text: raw });
    scheduleLayoutPaint();
  });
}

export function selectNewestWidget(recipeExtras: ExtraSlot[] | undefined) {
  const last = recipeExtras?.[recipeExtras.length - 1];
  if (last?.widget) selectLayoutExtra(last.id);
}

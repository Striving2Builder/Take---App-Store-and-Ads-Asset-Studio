/** OWNER: editor/inspectors — C1 pitch / yaw sliders on the selected device */
import { DEFAULT_DEPTH, hasPerspective } from "@take/template-engine";
import { $ } from "../../shared/dom";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { attachRecipeToSet, ensureSetRecipe } from "../layout/attach-recipe";
import { selectedLayoutDeviceId } from "../layout/layout-drag";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";

const YAW_MAX = 35;
const PITCH_MAX = 20;

function selectedDevice() {
  const recipe = stripRecipeOfSet();
  const id = selectedLayoutDeviceId();
  if (!recipe || !id) return null;
  return recipe.devices.find((d) => d.id === id) || null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function setVal(id: string, text: string) {
  const el = $(id);
  if (el) el.textContent = text;
}

export function renderTiltSliders() {
  const row = $("#tilt-sliders-row") as HTMLElement | null;
  const yaw = $("#device-yaw") as HTMLInputElement | null;
  const pitch = $("#device-pitch") as HTMLInputElement | null;
  if (!row || !yaw || !pitch) return;
  const inst = selectedDevice();
  row.hidden = !inst;
  if (!inst) return;
  const y = clamp(Math.round(inst.rotateYDeg || 0), -YAW_MAX, YAW_MAX);
  const x = clamp(Math.round(inst.rotateXDeg || 0), -PITCH_MAX, PITCH_MAX);
  if (document.activeElement !== yaw) yaw.value = String(y);
  if (document.activeElement !== pitch) pitch.value = String(x);
  setVal("#device-yaw-val", `${y}°`);
  setVal("#device-pitch-val", `${x}°`);
}

function patchTilt(partial: { rotateXDeg?: number; rotateYDeg?: number }) {
  const recipe = ensureSetRecipe();
  const id = selectedLayoutDeviceId();
  if (!recipe || !id) return;
  const i = recipe.devices.findIndex((d) => d.id === id);
  if (i < 0) return;
  const next = { ...recipe.devices[i], ...partial, authored: true };
  const live = hasPerspective(next);
  next.depth = live ? next.depth || DEFAULT_DEPTH : undefined;
  if (!live) {
    next.rotateXDeg = 0;
    next.rotateYDeg = 0;
  }
  recipe.devices[i] = next;
  attachRecipeToSet(recipe);
}

export function bindTiltSliders() {
  const yaw = $("#device-yaw") as HTMLInputElement | null;
  const pitch = $("#device-pitch") as HTMLInputElement | null;
  yaw?.addEventListener("input", () => {
    if (!selectedDevice()) return;
    const rotateYDeg = clamp(Number(yaw.value) || 0, -YAW_MAX, YAW_MAX);
    setVal("#device-yaw-val", `${rotateYDeg}°`);
    patchTilt({ rotateYDeg });
    scheduleLayoutPaint();
  });
  pitch?.addEventListener("input", () => {
    if (!selectedDevice()) return;
    const rotateXDeg = clamp(Number(pitch.value) || 0, -PITCH_MAX, PITCH_MAX);
    setVal("#device-pitch-val", `${rotateXDeg}°`);
    patchTilt({ rotateXDeg });
    scheduleLayoutPaint();
  });
}

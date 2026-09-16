/** OWNER: editor/inspectors — 2D/3D canvas-render toggle
 *  Real perspective, not a cosmetic flag: 3D writes a real rotateYDeg/depth
 *  onto every device in the active set's layout recipe, which paint-devices.ts's
 *  hasPerspective() + paintProjected() already render for real (the same
 *  engine authored "yaw" templates use) — this just makes it a project-wide
 *  toggle instead of something only a template author could set. 2D zeroes
 *  those fields back out (paintFlat). Toggling 3D always applies a freshly
 *  generated tilt pattern; it does not restore a specific template's
 *  original authored angles if they'd been overridden — disclosed, not a bug. */
import { currentSet } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { ensureSetRecipe, attachRecipeToSet } from "../layout/attach-recipe";

const DEPTH = 0.045;

function tiltFor(index: number): { rotateXDeg: number; rotateYDeg: number; depth: number } {
  const sign = index % 2 === 0 ? 1 : -1;
  const mag = 16 + (index % 3) * 4;
  return { rotateXDeg: 0, rotateYDeg: sign * mag, depth: DEPTH };
}

function apply3d(to3d: boolean) {
  const recipe = stripRecipeOfSet() || ensureSetRecipe();
  if (!recipe) return;
  recipe.devices.forEach((d, i) => {
    if (to3d) {
      Object.assign(d, tiltFor(i));
    } else {
      d.rotateXDeg = 0;
      d.rotateYDeg = 0;
      d.depth = undefined;
    }
  });
  attachRecipeToSet(recipe);
}

export function syncRenderModeControl() {
  const set = currentSet();
  const is3d = !!set?.render3d;
  const btn2d = $("#render-mode-2d") as HTMLButtonElement | null;
  const btn3d = $("#render-mode-3d") as HTMLButtonElement | null;
  if (btn2d) {
    btn2d.classList.toggle("is-active", !is3d);
    btn2d.setAttribute("aria-pressed", (!is3d).toString());
  }
  if (btn3d) {
    btn3d.classList.toggle("is-active", is3d);
    btn3d.setAttribute("aria-pressed", is3d.toString());
  }
}

export function bindRenderModeControl() {
  const btn2d = $("#render-mode-2d") as HTMLButtonElement | null;
  const btn3d = $("#render-mode-3d") as HTMLButtonElement | null;
  if (!btn2d || !btn3d) return;

  function setMode(to3d: boolean) {
    const set = currentSet();
    if (!set) return;
    if (!!set.render3d === to3d) return;
    set.render3d = to3d;
    apply3d(to3d);
    syncRenderModeControl();
    scheduleLayoutPaint();
  }

  btn2d.addEventListener("click", () => setMode(false));
  btn3d.addEventListener("click", () => setMode(true));
}

/** OWNER: editor/strip — readable Set carousel; shares paintStripSlice */
import { resolveExportSize } from "@take/device-catalog";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { paintExportFrame } from "../../stages/export/frame-render";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { ensureSetRecipe } from "../layout/attach-recipe";

const SET_W = 168;

export function syncEditViewToggle() {
  document.querySelectorAll<HTMLElement>("[data-edit-view]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.editView === state.editView);
  });
}

export async function refreshSetView() {
  const host = $("#set-stage") as HTMLElement | null;
  const rail = $("#set-stage-rail") as HTMLElement | null;
  const sliceCanvas = $("#edit-canvas") as HTMLElement | null;
  if (!host || !rail) return;

  const on = state.editView === "set";
  host.hidden = !on;
  if (sliceCanvas) sliceCanvas.hidden = on;
  syncEditViewToggle();
  if (!on) {
    rail.innerHTML = "";
    return;
  }

  const set = currentSet();
  if (!set) {
    rail.innerHTML = "";
    return;
  }

  ensureSetRecipe();
  const recipe = stripRecipeOfSet();
  const { w, h } = resolveExportSize(state.deviceId, state.platform, state.orientation).size;
  const setH = Math.round(SET_W * (h / w));
  const n = set.frames.length;
  rail.innerHTML = "";
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < n; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `set-slice${i === state.activeFrame ? " is-active" : ""}`;
    btn.dataset.frame = String(i);
    btn.setAttribute("aria-label", `Frame ${i + 1}`);
    const canvas = document.createElement("canvas");
    canvas.width = SET_W;
    canvas.height = setH;
    btn.appendChild(canvas);
    rail.appendChild(btn);
    canvases.push(canvas);
  }

  for (let i = 0; i < n; i++) {
    if (recipe) {
      await paintStripSlice(canvases[i], i, { w: SET_W, h: setH });
    } else {
      await paintExportFrame(canvases[i], i);
    }
  }
}

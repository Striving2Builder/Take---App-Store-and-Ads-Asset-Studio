/** OWNER: editor/layout — drag / resize / rotate device slots on #layout-stage */
import {
  hitDevice,
  moveDevice,
  resizeDevice,
  rotateDevice,
  slicesTouched,
  validateLayout,
  resolveMetrics,
  type ResizeCorner,
  type TemplateRecord,
} from "@take/template-engine";
import { resolveExportSize } from "@take/device-catalog";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { toast } from "../../shell/toast";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { refreshStripPreview } from "../strip/strip-preview";

type DragKind = "move" | "resize" | "rotate";

type DragState = {
  kind: DragKind;
  id: string;
  corner?: ResizeCorner;
  lastX: number;
  lastY: number;
  lastAngle?: number;
};

let selectedId: string | null = null;
let drag: DragState | null = null;
let bound = false;

function exportSize() {
  return resolveExportSize(state.deviceId, state.platform, state.orientation).size;
}

function canvasNorm(e: PointerEvent): { nx: number; ny: number; rect: DOMRect } | null {
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  return {
    nx: (e.clientX - rect.left) / rect.width,
    ny: (e.clientY - rect.top) / rect.height,
    rect,
  };
}

function patchDevice(id: string, fn: (inst: TemplateRecord["devices"][number]) => TemplateRecord["devices"][number]) {
  const recipe = stripRecipeOfSet();
  if (!recipe) return;
  const i = recipe.devices.findIndex((d) => d.id === id);
  if (i < 0) return;
  recipe.devices[i] = fn(recipe.devices[i]);
}

function boxStyle(inst: TemplateRecord["devices"][number], sliceIndex: number, sliceW: number, sliceH: number): string {
  const hSlice = (inst.h * sliceW) / Math.max(1, sliceH);
  const left = (inst.x - sliceIndex - inst.w / 2) * 100;
  const top = (inst.y - hSlice / 2) * 100;
  return [
    `left:${left}%`,
    `top:${top}%`,
    `width:${inst.w * 100}%`,
    `height:${hSlice * 100}%`,
    `transform:rotate(${inst.rotationDeg}deg)`,
  ].join(";");
}

const HANDLE_HTML = `
  <span class="layout-handle" data-layout-handle="nw"></span>
  <span class="layout-handle" data-layout-handle="ne"></span>
  <span class="layout-handle" data-layout-handle="sw"></span>
  <span class="layout-handle" data-layout-handle="se"></span>
  <span class="layout-handle layout-handle-rotate" data-layout-handle="rotate"></span>
`;

function rebuildHandles() {
  const host = $("#layout-handles") as HTMLElement | null;
  const stage = $("#layout-stage") as HTMLElement | null;
  const recipe = stripRecipeOfSet();
  if (!host || !stage) return;
  if (!recipe || stage.hidden) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  const { w, h } = exportSize();
  const slice = state.activeFrame;
  host.innerHTML = recipe.devices
    .filter((d) => slicesTouched(d, recipe.frameCount, w, h).includes(slice))
    .map((d) => {
      const sel = d.id === selectedId ? " is-selected" : "";
      const handles = d.id === selectedId ? HANDLE_HTML : "";
      return `<div class="layout-device-box${sel}" data-device-id="${d.id}" style="${boxStyle(d, slice, w, h)}">${handles}</div>`;
    })
    .join("");
}

function updateSelectedBox() {
  if (!selectedId) return;
  const recipe = stripRecipeOfSet();
  const inst = recipe?.devices.find((d) => d.id === selectedId);
  const box = document.querySelector<HTMLElement>(`.layout-device-box[data-device-id="${selectedId}"]`);
  if (!inst || !box) {
    rebuildHandles();
    return;
  }
  const { w, h } = exportSize();
  box.setAttribute("style", boxStyle(inst, state.activeFrame, w, h));
}

async function livePaint() {
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  const recipe = stripRecipeOfSet();
  const set = currentSet();
  if (!canvas || !recipe || !set) return;
  const { w, h } = exportSize();
  const cw = canvas.width || 264;
  await paintStripSlice(canvas, state.activeFrame, {
    w: cw,
    h: Math.round(cw * (h / w)),
    skipType: true,
    recipe,
    frames: set.frames,
    palette: set.palette,
  });
  if (drag) updateSelectedBox();
  else rebuildHandles();
}

function finishDrag() {
  drag = null;
  rebuildHandles();
  const recipe = stripRecipeOfSet();
  if (!recipe) return;
  const { w, h } = exportSize();
  const metrics = resolveMetrics(state.deviceId, state.platform, state.orientation);
  const check = validateLayout(recipe, w, h, metrics);
  if (!check.ok) toast(`Layout note: ${check.errors[0]}`);
  void refreshStripPreview();
}

function onPointerDown(e: PointerEvent) {
  const stage = $("#layout-stage") as HTMLElement | null;
  if (!stage || stage.hidden) return;
  const target = e.target as HTMLElement;
  if (target.isContentEditable) return;

  const handle = target.closest("[data-layout-handle]") as HTMLElement | null;
  const box = target.closest("[data-device-id]") as HTMLElement | null;
  const recipe = stripRecipeOfSet();
  if (!recipe) return;

  const { w, h } = exportSize();
  let id = box?.dataset.deviceId || null;
  let kind: DragKind = "move";
  let corner: ResizeCorner | undefined;

  if (handle && box) {
    id = box.dataset.deviceId || null;
    const hKind = handle.dataset.layoutHandle || "";
    if (hKind === "rotate") kind = "rotate";
    else {
      kind = "resize";
      corner = hKind as ResizeCorner;
    }
  } else if (!id) {
    const norm = canvasNorm(e);
    if (!norm) return;
    const hit = hitDevice(recipe.devices, state.activeFrame, norm.nx, norm.ny, w, h);
    id = hit?.id || null;
    if (!id) {
      selectedId = null;
      rebuildHandles();
      return;
    }
    kind = e.altKey ? "rotate" : "move";
  } else if (e.altKey) {
    kind = "rotate";
  }

  if (!id) return;
  e.preventDefault();
  selectedId = id;
  const inst = recipe.devices.find((d) => d.id === id);
  const norm = canvasNorm(e);
  const cx = inst ? inst.x - state.activeFrame : 0.5;
  const cy = inst?.y ?? 0.5;
  const lastAngle = norm
    ? (Math.atan2(norm.ny - cy, norm.nx - cx) * 180) / Math.PI
    : 0;
  drag = { kind, id, corner, lastX: e.clientX, lastY: e.clientY, lastAngle };
  stage.setPointerCapture(e.pointerId);
  rebuildHandles();
}

function onPointerMove(e: PointerEvent) {
  if (!drag) return;
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dx = (e.clientX - drag.lastX) / rect.width;
  const dy = (e.clientY - drag.lastY) / rect.height;
  const { w, h } = exportSize();

  if (drag.kind === "move") {
    patchDevice(drag.id, (inst) => moveDevice(inst, dx, dy));
  } else if (drag.kind === "resize" && drag.corner) {
    patchDevice(drag.id, (inst) => resizeDevice(inst, drag!.corner!, dx, dy, w, h));
  } else if (drag.kind === "rotate") {
    const recipe = stripRecipeOfSet();
    const inst = recipe?.devices.find((d) => d.id === drag!.id);
    const norm = canvasNorm(e);
    if (inst && norm && drag.lastAngle != null) {
      const cx = inst.x - state.activeFrame;
      const angle = (Math.atan2(norm.ny - inst.y, norm.nx - cx) * 180) / Math.PI;
      const delta = angle - drag.lastAngle;
      drag.lastAngle = angle;
      patchDevice(drag.id, (d) => rotateDevice(d, delta));
    }
  }
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  void livePaint();
}

function onPointerUp(e: PointerEvent) {
  if (!drag) return;
  const stage = $("#layout-stage") as HTMLElement | null;
  if (stage?.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
  finishDrag();
}

function onKeyDown(e: KeyboardEvent) {
  if (!selectedId) return;
  const stage = $("#layout-stage") as HTMLElement | null;
  if (!stage || stage.hidden) return;
  if ((e.target as HTMLElement)?.isContentEditable) return;
  const step = e.shiftKey ? 0.005 : 0.02;
  let dx = 0;
  let dy = 0;
  if (e.key === "ArrowLeft") dx = -step;
  else if (e.key === "ArrowRight") dx = step;
  else if (e.key === "ArrowUp") dy = -step;
  else if (e.key === "ArrowDown") dy = step;
  else return;
  e.preventDefault();
  patchDevice(selectedId, (inst) => moveDevice(inst, dx, dy));
  void livePaint().then(() => refreshStripPreview());
}

export function bindLayoutDrag() {
  if (bound) return;
  bound = true;
  const stage = $("#layout-stage") as HTMLElement | null;
  stage?.addEventListener("pointerdown", onPointerDown);
  stage?.addEventListener("pointermove", onPointerMove);
  stage?.addEventListener("pointerup", onPointerUp);
  stage?.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
}

export function syncLayoutDrag() {
  const hint = $("#layout-stage-hint") as HTMLElement | null;
  const stage = $("#layout-stage") as HTMLElement | null;
  const on = !!stripRecipeOfSet() && !!stage && !stage.hidden;
  if (hint) hint.hidden = !on;
  if (!on) {
    selectedId = null;
    drag = null;
  }
  rebuildHandles();
}

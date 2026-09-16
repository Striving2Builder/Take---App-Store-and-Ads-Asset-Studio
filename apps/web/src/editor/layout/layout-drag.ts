/** OWNER: editor/layout — drag / resize / rotate devices + extras on #layout-stage */
import {
  extrasInSlice,
  hasPerspective,
  hitDevice,
  hitExtra,
  instanceAabb,
  moveDevice,
  moveExtra,
  resizeDevice,
  resizeExtra,
  rotateDevice,
  rotateExtra,
  slicesTouched,
  validateLayout,
  resolveMetrics,
  type ExtraSlot,
  type ResizeCorner,
  type TemplateRecord,
} from "@take/template-engine";
import { resolveExportSize } from "@take/device-catalog";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { isTypingTarget } from "../../shared/typing-target";
import { toast } from "../../shell/toast";
import { paintStripSlice, stripRecipeOfSet } from "../../stages/export/paint-strip-slice";
import { refreshStripPreview } from "../strip/strip-preview";
import { commitHistory, syncHistoryButtons } from "../history/edit-history";

type DragKind = "move" | "resize" | "rotate";
type DragTarget = "device" | "extra";

type DragState = {
  kind: DragKind;
  target: DragTarget;
  id: string;
  corner?: ResizeCorner;
  lastX: number;
  lastY: number;
  lastAngle?: number;
};

let selectedId: string | null = null;
let selectedTarget: DragTarget = "device";
let drag: DragState | null = null;
let bound = false;

function exportSize() {
  return resolveExportSize(state.deviceId, state.platform, state.orientation).size;
}

function canvasNorm(e: PointerEvent): { nx: number; ny: number } | null {
  const canvas = $("#layout-slice-canvas") as HTMLCanvasElement | null;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  return { nx: (e.clientX - rect.left) / rect.width, ny: (e.clientY - rect.top) / rect.height };
}

function patchDevice(id: string, fn: (inst: TemplateRecord["devices"][number]) => TemplateRecord["devices"][number]) {
  const recipe = stripRecipeOfSet();
  if (!recipe) return;
  const i = recipe.devices.findIndex((d) => d.id === id);
  if (i < 0) return;
  recipe.devices[i] = fn(recipe.devices[i]);
}

function patchExtra(id: string, fn: (slot: ExtraSlot) => ExtraSlot) {
  const recipe = stripRecipeOfSet();
  if (!recipe?.extras) return;
  const i = recipe.extras.findIndex((d) => d.id === id);
  if (i < 0) return;
  recipe.extras[i] = fn(recipe.extras[i]);
}

function boxStyle(
  inst: { x: number; y: number; w: number; h: number; rotationDeg: number },
  sliceIndex: number,
  sliceW: number,
  sliceH: number
): string {
  const hSlice = (inst.h * sliceW) / Math.max(1, sliceH);
  const left = (inst.x - sliceIndex - inst.w / 2) * 100;
  const top = (inst.y - hSlice / 2) * 100;
  return `left:${left}%;top:${top}%;width:${inst.w * 100}%;height:${hSlice * 100}%;transform:rotate(${inst.rotationDeg}deg)`;
}

function deviceBoxStyle(
  inst: TemplateRecord["devices"][number],
  sliceIndex: number,
  sliceW: number,
  sliceH: number
): string {
  if (hasPerspective(inst)) {
    const box = instanceAabb(inst, sliceW, sliceH);
    const left = ((box.x - sliceIndex * sliceW) / sliceW) * 100;
    const top = (box.y / sliceH) * 100;
    const width = (box.w / sliceW) * 100;
    const height = (box.h / sliceH) * 100;
    return `left:${left}%;top:${top}%;width:${width}%;height:${height}%;transform:none`;
  }
  return boxStyle(inst, sliceIndex, sliceW, sliceH);
}

const HANDLE_HTML = `
  <span class="layout-handle" data-layout-handle="nw"></span>
  <span class="layout-handle" data-layout-handle="ne"></span>
  <span class="layout-handle" data-layout-handle="sw"></span>
  <span class="layout-handle" data-layout-handle="se"></span>
  <span class="layout-handle layout-handle-rotate" data-layout-handle="rotate"></span>
`;

const COVER_ICON =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1.5"/></svg>';
const CONTAIN_ICON =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="1.5" opacity="0.45"/><rect x="6.5" y="8" width="11" height="8" rx="1"/></svg>';

/** Quick actions near the selection, surfacing controls that already exist
 *  in the right panel (Fit, text face) — not new capability, just closer
 *  to where the user is looking. Only built for kinds that actually have
 *  a real per-instance action; other extra kinds (shape/widget/image) get
 *  resize/rotate handles only, same as before. */
function contextToolbarHtml(target: "device", inst: TemplateRecord["devices"][number]): string;
function contextToolbarHtml(target: "extra", inst: ExtraSlot): string;
function contextToolbarHtml(target: DragTarget, inst: TemplateRecord["devices"][number] | ExtraSlot): string {
  if (target === "device") {
    const fit = (inst as TemplateRecord["devices"][number]).fit || "cover";
    return `<div class="layout-context-toolbar">
      <button type="button" class="ctx-btn${fit === "cover" ? " is-active" : ""}" data-device-fit="cover" title="Cover">${COVER_ICON}</button>
      <button type="button" class="ctx-btn${fit === "contain" ? " is-active" : ""}" data-device-fit="contain" title="Contain">${CONTAIN_ICON}</button>
    </div>`;
  }
  const slot = inst as ExtraSlot;
  if (slot.kind === "copy" && !slot.widget) {
    const face = slot.face === "script" ? "script" : "display";
    return `<div class="layout-context-toolbar">
      <button type="button" class="ctx-btn ctx-btn-text${face === "display" ? " is-active" : ""}" data-extra-face="display" title="Display face">Aa</button>
      <button type="button" class="ctx-btn ctx-btn-text${face === "script" ? " is-active" : ""}" data-extra-face="script" title="Script face">Aa</button>
    </div>`;
  }
  return "";
}

export function rebuildHandles() {
  const host = $("#layout-handles") as HTMLElement | null;
  const stage = $("#layout-stage") as HTMLElement | null;
  const recipe = stripRecipeOfSet();
  if (!host || !stage) {
    notifySelection();
    return;
  }
  if (!recipe || stage.hidden) {
    host.hidden = true;
    host.innerHTML = "";
    notifySelection();
    return;
  }
  host.hidden = false;
  const { w, h } = exportSize();
  const slice = state.activeFrame;
  const devices = recipe.devices
    .filter((d) => slicesTouched(d, recipe.frameCount, w, h).includes(slice))
    .map((d) => {
      const sel = selectedTarget === "device" && d.id === selectedId ? " is-selected" : "";
      const handles = sel ? HANDLE_HTML + contextToolbarHtml("device", d) : "";
      return `<div class="layout-device-box${sel}" data-device-id="${d.id}" style="${deviceBoxStyle(d, slice, w, h)}">${handles}</div>`;
    });
  const extras = extrasInSlice(recipe, slice).map((e) => {
    const sel = selectedTarget === "extra" && e.id === selectedId ? " is-selected" : "";
    const handles = sel ? HANDLE_HTML + contextToolbarHtml("extra", e) : "";
    return `<div class="layout-device-box layout-extra-box${sel}" data-extra-id="${e.id}" style="${boxStyle(e, slice, w, h)}">${handles}</div>`;
  });
  host.innerHTML = devices.join("") + extras.join("");
  notifySelection();
}

function updateSelectedBox() {
  if (!selectedId) return;
  const recipe = stripRecipeOfSet();
  const inst =
    selectedTarget === "extra"
      ? recipe?.extras?.find((d) => d.id === selectedId)
      : recipe?.devices.find((d) => d.id === selectedId);
  const sel =
    selectedTarget === "extra"
      ? `.layout-extra-box[data-extra-id="${selectedId}"]`
      : `.layout-device-box[data-device-id="${selectedId}"]`;
  const box = document.querySelector<HTMLElement>(sel);
  if (!inst || !box) {
    rebuildHandles();
    return;
  }
  const { w, h } = exportSize();
  box.setAttribute(
    "style",
    selectedTarget === "device" && "placement" in inst
      ? deviceBoxStyle(inst as TemplateRecord["devices"][number], state.activeFrame, w, h)
      : boxStyle(inst, state.activeFrame, w, h)
  );
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
  commitHistory();
  syncHistoryButtons();
}

function selectAt(e: PointerEvent, recipe: TemplateRecord): { id: string; target: DragTarget } | null {
  const extraBox = (e.target as HTMLElement).closest("[data-extra-id]") as HTMLElement | null;
  if (extraBox?.dataset.extraId) return { id: extraBox.dataset.extraId, target: "extra" };
  const box = (e.target as HTMLElement).closest("[data-device-id]") as HTMLElement | null;
  if (box?.dataset.deviceId) return { id: box.dataset.deviceId, target: "device" };
  const norm = canvasNorm(e);
  if (!norm) return null;
  const { w, h } = exportSize();
  const extra = hitExtra(recipe.extras || [], state.activeFrame, norm.nx, norm.ny, w, h);
  if (extra) return { id: extra.id, target: "extra" };
  const hit = hitDevice(recipe.devices, state.activeFrame, norm.nx, norm.ny, w, h);
  return hit ? { id: hit.id, target: "device" } : null;
}

function onPointerDown(e: PointerEvent) {
  const stage = $("#layout-stage") as HTMLElement | null;
  if (!stage || stage.hidden) return;
  const target = e.target as HTMLElement;
  if (target.isContentEditable) return;
  // The context toolbar sits inside the draggable box for CSS positioning
  // convenience — its own buttons must not also start a device/extra drag.
  if (target.closest(".layout-context-toolbar")) return;
  const recipe = stripRecipeOfSet();
  if (!recipe) return;

  const handle = target.closest("[data-layout-handle]") as HTMLElement | null;
  const picked = selectAt(e, recipe);
  let kind: DragKind = "move";
  let corner: ResizeCorner | undefined;
  if (handle && picked) {
    const hKind = handle.dataset.layoutHandle || "";
    if (hKind === "rotate") kind = "rotate";
    else {
      kind = "resize";
      corner = hKind as ResizeCorner;
    }
  } else if (!picked) {
    selectedId = null;
    rebuildHandles();
    return;
  } else if (e.altKey) {
    kind = "rotate";
  }

  if (!picked) return;
  e.preventDefault();
  selectedId = picked.id;
  selectedTarget = picked.target;
  const inst =
    picked.target === "extra"
      ? recipe.extras?.find((d) => d.id === picked.id)
      : recipe.devices.find((d) => d.id === picked.id);
  const norm = canvasNorm(e);
  const cx = inst ? inst.x - state.activeFrame : 0.5;
  const cy = inst?.y ?? 0.5;
  const lastAngle = norm ? (Math.atan2(norm.ny - cy, norm.nx - cx) * 180) / Math.PI : 0;
  drag = { kind, target: picked.target, id: picked.id, corner, lastX: e.clientX, lastY: e.clientY, lastAngle };
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
  const extra = drag.target === "extra";

  if (drag.kind === "move") {
    if (extra) patchExtra(drag.id, (s) => moveExtra(s, dx, dy));
    else patchDevice(drag.id, (inst) => moveDevice(inst, dx, dy));
  } else if (drag.kind === "resize" && drag.corner) {
    if (extra) patchExtra(drag.id, (s) => resizeExtra(s, drag!.corner!, dx, dy, w, h));
    else patchDevice(drag.id, (inst) => resizeDevice(inst, drag!.corner!, dx, dy, w, h));
  } else if (drag.kind === "rotate") {
    const recipe = stripRecipeOfSet();
    const inst = extra
      ? recipe?.extras?.find((d) => d.id === drag!.id)
      : recipe?.devices.find((d) => d.id === drag!.id);
    const norm = canvasNorm(e);
    if (inst && norm && drag.lastAngle != null) {
      const cx = inst.x - state.activeFrame;
      const angle = (Math.atan2(norm.ny - inst.y, norm.nx - cx) * 180) / Math.PI;
      const delta = angle - drag.lastAngle;
      drag.lastAngle = angle;
      if (extra) patchExtra(drag.id, (s) => rotateExtra(s, delta));
      else patchDevice(drag.id, (d) => rotateDevice(d, delta));
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

let nudgeCommitTimer: ReturnType<typeof setTimeout> | undefined;

function onKeyDown(e: KeyboardEvent) {
  if (!selectedId) return;
  const stage = $("#layout-stage") as HTMLElement | null;
  if (!stage || stage.hidden) return;
  if (isTypingTarget(e.target)) return;
  const step = e.shiftKey ? 0.005 : 0.02;
  let dx = 0;
  let dy = 0;
  if (e.key === "ArrowLeft") dx = -step;
  else if (e.key === "ArrowRight") dx = step;
  else if (e.key === "ArrowUp") dy = -step;
  else if (e.key === "ArrowDown") dy = step;
  else return;
  e.preventDefault();
  if (selectedTarget === "extra") patchExtra(selectedId, (s) => moveExtra(s, dx, dy));
  else patchDevice(selectedId, (inst) => moveDevice(inst, dx, dy));
  void livePaint().then(() => refreshStripPreview());
  // Debounced, not per-keypress: holding an arrow key repeats fast enough
  // to flood the history stack with one entry per pixel-nudge otherwise —
  // group a held-key nudge session into a single undo step instead.
  clearTimeout(nudgeCommitTimer);
  nudgeCommitTimer = setTimeout(() => {
    commitHistory();
    syncHistoryButtons();
  }, 400);
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

export function selectedLayoutDeviceId(): string | null {
  return selectedTarget === "device" ? selectedId : null;
}

export function selectedLayoutExtraId(): string | null {
  return selectedTarget === "extra" ? selectedId : null;
}

export function selectLayoutDevice(id: string): void {
  selectedId = id;
  selectedTarget = "device";
  rebuildHandles();
}

export function selectLayoutExtra(id: string): void {
  selectedId = id;
  selectedTarget = "extra";
  rebuildHandles();
}

const selectionListeners: Array<() => void> = [];

function notifySelection() {
  for (const fn of selectionListeners) fn();
}

export function onLayoutSelection(fn: () => void) {
  selectionListeners.push(fn);
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

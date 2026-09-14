/** OWNER: editor/history — real undo/redo over the active ProjectSet
 *  Snapshots are captured once, centrally, from renderEditor() — every
 *  discrete edit action already calls that after mutating state, so this
 *  needed no changes at each of the dozens of individual action handlers.
 *  Drag/keyboard-nudge gestures in layout-drag.ts call commitHistory()
 *  directly at their own commit points (drag end, each nudge) since those
 *  intentionally skip the full render for performance. */
import type { ProjectSet } from "@take/core";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";

const MAX_DEPTH = 50;

let stack: string[] = [];
let index = -1;
let stackSetId: string | null = null;
let restoring = false;

function snapshotOf(set: ProjectSet): string {
  return JSON.stringify(set);
}

/** Call after any action that may have changed the active set. Cheap no-op
 *  if nothing actually changed since the last commit, and self-resets the
 *  stack the first time it sees a different set's id (switching concepts,
 *  opening a different project) rather than requiring a reset call at
 *  every editor entry point. */
export function commitHistory(): void {
  if (restoring) return;
  const set = currentSet();
  if (!set) return;
  if (set.id !== stackSetId) {
    stack = [];
    index = -1;
    stackSetId = set.id;
  }
  const snap = snapshotOf(set);
  if (stack[index] === snap) return;
  stack = stack.slice(0, index + 1);
  stack.push(snap);
  index = stack.length - 1;
  if (stack.length > MAX_DEPTH) {
    stack.shift();
    index--;
  }
}

export function canUndo(): boolean {
  return index > 0;
}

export function canRedo(): boolean {
  return index >= 0 && index < stack.length - 1;
}

/** Shared by edit-canvas.ts (after every full render) and layout-drag.ts
 *  (after a drag/nudge commit that skips the full render) — lives here,
 *  not in edit-canvas.ts, so neither module needs to import the other. */
export function syncHistoryButtons(): void {
  const undoBtn = $("#btn-undo") as HTMLButtonElement | null;
  const redoBtn = $("#btn-redo") as HTMLButtonElement | null;
  if (undoBtn) undoBtn.disabled = !canUndo();
  if (redoBtn) redoBtn.disabled = !canRedo();
}

function restoreAt(i: number): ProjectSet | null {
  const raw = stack[i];
  if (raw == null) return null;
  return JSON.parse(raw) as ProjectSet;
}

/** Restore the previous snapshot into the current set slot and return it —
 *  caller is responsible for re-rendering wrapped in beginRestore/
 *  endRestore so that render's own commitHistory() call doesn't re-push
 *  the state we just restored. */
export function undo(): ProjectSet | null {
  if (!canUndo()) return null;
  index--;
  return restoreAt(index);
}

export function redo(): ProjectSet | null {
  if (!canRedo()) return null;
  index++;
  return restoreAt(index);
}

export function beginRestore(): void {
  restoring = true;
}

export function endRestore(): void {
  restoring = false;
}

/** Replace the active set slot with a restored snapshot in place, keeping
 *  its array index and every other set in state.sets untouched. */
export function applyRestoredSet(restored: ProjectSet): void {
  const i = state.selectedSet;
  if (state.sets[i]) state.sets[i] = restored;
}

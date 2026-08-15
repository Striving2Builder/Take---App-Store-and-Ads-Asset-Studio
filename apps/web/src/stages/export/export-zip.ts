/** OWNER: stages/export — plan + paint + fit ZIP members */
import { getDevice, resolveDefaultDevice, resolveExportSize } from "@take/device-catalog";
import { planExportFiles, type ExportPlan, type StorePlatform } from "@take/export-presets";
import { currentSet, state } from "../../app/app-state";
import { currentExportSize, paintExportFrame } from "./frame-render";
import { canvasPngBytes, fitCanvas } from "./fit-canvas";

function slugOf(): string {
  return (state.inference?.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function storePlatform(): StorePlatform {
  const p = getDevice(state.deviceId)?.platform;
  if (p === "android" || p === "ios") return p;
  return "other";
}

export function currentExportPlan(selectedIds: string[], frameCount: number): ExportPlan {
  const store = currentExportSize();
  const ios = resolveDefaultDevice("ios");
  const play = resolveDefaultDevice("android");
  const iosStore = ios
    ? resolveExportSize(ios.id, "ios", state.orientation).size
    : store;
  const playStore = play
    ? resolveExportSize(play.id, "android", state.orientation).size
    : store;
  return planExportFiles({
    selectedIds,
    frameCount,
    slug: slugOf(),
    store: { ...store, platform: storePlatform() },
    iosStore,
    playStore,
  });
}

export async function buildExportFiles(
  selectedIds: string[]
): Promise<{ files: { name: string; data: Uint8Array | string }[]; plan: ExportPlan; store: { w: number; h: number } }> {
  const set = currentSet();
  if (!set) throw new Error("No set selected");
  const store = currentExportSize();
  const plan = currentExportPlan(selectedIds, set.frames.length);
  const padColor = set.palette[1] || "#0c0d10";
  const painted = new Map<number, HTMLCanvasElement>();

  async function source(i: number): Promise<HTMLCanvasElement> {
    const hit = painted.get(i);
    if (hit) return hit;
    const canvas = document.createElement("canvas");
    const ok = await paintExportFrame(canvas, i);
    if (!ok) throw new Error(`missing frame ${i + 1}`);
    painted.set(i, canvas);
    return canvas;
  }

  const files: { name: string; data: Uint8Array | string }[] = [];
  for (const row of plan.files) {
    const src = await source(row.frameIndex);
    if (row.fit === "native") {
      files.push({ name: row.path, data: await canvasPngBytes(src) });
      continue;
    }
    const dest = document.createElement("canvas");
    dest.width = row.w;
    dest.height = row.h;
    fitCanvas(src, dest, row.fit, padColor);
    files.push({ name: row.path, data: await canvasPngBytes(dest) });
  }
  return { files, plan, store };
}

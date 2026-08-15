/** OWNER: packages/export-presets — ZIP file list from checked presets (no paint) */
import { iosPresets } from "./ios.presets";
import { playPresets } from "./play.presets";
import { socialPresets } from "./social.presets";
import { iabPresets } from "./iab.presets";
import type { ExportFit, PresetKind } from "./preset.types";

function allPresets() {
  return [...iosPresets, ...playPresets, ...socialPresets, ...iabPresets];
}

export type StorePlatform = "ios" | "android" | "other";

export type PlanExportInput = {
  selectedIds: string[];
  frameCount: number;
  slug: string;
  store: { w: number; h: number; platform: StorePlatform };
  iosStore: { w: number; h: number };
  playStore: { w: number; h: number };
};

export type PlannedExportFile = {
  path: string;
  w: number;
  h: number;
  presetId: string;
  targetId: string;
  fit: ExportFit | "native";
  frameIndex: number;
};

export type ExportPlan = {
  files: PlannedExportFile[];
  skippedFake: string[];
  motion: boolean;
};

function pad(i: number): string {
  return String(i + 1).padStart(2, "0");
}

function sameSize(a: { w: number; h: number }, b: { w: number; h: number }): boolean {
  return a.w === b.w && a.h === b.h;
}

function framePath(folder: string, slug: string, frameIndex: number): string {
  return `${folder}/${slug}-${pad(frameIndex)}.png`;
}

/**
 * Store screens stay catalog size. Extra presets are additional files.
 * Unchecked presets emit nothing. Layered/bundle are listed in skippedFake.
 */
export function planExportFiles(input: PlanExportInput): ExportPlan {
  const selected = new Set(input.selectedIds);
  const presets = allPresets().filter((p) => selected.has(p.id));
  const files: PlannedExportFile[] = [];
  const skippedFake = presets.filter((p) => p.kind === "fake").map((p) => p.id);
  const motion = presets.some((p) => p.kind === "motion");
  const n = Math.max(0, input.frameCount);
  const slug = input.slug || "app";

  const wantIos = selected.has("ios-screens");
  const wantPlay = selected.has("play-screens");
  if (wantIos || wantPlay) {
    for (let i = 0; i < n; i++) {
      files.push({
        path: framePath("screens", slug, i),
        w: input.store.w,
        h: input.store.h,
        presetId: wantIos ? "ios-screens" : "play-screens",
        targetId: "store",
        fit: "native",
        frameIndex: i,
      });
    }
    if (wantPlay && input.store.platform !== "android" && !sameSize(input.store, input.playStore)) {
      for (let i = 0; i < n; i++) {
        files.push({
          path: framePath("screens-play", slug, i),
          w: input.playStore.w,
          h: input.playStore.h,
          presetId: "play-screens",
          targetId: "play-store",
          fit: "contain",
          frameIndex: i,
        });
      }
    }
    if (wantIos && input.store.platform !== "ios" && !sameSize(input.store, input.iosStore)) {
      for (let i = 0; i < n; i++) {
        files.push({
          path: framePath("screens-ios", slug, i),
          w: input.iosStore.w,
          h: input.iosStore.h,
          presetId: "ios-screens",
          targetId: "ios-store",
          fit: "contain",
          frameIndex: i,
        });
      }
    }
  }

  for (const preset of presets) {
    if (preset.kind !== "sized") continue;
    const perFrame = preset.emit === "per-frame";
    const indices = perFrame ? [...Array(n).keys()] : n > 0 ? [0] : [];
    const root = preset.folder || preset.id;
    for (const target of preset.targets) {
      for (const i of indices) {
        files.push({
          path: framePath(`${root}/${target.id}`, slug, i),
          w: target.w,
          h: target.h,
          presetId: preset.id,
          targetId: target.id,
          fit: target.fit,
          frameIndex: i,
        });
      }
    }
  }

  return { files, skippedFake, motion };
}

export function sizedPresetsHaveTargets(): { id: string; kind: PresetKind; ok: boolean }[] {
  return allPresets().map((p) => ({
    id: p.id,
    kind: p.kind,
    ok: p.kind !== "sized" || (p.targets.length > 0 && p.targets.every((t) => t.w > 0 && t.h > 0)),
  }));
}

/** Catch plan ↔ preset target drift (w/h/fit) without opening a ZIP. */
export function planMatchesTargets(
  plan: ExportPlan,
  presets: { id: string; targets: { id: string; w: number; h: number; fit: string }[] }[] = allPresets()
): string[] {
  const byId = new Map(presets.map((p) => [p.id, p]));
  const errors: string[] = [];
  for (const f of plan.files) {
    if (f.fit === "native") continue;
    const preset = byId.get(f.presetId);
    const t = preset?.targets.find((x) => x.id === f.targetId);
    if (!t) {
      errors.push(`${f.path}: no target ${f.presetId}/${f.targetId}`);
      continue;
    }
    if (t.w !== f.w || t.h !== f.h || t.fit !== f.fit) {
      errors.push(`${f.path}: planned ${f.w}×${f.h} ${f.fit} ≠ target ${t.w}×${t.h} ${t.fit}`);
    }
  }
  return errors;
}

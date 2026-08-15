/** OWNER: stages/export — persist selected preset ids (session + localStorage) */
import { STORAGE_KEYS, saveJSON } from "@take/storage";
import { allPresets, defaultPresetIds, resolvePresetIds } from "@take/export-presets";
import { state } from "../../app/app-state";

function knownIds(): string[] {
  return allPresets().map((p) => p.id);
}

function loadStored(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.exportPresets);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

export function resolvedExportPresetIds(): string[] {
  return resolvePresetIds({
    session: state.exportPresetIds,
    stored: loadStored(),
    knownIds: knownIds(),
    defaults: defaultPresetIds(allPresets()),
  });
}

export function persistExportPresetIds(ids: string[]): void {
  const next = ids.filter((id) => knownIds().includes(id));
  state.exportPresetIds = next;
  saveJSON(STORAGE_KEYS.exportPresets, next);
}

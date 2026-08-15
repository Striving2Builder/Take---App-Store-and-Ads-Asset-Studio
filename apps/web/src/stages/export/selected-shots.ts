/** OWNER: stages/export — ordered selected screenshots (no i % n cycle) */
import { state } from "../../app/app-state";

export type ShotAsset = { id: string; url: string; kind: string };

export function selectedScreenshots(): ShotAsset[] {
  const all =
    (state.lastScan?.capture?.assets?.filter((a) => a.kind === "screenshot") as ShotAsset[] | undefined) ||
    [];
  if (!state.selectedShotIds.length) return all;
  const byId = new Map(all.map((a) => [a.id, a]));
  return state.selectedShotIds.map((id) => byId.get(id)).filter((a): a is ShotAsset => !!a);
}

export function shotUrlAt(index: number): string | null {
  return selectedScreenshots()[index]?.url || null;
}

export function scanIconUrl(): string | null {
  return state.lastScan?.capture?.assets?.find((a) => a.kind === "icon")?.url || null;
}

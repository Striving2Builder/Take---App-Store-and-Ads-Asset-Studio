/** OWNER: stages/export — ordered selected screenshots (no i % n cycle) */
import { state } from "../../app/app-state";

export type ShotAsset = { id: string; url: string; kind: string };

export function selectedScreenshots(): ShotAsset[] {
  const all =
    (state.lastScan?.capture?.assets?.filter((a) => a.kind === "screenshot") as ShotAsset[] | undefined) ||
    [];
  const uploaded = state.uploads
    .filter((upload) => upload.kind !== "video")
    .map((upload, index) => ({
      id: `upload-${index}`,
      url: upload.url,
      kind: "screenshot",
    }));
  const available = all.length ? all : uploaded;
  if (!state.selectedShotIds.length) return available;
  const byId = new Map(available.map((a) => [a.id, a]));
  return state.selectedShotIds.map((id) => byId.get(id)).filter((a): a is ShotAsset => !!a);
}

export function shotUrlAt(index: number): string | null {
  return selectedScreenshots()[index]?.url || null;
}

export function scanIconUrl(): string | null {
  return state.lastScan?.capture?.assets?.find((a) => a.kind === "icon")?.url || null;
}

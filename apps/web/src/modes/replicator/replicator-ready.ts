/** OWNER: modes/replicator — session ready check (pack or uploads) */
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { getScanSources } from "../../stages/intake/scan-sources";
import { competitorBeatsFromPack } from "./competitor-beats";

export function hasCompetitorHint(): boolean {
  if (getScanSources().some((s) => s.role === "competitor" && s.url.trim())) return true;
  if (competitorBeatsFromPack(state.lastPack).length) return true;
  const text = ($("#f-competitors") as HTMLInputElement | null)?.value.trim();
  return Boolean(text);
}

export function replicatorReady(uploadCount: number): boolean {
  return uploadCount > 0 || hasCompetitorHint();
}

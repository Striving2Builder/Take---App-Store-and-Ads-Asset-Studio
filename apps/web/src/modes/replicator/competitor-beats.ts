/** OWNER: modes/replicator — competitor pack → beat count (no art merge) */
import type { ModePackSlice } from "@take/modes-sdk";

export type CompetitorBeat = {
  label: string;
  url?: string;
  screenshotCount: number;
};

export function competitorBeatsFromPack(pack?: ModePackSlice | null): CompetitorBeat[] {
  const sources = (pack?.sources || []).filter(
    (s) => s.extensions?.sourceRole === "competitor" && s.ok !== false
  );
  return sources.map((s, i) => ({
    label: s.fields?.name?.value?.trim() || `Competitor ${i + 1}`,
    url: s.inputUrl,
    screenshotCount: (s.assets || []).filter((a) => a.kind === "screenshot").length,
  }));
}

export function replicatorFrameCount(beats: CompetitorBeat[], uploadCount: number): number {
  const shots = beats.reduce((n, b) => n + b.screenshotCount, 0);
  return Math.min(12, Math.max(3, shots || uploadCount || 6));
}

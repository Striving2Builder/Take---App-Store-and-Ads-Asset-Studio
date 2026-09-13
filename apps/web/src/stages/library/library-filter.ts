/** OWNER: stages/library — filter match for system + user cards */
import type { SavedTemplate } from "@take/storage";

/** Recipe self-tagged as an unfinished seed example — not filtered out by
 *  default (still real, still usable), just distinguishable from a
 *  finished one so it doesn't get mistaken for representative output. */
export function isDraftTemplate(t: SavedTemplate): boolean {
  return (t.tags || []).includes("needs-polish");
}

/** Dual-store geometry (mobile) appears under Mobile, iOS, and Android filters. */
export function libraryFilterMatch(t: SavedTemplate, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "mine") return t.kind === "user";
  const tags = t.tags || [];
  const mobile = t.platform === "mobile" || tags.includes("mobile");
  if (filter === "mobile") return mobile;
  if (filter === "ios" || filter === "android") {
    return t.platform === filter || tags.includes(filter) || mobile;
  }
  return t.platform === filter || tags.includes(filter);
}

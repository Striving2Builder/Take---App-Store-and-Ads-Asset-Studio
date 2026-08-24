/** OWNER: stages/library — filter match for system + user cards */
import type { SavedTemplate } from "@take/storage";

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

/** OWNER: packages/storage — persistent, cross-project brand kit
 *  One saved kit (not a list) — matches the single "starter kit" the Style
 *  tab's Save/Apply pair works against. logoUrl is only ever stored when
 *  it's a durable reference (http(s) or a data: URI) — a blob: URL is
 *  session-scoped and would render broken after reload, so it's dropped
 *  rather than saved as a lie. */
import { STORAGE_KEYS } from "./keys";
import { loadJSON, saveJSON } from "./local-json";

export type BrandKit = {
  name: string;
  palette: string[];
  typography?: { display: string; body: string };
  logoUrl?: string;
  updatedAt: string;
};

export function loadBrandKit(): BrandKit | null {
  return loadJSON<BrandKit | null>(STORAGE_KEYS.brandKit, null);
}

export function saveBrandKit(kit: Omit<BrandKit, "updatedAt">): BrandKit {
  const record: BrandKit = { ...kit, updatedAt: new Date().toISOString() };
  saveJSON(STORAGE_KEYS.brandKit, record);
  return record;
}

export function clearBrandKit(): void {
  saveJSON(STORAGE_KEYS.brandKit, null);
}

/** A blob:/filesystem: URL dies with the tab that created it — never worth
 *  persisting under a "cross-project, saved for later" promise. */
export function isDurableLogoUrl(url: string): boolean {
  return /^(https?:|data:)/.test(url);
}

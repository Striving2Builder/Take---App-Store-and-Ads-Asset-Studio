/** OWNER: packages/storage — usage history */
import { STORAGE_KEYS } from "./keys";
import { loadJSON, saveJSON } from "./local-json";

export function pushHistory(action: string, ref: string): void {
  const h = loadJSON<{ action: string; ref: string; at: string }[]>(STORAGE_KEYS.history, []);
  h.unshift({ action, ref, at: new Date().toISOString() });
  saveJSON(STORAGE_KEYS.history, h.slice(0, 200));
}

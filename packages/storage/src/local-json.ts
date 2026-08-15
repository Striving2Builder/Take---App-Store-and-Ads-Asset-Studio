/** OWNER: packages/storage — JSON localStorage helper */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
      throw new Error("Storage full — clear old projects or shrink uploads");
    }
    throw err instanceof Error ? err : new Error("localStorage write failed");
  }
}

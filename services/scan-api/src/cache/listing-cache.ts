/** OWNER: services/scan-api/cache — listing cache by url+locale+adapter */
import type { AppCapture } from "@take/scan-client";

type Entry = { expires: number; value: AppCapture };

const store = new Map<string, Entry>();

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24h listings

export function cacheKey(parts: {
  adapter: string;
  url: string;
  locale: string;
}): string {
  return `${parts.adapter}::${parts.locale}::${parts.url}`;
}

export function cacheGet(key: string): AppCapture | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return structuredClone(hit.value);
}

export function cacheSet(key: string, value: AppCapture, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { expires: Date.now() + ttlMs, value: structuredClone(value) });
}

export function cacheClear(): void {
  store.clear();
}

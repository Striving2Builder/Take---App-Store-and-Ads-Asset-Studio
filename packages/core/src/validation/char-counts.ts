/** OWNER: packages/core — character count helpers */
import { META_LIMITS, type MetaLimitKey } from "../constants/meta-limits";

export function clip(text: string, max: number): string {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function countStatus(key: MetaLimitKey, value: string) {
  const max = META_LIMITS[key];
  const length = value.length;
  return { length, max, over: length > max };
}

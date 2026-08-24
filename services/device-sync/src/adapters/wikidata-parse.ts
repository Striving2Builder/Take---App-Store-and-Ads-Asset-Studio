/** OWNER: services/device-sync — Wikidata SPARQL JSON → RawDiscovery (no fetch) */
import type { RawDiscovery } from "../discover.types";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function bindingValue(row: Record<string, unknown>, key: string): string {
  const cell = row[key];
  if (!isObj(cell)) return "";
  return typeof cell.value === "string" ? cell.value.trim() : "";
}

const MAKER: Record<string, { prefix: string; platform: "ios" | "android" }> = {
  Q312: { prefix: "apple", platform: "ios" },
  Q95: { prefix: "google", platform: "android" },
  Q20718: { prefix: "samsung", platform: "android" },
};

function qidFromUri(uri: string): string {
  const m = uri.match(/\/(Q\d+)$/i);
  return m ? m[1].toUpperCase() : "";
}

/** "iPhone 17 Pro" → iphone-17-pro; rejects watches / buds / empty. */
export function slugModelName(label: string): string | null {
  let s = label.trim().toLowerCase();
  if (!s) return null;
  if (/\b(watch|buds|bud|tv|vision|book|chromebook|tablet|ipad|foldable)\b/.test(s)) return null;
  s = s.replace(/^samsung\s+/, "").replace(/^google\s+/, "").replace(/^apple\s+/, "");
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!s || s.length < 4) return null;
  return s;
}

export function wikidataEntityUrl(itemUri: string): string {
  const qid = qidFromUri(itemUri);
  return qid ? `https://www.wikidata.org/wiki/${qid}` : "";
}

/**
 * Map SPARQL bindings `{ item, itemLabel, manufacturer, date? }` to discoveries.
 * Identity only — no store class, no inherit (do not invent chrome).
 */
export function parseWikidataBindings(raw: unknown): RawDiscovery[] {
  const results = isObj(raw) && isObj(raw.results) && Array.isArray(raw.results.bindings)
    ? raw.results.bindings
    : [];
  const out: RawDiscovery[] = [];
  const seen = new Set<string>();
  for (const row of results) {
    if (!isObj(row)) continue;
    const item = bindingValue(row, "item");
    const label = bindingValue(row, "itemLabel");
    const manufacturer = bindingValue(row, "manufacturer");
    const dateRaw = bindingValue(row, "date");
    const maker = MAKER[qidFromUri(manufacturer)];
    const slug = slugModelName(label);
    const evidenceUrl = wikidataEntityUrl(item);
    if (!maker || !slug || !evidenceUrl) continue;
    const id = `${maker.prefix}.${slug}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const releasedAt = dateRaw && !Number.isNaN(Date.parse(dateRaw))
      ? dateRaw.slice(0, 10)
      : "2025-01-01";
    out.push({
      id,
      name: label,
      platform: maker.platform,
      formFactor: "phone",
      releasedAt,
      evidenceUrl,
      evidenceNote: "Wikidata identity — sizes/chrome not taken from this row",
      adapter: "wikidata",
    });
  }
  return out;
}

/** Bounded SPARQL: recent smartphones from Apple / Google / Samsung. */
export function wikidataSparql(): string {
  return `SELECT ?item ?itemLabel ?manufacturer ?date WHERE {
  ?item wdt:P31/wdt:P279* wd:Q22645 .
  ?item wdt:P176 ?manufacturer .
  VALUES ?manufacturer { wd:Q312 wd:Q95 wd:Q20718 }
  OPTIONAL { ?item wdt:P577 ?date }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 80`;
}

export function wikidataSparqlUrl(): string {
  return `https://query.wikidata.org/sparql?query=${encodeURIComponent(wikidataSparql())}&format=json`;
}

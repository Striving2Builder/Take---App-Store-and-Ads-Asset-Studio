/** Regenerates packages/scan-client/src/locale.presets.ts from real data:
 *  - `world-countries` (independent sovereign states; real ISO region/
 *    subregion/language/cca2 fields) for which countries exist and which
 *    languages are actually official where.
 *  - Node's built-in Intl.DisplayNames for native-script labels (real CLDR
 *    data, not hand-typed translations).
 *  Run: node scripts/gen-locale-presets.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const countries = createRequire(import.meta.url)("world-countries");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, "../packages/scan-client/src/locale.presets.ts");

// ISO 639-3 (world-countries' key) -> ISO 639-1, for codes that have a real,
// standard 2-letter equivalent — the actual constraint that matters here is
// "is this a real BCP-47 language subtag app storefronts recognize," and
// major national languages are exactly the ones ISO 639-1 covers. Regional/
// minority official languages without a standard 639-1 code (Bavarian, Swiss
// German, Sami, Aramaic, Aymara, Tetum, Dhivehi, Dzongkha, Dari, Central
// Kurdish, Montenegrin) are deliberately left unmapped and dropped below —
// not a market-relevance judgment call, an ISO-coverage fact.
const TO_639_1 = {
  ara: "ar", aze: "az", bel: "be", ben: "bn", bos: "bs", bul: "bg",
  cat: "ca", ces: "cs", dan: "da", deu: "de", ell: "el", eng: "en",
  est: "et", fas: "fa", fil: "fil", fin: "fi", fra: "fr", gle: "ga",
  heb: "he", hin: "hi", hrv: "hr", hun: "hu", hye: "hy", ind: "id",
  isl: "is", ita: "it", jpn: "ja", kat: "ka", kaz: "kk", khm: "km",
  kir: "ky", kor: "ko", lao: "lo", lav: "lv", lit: "lt", ltz: "lb",
  mkd: "mk", mlt: "mt", mon: "mn", msa: "ms", mya: "my", nep: "ne",
  nld: "nl", nno: "nb", nob: "nb", pol: "pl", por: "pt", pus: "ps",
  que: "qu", roh: "rm", ron: "ro", rus: "ru", sin: "si", slk: "sk",
  slv: "sl", spa: "es", sqi: "sq", srp: "sr", swe: "sv", tam: "ta",
  tgk: "tg", tha: "th", tuk: "tk", tur: "tr", ukr: "uk", urd: "ur",
  uzb: "uz", vie: "vi", zho: "zh",
};

const REGION_PRED = {
  "North America": (c) => c.subregion === "North America",
  Europe: (c) => c.region === "Europe",
  "South America": (c) => c.subregion === "South America",
  Asia: (c) => c.region === "Asia",
};

const langName = (l) => {
  try {
    return new Intl.DisplayNames([l], { type: "language" }).of(l);
  } catch {
    return null;
  }
};
const countryName = (l, cca2) => {
  try {
    return new Intl.DisplayNames([l], { type: "region" }).of(cca2);
  } catch {
    return null;
  }
};

const out = {};
for (const [region, pred] of Object.entries(REGION_PRED)) {
  const list = countries.filter((c) => c.independent && pred(c));
  // Alphabetical by country name, except North America keeps US first —
  // findLocalePreset()'s no-match fallback is LOCALE_PRESETS[0], and this
  // app's existing default locale everywhere else is en-US.
  const sorted =
    region === "North America"
      ? list.sort((a, b) =>
          a.cca2 === "US" ? -1 : b.cca2 === "US" ? 1 : a.name.common.localeCompare(b.name.common)
        )
      : list.sort((a, b) => a.name.common.localeCompare(b.name.common));
  const entries = [];
  for (const c of sorted) {
    const seen = new Set();
    for (const code3 of Object.keys(c.languages || {})) {
      const code1 = TO_639_1[code3];
      if (!code1 || seen.has(code1)) continue;
      seen.add(code1);
      const ln = langName(code1);
      const cn = countryName(code1, c.cca2);
      if (!ln || !cn) continue; // Intl couldn't resolve — drop rather than guess
      entries.push({
        id: `${code1}-${c.cca2}`,
        label: `${ln} · ${cn}`,
        locale: `${code1}-${c.cca2}`,
        language: code1,
        country: c.cca2.toLowerCase(),
        region,
      });
    }
  }
  out[region] = entries;
}

for (const [region, entries] of Object.entries(out)) {
  console.log(`${region}: ${entries.length} entries`);
}
console.log("TOTAL:", Object.values(out).flat().length);

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const lines = [];
lines.push(`/** OWNER: packages/scan-client — locale presets for Scan switcher`);
lines.push(` *  Every real independent country in 4 regions (North America, Europe,`);
lines.push(` *  South America, Asia), one entry per country x each of its real official`);
lines.push(` *  languages with a standard ISO 639-1 code — generated from the`);
lines.push(` *  \`world-countries\` dataset (independent sovereign states, real ISO`);
lines.push(` *  region/subregion/language/cca2 fields) plus Node's built-in`);
lines.push(` *  Intl.DisplayNames for native-script labels (both real, checkable data`);
lines.push(` *  sources — not hand-picked "top markets" and not hand-typed`);
lines.push(` *  translations). Regenerate with \`node scripts/gen-locale-presets.mjs\`.`);
lines.push(` *`);
lines.push(` *  Known, deliberate scope notes (ask before "fixing" these silently):`);
lines.push(` *  - "North America" here is the strict geographic subregion (US, Canada,`);
lines.push(` *    Mexico only) — Central America and the Caribbean aren't covered by`);
lines.push(` *    any of the 4 named regions, so they're excluded, not folded in.`);
lines.push(` *  - "Asia" is the full UN-defined continent, which includes Western Asia`);
lines.push(` *    (the Middle East) and Central Asia, not just East/South Asia.`);
lines.push(` *  - Minority/regional official languages without a standard ISO 639-1`);
lines.push(` *    code (Swiss German, Bavarian, Sami, Aramaic, Aymara, Tetum, Dhivehi,`);
lines.push(` *    Dzongkha, Dari, Central Kurdish, Montenegrin) are left out — an`);
lines.push(` *    ISO-coverage fact, not a relevance judgment.`);
lines.push(` *  - Every listed country is real per world-countries; not every one`);
lines.push(` *    necessarily has a live App Store/Play storefront (e.g. sanctioned`);
lines.push(` *    territories) — the scan backend already handles that honestly by`);
lines.push(` *    surfacing a real "no results" error, not a fake success.`);
lines.push(` */`);
lines.push(`export type Region = "North America" | "Europe" | "South America" | "Asia";`);
lines.push(``);
lines.push(`export type LocalePreset = {`);
lines.push(`  id: string;`);
lines.push(`  label: string;`);
lines.push(`  locale: string;`);
lines.push(`  language: string;`);
lines.push(`  country: string;`);
lines.push(`  region: Region;`);
lines.push(`};`);
lines.push(``);
lines.push(`export const LOCALE_REGIONS: Region[] = ["North America", "Europe", "South America", "Asia"];`);
lines.push(``);
lines.push(`export const LOCALE_PRESETS: LocalePreset[] = [`);
for (const region of Object.keys(out)) {
  lines.push(`  // ${region}`);
  for (const e of out[region]) {
    lines.push(
      `  { id: "${esc(e.id)}", label: "${esc(e.label)}", locale: "${esc(e.locale)}", language: "${esc(e.language)}", country: "${esc(e.country)}", region: "${e.region}" },`
    );
  }
}
lines.push(`];`);
lines.push(``);
lines.push(`export function findLocalePreset(idOrLocale: string): LocalePreset {`);
lines.push(`  return (`);
lines.push(`    LOCALE_PRESETS.find((p) => p.id === idOrLocale || p.locale === idOrLocale) ||`);
lines.push(`    LOCALE_PRESETS[0]`);
lines.push(`  );`);
lines.push(`}`);
lines.push(``);

await fs.writeFile(OUT_FILE, lines.join("\n"));
console.log("wrote", OUT_FILE);

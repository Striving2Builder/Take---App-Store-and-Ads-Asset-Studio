/** OWNER: services/device-sync/node — npm run sync:devices [-- --discover snapshots] */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogDevices } from "@take/device-catalog";
import { parseSnapshotFile } from "../adapters/snapshots";
import { parseWikidataBindings, wikidataSparqlUrl } from "../adapters/wikidata-parse";
import type { NormalizedCandidate } from "../discover.types";
import { runDeviceSync } from "../job";
import { parseProposalInput } from "../parse-pack";
import { normalizeDiscoveries } from "../run-discover";
import { fetchAllowlistedJson, fetchSourceUrls } from "./fetch-json";
import { createFileReviewGate } from "./file-gate";
import { loadSnapshotJson } from "./load-snapshots";
import type { DeviceProfile } from "@take/device-catalog";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
const inputPath = arg("--input");
const evidence = arg("--evidence") || "";
const outPath = arg("--out") || join(repo, ".take-sync", "proposals.json");
const queuePath = arg("--queue") || join(repo, ".take-sync", "queue.json");
const deprecateMissing = process.argv.includes("--deprecate-missing");
const discoverArg = arg("--discover");
const adapters = new Set(
  (discoverArg ?? (inputPath ? "" : "snapshots"))
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "none")
);

const current = loadCatalogDevices();
let candidates: DeviceProfile[] = [];
if (inputPath) {
  const parsed = parseProposalInput(JSON.parse(readFileSync(inputPath, "utf8")));
  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }
  candidates = parsed.pack.devices.length
    ? parsed.pack.devices
    : ((parsed.pack.proposals || []).map((p) => p.proposed) as DeviceProfile[]);
}

const fetchedSources: { url: string; json: unknown }[] = [];
if (process.env.DEVICE_SYNC_FETCH === "1") {
  const urls = fetchSourceUrls();
  if (!urls.length && !adapters.has("wikidata")) {
    console.warn("DEVICE_SYNC_FETCH=1 but DEVICE_SYNC_SOURCES is empty — skipping fetch");
  }
  for (const url of urls) {
    try {
      fetchedSources.push({ url, json: await fetchAllowlistedJson(url) });
      console.log(`Fetched ${url}`);
    } catch (err) {
      console.warn(err instanceof Error ? err.message : String(err));
    }
  }
}

const normalized: NormalizedCandidate[] = [];
if (adapters.has("snapshots")) {
  const run = normalizeDiscoveries(parseSnapshotFile(loadSnapshotJson()), current);
  normalized.push(...run.candidates);
  for (const w of run.warnings) console.warn(w);
  console.log(`snapshots: ${run.candidates.length} normalized (${run.warnings.length} skipped)`);
}
if (adapters.has("wikidata")) {
  if (process.env.DEVICE_SYNC_FETCH !== "1") {
    console.warn("wikidata skipped — set DEVICE_SYNC_FETCH=1 (allowlisted SPARQL JSON, not HTML)");
  } else {
    try {
      const json = await fetchAllowlistedJson(wikidataSparqlUrl());
      const run = normalizeDiscoveries(parseWikidataBindings(json), current);
      normalized.push(...run.candidates);
      for (const w of run.warnings) console.warn(w);
      console.log(`wikidata: ${run.candidates.length} normalized (${run.warnings.length} skipped)`);
    } catch (err) {
      console.warn(err instanceof Error ? err.message : String(err));
    }
  }
}

const result = runDeviceSync({
  current,
  candidates,
  evidenceUrl: evidence,
  fetchedSources,
  normalized,
  deprecateMissing,
});
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(result.pack, null, 2)}\n`, "utf8");

const proposals = result.pack.proposals || [];
if (proposals.length) {
  const gate = createFileReviewGate(queuePath);
  await gate.ingest(proposals);
  console.log(`Review queue ${queuePath} (${proposals.length} proposal(s))`);
}

console.log(result.message);
console.log(`Wrote ${outPath}`);
console.log("Import that pack in Catalog sync. npm run catalog:publish writes disk only after approve.");

/** OWNER: services/device-sync/node — npm run sync:devices [-- --input pack.json --evidence url] */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogDevices } from "@take/device-catalog";
import { parseProposalInput } from "../parse-pack";
import { runDeviceSync } from "../job";
import { fetchAllowlistedJson, fetchSourceUrls } from "./fetch-json";
import { createFileReviewGate } from "./file-gate";
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
  if (!urls.length) {
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

const result = runDeviceSync({
  current: loadCatalogDevices(),
  candidates,
  evidenceUrl: evidence,
  fetchedSources,
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

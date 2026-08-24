/** OWNER: services/device-sync — snapshot discover + normalize (no network) */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogDevices } from "@take/device-catalog";
import { parseSnapshotFile } from "./adapters/snapshots";
import { parseWikidataBindings, slugModelName } from "./adapters/wikidata-parse";
import { isAllowedSyncHost } from "./allowlist";
import { materializeDevice } from "./materialize";
import { normalizeDiscovery } from "./normalize-discovery";
import { runDeviceSync } from "./job";
import { normalizeDiscoveries } from "./run-discover";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const current = loadCatalogDevices();
const sibling = current.find((d) => d.id === "apple.iphone-16-pro");
assert(!!sibling, "16 Pro in catalog");

{
  const missing = normalizeDiscovery(
    {
      id: "apple.iphone-17-pro",
      name: "iPhone 17 Pro",
      platform: "ios",
      formFactor: "phone",
      releasedAt: "2025-09-19",
      storeSizeClass: "iphone-6.3",
      inheritFrom: "apple.iphone-does-not-exist",
      evidenceUrl: "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/",
      adapter: "snapshots",
    },
    current
  );
  assert(!missing.ok, "inheritFrom must resolve");
}

{
  const self = normalizeDiscovery(
    {
      id: "apple.iphone-16-pro",
      name: "iPhone 16 Pro",
      platform: "ios",
      formFactor: "phone",
      releasedAt: "2024-09-20",
      inheritFrom: "apple.iphone-16-pro",
      evidenceUrl: "https://developer.apple.com/iphone",
      adapter: "snapshots",
    },
    current
  );
  assert(!self.ok, "inheritFrom cannot be self");
}

{
  const n = normalizeDiscovery(
    {
      id: "apple.iphone-17-pro",
      name: "iPhone 17 Pro",
      platform: "ios",
      formFactor: "phone",
      releasedAt: "2025-09-19",
      storeSizeClass: "iphone-6.3",
      inheritFrom: "apple.iphone-16-pro",
      evidenceUrl:
        "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/",
      evidenceNote: "ASC 6.3",
      adapter: "snapshots",
    },
    current
  );
  assert(n.ok, "17 Pro normalizes");
  if (!n.ok) throw new Error("unreachable");
  assert(n.candidate.confidence === "medium", "store class + inherit is medium, not high");
  assert(n.candidate.inferredFrom === "apple.iphone-16-pro", "inferredFrom stamped");
  assert(n.candidate.proposed.exportPx?.w === 1206, "ASC 6.3 exportPx");
  assert(n.candidate.proposed.exportPx?.h === 2622, "ASC 6.3 height");
  assert(n.candidate.proposed.shellFamily === sibling!.shellFamily, "shell family inherited");
  assert(
    JSON.stringify(n.candidate.proposed.hardware) === JSON.stringify(sibling!.hardware),
    "hardware cloned from sibling — no invented SKU chrome"
  );
  assert(
    (n.candidate.proposed.source || "").includes("inferredFrom: apple.iphone-16-pro"),
    "source labels inherit"
  );
  const mat = materializeDevice(n.candidate.proposed);
  assert(mat.ok, "inherited + size class materializes");
}

{
  const ident = normalizeDiscovery(
    {
      id: "google.pixel-10-pro",
      name: "Pixel 10 Pro",
      platform: "android",
      formFactor: "phone",
      releasedAt: "2025-08-28",
      evidenceUrl: "https://www.wikidata.org/wiki/Q1",
      adapter: "wikidata",
    },
    current
  );
  assert(ident.ok, "identity-only ok");
  if (!ident.ok) throw new Error("unreachable");
  assert(ident.candidate.confidence === "low", "identity-only is low");
  assert(!ident.candidate.proposed.hardware, "no invented punch");
  assert(!ident.candidate.proposed.exportPx, "no invented exportPx");
  const mat = materializeDevice(ident.candidate.proposed);
  assert(!mat.ok, "identity-only cannot approve until sized");
}

{
  const snapPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "sources/snapshots/2025-flagships.json"
  );
  const rows = parseSnapshotFile(JSON.parse(readFileSync(snapPath, "utf8")));
  assert(rows.length >= 7, "snapshot has flagship rows");
  const snapIds = new Set(rows.map((r) => r.id));
  const beforePublish = current.filter((d) => !snapIds.has(d.id));
  const run = normalizeDiscoveries(rows, beforePublish);
  assert(run.warnings.length === 0, run.warnings.join("; ") || "all snapshot rows normalize");
  const job = runDeviceSync({ current: beforePublish, normalized: run.candidates });
  const props = job.pack.proposals || [];
  assert(props.length >= 1, "job emits proposals vs catalog without snapshot ids");
  assert(
    props.some((p) => p.proposed.id === "apple.iphone-17-pro"),
    "17 Pro in pack"
  );
  assert(
    props.every((p) => p.confidence !== "high"),
    "discovery is not high confidence"
  );
  assert(
    props.every((p) => p.evidence.some((e) => /^https:\/\//i.test(e.url))),
    "every proposal has https evidence"
  );
  const seventeen = props.find((p) => p.proposed.id === "apple.iphone-17-pro");
  const sixteenHw = current.find((d) => d.id === "apple.iphone-16-pro")!.hardware;
  assert(
    JSON.stringify(seventeen?.proposed.hardware) === JSON.stringify(sixteenHw),
    "17 Pro chrome equals 16 Pro — no fake SKU front"
  );
  const after = runDeviceSync({
    current: [...beforePublish, ...run.candidates.map((c) => c.proposed as (typeof current)[0])],
    normalized: run.candidates,
  });
  assert((after.pack.proposals || []).length === 0, "discover is idempotent once published");
}

{
  assert(slugModelName("iPhone 17 Pro") === "iphone-17-pro", "iphone slug");
  assert(slugModelName("Galaxy S25") === "galaxy-s25", "galaxy slug");
  assert(slugModelName("Pixel Watch") === null, "reject watch");
  const parsed = parseWikidataBindings({
    results: {
      bindings: [
        {
          item: { value: "http://www.wikidata.org/entity/Q999" },
          itemLabel: { value: "iPhone 17 Pro" },
          manufacturer: { value: "http://www.wikidata.org/entity/Q312" },
          date: { value: "2025-09-19T00:00:00Z" },
        },
      ],
    },
  });
  assert(parsed.length === 1 && parsed[0].id === "apple.iphone-17-pro", "wikidata parse");
  assert(parsed[0].evidenceUrl === "https://www.wikidata.org/wiki/Q999", "entity evidence");
  assert(!parsed[0].inheritFrom && !parsed[0].storeSizeClass, "wikidata is identity-only");
}

{
  assert(isAllowedSyncHost("query.wikidata.org"), "wikidata SPARQL host allowed");
  assert(!isAllowedSyncHost("gsmarena.com"), "open web still blocked");
}

console.log("device-sync.normalize-discovery.test ok");

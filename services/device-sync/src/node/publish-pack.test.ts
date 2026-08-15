/** OWNER: services/device-sync — disk publisher tmpdir (does not touch repo catalogs) */
import { mkdtempSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCatalogDevices } from "@take/device-catalog";
import { publishPackToDisk } from "./publish-pack";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const base = loadCatalogDevices()[0];
const root = mkdtempSync(join(tmpdir(), "take-sync-"));
mkdirSync(join(root, "packages", "device-catalog", "src"), { recursive: true });

const refused = await publishPackToDisk(
  {
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [base],
    proposals: [
      {
        id: "p",
        proposed: base,
        evidence: [{ url: "https://developer.apple.com/iphone" }],
        confidence: "high",
        reviewStatus: "pending",
        createdAt: "2026-08-15T00:00:00.000Z",
      },
    ],
  },
  { repoRoot: root }
);
assert(!refused.ok, "unapproved pack does not write");

const ok = await publishPackToDisk(
  {
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [base],
    proposals: [
      {
        id: "p",
        proposed: base,
        evidence: [{ url: "https://developer.apple.com/iphone" }],
        confidence: "high",
        reviewStatus: "approved",
        createdAt: "2026-08-15T00:00:00.000Z",
      },
    ],
  },
  { repoRoot: root }
);
assert(ok.ok, ok.message);
assert(ok.wrote.length === 1, "wrote one json");
const jsonPath = join(root, "catalogs", "devices", ok.wrote[0]);
assert(existsSync(jsonPath), "device json exists");
const barrel = readFileSync(join(root, "packages", "device-catalog", "src", "load-catalog.ts"), "utf8");
assert(barrel.includes("loadCatalogDevices"), "barrel written");
assert(JSON.parse(readFileSync(jsonPath, "utf8")).id === base.id, "json id matches");

console.log("device-sync.publish-pack.test ok");

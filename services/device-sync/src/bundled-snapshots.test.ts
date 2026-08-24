/** OWNER: services/device-sync — bundled snapshot propose (no network) */
import { loadCatalogDevices } from "@take/device-catalog";
import { bundledSnapshotRows, proposeBundledSnapshots } from "./bundled-snapshots";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const rows = bundledSnapshotRows();
assert(rows.length >= 7, "bundled fixture has flagships");
assert(rows.every((r) => r.adapter === "snapshots"), "adapter tagged");

const current = loadCatalogDevices();
const snapIds = new Set(rows.map((r) => r.id));
const before = current.filter((d) => !snapIds.has(d.id));
const missing = proposeBundledSnapshots(before);
assert((missing.pack.proposals || []).length >= 1, "proposes vs catalog without snapshot ids");

const after = proposeBundledSnapshots(current);
assert((after.pack.proposals || []).length === 0, "published catalog → nothing to review");
assert(after.message.toLowerCase().includes("match") || after.message.includes("nothing"), after.message);

console.log("device-sync.bundled-snapshots.test ok");

/** OWNER: services/device-sync/node — file ReviewGate persist */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileReviewGate, loadQueue } from "./file-gate";
import type { DeviceProposal } from "../types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const dir = mkdtempSync(join(tmpdir(), "take-sync-"));
const queuePath = join(dir, "queue.json");

const row: DeviceProposal = {
  id: "p1",
  proposed: { id: "apple.test", name: "Test" },
  evidence: [{ url: "https://developer.apple.com/iphone" }],
  confidence: "high",
  reviewStatus: "pending",
  createdAt: "2026-08-15T00:00:00.000Z",
};

const gate = createFileReviewGate(queuePath);
await gate.ingest([row]);
const approved = await gate.approve("p1");
assert(approved?.reviewStatus === "approved", "file-gate approve");

const disk = JSON.parse(readFileSync(queuePath, "utf8")) as DeviceProposal[];
assert(disk[0]?.reviewStatus === "approved", "queue.json persisted");

const reloaded = loadQueue(queuePath);
assert(reloaded[0]?.id === "p1" && reloaded[0].reviewStatus === "approved", "loadQueue round-trip");

const gate2 = createFileReviewGate(queuePath);
const again = await gate2.get("p1");
assert(again?.reviewStatus === "approved", "second gate hydrates from disk");

rmSync(dir, { recursive: true, force: true });
console.log("device-sync.file-gate.test ok");

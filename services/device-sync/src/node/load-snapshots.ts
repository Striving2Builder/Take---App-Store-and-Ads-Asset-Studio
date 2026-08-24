/** OWNER: services/device-sync/node — read cited snapshot JSON from disk */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SNAPSHOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../sources/snapshots/2025-flagships.json"
);

export function loadSnapshotJson(filePath: string = SNAPSHOT): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

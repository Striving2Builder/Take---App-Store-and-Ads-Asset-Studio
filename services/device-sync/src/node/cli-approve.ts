/** OWNER: services/device-sync/node — npm run catalog:approve -- pack.json */
import { writeFileSync } from "node:fs";
import { approveEvidencedPack } from "../approve-pack";
import { readPackFile } from "./publish-pack";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

const file = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!file) {
  console.error("Usage: npm run catalog:approve -- <pack.json> [--out approved.json] [--note text]");
  process.exit(1);
}

const out = arg("--out") || file;
const note = arg("--note") || "CLI approve — evidenced + materialize ok; not auto-publish";
const result = approveEvidencedPack(readPackFile(file), note);
writeFileSync(out, `${JSON.stringify(result.pack, null, 2)}\n`, "utf8");
console.log(`Approved ${result.approved}, skipped ${result.skipped} — wrote ${out}`);
console.log("npm run catalog:publish writes disk only for this approved pack.");
if (!result.approved) process.exit(1);

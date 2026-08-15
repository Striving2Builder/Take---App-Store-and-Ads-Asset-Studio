/** OWNER: services/device-sync/node — npm run catalog:publish -- pack.json */
import { publishPackToDisk, readPackFile } from "./publish-pack";

const file = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!file) {
  console.error("Usage: npm run catalog:publish -- <approved-pack.json>");
  process.exit(1);
}

const pack = readPackFile(file);
const result = await publishPackToDisk(pack);
console[result.ok ? "log" : "error"](result.message);
if (result.wrote.length) console.log(result.wrote.join("\n"));
process.exit(result.ok ? 0 : 1);

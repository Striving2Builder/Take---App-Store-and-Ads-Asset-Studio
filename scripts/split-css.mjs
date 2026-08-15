import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync("_legacy/css/take.css", "utf8");
const lines = src.split(/\r?\n/);
const sections = [];
let current = { name: "00-preamble", lines: [] };

for (const line of lines) {
  const m = line.match(/^\/\* ──\s*(.+?)\s*──/);
  if (m) {
    sections.push(current);
    current = {
      name: m[1]
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      lines: [line],
    };
  } else {
    current.lines.push(line);
  }
}
sections.push(current);

const outDir = "apps/web/src/styles/parts";
fs.mkdirSync(outDir, { recursive: true });
const imports = [];

for (const s of sections) {
  const file = `${s.name || "part"}.css`;
  fs.writeFileSync(path.join(outDir, file), `${s.lines.join("\n")}\n`);
  imports.push(`@import "./parts/${file}";`);
  console.log(file, s.lines.length);
}

fs.writeFileSync("apps/web/src/styles/main.css", `${imports.join("\n")}\n`);
console.log("wrote", imports.length, "parts");

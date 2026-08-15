import fs from "node:fs";
import path from "node:path";

const preamble = fs.readFileSync("apps/web/src/styles/parts/00-preamble.css", "utf8");
const library = fs.readFileSync("apps/web/src/styles/parts/library.css", "utf8");

function write(name, content) {
  const p = path.join("apps/web/src/styles", name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trim() + "\n");
  console.log(name, content.trim().split(/\n/).length);
}

// Heuristic splits on known comment anchors inside preamble
const anchors = [
  { file: "tokens.css", start: /:root\s*\{/, end: /^\*,\s*\*::before/m },
  { file: "base.css", start: /^\*,\s*\*::before/m, end: /\/\* Atmosphere \*\// },
  { file: "atmosphere.css", start: /\/\* Atmosphere \*\//, end: /\/\* Stages \*\// },
  { file: "stages-chrome.css", start: /\/\* Stages \*\//, end: /\/\* Topbar \*\// },
  { file: "shell.css", start: /\/\* Topbar \*\//, end: /\/\* Buttons \*\// },
  { file: "buttons.css", start: /\/\* Buttons \*\//, end: /\/\* Crop marks \*\// },
  { file: "crop-marks.css", start: /\/\* Crop marks \*\//, end: null },
];

let remaining = preamble;
for (const a of anchors) {
  const startIdx = remaining.search(a.start);
  if (startIdx < 0) {
    console.warn("missing", a.file);
    continue;
  }
  let chunk;
  if (a.end) {
    const fromStart = remaining.slice(startIdx);
    const endRel = fromStart.search(a.end);
    if (endRel < 0) {
      chunk = remaining.slice(startIdx);
      remaining = remaining.slice(0, startIdx);
    } else {
      // end marker belongs to next file — cut before it
      const absEnd = startIdx + endRel;
      chunk = remaining.slice(startIdx, absEnd);
      remaining = remaining.slice(0, startIdx) + remaining.slice(absEnd);
    }
  } else {
    chunk = remaining.slice(startIdx);
    remaining = remaining.slice(0, startIdx);
  }
  write(a.file, `/* OWNER: styles/${a.file} */\n${chunk}`);
}

if (remaining.trim()) write("preamble-rest.css", `/* OWNER: styles/preamble-rest.css */\n${remaining}`);

// Split library file: library | toast-modal | responsive
const toastIdx = library.search(/\/\* Toast \+ Modal \*\//);
const mediaIdx = library.search(/@media \(max-width: 1100px\)/);
let libPart = library;
let toastPart = "";
let respPart = "";
if (toastIdx >= 0 && mediaIdx > toastIdx) {
  libPart = library.slice(0, toastIdx);
  toastPart = library.slice(toastIdx, mediaIdx);
  respPart = library.slice(mediaIdx);
} else if (mediaIdx >= 0) {
  libPart = library.slice(0, mediaIdx);
  respPart = library.slice(mediaIdx);
}
write("parts/library.css", libPart);
if (toastPart) write("toast-modal.css", `/* OWNER: styles/toast-modal.css */\n${toastPart}`);
if (respPart) write("responsive.css", `/* OWNER: styles/responsive.css */\n${respPart}`);

const main = [
  '@import "./tokens.css";',
  '@import "./base.css";',
  '@import "./atmosphere.css";',
  '@import "./stages-chrome.css";',
  '@import "./shell.css";',
  '@import "./buttons.css";',
  '@import "./forms.css";',
  '@import "./crop-marks.css";',
  '@import "./parts/landing.css";',
  '@import "./parts/modes.css";',
  '@import "./parts/intake.css";',
  '@import "./parts/generate-theater.css";',
  '@import "./parts/review.css";',
  '@import "./parts/editor.css";',
  '@import "./parts/export.css";',
  '@import "./parts/library.css";',
  '@import "./toast-modal.css";',
  '@import "./responsive.css";',
].join("\n");

// forms.css may be empty — create placeholder if missing
if (!fs.existsSync("apps/web/src/styles/forms.css")) {
  write(
    "forms.css",
    `/* OWNER: styles/forms.css — form controls extracted from stage CSS over time */\n`
  );
}

fs.writeFileSync("apps/web/src/styles/main.css", main + "\n");
fs.unlinkSync("apps/web/src/styles/parts/00-preamble.css");
console.log("main.css rewritten");

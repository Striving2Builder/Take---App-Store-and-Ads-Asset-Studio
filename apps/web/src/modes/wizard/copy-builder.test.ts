/** OWNER: modes/wizard — store copy must not duplicate the app name or mangle it */
import type { InferenceBrief } from "@take/core";
import { buildCopy, leadWithName } from "./copy-builder";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// leadWithName: the actual bug was "Aurabase — Aurabase — Productivity" when
// the captured subtitle already opened with the app's own name.
assert(
  leadWithName("Aurabase", "Aurabase — Productivity") === "Aurabase — Productivity",
  "does not double the name when the line already leads with it"
);
assert(
  leadWithName("Aurabase", "aurabase — productivity") === "aurabase — productivity",
  "match is case-insensitive"
);
assert(
  leadWithName("Aurabase", "Focus without the noise") === "Aurabase — Focus without the noise",
  "prefixes the name when the line doesn't already have it"
);
assert(
  leadWithName("Aurabase", "Aurabase: Habits that stick", ": ") === "Aurabase: Habits that stick",
  "custom separator: still dedupes"
);
assert(
  leadWithName("Aurabase", "Habits that stick", ": ") === "Aurabase: Habits that stick",
  "custom separator: still prefixes when needed"
);

function brief(overrides: Partial<InferenceBrief>): InferenceBrief {
  return {
    name: "Aurabase",
    category: "Productivity",
    audience: "",
    where: "",
    when: "",
    how: "",
    features: [],
    positioning: "",
    narrative: "",
    value: "",
    differentiators: [],
    style: "bold",
    platform: "ios",
    locale: "en-US",
    goal: "install",
    host: "aurabase.app",
    mode: "wizard",
    donot: "",
    tone: "",
    ux: "",
    refs: "",
    ...overrides,
  };
}

// Regression: a captured subtitle/positioning that already leads with the
// app's name must not be duplicated in Play short/full description.
{
  const inf = brief({ positioning: "Aurabase — Productivity" });
  const copy = buildCopy(inf, 0);
  assert(!copy.playShort.includes("Aurabase — Aurabase"), `playShort duplicated the name: ${copy.playShort}`);
  assert(!copy.playFull.includes("Aurabase — Aurabase"), `playFull duplicated the name: ${copy.playFull}`);
}

// Regression: variant 2's iosTitle used to slice the name itself to 20 chars
// with no ellipsis, corrupting it (e.g. "Meditation" -> "Meditatio").
{
  const inf = brief({ name: "Wildflower Meditation" });
  const copy = buildCopy(inf, 2);
  assert(
    !copy.iosTitle.includes("Meditatio ") && !copy.iosTitle.endsWith("Meditatio"),
    `iosTitle corrupted the name mid-word: ${copy.iosTitle}`
  );
}

console.log("copy-builder.test ok");

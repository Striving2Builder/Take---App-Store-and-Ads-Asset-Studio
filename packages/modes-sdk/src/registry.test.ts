/** OWNER: packages/modes-sdk — registry + optional hook smoke */
import type { CreationMode, ModeRunResult } from "./creation-mode";
import { getMode, listModes, registerMode } from "./registry";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const stubResult: ModeRunResult = {
  inference: {
    name: "Stub",
    category: "",
    audience: "",
    where: "",
    when: "",
    how: "",
    features: [],
    positioning: "",
    narrative: "",
    value: "",
    differentiators: [],
    style: "minimal",
    platform: "ios",
    locale: "en-US",
    goal: "install",
    host: "",
    mode: "stub",
    donot: "",
    tone: "",
    ux: "",
    refs: "",
  },
  sets: [],
};

const stub: CreationMode = {
  id: "stub-test",
  label: "Stub",
  capabilities: {
    needsUrl: false,
    needsUploads: false,
    supportsStorySequence: true,
    supportsVideo: false,
    supportsTrace: false,
  },
  validateIntake: () => [],
  run: async () => stubResult,
};

registerMode(stub);
assert(getMode("stub-test")?.label === "Stub", "getMode finds stub");
assert(
  listModes().some((m) => m.id === "stub-test"),
  "listModes includes stub"
);
assert(getMode("stub-test")?.getEditorPlugins === undefined, "plugins optional");
assert(getMode("missing") === undefined, "unknown id is undefined");

const withHooks: CreationMode = {
  ...stub,
  id: "stub-hooks",
  getEditorPlugins: () => [
    { id: "p", title: "P", slot: "review", render: () => undefined },
  ],
  getExportHints: () => ({ preferMotion: true, defaultPresets: ["slideshow"] }),
};
registerMode(withHooks);
assert(getMode("stub-hooks")?.getEditorPlugins?.().length === 1, "plugins hook");
assert(getMode("stub-hooks")?.getExportHints?.().preferMotion === true, "export hints");

console.log("modes-sdk registry.test ok");

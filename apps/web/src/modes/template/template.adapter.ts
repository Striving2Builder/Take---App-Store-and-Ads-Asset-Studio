/** OWNER: modes/template — uses saved library templates when present */
import type { CreationMode } from "@take/modes-sdk";
import { getTemplates } from "@take/storage";
import { scanApp } from "@take/scan-client";
import { generateSets } from "../wizard/sets-builder";

export const templateMode: CreationMode = {
  id: "template",
  label: "Template",
  capabilities: {
    needsUrl: true,
    needsUploads: false,
    supportsStorySequence: true,
    supportsVideo: false,
    supportsTrace: false,
  },
  validateIntake(input) {
    const missing: string[] = [];
    if (!input.url && input.uploads === 0) missing.push("URL or uploads required");
    return missing;
  },
  async run(input, ctx) {
    const brief = ctx.priorBrief
      ? { ...ctx.priorBrief, mode: "template" as const }
      : (await scanApp(input)).brief;
    const tpl = getTemplates().find((t) => t.kind === "user") || getTemplates()[0];
    const qty = Math.min(5, Math.max(1, input.qty));
    const sets = generateSets(brief, qty, undefined, {
      seedPalette: ctx.seedPalette,
    });
    if (tpl) {
      sets.forEach((s, i) => {
        s.name = i === 0 ? tpl.name : `${tpl.name} · ${s.name}`;
        s.style = (tpl.style as typeof s.style) || s.style;
        s.styleLabel = `Template · ${tpl.name}`;
        s.blurb = `Built from library template “${tpl.name}” + scan brief.`;
      });
    } else {
      sets.forEach((s) => {
        s.styleLabel = "Template · default layout";
        s.blurb = "No saved template yet — using scan brief with template mode framing.";
      });
    }
    return { inference: { ...brief, mode: "template" }, sets };
  },
};

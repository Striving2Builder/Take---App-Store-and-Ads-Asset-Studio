/** OWNER: packages/template-engine — apply a recipe to a brief (copy still rule-based) */
import { FRAME_ROLES, type InferenceBrief, type StoryFrame } from "@take/core";
import type { TemplateRecord } from "../template.types";
import { mapShotsToFrames } from "./map-shots";

export type ApplyTemplateInput = {
  recipe: TemplateRecord;
  brief: InferenceBrief;
  shotCount: number;
};

export type ApplyTemplateResult = {
  recipe: TemplateRecord;
  frames: StoryFrame[];
  shotByFrame: Array<number | undefined>;
};

const TOKEN: Record<string, (b: InferenceBrief) => string> = {
  "{{name}}": (b) => b.name,
  "{{value}}": (b) => b.value,
  "{{positioning}}": (b) => b.positioning,
  "{{audience}}": (b) => b.audience,
  "{{category}}": (b) => b.category,
};

function fill(text: string, brief: InferenceBrief): string {
  let out = text;
  for (const [tok, fn] of Object.entries(TOKEN)) {
    if (out.includes(tok)) out = out.split(tok).join(fn(brief).trim());
  }
  return out.trim();
}

/** One line pair per role — no headline modulo. Empty stays empty. */
function roleLine(brief: InferenceBrief, role: string): { headline: string; caption: string } {
  const byRole: Record<string, [string, string]> = {
    HOOK: ["{{name}}", "{{positioning}}"],
    PROBLEM: ["{{audience}}", "{{value}}"],
    SHIFT: ["{{positioning}}", "{{value}}"],
    PROOF: ["{{value}}", "{{category}}"],
    FEATURE: [brief.features[0] || "", brief.ux || brief.how],
    RITUAL: [brief.when, brief.where],
    SOCIAL: ["{{audience}}", "{{positioning}}"],
    DETAIL: [brief.ux, brief.tone],
    OUTCOME: ["{{value}}", "{{positioning}}"],
    TRUST: ["{{category}}", "{{value}}"],
    CTA: ["{{name}}", "{{positioning}}"],
    CLOSE: ["{{name}}", "{{value}}"],
  };
  const [h, c] = byRole[role] || ["", ""];
  return { headline: fill(h, brief), caption: fill(c, brief) };
}

export function applyTemplate(input: ApplyTemplateInput): ApplyTemplateResult {
  const { recipe, brief } = input;
  const n = Math.min(12, Math.max(1, recipe.frameCount || input.shotCount || 5));
  const mapped = mapShotsToFrames(
    Array.from({ length: input.shotCount }, (_, i) => i),
    n
  );
  const frames: StoryFrame[] = Array.from({ length: n }, (_, i) => {
    const role = FRAME_ROLES[i] || `FRAME ${i + 1}`;
    const copy = roleLine(brief, role);
    return {
      id: `${recipe.id}-f-${i}`,
      index: i,
      role,
      kicker: `${String(i + 1).padStart(2, "0")} · ${role}`,
      headline: copy.headline,
      caption: copy.caption,
      cta: brief.goal === "trial" ? "Start free trial" : "Get the app",
    };
  });
  return { recipe, frames, shotByFrame: mapped };
}

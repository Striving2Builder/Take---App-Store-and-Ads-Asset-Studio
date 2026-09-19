/** OWNER: packages/template-engine — proof widget strings (sample until the user types) */
import type { ExtraSlot } from "../template.types";

export const SAMPLE_SCORE_TEXT = "—";
export const SAMPLE_STORE_LABEL = "Sample rating";
export const SAMPLE_QUOTE = "This app changed how I start my mornings.";
export const SAMPLE_ATTRIBUTION = "Sample";
export const SAMPLE_PILLS = ["Tag one", "Tag two", "Tag three"];

export type WidgetCopy = {
  scoreText: string;
  storeLabel: string;
  quote: string;
  attribution: string;
  pills: string[];
  stars: number;
  isSample: boolean;
};

function hasScore(score: number | undefined): score is number {
  return typeof score === "number" && Number.isFinite(score);
}

export function widgetCopy(slot: ExtraSlot, realFeatures?: string[]): WidgetCopy {
  const stars = Math.max(1, Math.min(5, Math.round(slot.stars ?? 5)));
  if (slot.widget === "rating") {
    const score = slot.score;
    if (!hasScore(score)) {
      return {
        scoreText: SAMPLE_SCORE_TEXT,
        storeLabel: (slot.storeLabel || "").trim() || SAMPLE_STORE_LABEL,
        quote: "",
        attribution: "",
        pills: [],
        stars,
        isSample: true,
      };
    }
    return {
      scoreText: score.toFixed(1),
      storeLabel: (slot.storeLabel || "").trim() || SAMPLE_STORE_LABEL,
      quote: "",
      attribution: "",
      pills: [],
      stars,
      isSample: false,
    };
  }
  if (slot.widget === "review") {
    const quote = (slot.quote || slot.text || "").trim();
    const attribution = (slot.attribution || "").trim();
    const sample = !quote || quote === SAMPLE_QUOTE;
    return {
      scoreText: SAMPLE_SCORE_TEXT,
      storeLabel: "",
      quote: quote || SAMPLE_QUOTE,
      attribution: attribution || SAMPLE_ATTRIBUTION,
      pills: [],
      stars,
      isSample: sample,
    };
  }
  // Real brief features/differentiators always win over a template's
  // hardcoded pill words when any exist — a recipe's authored pills (e.g.
  // "Cook, Plan, Share") have no way to know what app they'll actually be
  // applied to, so they were showing at full opacity on completely
  // unrelated apps (isSample only ever caught "no pills provided at all",
  // never "these pills don't describe this app"). Real feature text is
  // always more honest than a static per-template guess.
  const fromBrief = (realFeatures || []).map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (fromBrief.length) {
    return {
      scoreText: SAMPLE_SCORE_TEXT,
      storeLabel: "",
      quote: "",
      attribution: "",
      pills: fromBrief,
      stars,
      isSample: false,
    };
  }
  const authoredPills = slot.pills?.length
    ? slot.pills.map((s) => s.trim()).filter(Boolean)
    : (slot.text || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return {
    scoreText: SAMPLE_SCORE_TEXT,
    storeLabel: "",
    quote: "",
    attribution: "",
    pills: authoredPills.length ? authoredPills : [...SAMPLE_PILLS],
    stars,
    // No real brief data to go on — an authored template's own pills are
    // still an unverified guess at this specific app's features, so mark
    // them sample too, same honest treatment as an empty slot.
    isSample: true,
  };
}

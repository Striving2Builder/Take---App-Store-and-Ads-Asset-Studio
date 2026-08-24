/** OWNER: packages/template-engine — proof widget strings (sample until the user types) */
import type { ExtraSlot } from "../template.types";

export const SAMPLE_SCORE_TEXT = "—";
export const SAMPLE_STORE_LABEL = "Sample rating";
export const SAMPLE_QUOTE = "Add your quote";
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

export function widgetCopy(slot: ExtraSlot): WidgetCopy {
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
  const pills = slot.pills?.length
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
    pills: pills.length ? pills : [...SAMPLE_PILLS],
    stars,
    isSample: !slot.pills?.length && !(slot.text || "").trim(),
  };
}

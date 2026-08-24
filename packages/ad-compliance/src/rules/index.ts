/** OWNER: ad-compliance/rules — jurisdiction-aware aggregator */
import type { CategoryRules, Jurisdiction, RegulatedCategory } from "../types";
import { US_RULES } from "./us";
import { EU_RULES } from "./eu";
import { UK_RULES } from "./uk";
import { CA_RULES } from "./ca";

const BY_JURISDICTION: Record<Jurisdiction, CategoryRules[]> = {
  us: US_RULES,
  eu: EU_RULES,
  uk: UK_RULES,
  ca: CA_RULES,
};

export function listJurisdictions(): Jurisdiction[] {
  return Object.keys(BY_JURISDICTION) as Jurisdiction[];
}

export function rulesForCategory(jurisdiction: Jurisdiction, category: RegulatedCategory): CategoryRules | null {
  if (category === "none") return null;
  return BY_JURISDICTION[jurisdiction]?.find((r) => r.category === category) ?? null;
}

export function listRegulatedCategories(jurisdiction: Jurisdiction): CategoryRules[] {
  return BY_JURISDICTION[jurisdiction] ?? [];
}

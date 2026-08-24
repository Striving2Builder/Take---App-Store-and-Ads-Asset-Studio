/** OWNER: ad-compliance/rules — United Kingdom */
import type { CategoryRules } from "../types";

export const UK_FINANCE: CategoryRules = {
  category: "finance",
  jurisdiction: "uk",
  label: "Finance / Credit / Investing",
  requirements: [
    {
      id: "uk-finance-capital-at-risk",
      label: "Must clearly indicate capital is at risk",
      description:
        "The FCA requires financial promotions to make clear a product places capital at risk — but as of the FCA-backed April 2026 Risk Warnings Review, there is deliberately no fixed required wording; \"capital at risk\" as a rote phrase is being phased out in favor of plain-language risk explanation. Not machine-checkable for that reason — read it, don't just pattern-match it.",
      source: "FCA COBS 4 — financial promotions; Investment Association Risk Warnings Review (April 2026)",
      kind: "disclosure",
      patterns: [],
    },
    {
      id: "uk-finance-high-risk-warning",
      label: "High-risk investment specific risk summary",
      description: "Certain high-risk investment types require a specific risk summary under FCA rules.",
      source: "FCA COBS 4.5 — risk warnings and risk summaries for high-risk investments",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const UK_HEALTHCARE: CategoryRules = {
  category: "healthcare",
  jurisdiction: "uk",
  label: "Healthcare / Pharma (prescription or clinical claims)",
  requirements: [
    {
      id: "uk-healthcare-dtc-ban",
      label: "Direct-to-consumer prescription drug advertising is banned",
      description:
        "As in the EU, advertising prescription-only medicines directly to the public is prohibited in the UK. This is a legality question, not a missing disclosure.",
      source: "MHRA / ABPI Code of Practice for the Pharmaceutical Industry",
      kind: "prohibition-notice",
      patterns: [],
    },
    {
      id: "uk-healthcare-otc-substantiation",
      label: "Substantiated health/OTC claims",
      description: "Non-prescription health claims must be truthful, substantiated, and not misleading.",
      source: "ASA / CAP Code — health, beauty and slimming claims",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const UK_ALCOHOL: CategoryRules = {
  category: "alcohol",
  jurisdiction: "uk",
  label: "Alcohol",
  requirements: [
    {
      id: "uk-alcohol-drinkaware",
      label: "Responsible-drinking reference (commonly Drinkaware)",
      description: "UK alcohol ads commonly reference Drinkaware or an equivalent responsible-drinking message.",
      source: "ASA / CAP Code — alcohol; industry practice (Drinkaware)",
      kind: "disclosure",
      patterns: [/drinkaware/i, /drink responsibly/i, /enjoy responsibly/i],
    },
    {
      id: "uk-alcohol-no-social-success-link",
      label: "Must not link alcohol to social, sexual, or sporting success",
      description: "The CAP Code prohibits associating alcohol with social success, sexual success, or enhanced physical performance — a content judgment, not a phrase to add.",
      source: "ASA / CAP Code — alcohol",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const UK_GAMBLING: CategoryRules = {
  category: "gambling",
  jurisdiction: "uk",
  label: "Gambling / Sports betting",
  requirements: [
    {
      id: "uk-gambling-safer-gambling",
      label: "Safer-gambling reference (BeGambleAware / GamCare)",
      description: "UK gambling ads are expected to carry a safer-gambling reference — the industry has shifted terminology from \"gamble responsibly\" toward \"safer gambling.\"",
      source: "ASA / CAP Code Section 16 — gambling; Gambling Commission",
      kind: "disclosure",
      patterns: [/begambleaware/i, /gamcare/i, /safer gambling/i, /gambling problem/i, /gamble responsibly/i],
    },
    {
      id: "uk-gambling-no-vulnerable-targeting",
      label: "Must not target under-18s or exploit vulnerable people",
      description: "Gambling ads must not portray, condone, or encourage socially irresponsible gambling or exploit children, young people, or other vulnerable persons — a content/targeting judgment, not a phrase to add.",
      source: "ASA / CAP Code Section 16 — gambling",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const UK_RULES = [UK_FINANCE, UK_HEALTHCARE, UK_ALCOHOL, UK_GAMBLING];

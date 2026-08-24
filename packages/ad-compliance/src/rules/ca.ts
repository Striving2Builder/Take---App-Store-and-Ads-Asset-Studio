/** OWNER: ad-compliance/rules — Canada
 *  Gambling and alcohol are provincially regulated in Canada — there's no single federal
 *  framework the way the FDA or FCA centralizes US/UK rules. Gambling here is scoped to
 *  Ontario (AGCO) specifically, the largest regulated iGaming market, and labeled as such
 *  rather than presented as a national rule. */
import type { CategoryRules } from "../types";

export const CA_FINANCE: CategoryRules = {
  category: "finance",
  jurisdiction: "ca",
  label: "Finance / Credit / Investing",
  requirements: [
    {
      id: "ca-finance-risk",
      label: "Investment risk disclosure",
      description: "Canadian securities regulation (coordinated provincially through the CSA) expects clear risk disclosure for investment products, similar in spirit to US/UK practice.",
      source: "Canadian Securities Administrators (CSA) — provincially coordinated investor protection rules",
      kind: "disclosure",
      patterns: [/\brisk\b/i, /may lose/i, /not guaranteed/i],
    },
  ],
};

export const CA_HEALTHCARE: CategoryRules = {
  category: "healthcare",
  jurisdiction: "ca",
  label: "Healthcare / Pharma (prescription or clinical claims)",
  requirements: [
    {
      id: "ca-healthcare-dtc-ban",
      label: "Direct-to-consumer prescription drug advertising is banned, with narrow exceptions",
      description:
        "Canada prohibits DTC prescription drug advertising under the Food and Drugs Act — but uniquely allows two narrow exceptions: \"reminder ads\" (brand name only, no health claim) and \"help-seeking ads\" (names a condition, not the product). Anything beyond those two forms needs legal review before it's a legal ad, not just a disclosure fix.",
      source: "Health Canada — Food and Drugs Act / Food and Drug Regulations",
      kind: "prohibition-notice",
      patterns: [],
    },
  ],
};

export const CA_ALCOHOL: CategoryRules = {
  category: "alcohol",
  jurisdiction: "ca",
  label: "Alcohol",
  requirements: [
    {
      id: "ca-alcohol-provincial",
      label: "Provincial liquor authority rules + drinking age vary by province",
      description: "Legal drinking age is 18 or 19 depending on province, and each provincial liquor authority sets its own advertising rules — there is no single national Canadian standard.",
      source: "Provincial liquor control authorities (e.g. AGCO in Ontario, RACJ in Quebec)",
      kind: "prohibition-notice",
      patterns: [],
    },
    {
      id: "ca-alcohol-responsibility-signal",
      label: "Responsible-drinking message",
      description: "A responsible-drinking reference is common practice across Canadian alcohol advertising.",
      source: "Provincial liquor authority guidance; industry practice",
      kind: "disclosure",
      patterns: [/drink responsibly/i, /enjoy responsibly/i],
    },
  ],
};

export const CA_GAMBLING: CategoryRules = {
  category: "gambling",
  jurisdiction: "ca",
  label: "Gambling / Sports betting (Ontario / AGCO — other provinces differ)",
  requirements: [
    {
      id: "ca-on-gambling-helpline",
      label: "ConnexOntario helpline reference",
      description: "Ontario-regulated iGaming operators must direct players to ConnexOntario, the province's confidential problem-gambling helpline.",
      source: "Alcohol and Gaming Commission of Ontario (AGCO) — advertising & responsible gambling standards",
      kind: "disclosure",
      patterns: [/connexontario/i, /1-?866-?531-?2600/i],
    },
    {
      id: "ca-on-gambling-no-endorsers",
      label: "No athlete or celebrity endorsers in Ontario iGaming ads",
      description: "Since February 2024, AGCO rules prohibit athletes and celebrities from appearing in Ontario iGaming ads (responsible-gambling messaging excepted), and ban public advertising of bonuses or inducements.",
      source: "AGCO — 2024 advertising standard amendments",
      kind: "prohibition-notice",
      patterns: [],
    },
  ],
};

export const CA_RULES = [CA_FINANCE, CA_HEALTHCARE, CA_ALCOHOL, CA_GAMBLING];

/** OWNER: ad-compliance/rules — United States */
import type { CategoryRules } from "../types";

export const US_FINANCE: CategoryRules = {
  category: "finance",
  jurisdiction: "us",
  label: "Finance / Credit / Investing",
  requirements: [
    {
      id: "us-finance-rate-terms",
      label: "APR / rate & repayment terms visible in the ad",
      description:
        "If the ad cites a rate, payment, or credit term, the APR, fees, and repayment terms must be immediately visible in the ad copy — not behind a link or roll-over.",
      source: "Google Ads Policy — Financial products and services disclosures",
      kind: "disclosure",
      patterns: [/\bapr\b/i, /annual percentage rate/i, /\bfees? (?:apply|may apply)\b/i, /repayment terms?/i],
    },
    {
      id: "us-finance-risk",
      label: "Investment risk disclosure",
      description: "Investment/trading/crypto ads should disclose that investing carries risk, including loss of principal.",
      source: "Common SEC/FINRA-aligned ad practice; Meta financial services ad standards",
      kind: "disclosure",
      patterns: [/\brisk\b/i, /loss of principal/i, /not (?:fdic|sipc) insured/i, /past performance/i],
    },
    {
      id: "us-finance-licensing",
      label: "Platform certification / licensing",
      description:
        "Lending, crypto, and BNPL advertisers often need Google/Meta certification and proof of regulatory authorization before the ad can run — verify separately per platform and state.",
      source: "Meta Ad Standards — Financial services; Google Ads financial services certification",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const US_HEALTHCARE: CategoryRules = {
  category: "healthcare",
  jurisdiction: "us",
  label: "Healthcare / Pharma (prescription or clinical claims)",
  requirements: [
    {
      id: "us-healthcare-fair-balance",
      label: "Risk / side-effect disclosure alongside the benefit claim",
      description:
        "FDA fair-balance guidance expects risk information presented with a prominence comparable to the benefit claim — not omitted or buried. The US (with New Zealand) is one of the only markets that allows direct-to-consumer prescription drug ads at all.",
      source: "FDA Prescription Drug Advertising Rule — fair balance",
      kind: "disclosure",
      patterns: [/side effects?/i, /risks? includ/i, /may cause/i, /consult your (?:doctor|physician|healthcare provider)/i, /talk to your doctor/i],
    },
    {
      id: "us-healthcare-full-info",
      label: "Reference to full prescribing / safety information",
      description: "Broadcast-style ads satisfy detailed risk disclosure via a brief major-risk statement plus a pointer to full prescribing information.",
      source: "FDA — \"adequate provision\" for full risk information",
      kind: "disclosure",
      patterns: [/prescribing information/i, /full (?:risk|safety) information/i, /important safety information/i],
    },
  ],
};

export const US_ALCOHOL: CategoryRules = {
  category: "alcohol",
  jurisdiction: "us",
  label: "Alcohol",
  requirements: [
    {
      id: "us-alcohol-responsibility",
      label: "Responsible-drinking message",
      description: "Alcohol ads are expected to always carry a responsible-drinking message.",
      source: "Industry Digital Guiding Principles for alcohol advertising",
      kind: "disclosure",
      patterns: [/drink responsibly/i, /enjoy responsibly/i, /please drink responsibly/i],
    },
    {
      id: "us-alcohol-age",
      label: "Legal drinking age restriction stated",
      description: "Ads must not target under the legal drinking age and should carry a clear age restriction.",
      source: "DISCUS Code of Responsible Practices; platform alcohol ad policies",
      kind: "disclosure",
      patterns: [/21\+/, /must be (?:of )?legal drinking age/i, /21 (?:years|and) (?:or )?older/i],
    },
  ],
};

export const US_GAMBLING: CategoryRules = {
  category: "gambling",
  jurisdiction: "us",
  label: "Gambling / Sports betting",
  requirements: [
    {
      id: "us-gambling-helpline",
      label: "Problem-gambling helpline",
      description: "Most regulated US markets require a problem-gambling helpline reference on every ad.",
      source: "State gaming commission ad rules (e.g. NJ); American Gaming Association responsible-play standards",
      kind: "disclosure",
      patterns: [/1-?800-?gambler/i, /gambling problem/i, /problem gambling/i, /ncpgambling/i, /gamblers anonymous/i],
    },
    {
      id: "us-gambling-age",
      label: "Legal betting age stated",
      description: "Ads should state the legal betting age for the target market (commonly 21+ in the US).",
      source: "State gaming commission ad rules",
      kind: "disclosure",
      patterns: [/21\+/, /must be (?:21|18)/i, /of legal (?:gambling|betting) age/i],
    },
    {
      id: "us-gambling-responsible-play",
      label: "Responsible-play statement",
      description: "A short responsible-gambling statement is standard alongside the helpline.",
      source: "American Gaming Association — Responsible Play",
      kind: "disclosure",
      patterns: [/gambl(?:e|ing) responsibly/i, /play responsibly/i, /bet responsibly/i, /know when to stop/i],
    },
  ],
};

export const US_RULES = [US_FINANCE, US_HEALTHCARE, US_ALCOHOL, US_GAMBLING];

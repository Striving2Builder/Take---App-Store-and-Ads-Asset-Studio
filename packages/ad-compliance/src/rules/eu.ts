/** OWNER: ad-compliance/rules — European Union
 *  EU rules are genuinely thinner than US/UK/CA for two of these categories: gambling and
 *  alcohol advertising are largely member-state competency, not harmonized EU law. Rather
 *  than fabricate a single "EU rule" that doesn't exist, those show as an explicit
 *  fragmentation notice instead of a false checklist. */
import type { CategoryRules } from "../types";

export const EU_FINANCE: CategoryRules = {
  category: "finance",
  jurisdiction: "eu",
  label: "Finance / Credit / Investing",
  requirements: [
    {
      id: "eu-finance-cfd-risk-warning",
      label: "Standardised CFD/high-risk retail investment risk warning",
      description:
        "ESMA requires a firm-specific standardised risk warning on CFD and similar high-risk retail investment ads, in the form \"[X]% of retail [CFD] accounts lose money.\"",
      source: "ESMA product intervention measures — CFDs and binary options for retail investors",
      kind: "disclosure",
      patterns: [/%\s*(?:of )?retail(?:\s+(?:investor|cfd))?\s+accounts?\s+lose\s+money/i, /\bcfd\b.{0,40}\brisk\b/i],
    },
    {
      id: "eu-finance-mifid-risk",
      label: "MiFID II-aligned risk disclosure",
      description: "General EU investor-protection rules expect clear, fair, non-misleading risk communication for financial promotions.",
      source: "MiFID II — investor protection / marketing communications",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const EU_HEALTHCARE: CategoryRules = {
  category: "healthcare",
  jurisdiction: "eu",
  label: "Healthcare / Pharma (prescription or clinical claims)",
  requirements: [
    {
      id: "eu-healthcare-dtc-ban",
      label: "Direct-to-consumer prescription drug advertising is banned EU-wide",
      description:
        "Unlike the US, the EU maintains a strict ban on advertising prescription-only medicines directly to the public. This isn't a missing disclosure — it's a legality question to resolve before running the ad at all.",
      source: "EU Directive 2001/83/EC (as amended) — advertising of medicinal products",
      kind: "prohibition-notice",
      patterns: [],
    },
    {
      id: "eu-healthcare-otc-substantiation",
      label: "Substantiated health/OTC claims",
      description: "Non-prescription health claims still must be truthful and substantiated under general EU unfair-commercial-practices law.",
      source: "EU Unfair Commercial Practices Directive",
      kind: "disclosure",
      patterns: [],
    },
  ],
};

export const EU_ALCOHOL: CategoryRules = {
  category: "alcohol",
  jurisdiction: "eu",
  label: "Alcohol",
  requirements: [
    {
      id: "eu-alcohol-no-harmonized-rule",
      label: "No single EU-wide alcohol ad rule — member states diverge sharply",
      description:
        "The Audiovisual Media Services Directive sets a floor (no encouraging excessive consumption, no targeting minors) but member states add their own rules well beyond it — Poland drafted a broad new advertising ban in January 2026. Verify the specific member state, not just \"EU.\"",
      source: "AVMSD floor + member-state law (e.g. Poland's 2026 draft ban)",
      kind: "prohibition-notice",
      patterns: [],
    },
    {
      id: "eu-alcohol-responsibility-signal",
      label: "Responsible-drinking message (common practice, not universally mandated)",
      description: "Many member states expect or require a responsible-drinking reference even where not explicitly harmonized.",
      source: "AVMSD principle; common member-state practice",
      kind: "disclosure",
      patterns: [/drink responsibly/i, /enjoy responsibly/i],
    },
  ],
};

export const EU_GAMBLING: CategoryRules = {
  category: "gambling",
  jurisdiction: "eu",
  label: "Gambling / Sports betting",
  requirements: [
    {
      id: "eu-gambling-no-harmonized-rule",
      label: "Gambling ad legality varies drastically by member state",
      description:
        "There is no single EU gambling-advertising law. Italy and Latvia impose near-total bans; Belgium banned nearly all betting ads in 2023; Spain restricts ads to late-night hours; other member states apply only minimal guidance. A single \"EU\" checklist would misrepresent this — verify the specific member state's regulator before running the ad.",
      source: "European Audiovisual Observatory — comparative review of gambling ad regulation",
      kind: "prohibition-notice",
      patterns: [],
    },
  ],
};

export const EU_RULES = [EU_FINANCE, EU_HEALTHCARE, EU_ALCOHOL, EU_GAMBLING];

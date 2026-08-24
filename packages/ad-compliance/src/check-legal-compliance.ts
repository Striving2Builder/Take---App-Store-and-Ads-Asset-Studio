/** OWNER: packages/ad-compliance — does the ad copy carry the disclosures its category/jurisdiction expect */
import type { Jurisdiction, LegalComplianceResult, RegulatedCategory } from "./types";
import { rulesForCategory } from "./rules/index";

export type AdCopyText = { headline: string; description: string; legalLine: string };

/** Checks combined ad text (headline + description + legal line) against the category's
 *  requirements for the given jurisdiction. A checklist against documented platform/regulator
 *  guidance — not legal certification. Always advisory: callers should warn, never hard-block
 *  export on this. prohibition-notice requirements always surface separately — no amount of
 *  text satisfies "this may be illegal to run here." */
export function checkLegalCompliance(
  category: RegulatedCategory,
  jurisdiction: Jurisdiction,
  copy: AdCopyText
): LegalComplianceResult {
  const rules = rulesForCategory(jurisdiction, category);
  if (!rules) return { category, jurisdiction, satisfied: [], missing: [], advisories: [], prohibitions: [] };

  const haystack = `${copy.headline} ${copy.description} ${copy.legalLine}`;
  const satisfied: LegalComplianceResult["satisfied"] = [];
  const missing: LegalComplianceResult["missing"] = [];
  const advisories: LegalComplianceResult["advisories"] = [];
  const prohibitions: LegalComplianceResult["prohibitions"] = [];

  for (const req of rules.requirements) {
    if (req.kind === "prohibition-notice") {
      prohibitions.push(req);
      continue;
    }
    if (!req.patterns.length) {
      advisories.push(req);
      continue;
    }
    const hit = req.patterns.some((p) => p.test(haystack));
    (hit ? satisfied : missing).push(req);
  }

  return { category, jurisdiction, satisfied, missing, advisories, prohibitions };
}

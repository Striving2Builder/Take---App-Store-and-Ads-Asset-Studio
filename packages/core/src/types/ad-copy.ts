/** OWNER: packages/core — ad creative copy (NOT store metadata — see StoreCopy) */

/** Mirrors packages/ad-compliance RegulatedCategory/Jurisdiction as plain string unions —
 *  kept decoupled, same loose-coupling convention as AdUnitFamily in template-engine/ad-grammar. */
export type AdRegulatedCategory = "none" | "finance" | "healthcare" | "alcohol" | "gambling";
export type AdJurisdiction = "us" | "eu" | "uk" | "ca";

export type AdCopy = {
  headline: string;
  description: string;
  cta: string;
  /** Required for a real ad — where the click actually goes. */
  clickThroughUrl: string;
  advertiserName: string;
  /** Some networks require a disclosure line ("Ad" tag, sponsor line, terms). */
  legalLine: string;
  /** Drives the @take/ad-compliance checklist — "none" skips it entirely. */
  regulatedCategory: AdRegulatedCategory;
  /** Which jurisdiction's rules to check the category against. */
  jurisdiction: AdJurisdiction;
};

/** OWNER: packages/ad-compliance — regulated-category disclosure rules (NOT legal advice) */

export type RegulatedCategory = "none" | "finance" | "healthcare" | "alcohol" | "gambling";

/** Deliberately NOT continent-level ("Asia", "South America" etc.) — ad law is per-country,
 *  and a continent-wide ruleset would misrepresent jurisdictions with wildly different rules
 *  (EU gambling alone ranges from Italy/Latvia's near-total bans to minimal rules elsewhere).
 *  These four are the ones with stable, centrally-citable frameworks; add more deliberately,
 *  one researched country at a time — never a fabricated regional average. */
export type Jurisdiction = "us" | "eu" | "uk" | "ca";

export type RequirementKind =
  | "disclosure"
  /** The category itself may be illegal or heavily restricted here — not a phrase to add,
   *  a legality question to resolve before running the ad at all. Always shown, never
   *  scored pass/fail by adding text. */
  | "prohibition-notice";

export type ComplianceRequirement = {
  id: string;
  label: string;
  description: string;
  /** Citation — the platform policy or regulation this requirement reflects. */
  source: string;
  kind: RequirementKind;
  /** Any one pattern matching the ad's combined text satisfies this requirement.
   *  Empty = not machine-checkable (e.g. "get platform certification", or any
   *  prohibition-notice) — shown as an advisory reminder instead of a pass/fail. */
  patterns: RegExp[];
};

export type CategoryRules = {
  category: RegulatedCategory;
  jurisdiction: Jurisdiction;
  label: string;
  requirements: ComplianceRequirement[];
};

export type LegalComplianceResult = {
  category: RegulatedCategory;
  jurisdiction: Jurisdiction;
  satisfied: ComplianceRequirement[];
  missing: ComplianceRequirement[];
  advisories: ComplianceRequirement[];
  /** kind: "prohibition-notice" requirements — always surfaced, never satisfied by text. */
  prohibitions: ComplianceRequirement[];
};

/** OWNER: packages/ad-compliance — public API */
export type {
  RegulatedCategory,
  Jurisdiction,
  RequirementKind,
  ComplianceRequirement,
  CategoryRules,
  LegalComplianceResult,
} from "./types";
export { rulesForCategory, listRegulatedCategories, listJurisdictions } from "./rules/index";
export { checkLegalCompliance, type AdCopyText } from "./check-legal-compliance";

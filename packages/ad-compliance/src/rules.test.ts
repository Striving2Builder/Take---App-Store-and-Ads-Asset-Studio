/** OWNER: packages/ad-compliance — rule-checking smoke test (tsx runnable) */
import { checkLegalCompliance } from "./check-legal-compliance";
import { listRegulatedCategories, listJurisdictions } from "./rules/index";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const jurisdictions = listJurisdictions();
assert(jurisdictions.length === 4, `expected 4 jurisdictions, got ${jurisdictions.length}`);
for (const j of ["us", "eu", "uk", "ca"] as const) {
  assert(jurisdictions.includes(j), `missing jurisdiction ${j}`);
  const cats = listRegulatedCategories(j);
  assert(cats.length === 4, `${j} expected 4 categories, got ${cats.length}`);
  for (const c of cats) assert(c.requirements.length > 0, `${j}/${c.category} has no requirements`);
}

// none = no-op regardless of jurisdiction
const none = checkLegalCompliance("none", "us", { headline: "", description: "", legalLine: "" });
assert(none.missing.length === 0 && none.satisfied.length === 0 && none.prohibitions.length === 0, "none category should be a no-op");

// US gambling: empty legal line flags every checkable requirement as missing
const usGamblingEmpty = checkLegalCompliance("gambling", "us", { headline: "Bet now", description: "Big odds", legalLine: "" });
assert(usGamblingEmpty.missing.length === 3, `expected 3 missing US gambling requirements, got ${usGamblingEmpty.missing.length}`);
assert(usGamblingEmpty.prohibitions.length === 0, "US gambling should carry no prohibition notices");

// US gambling: compliant legal line satisfies all three checkable requirements
const usGamblingOk = checkLegalCompliance("gambling", "us", {
  headline: "Bet now",
  description: "Big odds",
  legalLine: "21+. Gambling problem? Call 1-800-GAMBLER. Bet responsibly.",
});
assert(usGamblingOk.missing.length === 0, `expected 0 missing US gambling requirements, got ${usGamblingOk.missing.length}`);
assert(usGamblingOk.satisfied.length === 3, `expected 3 satisfied US gambling requirements, got ${usGamblingOk.satisfied.length}`);

// EU gambling: no checkable requirements at all — always a prohibition-notice (fragmentation warning)
const euGambling = checkLegalCompliance("gambling", "eu", { headline: "Bet now", description: "", legalLine: "21+, GamCare, safer gambling" });
assert(euGambling.prohibitions.length === 1, `expected 1 EU gambling prohibition notice, got ${euGambling.prohibitions.length}`);
assert(euGambling.missing.length === 0 && euGambling.satisfied.length === 0, "EU gambling has no checkable requirements — text shouldn't change that");

// EU healthcare: DTC pharma ban is a prohibition-notice, not satisfiable by text
const euHealthcare = checkLegalCompliance("healthcare", "eu", {
  headline: "Feel better",
  description: "Side effects include drowsiness. See full safety information.",
  legalLine: "",
});
assert(euHealthcare.prohibitions.length === 1, "EU healthcare should always carry the DTC-ban prohibition notice");
assert(euHealthcare.prohibitions[0].id === "eu-healthcare-dtc-ban", "EU healthcare prohibition should be the DTC ban");

// EU finance: ESMA-style CFD warning is checkable
const euFinanceOk = checkLegalCompliance("finance", "eu", {
  headline: "Trade CFDs",
  description: "76% of retail CFD accounts lose money when trading with this provider.",
  legalLine: "",
});
assert(euFinanceOk.satisfied.some((r) => r.id === "eu-finance-cfd-risk-warning"), "EU finance CFD warning should be satisfied");

// UK finance: capital-at-risk requirement is deliberately non-checkable (FCA prescribes no fixed wording)
const ukFinance = checkLegalCompliance("finance", "uk", { headline: "Invest now", description: "", legalLine: "" });
assert(ukFinance.advisories.length === 2, `expected both UK finance requirements as advisories, got ${ukFinance.advisories.length}`);
assert(ukFinance.missing.length === 0, "UK finance should never show false 'missing' — there's no fixed wording to match");

// Canada healthcare: DTC ban with reminder/help-seeking exception is a prohibition-notice
const caHealthcare = checkLegalCompliance("healthcare", "ca", { headline: "Ask your doctor", description: "", legalLine: "" });
assert(caHealthcare.prohibitions.length === 1, "CA healthcare should carry the DTC-ban-with-exceptions prohibition notice");

// Canada gambling: Ontario-scoped helpline is checkable, endorser rule is a prohibition-notice
const caGamblingOk = checkLegalCompliance("gambling", "ca", {
  headline: "Bet in Ontario",
  description: "",
  legalLine: "Need help? Call ConnexOntario 1-866-531-2600.",
});
assert(caGamblingOk.satisfied.some((r) => r.id === "ca-on-gambling-helpline"), "CA Ontario helpline should be satisfied");
assert(caGamblingOk.prohibitions.some((r) => r.id === "ca-on-gambling-no-endorsers"), "CA gambling should carry the no-endorsers prohibition notice");

console.log("ad-compliance: rules PASS (4 jurisdictions × 4 categories)");

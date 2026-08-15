/**
 * OWNER: shared/truth — honesty markers for Real vs Partial vs Fake
 * Temporary until product features are actually wired. Do not remove quietly.
 */

export type TruthStatus = "real" | "partial" | "fake";

export type TruthMark = {
  /** CSS selector for an existing element to badge */
  sel: string;
  status: TruthStatus;
  /** Short reason shown in title tooltip */
  why: string;
  /** Optional: place badge before / after / as corner on the target */
  place?: "after" | "before" | "corner";
};

export const TRUTH_MARKS: TruthMark[] = [
  // Landing claim
  {
    sel: ".hero-sub",
    status: "partial",
    why: "iOS + Play + web + pack + palette + PNG ZIP; NLP/MP4 still limited",
    place: "after",
  },

  // Modes
  {
    sel: '[data-mode-pick="wizard"]',
    status: "partial",
    why: "Uses scan brief when available; frame copy still rule-based",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="template"]',
    status: "partial",
    why: "Uses library template framing + scan brief — not a full drag-drop editor",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="replicator"]',
    status: "partial",
    why: "Requires uploads; maps refs to frame rail — not pixel-perfect wireframe trace",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="slideshow"]',
    status: "partial",
    why: "Ordered PNG + MediaRecorder motion (~15s WebM/MP4 when supported)",
    place: "corner",
  },

  // Intake
  {
    sel: "#btn-scan",
    status: "real",
    why: "Live Apple/Play/OG + pack/palette; narrative from listing/Advanced or Missing — not invented",
    place: "after",
  },
  {
    sel: "#scan-locale",
    status: "real",
    why: "Locale switcher passes language/country into scan-api adapters",
    place: "after",
  },
  {
    sel: "#scan-receipt",
    status: "real",
    why: "Shows Captured vs Inferred + asset bin from last scan",
    place: "corner",
  },
  {
    sel: "#scan-hint",
    status: "real",
    why: "iOS + Play (scraper retry + HTML fallback) + OG; pack + palette wired",
    place: "after",
  },
  {
    sel: "#scan-sources",
    status: "real",
    why: "Optional marketing/competitor URLs merge via POST /scan/pack (primary wins)",
    place: "after",
  },
  {
    sel: '[data-panel-view="style"] .inspector-title',
    status: "partial",
    why: "Lock uses --project-accent on canvas; From scan when palette extracted",
    place: "after",
  },
  {
    sel: "#upload-strip",
    status: "partial",
    why: "Uploads merge into asset bin + palette + canvas; not full CV analysis",
    place: "corner",
  },
  {
    sel: "#f-competitors",
    status: "real",
    why: "Blur/scan syncs comma-separated URLs into Extra Sources competitor rows",
    place: "after",
  },
  {
    sel: "#advanced-panel",
    status: "real",
    why: "UX/tone/refs/donot/where/when shape brief → frames → store copy; session-persisted",
    place: "corner",
  },
  {
    sel: "#missing-box",
    status: "real",
    why: "Missing-field checks actually run",
    place: "after",
  },
  {
    sel: "#qty-control",
    status: "real",
    why: "Controls how many local concept sets are built",
    place: "after",
  },
  {
    sel: "#btn-generate",
    status: "partial",
    why: "Uses scan brief + Advanced; frame copy still rule-based (not creative AI)",
    place: "after",
  },

  // Generate / review
  {
    sel: "#infer-feed",
    status: "partial",
    why: "Shows Captured / Inferred / Missing honestly; still animated presentation",
    place: "corner",
  },  {
    sel: "#set-rail",
    status: "partial",
    why: "Sets are selectable; content is rule-based filler",
    place: "corner",
  },
  {
    sel: "#btn-regen-all",
    status: "partial",
    why: "Re-rolls local templates — not real creative AI",
    place: "after",
  },

  // Editor
  {
    sel: "#device-picker",
    status: "partial",
    why: "Picker works from seed catalog; shells are not real device assets yet",
    place: "after",
  },
  {
    sel: "#phone-mock",
    status: "partial",
    why: "Shows scan screenshots/icon when capture has assets; else CSS mock",
    place: "corner",
  },
  {
    sel: "#shot-headline",
    status: "real",
    why: "Editable copy syncs into session state",
    place: "after",
  },
  {
    sel: '[data-panel-view="copy"] .inspector-title',
    status: "partial",
    why: "Fields + char limits are real; starting values are placeholders",
    place: "after",
  },
  {
    sel: "#btn-add-copy",
    status: "fake",
    why: "Toast only — does not add a layer",
    place: "after",
  },
  {
    sel: "#btn-add-visual",
    status: "fake",
    why: "Toast only — does not add a visual",
    place: "after",
  },
  {
    sel: "#btn-save-template",
    status: "real",
    why: "Saves to localStorage",
    place: "after",
  },

  // Export
  {
    sel: "#export-presets",
    status: "partial",
    why: "Checklist recorded in ZIP manifest; frames always PNG-rendered",
    place: "corner",
  },
  {
    sel: "#btn-export",
    status: "partial",
    why: "PNG ZIP always; motion WebM/MP4 when Slideshow preset/mode — not App Store QA",
    place: "after",
  },
  {
    sel: "#btn-export-library",
    status: "real",
    why: "Exports template JSON from localStorage",
    place: "after",
  },
  {
    sel: "#validation-card",
    status: "partial",
    why: "Char/count checks run; notes PNG export size",
    place: "corner",
  },

  // Library
  {
    sel: ".library-layout .stage-label, #stage-library .stage-label",
    status: "partial",
    why: "Templates + local projects open; Use arms Template mode",
    place: "after",
  },
];

export const TRUTH_LABEL: Record<TruthStatus, string> = {
  real: "REAL",
  partial: "PARTIAL",
  fake: "FAKE",
};

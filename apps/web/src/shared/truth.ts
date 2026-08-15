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
    why: "Uses scan brief; multi-set concepts; frame copy still rule-based",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="template"]',
    status: "partial",
    why: "Applies generated grammar layouts or a library recipe; drag devices on the export slice — not extra layers; not LLM",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="replicator"]',
    status: "partial",
    why: "Maps competitor pack or uploads to a beat rail — structure only, not pixel-trace",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="slideshow"]',
    status: "partial",
    why: "Storyboard + editable dwells; MediaRecorder motion when supported",
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
    sel: "#template-arm",
    status: "partial",
    why: "Arms a library recipe + catalog device. Generate still builds a new layout; Apply library keeps the card.",
    place: "corner",
  },
  {
    sel: "#qty-control",
    status: "real",
    why: "Controls Wizard concept-set count or Template generated-layout count",
    place: "after",
  },
  {
    sel: "#btn-generate",
    status: "partial",
    why: "Scan brief + mode.run; Template Generate = grammar layouts (not LLM); copy still rule-based",
    place: "after",
  },

  // Generate / review
  {
    sel: "#infer-feed",
    status: "partial",
    why: "Shows Captured / Inferred / Missing honestly; still animated presentation",
    place: "corner",
  },
  {
    sel: "#set-rail",
    status: "partial",
    why: "Template layouts paint strip slices; Wizard thumbs are placeholders",
    place: "corner",
  },
  {
    sel: "#btn-regen-all",
    status: "partial",
    why: "Re-runs the armed mode. Template: new generateLayout seed. Refresh copy is a separate inspector action.",
    place: "after",
  },

  // Editor
  {
    sel: "#device-picker",
    status: "partial",
    why: "Catalog + TAKE SVG shell families (island/punch/fold/flip); not photoreal product photos",
    place: "after",
  },
  {
    sel: "#phone-mock",
    status: "partial",
    why: "Wizard / no-recipe copy edit. Layout recipes use #layout-stage (the export slice) instead",
    place: "corner",
  },
  {
    sel: "#layout-stage",
    status: "real",
    why: "Export slice canvas + overlay copy; drag/resize/rotate device slots; type is not double-painted",
    place: "after",
  },
  {
    sel: "#strip-preview",
    status: "real",
    why: "Joined strip rail shares paintStripSlice with export — bleed is a real world clip",
    place: "after",
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
    why: "Toast only — extra copy blocks are not a slot (device drag is real on #layout-stage)",
    place: "after",
  },
  {
    sel: "#btn-add-visual",
    status: "fake",
    why: "Toast only — extra visuals are not a slot (device drag is real on #layout-stage)",
    place: "after",
  },
  {
    sel: "#btn-save-template",
    status: "real",
    why: "Save as new, or Update armed user recipe; lockBrand stamps the palette on Generate",
    place: "after",
  },

  // Export
  {
    sel: "#export-presets",
    status: "partial",
    why: "Checked presets emit PNG at listed WxH; TikTok+motion adds 1080×1920 video; layered/bundle stay FAKE",
    place: "corner",
  },
  {
    sel: "#btn-export",
    status: "partial",
    why: "ZIP: store at catalog exportPx plus extra sizes from checked presets; layered/bundle skipped",
    place: "after",
  },
  {
    sel: "#btn-export-library",
    status: "real",
    why: "Exports template JSON from localStorage",
    place: "after",
  },
  {
    sel: "#catalog-wizard",
    status: "partial",
    why: "Propose→Review→Apply session catalog; evidence required; download pack for CLI publish — not live sync",
    place: "corner",
  },
  {
    sel: "#btn-device-preview",
    status: "real",
    why: "Opens Edit with stub set — no Generate required",
    place: "after",
  },
  {
    sel: "#validation-card",
    status: "partial",
    why: "Char/count checks; notes ZIP PNG count, catalog store WxH, skipped FAKE presets",
    place: "corner",
  },

  // Library
  {
    sel: ".library-layout .stage-label, #stage-library .stage-label",
    status: "partial",
    why: "Use arms Template mode; Refresh copy rewrites user cards (system cards: duplicate first)",
    place: "after",
  },
];

export const TRUTH_LABEL: Record<TruthStatus, string> = {
  real: "REAL",
  partial: "PARTIAL",
  fake: "FAKE",
};

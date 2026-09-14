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
    status: "real",
    why: "Opens Library. Use applies a store canvas (devices pre-placed). Scan stays on Wizard.",
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
    why: "Same stages as Wizard. Distinct only: 6 beats, dwellMs inspector, MediaRecorder when supported — not a separate destination",
    place: "corner",
  },
  {
    sel: '[data-mode-pick="ads"]',
    status: "partial",
    why: "Display/social/video units compose natively — video records the uploaded clip itself (MediaRecorder), not a re-recorded slideshow. Audio passthrough depends on browser captureStream support. Falls back to a labeled static frame only when no video is uploaded.",
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
    status: "real",
    why: "Shows when a Library look is armed. Wizard Generate applies that recipe (applyTemplate), not generateSets / generateLayout.",
    place: "corner",
  },
  {
    sel: "#qty-control",
    status: "real",
    why: "Controls Wizard concept-set count. Armed Library look uses the recipe’s frame count (one set).",
    place: "after",
  },
  {
    sel: "#btn-generate",
    status: "partial",
    why: "Scan brief + mode.run; Wizard with an armed Library look applies that recipe",
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
    why: "Re-runs the armed mode. Wizard + armed look re-applies the recipe. New layout is a Library action (grammar).",
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
    sel: "#store-target-control",
    status: "real",
    why: "iOS | Android swaps shell + device aspect on the same layout recipe, then re-export. Play sets over 8 frames warn — no silent trim. Armed Wizard Generate binds the shell from intake/brief.",
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
    why: "Export slice canvas. Geometric shells bake island / punch / side buttons from catalog hardware — not photoreal OEM photos.",
    place: "after",
  },
  {
    sel: "#strip-preview",
    status: "real",
    why: "Joined strip rail shares paintStripSlice with export — bleed is a real world clip",
    place: "after",
  },
  {
    sel: "#set-stage",
    status: "real",
    why: "Set view paints the store carousel via paintStripSlice (same as export); click a frame for Slice",
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
    status: "real",
    why: "Creates an ExtraSlot copy on the recipe; drag on #layout-stage; cap 6 per slice",
    place: "after",
  },
  {
    sel: "#copy-marks-row",
    status: "real",
    why: "**word** paints a pill, ++word++ an underline. Script face is this element only — store headline stays system-ui.",
    place: "after",
  },
  {
    sel: "#btn-add-visual",
    status: "real",
    why: "Creates an ExtraSlot visual (image or fill) on the recipe; not the world background",
    place: "after",
  },
  {
    sel: "#shape-row",
    status: "real",
    why: "Procedural blob/wave/star/dots/scribble shapes — not competitor art",
    place: "after",
  },
  {
    sel: "#widget-row",
    status: "real",
    why: "Rating / review / pills geometry. Numbers and names are sample until you type them — ZIP does not invent App Store ratings.",
    place: "after",
  },
  {
    sel: "#widget-fields-row",
    status: "real",
    why: "Edit selected proof element's score, label, quote, name, pills. Empty score paints an em dash.",
    place: "after",
  },
  {
    sel: "#type-band-row",
    status: "real",
    why: "Per-PNG type band (top/bottom/split/none). Recipe typeFamily is the default.",
    place: "after",
  },
  {
    sel: "#slice-rule-row",
    status: "real",
    why: "Add/remove/fan-3 devices on this PNG; landscape is this device in a portrait store file; mini screen is an element, not a DeviceInstance.",
    place: "after",
  },
  {
    sel: "#btn-strip-panorama",
    status: "real",
    why: "Sets BackgroundLayer image across n·W; isolated still paints per PNG (no fake join)",
    place: "after",
  },
  {
    sel: "#pos-preset-grid",
    status: "real",
    why: "Stamps selected device from PLACEMENT_PRESETS. Yaw/Pitch project a 2.5D shell (not OEM photos). Bleed next/prev is one device clipped across two store PNGs.",
    place: "after",
  },
  {
    sel: "#tilt-sliders-row",
    status: "real",
    why: "Yaw −35…35 and pitch −20…20 on the selected device. Same rotateXDeg/rotateYDeg as presets. Cheap warp, not WebGL.",
    place: "after",
  },
  {
    sel: "#device-fit-row",
    status: "real",
    why: "Sets DeviceInstance.fit, read by paint-devices.ts's screenBitmap() — the same value affects the live preview and the exported PNG. Cover crops to fill; Contain letterboxes.",
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
    status: "real",
    why: "Every listed preset emits real files at its listed WxH; TikTok+motion adds 1080×1920 video",
    place: "corner",
  },
  {
    sel: "#btn-export",
    status: "real",
    why: "ZIP: store at catalog exportPx plus extra sizes from checked presets",
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
    status: "real",
    why: "Browses a bundled, cited research pack shipped with the app (not a live scrape — copy says so). Add updates this browser’s catalog. Disk publish is Advanced / CLI.",
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
    status: "real",
    why: "Char/count checks; notes ZIP PNG count, catalog store WxH",
    place: "corner",
  },

  // Ads mode
  {
    sel: ".ads-thumb-grid",
    status: "partial",
    why: "Each thumbnail is paintAdFrame — a real composition at that unit's native WxH from the chosen wireframe, headline/CTA positioned for that shape. No logo upload exists yet: every unit falls back to an advertiser-initial mark. ZIP export uses the same painter.",
    place: "corner",
  },
  {
    sel: ".ads-compliance-checklist",
    status: "partial",
    why: "Real keyword checks against cited platform/regulator disclosure norms — 4 categories × 4 jurisdictions (US/EU/UK/Canada, the only ones the picker offers). Not legal advice, not NLP. EU/UK pharma and EU/CA alcohol/gambling correctly show as legality prohibition-notices (banned, or too fragmented per-country for one rule) rather than a fake pass/fail checklist. No other country is selectable yet — deliberately, rather than fabricating continent-wide rules. Never blocks export.",
    place: "corner",
  },
  {
    sel: ".ads-unit-grid",
    status: "real",
    why: "24 units (incl. named TikTok/Instagram/YouTube/Pinterest destinations, real duration + file-size limits per platform) across 10 shape families from @take/ad-unit-catalog. Toggle, then Regenerate to rebuild the set — matches every other mode's regen path.",
    place: "after",
  },

  // Library
  {
    sel: ".library-layout .stage-label, #stage-library .stage-label",
    status: "real",
    why: "Click the thumb to browse every slice. System cards are store-count canvases plus dual-store mobile geometry for the 20 refs (one card each; visible under Mobile / iOS / Android filters; Edit iOS|Android swaps the shell; photo plates empty until you drop an image). Use applies the look (or arms Wizard if you have not scanned).",
    place: "after",
  },
];

export const TRUTH_LABEL: Record<TruthStatus, string> = {
  real: "REAL",
  partial: "PARTIAL",
  fake: "FAKE",
};

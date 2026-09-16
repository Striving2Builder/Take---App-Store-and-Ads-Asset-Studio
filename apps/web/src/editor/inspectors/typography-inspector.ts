/** OWNER: editor/inspectors — display/body font pairing
 *  Applies to headline+kicker (display) and caption+CTA (body) in both the
 *  live DOM preview (CSS custom properties on #phone-mock, same pattern as
 *  applyProjectAccent) and the PNG export canvas (frame-render.ts,
 *  paint-strip-slice.ts read set.typography directly). */
import { currentSet } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";
import { FONT_OPTIONS, DEFAULT_TYPOGRAPHY, fontStack } from "../../shared/typography";

function applyProjectFonts(display: string, body: string) {
  // Recipe-driven (isolated/strip) sets relocate #shot-content into
  // #layout-stage, outside #phone-mock's subtree — root is the only
  // ancestor guaranteed to cover both live-canvas shapes.
  document.documentElement.style.setProperty("--project-font-display", fontStack(display));
  document.documentElement.style.setProperty("--project-font-body", fontStack(body));
}

function paintPreviews(display: string, body: string) {
  const dp = $("#type-preview-display") as HTMLElement | null;
  const bp = $("#type-preview-body") as HTMLElement | null;
  if (dp) dp.style.fontFamily = fontStack(display);
  if (bp) bp.style.fontFamily = fontStack(body);
}

/** Sync the two selects + previews to the active set's real typography —
 *  called whenever the editor renders so the panel never shows a stale pick. */
export function syncTypographyInspector() {
  const set = currentSet();
  const t = set?.typography || DEFAULT_TYPOGRAPHY;
  const displaySel = $("#edit-font-display") as HTMLSelectElement | null;
  const bodySel = $("#edit-font-body") as HTMLSelectElement | null;
  if (displaySel) displaySel.value = t.display;
  if (bodySel) bodySel.value = t.body;
  applyProjectFonts(t.display, t.body);
  paintPreviews(t.display, t.body);
}

export function bindTypographyInspector() {
  const displaySel = $("#edit-font-display") as HTMLSelectElement | null;
  const bodySel = $("#edit-font-body") as HTMLSelectElement | null;
  if (!displaySel || !bodySel) return;

  const validNames = new Set(FONT_OPTIONS.map((f) => f.name));

  function apply() {
    const set = currentSet();
    if (!set) return;
    const display = validNames.has(displaySel!.value) ? displaySel!.value : DEFAULT_TYPOGRAPHY.display;
    const body = validNames.has(bodySel!.value) ? bodySel!.value : DEFAULT_TYPOGRAPHY.body;
    set.typography = { display, body };
    applyProjectFonts(display, body);
    paintPreviews(display, body);
    scheduleLayoutPaint();
  }

  displaySel.addEventListener("change", apply);
  bodySel.addEventListener("change", apply);
}

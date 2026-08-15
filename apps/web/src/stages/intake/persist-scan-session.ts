/** OWNER: stages/intake — shared scan session persist (LS + selection + Advanced) */
import { saveScanSession } from "@take/storage";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { collectIntake } from "./intake.form";
import { getScanSources } from "./scan-sources";

export function persistScanSession(): void {
  try {
    const d = collectIntake();
    saveScanSession({
      lastScan: state.lastScan,
      lastPack: state.lastPack,
      scanPalette: state.scanPalette,
      sources: getScanSources(),
      appUrl: d.url,
      locale: d.locale,
      intakeName: d.name,
      intakeCategory: d.category,
      selectedShotIds: state.selectedShotIds,
      advanced: {
        audience: d.audience,
        positioning: d.positioning,
        narrative: d.narrative,
        where: d.where,
        when: d.when,
        ux: d.ux,
        tone: d.tone,
        refs: d.refs,
        donot: d.donot,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Session save failed";
    console.warn("[take] persistScanSession", msg);
    const hint = $("#scan-hint");
    if (hint) hint.textContent = `Could not save session: ${msg}`;
  }
}

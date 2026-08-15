/** OWNER: stages/intake — missing field guidance */
import { listLayoutTemplates } from "@take/storage";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { replicatorReady } from "../../modes/replicator/replicator-ready";
import { collectIntake } from "./intake.form";

export function updateMissing() {
  const d = collectIntake();
  const missing: string[] = [];

  if (d.mode === "replicator") {
    if (!replicatorReady(d.uploads)) missing.push("Competitor URL (Extra Sources) or upload refs");
  } else if (!d.url && d.uploads === 0) {
    missing.push("App URL or uploaded screenshots");
  }

  if (!d.name) missing.push("App name (helps titles & filenames)");
  if (!d.audience) missing.push("Audience (sharpens narrative)");
  if (!d.positioning && d.mode === "wizard") missing.push("Positioning (optional but powerful)");
  if (d.mode === "template" && !state.templateId && !listLayoutTemplates().length) {
    missing.push("Save or pick a library recipe");
  }

  const box = $("#missing-box") as HTMLElement | null;
  const list = $("#missing-list");
  if (!box || !list) return;

  if (missing.length) {
    box.hidden = false;
    list.innerHTML = missing.map((m) => `<li>${escapeHtml(m)}</li>`).join("");
  } else {
    box.hidden = true;
  }
}

export function bindMissingWatchers() {
  ["#app-url", "#f-name", "#f-audience", "#f-positioning", "#f-competitors"].forEach((sel) => {
    $(sel)?.addEventListener("input", updateMissing);
  });
}

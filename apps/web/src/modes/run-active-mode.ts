/** OWNER: modes — run the armed CreationMode with session context */
import { getMode, type ModeRunResult } from "@take/modes-sdk";
import { state } from "../app/app-state";
import { collectIntake } from "../stages/intake/intake.form";
import { selectedScreenshots } from "../stages/export/selected-shots";
import { replicatorReady } from "./replicator/replicator-ready";

export async function runActiveMode(): Promise<ModeRunResult> {
  const d = collectIntake();
  state.mode = d.mode;
  state.qty = d.qty;
  const mode = getMode(d.mode) || getMode("wizard");
  if (!mode) throw new Error("No creation mode registered");

  if (mode.id === "replicator" && !replicatorReady(d.uploads)) {
    throw new Error("Add a competitor URL (Extra Sources) or upload refs for Replicator");
  }
  if (mode.capabilities.needsUploads && d.uploads === 0) {
    throw new Error("Upload wireframe / screenshot refs required");
  }
  if (!state.lastScan?.brief) {
    const missing = mode.validateIntake(d);
    if (missing.length) throw new Error(missing[0]);
  }

  const priorBrief = state.lastScan?.brief
    ? {
        ...state.lastScan.brief,
        name: d.name || state.lastScan.brief.name,
        category: d.category || state.lastScan.brief.category,
        audience: d.audience || state.lastScan.brief.audience,
        positioning: d.positioning || state.lastScan.brief.positioning,
        narrative: d.narrative || state.lastScan.brief.narrative,
        where: d.where || state.lastScan.brief.where,
        when: d.when || state.lastScan.brief.when,
        tone: d.tone || state.lastScan.brief.tone || "",
        ux: d.ux || state.lastScan.brief.ux || "",
        refs: d.refs || state.lastScan.brief.refs || "",
        donot: d.donot || state.lastScan.brief.donot || "",
        style: d.style,
        platform: d.platform,
        locale: d.locale,
        goal: d.goal,
        mode: d.mode,
      }
    : undefined;

  const result = await mode.run(d, {
    priorBrief,
    seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
    lastPack: state.lastPack ?? undefined,
    templateId: state.templateId || undefined,
    deviceId: state.deviceId,
    orientation: state.orientation,
    shotCount: selectedScreenshots().length,
  });

  const inf = result.inference;
  result.inference = {
    ...inf,
    name: d.name || inf.name,
    category: d.category || inf.category,
    audience: d.audience || inf.audience,
    positioning: d.positioning || inf.positioning,
    narrative: d.narrative || inf.narrative,
    where: d.where || inf.where,
    when: d.when || inf.when,
    tone: d.tone || inf.tone || "",
    ux: d.ux || inf.ux || "",
    refs: d.refs || inf.refs || "",
    donot: d.donot || inf.donot || "",
    style: d.style,
    platform: d.platform,
    locale: d.locale,
    goal: d.goal,
    mode: d.mode,
  };
  return result;
}

export function applyModeRunResult(result: ModeRunResult): void {
  state.inference = result.inference;
  state.sets = result.sets || [];
  state.selectedSet = 0;
  state.activeFrame = 0;
  if (result.deviceId) {
    state.deviceId = result.deviceId;
    for (const set of state.sets) set.deviceId = result.deviceId;
  }
  if (result.orientation) state.orientation = result.orientation;
}

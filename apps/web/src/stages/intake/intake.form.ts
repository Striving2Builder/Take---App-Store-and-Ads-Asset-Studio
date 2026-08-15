/** OWNER: stages/intake — collect form values */
import type { ConversionGoal, CreationModeId, IntakeInput, Platform, VisualStyle } from "@take/core";
import { state } from "../../app/app-state";
import { $, $$ } from "../../shared/dom";
import { getSelectedLocale } from "./scan-locale";

export function collectIntake(): IntakeInput {
  const platform = ($$<HTMLInputElement>('input[name="platform"]:checked')[0]?.value ||
    "ios") as Platform;
  const mode = ($$<HTMLInputElement>('input[name="mode"]:checked')[0]?.value ||
    "wizard") as CreationModeId;

  return {
    url: ($("#app-url") as HTMLInputElement)?.value.trim() || "",
    platform,
    mode,
    qty: state.qty,
    name: ($("#f-name") as HTMLInputElement)?.value.trim() || "",
    category: ($("#f-category") as HTMLInputElement)?.value.trim() || "",
    audience: ($("#f-audience") as HTMLInputElement)?.value.trim() || "",
    locale: getSelectedLocale(),
    competitors: ($("#f-competitors") as HTMLInputElement)?.value.trim() || "",
    goal: (($("#f-goal") as HTMLSelectElement)?.value || "install") as ConversionGoal,
    style: (($("#f-style") as HTMLSelectElement)?.value || "realistic") as VisualStyle,
    positioning: ($("#f-positioning") as HTMLTextAreaElement)?.value.trim() || "",
    narrative: ($("#f-narrative") as HTMLTextAreaElement)?.value.trim() || "",
    where: ($("#f-where") as HTMLInputElement)?.value.trim() || "",
    when: ($("#f-when") as HTMLInputElement)?.value.trim() || "",
    ux: ($("#f-ux") as HTMLTextAreaElement)?.value.trim() || "",
    tone: ($("#f-tone") as HTMLTextAreaElement)?.value.trim() || "",
    refs: ($("#f-refs") as HTMLTextAreaElement)?.value.trim() || "",
    donot: ($("#f-donot") as HTMLTextAreaElement)?.value.trim() || "",
    uploads: state.uploads.length,
  };
}

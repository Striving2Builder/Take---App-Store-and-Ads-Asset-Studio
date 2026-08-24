/** OWNER: modes/wizard — review hint plugin (baseline contrast) */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { listLayoutTemplates } from "@take/storage";
import { escapeHtml } from "../../shared/escape";
import { state } from "../../app/app-state";

export const wizardReviewPlugin: ModeEditorPlugin = {
  id: "wizard-review",
  title: "Wizard",
  slot: "review",
  render(host) {
    const armed = listLayoutTemplates().find((t) => t.id === state.templateId);
    if (armed) {
      host.innerHTML = `<p class="hint tight">${escapeHtml(
        `Filling “${armed.name}” — scan shots land in this look’s device slots. Not a new grammar layout.`
      )}</p>`;
      return;
    }
    const n = state.sets.length;
    host.innerHTML = `<p class="hint tight">${escapeHtml(
      `${n} concept set${n === 1 ? "" : "s"} from the scan brief. Pick one, then edit on the shared canvas.`
    )}</p>`;
  },
};

/** OWNER: modes/wizard — review hint plugin (baseline contrast) */
import type { ModeEditorPlugin } from "@take/modes-sdk";
import { escapeHtml } from "../../shared/escape";
import { state } from "../../app/app-state";

export const wizardReviewPlugin: ModeEditorPlugin = {
  id: "wizard-review",
  title: "Wizard",
  slot: "review",
  render(host) {
    const n = state.sets.length;
    host.innerHTML = `<p class="hint tight">${escapeHtml(
      `${n} concept set${n === 1 ? "" : "s"} from the scan brief. Pick one, then edit on the shared canvas.`
    )}</p>`;
  },
};

/** OWNER: UX Shell — nav jump links (data-jump) */
import { showStage } from "../app/stage-machine";

export function bindNavJumps(root: ParentNode = document) {
  root.addEventListener("click", (e) => {
    const jump = (e.target as Element | null)?.closest?.("[data-jump]");
    if (!jump) return;
    e.preventDefault();
    showStage((jump as HTMLElement).dataset.jump || "landing");
  });
}

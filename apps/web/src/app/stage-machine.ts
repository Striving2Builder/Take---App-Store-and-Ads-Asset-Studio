/** OWNER: UX Shell — stage switching */
import { $$ } from "../shared/dom";
import { state } from "./app-state";

type StageHook = (name: string) => void;
const enterHooks: StageHook[] = [];

export function onStageEnter(hook: StageHook) {
  enterHooks.push(hook);
}

export function showStage(name: string) {
  state.stage = name;
  $$<HTMLElement>(".stage").forEach((el) => {
    const match = el.dataset.stage === name;
    el.hidden = !match;
    el.classList.toggle("is-active", match);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  enterHooks.forEach((h) => h(name));
}

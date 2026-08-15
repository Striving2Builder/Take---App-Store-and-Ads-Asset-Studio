/** OWNER: UX Shell — toast */
import { $ } from "../shared/dom";

let toastTimer: number | undefined;

export function toast(msg: string) {
  const toastEl = $("#toast") as HTMLElement | null;
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastEl.hidden = true;
  }, 2800);
}

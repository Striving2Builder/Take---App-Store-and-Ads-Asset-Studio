/** OWNER: editor/layers — layer visibility toggles */
import { $ } from "../../shared/dom";

export function bindLayerToggles() {
  $("#layer-list")?.addEventListener("change", (e) => {
    const input = (e.target as Element).closest("[data-layer]") as HTMLInputElement | null;
    if (!input) return;
    const layer = input.dataset.layer;
    const phone = $("#phone-mock") as HTMLElement | null;
    const content = $("#shot-content") as HTMLElement | null;
    // Shell off = hide bezel chrome only; screen content stays full
    if (layer === "shell" && phone) {
      phone.classList.toggle("shell-chrome-off", !input.checked);
    }
    if (layer === "type") {
      (["#shot-headline", "#shot-caption", "#shot-kicker"] as const).forEach((sel) => {
        const el = $(sel) as HTMLElement | null;
        if (el) el.style.visibility = input.checked ? "visible" : "hidden";
      });
    }
    if (layer === "ui") {
      const ui = $(".shot-ui-block") as HTMLElement | null;
      if (ui) ui.style.display = input.checked ? "block" : "none";
    }
    if (layer === "bg") {
      const screen = $("#phone-screen") as HTMLElement | null;
      const shot = screen?.querySelector(".scan-shot-fill") as HTMLElement | null;
      if (screen) screen.style.filter = input.checked ? "none" : "grayscale(0.8) brightness(0.7)";
      if (shot) shot.style.filter = input.checked ? "none" : "grayscale(0.8) brightness(0.7)";
    }
    if (layer === "badge" && content) {
      content.style.outline = input.checked ? "none" : "1px dashed transparent";
    }
  });
}

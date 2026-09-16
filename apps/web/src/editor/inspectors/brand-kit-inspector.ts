/** OWNER: editor/inspectors — persistent, cross-project brand kit
 *  A real localStorage-backed record (packages/storage's brand-kit.repo)
 *  independent of any one project — Save captures the active set's real
 *  palette/typography (+ the scanned icon, only when its URL will still
 *  resolve after a reload), Apply writes them back onto whichever set is
 *  currently open, in any project. */
import {
  loadBrandKit,
  saveBrandKit,
  isDurableLogoUrl,
  type BrandKit,
} from "@take/storage";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { toast } from "../../shell/toast";
import { scanIconUrl } from "../../stages/export/selected-shots";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";
import { applyProjectAccent, renderPalette } from "./style-inspector";
import { syncPaletteWheel } from "./palette-wheel";
import { syncTypographyInspector } from "./typography-inspector";

function metaLine(kit: BrandKit): string {
  const parts = [`Palette · ${kit.palette.length}`];
  parts.push(kit.typography ? "2 fonts" : "0 fonts");
  parts.push(kit.logoUrl ? "1 logo" : "0 logo");
  return parts.join(" · ");
}

export function syncBrandKitCard() {
  const kit = loadBrandKit();
  const nameEl = $("#brand-kit-name");
  const metaEl = $("#brand-kit-meta");
  const markEl = $("#brand-kit-mark") as HTMLElement | null;
  if (!kit) {
    if (nameEl) nameEl.textContent = "No kit saved yet";
    if (metaEl) metaEl.textContent = "Save current to start one";
    if (markEl) markEl.style.backgroundImage = "";
    return;
  }
  if (nameEl) nameEl.textContent = kit.name;
  if (metaEl) metaEl.textContent = metaLine(kit);
  if (markEl) markEl.style.backgroundImage = kit.logoUrl ? `url("${kit.logoUrl}")` : "";
}

function applyKit(kit: BrandKit) {
  const set = currentSet();
  if (!set) return;
  set.palette = [...kit.palette];
  applyProjectAccent(set.palette[0]);
  renderPalette(set.palette);
  syncPaletteWheel();
  if (kit.typography) {
    set.typography = { ...kit.typography };
    syncTypographyInspector();
  }
  scheduleLayoutPaint();
}

export function bindBrandKitInspector() {
  const saveBtn = $("#btn-save-brand-kit") as HTMLButtonElement | null;
  const applyBtn = $("#btn-apply-brand-kit") as HTMLButtonElement | null;
  if (!saveBtn || !applyBtn) return;

  saveBtn.addEventListener("click", () => {
    const set = currentSet();
    if (!set) {
      toast("Open a concept set in the editor first");
      return;
    }
    const icon = scanIconUrl();
    const kit = saveBrandKit({
      name: `${state.inference?.name || set.name || "Untitled"} kit`,
      palette: [...set.palette],
      typography: set.typography ? { ...set.typography } : undefined,
      logoUrl: icon && isDurableLogoUrl(icon) ? icon : undefined,
    });
    syncBrandKitCard();
    toast(`Saved brand kit · ${kit.palette.length}-color palette${kit.typography ? " + typography" : ""}`);
  });

  applyBtn.addEventListener("click", () => {
    const kit = loadBrandKit();
    if (!kit) {
      toast("No kit saved yet — save one first");
      return;
    }
    if (!currentSet()) {
      toast("Open a concept set in the editor first");
      return;
    }
    applyKit(kit);
    toast(`Applied brand kit · ${kit.name}`);
  });
}

/** OWNER: editor/inspectors — palette + style family ONLY (not devices) */
import type { CapturedPalette } from "@take/scan-client";
import { currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { toast } from "../../shell/toast";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";
import { generatePalette, rotateHue } from "../../shared/palette-gen";
import { relativeLuminance, contrastGrade } from "../../shared/contrast-ink";

const GRADE_LABEL = { AAA: "AAA", AA: "AA", "AA-LARGE": "AA·L", LOW: "LOW" } as const;

/** Brand accent for the phone canvas only — never overwrite global --signal. */
export function applyProjectAccent(hex: string) {
  const phone = $("#phone-mock") as HTMLElement | null;
  if (phone) {
    phone.style.setProperty("--project-accent", hex);
  } else {
    // Editor not mounted yet — stash on root until renderEditor applies to phone
    document.documentElement.style.setProperty("--project-accent", hex);
  }
}

export function renderPalette(colors: string[]) {
  const host = $("#palette");
  if (!host) return;
  host.innerHTML = colors
    .map((c, i) => {
      const ink = relativeLuminance(c) > 0.5 ? "#14151b" : "#ffffff";
      const badge = contrastGrade(c, ink);
      return `<button type="button" class="swatch ${i === 0 ? "is-locked" : ""}" data-swatch="${i}" style="background:${c}" title="${c} · contrast ${badge.ratio.toFixed(1)}:1" aria-label="Color ${c}"><span class="swatch-badge" style="color:${ink}">${GRADE_LABEL[badge.grade]}</span></button>`;
    })
    .join("");
}

export function refreshScanPaletteSlot() {
  const slot = $("#scan-palette-slot") as HTMLElement | null;
  if (!slot) return;
  const pal = state.scanPalette;
  if (!pal?.swatches?.length) {
    slot.hidden = true;
    slot.innerHTML = "";
    return;
  }
  slot.hidden = false;
  slot.innerHTML = `
    <p class="mono scan-palette-label">FROM SCAN <span class="truth-badge prov-captured">CAPTURED</span></p>
    <div class="palette scan-from-palette">
      ${pal.swatches
        .map(
          (s, i) =>
            `<button type="button" class="swatch" data-apply-scan-swatch="${i}" style="background:${s.hex}" title="${s.hex}" aria-label="${s.hex}"></button>`
        )
        .join("")}
    </div>
    <button type="button" class="btn ghost small" id="btn-use-scan-palette">Use scan palette on set</button>
  `;
}

function applyScanPaletteToSet(pal: CapturedPalette) {
  const set = currentSet();
  if (!set) {
    toast("Open a concept set in the editor first");
    return;
  }
  const colors = pal.swatches.map((s) => s.hex);
  if (!colors.length) return;
  set.palette = colors;
  applyProjectAccent(colors[0]);
  renderPalette(set.palette);
  refreshScanPaletteSlot();
  scheduleLayoutPaint();
  toast(`Scan palette applied · ${colors[0]}`);
}

export function bindStyleInspector() {
  document.addEventListener("click", (e) => {
    const t = e.target as Element;

    const fromScan = t.closest?.("[data-apply-scan-swatch]") as HTMLElement | null;
    if (fromScan && state.scanPalette) {
      const i = Number(fromScan.dataset.applyScanSwatch);
      const sw = state.scanPalette.swatches[i];
      if (!sw) return;
      const set = currentSet();
      if (set) {
        set.palette = [sw.hex, ...set.palette.filter((c) => c !== sw.hex)];
        renderPalette(set.palette);
        scheduleLayoutPaint();
      }
      applyProjectAccent(sw.hex);
      toast(`Canvas accent · ${sw.hex}`);
      return;
    }

    if (t.closest?.("#btn-use-scan-palette") && state.scanPalette) {
      applyScanPaletteToSet(state.scanPalette);
      return;
    }

    if (t.closest?.("#btn-generate-palette")) {
      const set = currentSet();
      if (!set) {
        toast("Open a concept set in the editor first");
        return;
      }
      const currentAccent = set.palette[0] || "#3e5ac4";
      // A real, non-trivial rotation each click (40-140°) — a genuinely
      // different generated direction, not a re-roll of the same hue.
      const nextSeed = rotateHue(currentAccent, 40 + Math.random() * 100);
      set.palette = generatePalette(nextSeed);
      applyProjectAccent(set.palette[0]);
      renderPalette(set.palette);
      scheduleLayoutPaint();
      toast(`New palette generated · ${set.palette[0]}`);
      return;
    }

    const receiptSwatch = t.closest?.("[data-scan-swatch]") as HTMLElement | null;
    if (receiptSwatch?.dataset.scanSwatch) {
      applyProjectAccent(receiptSwatch.dataset.scanSwatch);
      toast(`Canvas accent · ${receiptSwatch.dataset.scanSwatch}`);
      return;
    }

    const swatch = t.closest?.("[data-swatch]") as HTMLElement | null;
    if (!swatch) return;
    const set = currentSet();
    if (!set) return;
    const i = Number(swatch.dataset.swatch);
    const color = set.palette[i];
    set.palette = [color, ...set.palette.filter((_, idx) => idx !== i)];
    applyProjectAccent(color);
    renderPalette(set.palette);
    scheduleLayoutPaint();
    toast(`Brand color locked · ${color}`);
  });
}

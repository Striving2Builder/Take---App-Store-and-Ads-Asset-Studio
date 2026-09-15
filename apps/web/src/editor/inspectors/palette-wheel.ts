/** OWNER: editor/inspectors — open-ended palette wheel
 *  Direct hue/saturation pointer input + a lightness slider, feeding the
 *  exact same generatePalette() harmony math the "Generate new palette"
 *  button already runs — this replaces "only re-roll a random hue" with
 *  "pick any hue", it doesn't add a second palette system. */
import { currentSet } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { scheduleLayoutPaint } from "../layout/layout-live-paint";
import { toast } from "../../shell/toast";
import { generatePalette, hexToHsl, hslToHex, type HSL } from "../../shared/palette-gen";
import { applyProjectAccent, renderPalette } from "./style-inspector";

const WHEEL_SIZE = 120;
const RADIUS = WHEEL_SIZE / 2;
const FALLBACK_HSL: HSL = { h: 224, s: 0.6, l: 0.5 };

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hueSatFromPoint(x: number, y: number): { h: number; s: number } {
  const dx = x - RADIUS;
  const dy = y - RADIUS;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const s = clamp(dist / RADIUS, 0, 1);
  const h = (((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360;
  return { h, s };
}

function pointFromHueSat(h: number, s: number): { x: number; y: number } {
  const rad = (h * Math.PI) / 180;
  const dist = s * RADIUS;
  return { x: RADIUS + Math.cos(rad) * dist, y: RADIUS + Math.sin(rad) * dist };
}

function currentHsl(): HSL {
  const seed = currentSet()?.palette?.[0];
  return seed ? hexToHsl(seed) : FALLBACK_HSL;
}

function paintPin(hsl: HSL) {
  const pin = $("#palette-wheel-pin") as HTMLElement | null;
  if (!pin) return;
  const { x, y } = pointFromHueSat(hsl.h, hsl.s);
  pin.style.left = `${x}px`;
  pin.style.top = `${y}px`;
}

function paintLightness(hsl: HSL) {
  const slider = $("#palette-lightness") as HTMLInputElement | null;
  const val = $("#palette-lightness-val");
  const pct = Math.round(hsl.l * 100);
  if (slider) slider.value = String(pct);
  if (val) val.textContent = `${pct}%`;
}

/** Reposition the wheel pin + lightness slider to match the active set's
 *  real current accent. Call whenever the Style panel (re)renders so the
 *  wheel never shows a stale or arbitrary position. */
export function syncPaletteWheel() {
  if (!currentSet()?.palette?.length) return;
  const hsl = currentHsl();
  paintPin(hsl);
  paintLightness(hsl);
}

function applyFromHsl(hsl: HSL) {
  const set = currentSet();
  if (!set) return;
  set.palette = generatePalette(hslToHex(hsl));
  applyProjectAccent(set.palette[0]);
  renderPalette(set.palette);
  scheduleLayoutPaint();
}

export function bindPaletteWheel() {
  const wheel = $("#palette-wheel") as HTMLElement | null;
  const slider = $("#palette-lightness") as HTMLInputElement | null;
  if (!wheel || !slider) return;

  let dragging = false;

  function pickAt(clientX: number, clientY: number) {
    if (!currentSet()) return;
    const rect = wheel!.getBoundingClientRect();
    const { h, s } = hueSatFromPoint(clientX - rect.left, clientY - rect.top);
    const hsl: HSL = { h, s, l: currentHsl().l };
    paintPin(hsl);
    applyFromHsl(hsl);
  }

  wheel.addEventListener("pointerdown", (e) => {
    if (!currentSet()) {
      toast("Open a concept set in the editor first");
      return;
    }
    dragging = true;
    wheel.setPointerCapture(e.pointerId);
    pickAt(e.clientX, e.clientY);
  });
  wheel.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pickAt(e.clientX, e.clientY);
  });
  wheel.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    wheel.releasePointerCapture(e.pointerId);
    const accent = currentSet()?.palette?.[0];
    if (accent) toast(`Palette updated · ${accent}`);
  });

  slider.addEventListener("input", () => {
    if (!currentSet()) return;
    const { h, s } = currentHsl();
    const l = Number(slider.value) / 100;
    const val = $("#palette-lightness-val");
    if (val) val.textContent = `${slider.value}%`;
    applyFromHsl({ h, s, l });
  });
}

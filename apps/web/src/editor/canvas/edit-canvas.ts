/** OWNER: editor/canvas — contenteditable sync + frame render + scan assets */
import { FRAME_ROLES } from "@take/core";
import { currentFrame, currentSet, state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { renderMetaFields } from "../inspectors/copy-inspector";
import { applyProjectAccent, renderPalette, refreshScanPaletteSlot } from "../inspectors/style-inspector";
import { goalCta } from "../../modes/wizard/copy-builder";
import { toast } from "../../shell/toast";

export function syncFrameFromDom() {
  const frame = currentFrame();
  if (!frame) return;
  frame.kicker = ($("#shot-kicker")?.textContent || "").trim();
  frame.headline = ($("#shot-headline")?.textContent || "").trim();
  frame.caption = ($("#shot-caption")?.textContent || "").trim();
}

function scanShotUrl(frameIndex: number): string | null {
  const all =
    state.lastScan?.capture?.assets?.filter((a) => a.kind === "screenshot") || [];
  const shots = state.selectedShotIds.length
    ? all.filter((a) => state.selectedShotIds.includes(a.id))
    : all;
  if (!shots.length) return null;
  return shots[frameIndex % shots.length]?.url || null;
}

function scanIconUrl(): string | null {
  return state.lastScan?.capture?.assets?.find((a) => a.kind === "icon")?.url || null;
}

function applyCanvasAssets(frameIndex: number) {
  const screen = $("#phone-screen") as HTMLElement | null;
  const content = $("#shot-content") as HTMLElement | null;
  if (!screen || !content) return;

  const shot = scanShotUrl(frameIndex);
  const icon = scanIconUrl();

  if (shot) {
    screen.style.backgroundImage = `linear-gradient(180deg, rgba(12,13,16,0.55) 0%, rgba(12,13,16,0.75) 100%), url("${shot}")`;
    screen.style.backgroundSize = "cover";
    screen.style.backgroundPosition = "center";
    screen.dataset.hasScanShot = "1";
    content.classList.add("has-scan-shot");
  } else {
    screen.style.backgroundImage = "";
    screen.style.backgroundSize = "";
    screen.style.backgroundPosition = "";
    delete screen.dataset.hasScanShot;
    content.classList.remove("has-scan-shot");
  }

  let badge = content.querySelector(".scan-icon-badge") as HTMLImageElement | null;
  if (icon) {
    if (!badge) {
      badge = document.createElement("img");
      badge.className = "scan-icon-badge";
      badge.alt = "App icon";
      badge.referrerPolicy = "no-referrer";
      content.prepend(badge);
    }
    badge.src = icon;
    badge.hidden = false;
  } else if (badge) {
    badge.hidden = true;
  }
}

export function renderEditor() {
  const set = currentSet();
  if (!set) return;

  const list = $("#frame-list");
  if (list) {
    list.innerHTML = set.frames
      .map(
        (f, i) => `<li>
        <button type="button" class="${i === state.activeFrame ? "is-active" : ""}" data-frame="${i}">
          <span>${String(i + 1).padStart(2, "0")} ${escapeHtml(f.role)}</span>
        </button>
      </li>`
      )
      .join("");
  }

  const frame = currentFrame();
  if (!frame) return;
  const label = $("#canvas-label");
  if (label) label.textContent = `FRAME ${String(frame.index + 1).padStart(2, "0")} · ${frame.role}`;
  const k = $("#shot-kicker");
  const h = $("#shot-headline");
  const c = $("#shot-caption");
  if (k) k.textContent = frame.kicker;
  if (h) h.textContent = frame.headline;
  if (c) c.textContent = frame.caption;

  applyCanvasAssets(state.activeFrame);
  applyProjectAccent(set.palette[0]);
  renderMetaFields(set.copy);
  renderPalette(set.palette);
  refreshScanPaletteSlot();
  const styleSel = $("#edit-style") as HTMLSelectElement | null;
  if (styleSel) styleSel.value = set.style;
  const locale = $("#export-locale");
  if (locale) locale.textContent = state.inference?.locale || "en-US";
}

export function addFrame() {
  const set = currentSet();
  if (!set) return;
  if (set.frames.length >= 12) {
    toast("Max 12 frames in a sequence");
    return;
  }
  const i = set.frames.length;
  const role = FRAME_ROLES[i] || "EXTRA";
  set.frames.push({
    id: `f-new-${Date.now()}`,
    index: i,
    role,
    kicker: `${String(i + 1).padStart(2, "0")} · ${role}`,
    headline: "New beat",
    caption: "Edit this frame",
    cta: goalCta(state.inference?.goal || "install"),
  });
  state.activeFrame = i;
  renderEditor();
  toast("Frame added");
}

export function removeFrame() {
  const set = currentSet();
  if (!set || set.frames.length <= 1) {
    toast("Keep at least one frame");
    return;
  }
  set.frames.splice(state.activeFrame, 1);
  set.frames.forEach((f, i) => {
    f.index = i;
    f.kicker = `${String(i + 1).padStart(2, "0")} · ${f.role}`;
  });
  state.activeFrame = Math.min(state.activeFrame, set.frames.length - 1);
  renderEditor();
  toast("Frame removed");
}

export function regenFrame() {
  const frame = currentFrame();
  if (!frame) return;
  const alts = [
    "A sharper cut",
    "One honest beat",
    "Less chrome. More signal.",
    "Proof over polish",
    "Open. Act. Leave.",
  ];
  frame.headline = alts[Math.floor(Math.random() * alts.length)];
  frame.caption = state.inference?.value || frame.caption;
  renderEditor();
  toast("Frame regenerated");
}

/** OWNER: stages/intake — Ads mode ad-unit picker, surfaced before Generate (not just post-Generate) */
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { unitCheckboxesHtml, bindUnitCheckboxes } from "../../modes/ads/ads.plugin";

const SCAN_HINT_DEFAULT =
  "Paste an App Store, Play, or marketing URL, then hit Scan. Optional marketing/competitor URLs merge into one pack (primary wins). Palette extracts from icon when available.";
const SCAN_HINT_ADS =
  "Optional for Ads — seeds headline copy and palette from a URL. The real input is your upload below plus the ad units on the right.";

function renderPicker(): void {
  const body = $("#ads-unit-picker-body");
  if (!body) return;
  body.innerHTML = unitCheckboxesHtml();
  bindUnitCheckboxes(body);
}

export function syncAdsIntakeUi(): void {
  const isAds = state.mode === "ads";
  document.body.classList.toggle("is-ads-intake", isAds);

  const videoTile = $("#upload-video-tile") as HTMLElement | null;
  if (videoTile) videoTile.hidden = !isAds;

  const fieldset = $("#ads-unit-picker") as HTMLElement | null;
  if (fieldset) {
    fieldset.hidden = !isAds;
    if (isAds) renderPicker();
  }

  const pip1 = document.querySelector('.progress-pips [data-pip="1"]');
  if (pip1) pip1.textContent = isAds ? "Upload" : "Scan";

  const hint = $("#scan-hint");
  if (hint) hint.textContent = isAds ? SCAN_HINT_ADS : SCAN_HINT_DEFAULT;

  const primary = document.querySelector(".intake-primary");
  primary?.classList.toggle("url-secondary", isAds);

  const scanBtn = $("#btn-scan") as HTMLButtonElement | null;
  if (scanBtn) scanBtn.textContent = isAds ? "Scan (optional)" : "Scan";
}

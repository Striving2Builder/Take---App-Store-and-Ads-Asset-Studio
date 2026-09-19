/** OWNER: stages/intake — locale switcher for Scan */
import { LOCALE_PRESETS, LOCALE_REGIONS, findLocalePreset } from "@take/scan-client";
import { escapeHtml } from "../../shared/escape";
import { $ } from "../../shared/dom";

const STORAGE_KEY = "take.scan.locale";

export function getSelectedLocale(): string {
  const sel = $("#scan-locale") as HTMLSelectElement | null;
  if (sel?.value) return sel.value;
  try {
    return localStorage.getItem(STORAGE_KEY) || "en-US";
  } catch {
    return "en-US";
  }
}

export function mountLocaleSwitcher() {
  const sel = $("#scan-locale") as HTMLSelectElement | null;
  if (!sel) return;

  let saved = "en-US";
  try {
    saved = localStorage.getItem(STORAGE_KEY) || "en-US";
  } catch {
    /* ignore */
  }

  sel.innerHTML = LOCALE_REGIONS.map((region) => {
    const opts = LOCALE_PRESETS.filter((p) => p.region === region)
      .map((p) => `<option value="${p.locale}">${escapeHtml(p.label)}</option>`)
      .join("");
    return `<optgroup label="${escapeHtml(region)}">${opts}</optgroup>`;
  }).join("");

  const preset = findLocalePreset(saved);
  sel.value = preset.locale;

  sel.addEventListener("change", () => {
    try {
      localStorage.setItem(STORAGE_KEY, sel.value);
    } catch {
      /* ignore */
    }
  });
}

export function localePartsForScan() {
  const preset = findLocalePreset(getSelectedLocale());
  return {
    locale: preset.locale,
    language: preset.language,
    country: preset.country,
  };
}

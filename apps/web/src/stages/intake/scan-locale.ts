/** OWNER: stages/intake — locale switcher for Scan */
import { LOCALE_PRESETS, findLocalePreset } from "@take/scan-client";
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

  sel.innerHTML = LOCALE_PRESETS.map(
    (p) => `<option value="${p.locale}">${p.label}</option>`
  ).join("");

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

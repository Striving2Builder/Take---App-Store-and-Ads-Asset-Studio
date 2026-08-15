/** OWNER: services/scan-api/locale — parse locale + apply to store params */
export type LocaleParts = {
  locale: string;
  language: string;
  country: string;
};

/** en-US → { language: en, country: us } */
export function parseLocale(raw?: string): LocaleParts {
  const locale = (raw || "en-US").trim() || "en-US";
  const [lang, region] = locale.split(/[-_]/);
  const language = (lang || "en").toLowerCase();
  const country = (region || "US").toLowerCase();
  return { locale: `${language}-${country.toUpperCase()}`, language, country };
}

/** OWNER: packages/scan-client — locale presets for Scan switcher */
export type LocalePreset = {
  id: string;
  label: string;
  locale: string;
  language: string;
  country: string;
};

export const LOCALE_PRESETS: LocalePreset[] = [
  { id: "en-US", label: "English · United States", locale: "en-US", language: "en", country: "us" },
  { id: "en-GB", label: "English · United Kingdom", locale: "en-GB", language: "en", country: "gb" },
  { id: "es-MX", label: "Español · México", locale: "es-MX", language: "es", country: "mx" },
  { id: "es-ES", label: "Español · España", locale: "es-ES", language: "es", country: "es" },
  { id: "pt-BR", label: "Português · Brasil", locale: "pt-BR", language: "pt", country: "br" },
  { id: "fr-FR", label: "Français · France", locale: "fr-FR", language: "fr", country: "fr" },
  { id: "de-DE", label: "Deutsch · Deutschland", locale: "de-DE", language: "de", country: "de" },
  { id: "ja-JP", label: "日本語 · 日本", locale: "ja-JP", language: "ja", country: "jp" },
  { id: "ko-KR", label: "한국어 · 한국", locale: "ko-KR", language: "ko", country: "kr" },
  { id: "zh-CN", label: "中文 · 中国", locale: "zh-CN", language: "zh", country: "cn" },
  { id: "zh-TW", label: "中文 · 台灣", locale: "zh-TW", language: "zh", country: "tw" },
  { id: "hi-IN", label: "हिन्दी · भारत", locale: "hi-IN", language: "hi", country: "in" },
];

export function findLocalePreset(idOrLocale: string): LocalePreset {
  return (
    LOCALE_PRESETS.find((p) => p.id === idOrLocale || p.locale === idOrLocale) ||
    LOCALE_PRESETS[0]
  );
}

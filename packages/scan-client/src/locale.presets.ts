/** OWNER: packages/scan-client — locale presets for Scan switcher
 *  Every real independent country in 4 regions (North America, Europe,
 *  South America, Asia), one entry per country x each of its real official
 *  languages with a standard ISO 639-1 code — generated from the
 *  `world-countries` dataset (independent sovereign states, real ISO
 *  region/subregion/language/cca2 fields) plus Node's built-in
 *  Intl.DisplayNames for native-script labels (both real, checkable data
 *  sources — not hand-picked "top markets" and not hand-typed
 *  translations). Regenerate with `node scripts/gen-locale-presets.mjs`.
 *
 *  Known, deliberate scope notes (ask before "fixing" these silently):
 *  - "North America" here is the strict geographic subregion (US, Canada,
 *    Mexico only) — Central America and the Caribbean aren't covered by
 *    any of the 4 named regions, so they're excluded, not folded in.
 *  - "Asia" is the full UN-defined continent, which includes Western Asia
 *    (the Middle East) and Central Asia, not just East/South Asia.
 *  - Minority/regional official languages without a standard ISO 639-1
 *    code (Swiss German, Bavarian, Sami, Aramaic, Aymara, Tetum, Dhivehi,
 *    Dzongkha, Dari, Central Kurdish, Montenegrin) are left out — an
 *    ISO-coverage fact, not a relevance judgment.
 *  - Every listed country is real per world-countries; not every one
 *    necessarily has a live App Store/Play storefront (e.g. sanctioned
 *    territories) — the scan backend already handles that honestly by
 *    surfacing a real "no results" error, not a fake success.
 */
export type Region = "North America" | "Europe" | "South America" | "Asia";

export type LocalePreset = {
  id: string;
  label: string;
  locale: string;
  language: string;
  country: string;
  region: Region;
};

export const LOCALE_REGIONS: Region[] = ["North America", "Europe", "South America", "Asia"];

export const LOCALE_PRESETS: LocalePreset[] = [
  // North America
  { id: "en-US", label: "English · United States", locale: "en-US", language: "en", country: "us", region: "North America" },
  { id: "en-CA", label: "English · Canada", locale: "en-CA", language: "en", country: "ca", region: "North America" },
  { id: "fr-CA", label: "français · Canada", locale: "fr-CA", language: "fr", country: "ca", region: "North America" },
  { id: "es-MX", label: "español · México", locale: "es-MX", language: "es", country: "mx", region: "North America" },
  // Europe
  { id: "sq-AL", label: "shqip · Shqipëri", locale: "sq-AL", language: "sq", country: "al", region: "Europe" },
  { id: "ca-AD", label: "català · Andorra", locale: "ca-AD", language: "ca", country: "ad", region: "Europe" },
  { id: "be-BY", label: "беларуская · Беларусь", locale: "be-BY", language: "be", country: "by", region: "Europe" },
  { id: "ru-BY", label: "русский · Беларусь", locale: "ru-BY", language: "ru", country: "by", region: "Europe" },
  { id: "de-BE", label: "Deutsch · Belgien", locale: "de-BE", language: "de", country: "be", region: "Europe" },
  { id: "fr-BE", label: "français · Belgique", locale: "fr-BE", language: "fr", country: "be", region: "Europe" },
  { id: "nl-BE", label: "Nederlands · België", locale: "nl-BE", language: "nl", country: "be", region: "Europe" },
  { id: "bs-BA", label: "bosanski · Bosna i Hercegovina", locale: "bs-BA", language: "bs", country: "ba", region: "Europe" },
  { id: "hr-BA", label: "hrvatski · Bosna i Hercegovina", locale: "hr-BA", language: "hr", country: "ba", region: "Europe" },
  { id: "sr-BA", label: "српски · Босна и Херцеговина", locale: "sr-BA", language: "sr", country: "ba", region: "Europe" },
  { id: "bg-BG", label: "български · България", locale: "bg-BG", language: "bg", country: "bg", region: "Europe" },
  { id: "hr-HR", label: "hrvatski · Hrvatska", locale: "hr-HR", language: "hr", country: "hr", region: "Europe" },
  { id: "el-CY", label: "Ελληνικά · Κύπρος", locale: "el-CY", language: "el", country: "cy", region: "Europe" },
  { id: "tr-CY", label: "Türkçe · Kıbrıs", locale: "tr-CY", language: "tr", country: "cy", region: "Europe" },
  { id: "cs-CZ", label: "čeština · Česko", locale: "cs-CZ", language: "cs", country: "cz", region: "Europe" },
  { id: "sk-CZ", label: "slovenčina · Česko", locale: "sk-CZ", language: "sk", country: "cz", region: "Europe" },
  { id: "da-DK", label: "dansk · Danmark", locale: "da-DK", language: "da", country: "dk", region: "Europe" },
  { id: "et-EE", label: "eesti · Eesti", locale: "et-EE", language: "et", country: "ee", region: "Europe" },
  { id: "fi-FI", label: "suomi · Suomi", locale: "fi-FI", language: "fi", country: "fi", region: "Europe" },
  { id: "sv-FI", label: "svenska · Finland", locale: "sv-FI", language: "sv", country: "fi", region: "Europe" },
  { id: "fr-FR", label: "français · France", locale: "fr-FR", language: "fr", country: "fr", region: "Europe" },
  { id: "de-DE", label: "Deutsch · Deutschland", locale: "de-DE", language: "de", country: "de", region: "Europe" },
  { id: "el-GR", label: "Ελληνικά · Ελλάδα", locale: "el-GR", language: "el", country: "gr", region: "Europe" },
  { id: "hu-HU", label: "magyar · Magyarország", locale: "hu-HU", language: "hu", country: "hu", region: "Europe" },
  { id: "is-IS", label: "íslenska · Ísland", locale: "is-IS", language: "is", country: "is", region: "Europe" },
  { id: "en-IE", label: "English · Ireland", locale: "en-IE", language: "en", country: "ie", region: "Europe" },
  { id: "ga-IE", label: "Gaeilge · Éire", locale: "ga-IE", language: "ga", country: "ie", region: "Europe" },
  { id: "it-IT", label: "italiano · Italia", locale: "it-IT", language: "it", country: "it", region: "Europe" },
  { id: "lv-LV", label: "latviešu · Latvija", locale: "lv-LV", language: "lv", country: "lv", region: "Europe" },
  { id: "de-LI", label: "Deutsch · Liechtenstein", locale: "de-LI", language: "de", country: "li", region: "Europe" },
  { id: "lt-LT", label: "lietuvių · Lietuva", locale: "lt-LT", language: "lt", country: "lt", region: "Europe" },
  { id: "de-LU", label: "Deutsch · Luxemburg", locale: "de-LU", language: "de", country: "lu", region: "Europe" },
  { id: "fr-LU", label: "français · Luxembourg", locale: "fr-LU", language: "fr", country: "lu", region: "Europe" },
  { id: "lb-LU", label: "Lëtzebuergesch · Lëtzebuerg", locale: "lb-LU", language: "lb", country: "lu", region: "Europe" },
  { id: "en-MT", label: "English · Malta", locale: "en-MT", language: "en", country: "mt", region: "Europe" },
  { id: "mt-MT", label: "Malti · Malta", locale: "mt-MT", language: "mt", country: "mt", region: "Europe" },
  { id: "ro-MD", label: "română · Republica Moldova", locale: "ro-MD", language: "ro", country: "md", region: "Europe" },
  { id: "fr-MC", label: "français · Monaco", locale: "fr-MC", language: "fr", country: "mc", region: "Europe" },
  { id: "nl-NL", label: "Nederlands · Nederland", locale: "nl-NL", language: "nl", country: "nl", region: "Europe" },
  { id: "mk-MK", label: "македонски · Северна Македонија", locale: "mk-MK", language: "mk", country: "mk", region: "Europe" },
  { id: "nb-NO", label: "norsk bokmål · Norge", locale: "nb-NO", language: "nb", country: "no", region: "Europe" },
  { id: "pl-PL", label: "polski · Polska", locale: "pl-PL", language: "pl", country: "pl", region: "Europe" },
  { id: "pt-PT", label: "português · Portugal", locale: "pt-PT", language: "pt", country: "pt", region: "Europe" },
  { id: "ro-RO", label: "română · România", locale: "ro-RO", language: "ro", country: "ro", region: "Europe" },
  { id: "ru-RU", label: "русский · Россия", locale: "ru-RU", language: "ru", country: "ru", region: "Europe" },
  { id: "it-SM", label: "italiano · San Marino", locale: "it-SM", language: "it", country: "sm", region: "Europe" },
  { id: "sr-RS", label: "српски · Србија", locale: "sr-RS", language: "sr", country: "rs", region: "Europe" },
  { id: "sk-SK", label: "slovenčina · Slovensko", locale: "sk-SK", language: "sk", country: "sk", region: "Europe" },
  { id: "sl-SI", label: "slovenščina · Slovenija", locale: "sl-SI", language: "sl", country: "si", region: "Europe" },
  { id: "es-ES", label: "español · España", locale: "es-ES", language: "es", country: "es", region: "Europe" },
  { id: "sv-SE", label: "svenska · Sverige", locale: "sv-SE", language: "sv", country: "se", region: "Europe" },
  { id: "fr-CH", label: "français · Suisse", locale: "fr-CH", language: "fr", country: "ch", region: "Europe" },
  { id: "it-CH", label: "italiano · Svizzera", locale: "it-CH", language: "it", country: "ch", region: "Europe" },
  { id: "rm-CH", label: "rumantsch · Svizra", locale: "rm-CH", language: "rm", country: "ch", region: "Europe" },
  { id: "uk-UA", label: "українська · Україна", locale: "uk-UA", language: "uk", country: "ua", region: "Europe" },
  { id: "en-GB", label: "English · United Kingdom", locale: "en-GB", language: "en", country: "gb", region: "Europe" },
  { id: "it-VA", label: "italiano · Città del Vaticano", locale: "it-VA", language: "it", country: "va", region: "Europe" },
  // South America
  { id: "es-AR", label: "español · Argentina", locale: "es-AR", language: "es", country: "ar", region: "South America" },
  { id: "qu-BO", label: "Runasimi · Bolivia", locale: "qu-BO", language: "qu", country: "bo", region: "South America" },
  { id: "es-BO", label: "español · Bolivia", locale: "es-BO", language: "es", country: "bo", region: "South America" },
  { id: "pt-BR", label: "português · Brasil", locale: "pt-BR", language: "pt", country: "br", region: "South America" },
  { id: "es-CL", label: "español · Chile", locale: "es-CL", language: "es", country: "cl", region: "South America" },
  { id: "es-CO", label: "español · Colombia", locale: "es-CO", language: "es", country: "co", region: "South America" },
  { id: "es-EC", label: "español · Ecuador", locale: "es-EC", language: "es", country: "ec", region: "South America" },
  { id: "en-GY", label: "English · Guyana", locale: "en-GY", language: "en", country: "gy", region: "South America" },
  { id: "es-PY", label: "español · Paraguay", locale: "es-PY", language: "es", country: "py", region: "South America" },
  { id: "qu-PE", label: "Runasimi · Perú", locale: "qu-PE", language: "qu", country: "pe", region: "South America" },
  { id: "es-PE", label: "español · Perú", locale: "es-PE", language: "es", country: "pe", region: "South America" },
  { id: "nl-SR", label: "Nederlands · Suriname", locale: "nl-SR", language: "nl", country: "sr", region: "South America" },
  { id: "es-UY", label: "español · Uruguay", locale: "es-UY", language: "es", country: "uy", region: "South America" },
  { id: "es-VE", label: "español · Venezuela", locale: "es-VE", language: "es", country: "ve", region: "South America" },
  // Asia
  { id: "ps-AF", label: "پښتو · افغانستان", locale: "ps-AF", language: "ps", country: "af", region: "Asia" },
  { id: "tk-AF", label: "türkmen dili · Owganystan", locale: "tk-AF", language: "tk", country: "af", region: "Asia" },
  { id: "hy-AM", label: "հայերեն · Հայաստան", locale: "hy-AM", language: "hy", country: "am", region: "Asia" },
  { id: "az-AZ", label: "azərbaycan · Azərbaycan", locale: "az-AZ", language: "az", country: "az", region: "Asia" },
  { id: "ru-AZ", label: "русский · Азербайджан", locale: "ru-AZ", language: "ru", country: "az", region: "Asia" },
  { id: "ar-BH", label: "العربية · البحرين", locale: "ar-BH", language: "ar", country: "bh", region: "Asia" },
  { id: "bn-BD", label: "বাংলা · বাংলাদেশ", locale: "bn-BD", language: "bn", country: "bd", region: "Asia" },
  { id: "ms-BN", label: "Melayu · Brunei", locale: "ms-BN", language: "ms", country: "bn", region: "Asia" },
  { id: "km-KH", label: "ខ្មែរ · កម្ពុជា", locale: "km-KH", language: "km", country: "kh", region: "Asia" },
  { id: "zh-CN", label: "中文 · 中国", locale: "zh-CN", language: "zh", country: "cn", region: "Asia" },
  { id: "ka-GE", label: "ქართული · საქართველო", locale: "ka-GE", language: "ka", country: "ge", region: "Asia" },
  { id: "en-IN", label: "English · India", locale: "en-IN", language: "en", country: "in", region: "Asia" },
  { id: "hi-IN", label: "हिन्दी · भारत", locale: "hi-IN", language: "hi", country: "in", region: "Asia" },
  { id: "ta-IN", label: "தமிழ் · இந்தியா", locale: "ta-IN", language: "ta", country: "in", region: "Asia" },
  { id: "id-ID", label: "Indonesia · Indonesia", locale: "id-ID", language: "id", country: "id", region: "Asia" },
  { id: "fa-IR", label: "فارسی · ایران", locale: "fa-IR", language: "fa", country: "ir", region: "Asia" },
  { id: "ar-IQ", label: "العربية · العراق", locale: "ar-IQ", language: "ar", country: "iq", region: "Asia" },
  { id: "ar-IL", label: "العربية · إسرائيل", locale: "ar-IL", language: "ar", country: "il", region: "Asia" },
  { id: "he-IL", label: "עברית · ישראל", locale: "he-IL", language: "he", country: "il", region: "Asia" },
  { id: "ja-JP", label: "日本語 · 日本", locale: "ja-JP", language: "ja", country: "jp", region: "Asia" },
  { id: "ar-JO", label: "العربية · الأردن", locale: "ar-JO", language: "ar", country: "jo", region: "Asia" },
  { id: "kk-KZ", label: "қазақ тілі · Қазақстан", locale: "kk-KZ", language: "kk", country: "kz", region: "Asia" },
  { id: "ru-KZ", label: "русский · Казахстан", locale: "ru-KZ", language: "ru", country: "kz", region: "Asia" },
  { id: "ar-KW", label: "العربية · الكويت", locale: "ar-KW", language: "ar", country: "kw", region: "Asia" },
  { id: "ky-KG", label: "кыргызча · Кыргызстан", locale: "ky-KG", language: "ky", country: "kg", region: "Asia" },
  { id: "ru-KG", label: "русский · Киргизия", locale: "ru-KG", language: "ru", country: "kg", region: "Asia" },
  { id: "lo-LA", label: "ລາວ · ລາວ", locale: "lo-LA", language: "lo", country: "la", region: "Asia" },
  { id: "ar-LB", label: "العربية · لبنان", locale: "ar-LB", language: "ar", country: "lb", region: "Asia" },
  { id: "fr-LB", label: "français · Liban", locale: "fr-LB", language: "fr", country: "lb", region: "Asia" },
  { id: "en-MY", label: "English · Malaysia", locale: "en-MY", language: "en", country: "my", region: "Asia" },
  { id: "ms-MY", label: "Melayu · Malaysia", locale: "ms-MY", language: "ms", country: "my", region: "Asia" },
  { id: "mn-MN", label: "монгол · Монгол", locale: "mn-MN", language: "mn", country: "mn", region: "Asia" },
  { id: "my-MM", label: "မြန်မာ · မြန်မာ", locale: "my-MM", language: "my", country: "mm", region: "Asia" },
  { id: "ne-NP", label: "नेपाली · नेपाल", locale: "ne-NP", language: "ne", country: "np", region: "Asia" },
  { id: "ko-KP", label: "한국어 · 북한", locale: "ko-KP", language: "ko", country: "kp", region: "Asia" },
  { id: "ar-OM", label: "العربية · عُمان", locale: "ar-OM", language: "ar", country: "om", region: "Asia" },
  { id: "en-PK", label: "English · Pakistan", locale: "en-PK", language: "en", country: "pk", region: "Asia" },
  { id: "ur-PK", label: "اردو · پاکستان", locale: "ur-PK", language: "ur", country: "pk", region: "Asia" },
  { id: "en-PH", label: "English · Philippines", locale: "en-PH", language: "en", country: "ph", region: "Asia" },
  { id: "fil-PH", label: "Filipino · Pilipinas", locale: "fil-PH", language: "fil", country: "ph", region: "Asia" },
  { id: "ar-QA", label: "العربية · قطر", locale: "ar-QA", language: "ar", country: "qa", region: "Asia" },
  { id: "ar-SA", label: "العربية · المملكة العربية السعودية", locale: "ar-SA", language: "ar", country: "sa", region: "Asia" },
  { id: "en-SG", label: "English · Singapore", locale: "en-SG", language: "en", country: "sg", region: "Asia" },
  { id: "ms-SG", label: "Melayu · Singapura", locale: "ms-SG", language: "ms", country: "sg", region: "Asia" },
  { id: "ta-SG", label: "தமிழ் · சிங்கப்பூர்", locale: "ta-SG", language: "ta", country: "sg", region: "Asia" },
  { id: "zh-SG", label: "中文 · 新加坡", locale: "zh-SG", language: "zh", country: "sg", region: "Asia" },
  { id: "ko-KR", label: "한국어 · 대한민국", locale: "ko-KR", language: "ko", country: "kr", region: "Asia" },
  { id: "si-LK", label: "සිංහල · ශ්‍රී ලංකාව", locale: "si-LK", language: "si", country: "lk", region: "Asia" },
  { id: "ta-LK", label: "தமிழ் · இலங்கை", locale: "ta-LK", language: "ta", country: "lk", region: "Asia" },
  { id: "ar-SY", label: "العربية · سوريا", locale: "ar-SY", language: "ar", country: "sy", region: "Asia" },
  { id: "ru-TJ", label: "русский · Таджикистан", locale: "ru-TJ", language: "ru", country: "tj", region: "Asia" },
  { id: "tg-TJ", label: "тоҷикӣ · Тоҷикистон", locale: "tg-TJ", language: "tg", country: "tj", region: "Asia" },
  { id: "th-TH", label: "ไทย · ไทย", locale: "th-TH", language: "th", country: "th", region: "Asia" },
  { id: "pt-TL", label: "português · Timor-Leste", locale: "pt-TL", language: "pt", country: "tl", region: "Asia" },
  { id: "tr-TR", label: "Türkçe · Türkiye", locale: "tr-TR", language: "tr", country: "tr", region: "Asia" },
  { id: "ru-TM", label: "русский · Туркменистан", locale: "ru-TM", language: "ru", country: "tm", region: "Asia" },
  { id: "tk-TM", label: "türkmen dili · Türkmenistan", locale: "tk-TM", language: "tk", country: "tm", region: "Asia" },
  { id: "ar-AE", label: "العربية · الإمارات العربية المتحدة", locale: "ar-AE", language: "ar", country: "ae", region: "Asia" },
  { id: "ru-UZ", label: "русский · Узбекистан", locale: "ru-UZ", language: "ru", country: "uz", region: "Asia" },
  { id: "uz-UZ", label: "o‘zbek · Oʻzbekiston", locale: "uz-UZ", language: "uz", country: "uz", region: "Asia" },
  { id: "vi-VN", label: "Tiếng Việt · Việt Nam", locale: "vi-VN", language: "vi", country: "vn", region: "Asia" },
  { id: "ar-YE", label: "العربية · اليمن", locale: "ar-YE", language: "ar", country: "ye", region: "Asia" },
];

export function findLocalePreset(idOrLocale: string): LocalePreset {
  return (
    LOCALE_PRESETS.find((p) => p.id === idOrLocale || p.locale === idOrLocale) ||
    LOCALE_PRESETS[0]
  );
}

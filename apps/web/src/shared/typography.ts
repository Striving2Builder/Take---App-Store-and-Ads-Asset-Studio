/** OWNER: shared — real font-pairing options for the Style tab's Typography
 *  section. Applies to headline+kicker (display face) and caption+CTA
 *  (body face) in both the live DOM preview and the PNG export canvas —
 *  not a preview-only control. */

export type FontOption = { name: string; stack: string; category: "sans" | "serif" };

export const FONT_OPTIONS: FontOption[] = [
  { name: "Manrope", stack: `"Manrope", -apple-system, sans-serif`, category: "sans" },
  { name: "Space Grotesk", stack: `"Space Grotesk", -apple-system, sans-serif`, category: "sans" },
  { name: "Bricolage Grotesque", stack: `"Bricolage Grotesque", -apple-system, sans-serif`, category: "sans" },
  { name: "IBM Plex Sans", stack: `"IBM Plex Sans", -apple-system, sans-serif`, category: "sans" },
  { name: "Source Serif 4", stack: `"Source Serif 4", Georgia, serif`, category: "serif" },
  { name: "Newsreader", stack: `"Newsreader", Georgia, serif`, category: "serif" },
];

export const DEFAULT_TYPOGRAPHY = { display: "Manrope", body: "Manrope" };

export function fontStack(name: string): string {
  return FONT_OPTIONS.find((f) => f.name === name)?.stack || `"${name}", -apple-system, sans-serif`;
}

/** Canvas text only renders a webfont once it's actually loaded — this
 *  awaits both weights the export painters use before any ctx.fillText,
 *  so a freshly-picked face doesn't silently fall back on first export. */
export async function ensureFontsLoaded(names: string[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const unique = [...new Set(names)];
  await Promise.all(
    unique.flatMap((name) => [
      document.fonts.load(`700 32px "${name}"`).catch(() => []),
      document.fonts.load(`400 32px "${name}"`).catch(() => []),
    ])
  );
}

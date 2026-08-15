/** OWNER: services/scan-api/routes — POST /palette */
import type { CapturedPalette } from "@take/scan-client";
import { extractPaletteFromUrls } from "../palette/extract-palette";

export type PaletteBody = {
  imageUrls?: string[];
  maxColors?: number;
};

export async function runPalette(body: PaletteBody): Promise<CapturedPalette> {
  const urls = body.imageUrls || [];
  if (!urls.length) {
    return {
      swatches: [],
      provenance: "captured",
      source: "palette-extract",
      extractedAt: new Date().toISOString(),
      warnings: ["No imageUrls provided"],
    };
  }
  const palette = await extractPaletteFromUrls(urls, body.maxColors || 6);
  if (!palette.swatches.length && !(palette.warnings || []).length) {
    return {
      ...palette,
      warnings: ["Could not extract colors from provided images"],
    };
  }
  return palette;
}

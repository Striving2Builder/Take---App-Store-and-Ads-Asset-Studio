/**
 * OWNER: services/scan-api/palette — extract dominant colors from remote images
 * Pure JS quantize (no native sharp) — fetch + sample JPEG/PNG via dynamic decode.
 */
import type { CapturedPalette, PaletteSwatch } from "@take/scan-client";
import { assertSafeUrl, fetchSafe } from "../security/allowlist";

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Very small median-cut style bucket quantize on RGB samples */
function quantize(samples: number[][], maxColors: number): PaletteSwatch[] {
  if (!samples.length) return [];
  type Bucket = { pts: number[][] };
  let buckets: Bucket[] = [{ pts: samples }];

  while (buckets.length < maxColors) {
    buckets.sort((a, b) => b.pts.length - a.pts.length);
    const big = buckets.shift();
    if (!big || big.pts.length < 2) {
      if (big) buckets.unshift(big);
      break;
    }
    let ch = 0;
    let best = -1;
    for (let c = 0; c < 3; c++) {
      let min = 255;
      let max = 0;
      for (const p of big.pts) {
        min = Math.min(min, p[c]);
        max = Math.max(max, p[c]);
      }
      if (max - min > best) {
        best = max - min;
        ch = c;
      }
    }
    big.pts.sort((a, b) => a[ch] - b[ch]);
    const mid = Math.floor(big.pts.length / 2);
    buckets.push({ pts: big.pts.slice(0, mid) }, { pts: big.pts.slice(mid) });
  }

  const total = samples.length;
  const swatches = buckets
    .map((b) => {
      let r = 0;
      let g = 0;
      let bl = 0;
      for (const p of b.pts) {
        r += p[0];
        g += p[1];
        bl += p[2];
      }
      const n = b.pts.length || 1;
      r = Math.round(r / n);
      g = Math.round(g / n);
      bl = Math.round(bl / n);
      const lum = luminance(r, g, bl);
      return {
        hex: rgbToHex(r, g, bl),
        weight: b.pts.length / total,
        role: (lum < 0.2 || lum > 0.85 ? "neutral" : "accent") as string,
      } satisfies PaletteSwatch;
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxColors);

  if (swatches[0] && swatches[0].role !== "neutral") {
    swatches[0] = { ...swatches[0], role: "primary" };
  }
  return swatches;
}

async function sampleImageUrl(url: string): Promise<number[][]> {
  let buf: Buffer;
  if (url.startsWith("data:image/")) {
    const m = url.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
    if (!m) throw new Error("invalid data URL");
    buf = Buffer.from(m[1], "base64");
  } else {
    assertSafeUrl(url);
    const res = await fetchSafe(url, {
      headers: { "user-agent": "TAKE-ScanApi/0.3 (+palette)", accept: "image/*" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`image HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  if (buf.byteLength > 4_000_000) throw new Error("image too large");

  const samples: number[][] = [];
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;

  if (isJpeg) {
    const jpeg = await import("jpeg-js");
    const decoded = jpeg.decode(buf, { maxMemoryUsageInMB: 64, useTArray: true });
    const { data, width, height } = decoded;
    const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const a = data[i + 3];
        if (a < 200) continue;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
    return samples;
  }

  if (isPng) {
    const { PNG } = await import("pngjs");
    const png = PNG.sync.read(buf);
    const { data, width, height } = png;
    const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const a = data[i + 3];
        if (a < 200) continue;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
    return samples;
  }

  throw new Error("unsupported image type (need jpeg/png)");
}

export async function extractPaletteFromUrls(
  imageUrls: string[],
  maxColors = 6
): Promise<CapturedPalette> {
  const urls = imageUrls.filter(Boolean).slice(0, 4);
  const all: number[][] = [];
  const warnings: string[] = [];

  for (const url of urls) {
    try {
      const pts = await sampleImageUrl(url);
      all.push(...pts);
    } catch (err) {
      warnings.push(`${url}: ${err instanceof Error ? err.message : "fail"}`);
    }
  }

  const swatches = quantize(all, maxColors);
  if (!swatches.length && !warnings.length) {
    warnings.push("No color samples from provided images");
  }

  return {
    swatches,
    provenance: "captured",
    source: "palette-extract",
    extractedAt: new Date().toISOString(),
    warnings,
  };
}

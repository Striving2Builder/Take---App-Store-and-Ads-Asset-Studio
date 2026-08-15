/**
 * OWNER: stages/intake — client palette helpers (WebP→PNG data URL for scan-api)
 */
export async function imageUrlToPngDataUrl(url: string): Promise<string> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  const max = 512;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url.slice(0, 80)}`));
    img.src = url;
  });
}

/** Prefer PNG data URLs so scan-api JPEG/PNG decoder always works (WebP/AVIF uploads). */
export async function preparePaletteUrls(urls: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls.slice(0, 3)) {
    try {
      if (url.startsWith("blob:") || url.startsWith("data:") || /\.webp($|\?)/i.test(url)) {
        out.push(await imageUrlToPngDataUrl(url));
      } else {
        // Also convert remote when server may reject webp — try original first path kept simple:
        out.push(url);
      }
    } catch {
      out.push(url);
    }
  }
  return out;
}

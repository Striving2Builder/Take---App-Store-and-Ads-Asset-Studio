/** OWNER: packages/template-engine — pixel + colour helpers for reading a layout from a screenshot */

/** RGBA image, same layout as a canvas ImageData. */
export type Pixels = { width: number; height: number; data: Uint8ClampedArray | Uint8Array };

export type Lab = [number, number, number];

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToLab(r: number, g: number, b: number): Lab {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number) => (t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const x = inv(fx) * 0.95047;
  const y = inv(fy);
  const z = inv(fz) * 1.08883;
  const R = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const G = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const B = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  const gamma = (c: number) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255)));
  };
  return [gamma(R), gamma(G), gamma(B)];
}

export function dE(a: Lab, b: Lab): number {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

export function labToHex(lab: Lab): string {
  const [r, g, b] = labToRgb(lab[0], lab[1], lab[2]);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Relative luminance 0-1 of a hex colour. */
export function hexLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Box-filter downscale so the analysis stays fast and JPEG noise averages out. */
export function downscale(img: Pixels, maxW: number, maxH: number): { img: Pixels; scale: number } {
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  if (scale >= 1) return { img, scale: 1 };
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y / h) * img.height);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) / h) * img.height));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x / w) * img.width);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) / w) * img.width));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.width + xx) * 4;
          const al = img.data[i + 3] / 255;
          r += img.data[i] * al + 255 * (1 - al);
          g += img.data[i + 1] * al + 255 * (1 - al);
          b += img.data[i + 2] * al + 255 * (1 - al);
          a += img.data[i + 3];
          n++;
        }
      }
      const o = (y * w + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = a / n;
    }
  }
  return { img: { width: w, height: h, data: out }, scale };
}

/** Per-pixel Lab, flattened [L,a,b, L,a,b, ...]. Transparent pixels read as white. */
export function labField(img: Pixels): Float32Array {
  const n = img.width * img.height;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const al = img.data[i * 4 + 3] / 255;
    const r = img.data[i * 4] * al + 255 * (1 - al);
    const g = img.data[i * 4 + 1] * al + 255 * (1 - al);
    const b = img.data[i * 4 + 2] * al + 255 * (1 - al);
    const lab = rgbToLab(r, g, b);
    out[i * 3] = lab[0];
    out[i * 3 + 1] = lab[1];
    out[i * 3 + 2] = lab[2];
  }
  return out;
}

export function labAt(field: Float32Array, width: number, x: number, y: number): Lab {
  const i = (y * width + x) * 3;
  return [field[i], field[i + 1], field[i + 2]];
}

export function medianLab(samples: Lab[]): Lab {
  const med = (k: 0 | 1 | 2) => {
    const v = samples.map((s) => s[k]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  return [med(0), med(1), med(2)];
}

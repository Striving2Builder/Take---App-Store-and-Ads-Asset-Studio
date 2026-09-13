/** OWNER: stages/export — native ad-unit composition (NOT a resized store screenshot) */
import type { AdCopy } from "@take/core";
import type { AdWireframe, AdZone } from "@take/template-engine";
import { fitRect } from "@take/export-presets";
import { MAX_SCREENSHOT_UPSCALE } from "@take/device-catalog";
import { roundRect } from "./canvas-round-rect";
import { wrapText } from "./canvas-text";
import { applyHighQualitySmoothing } from "../../shared/canvas-quality";

export type PaintAdFrameInput = {
  size: { w: number; h: number };
  wireframe: AdWireframe;
  copy: AdCopy;
  /** Uploaded creative image — cover-fit into the wireframe's image zone(s). */
  image: HTMLImageElement | HTMLCanvasElement | null;
  /** Uploaded logo — contain-fit into the logo zone. Falls back to an advertiser initial. */
  logo: HTMLImageElement | HTMLCanvasElement | null;
  palette: string[];
};

function rectOf(z: AdZone, w: number, h: number) {
  return { x: z.x * w, y: z.y * h, w: z.w * w, h: z.h * h };
}

function paintImageZone(
  ctx: CanvasRenderingContext2D,
  z: AdZone,
  W: number,
  H: number,
  image: PaintAdFrameInput["image"],
  fallbackColor: string
) {
  const r = rectOf(z, W, H);
  if (!image) {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  const place = fitRect(image.width, image.height, r.w, r.h, "cover", MAX_SCREENSHOT_UPSCALE);
  ctx.drawImage(
    image,
    place.sx,
    place.sy,
    place.sw,
    place.sh,
    r.x + place.dx,
    r.y + place.dy,
    place.dw,
    place.dh
  );
  ctx.restore();
}

function paintLogoZone(
  ctx: CanvasRenderingContext2D,
  z: AdZone,
  W: number,
  H: number,
  logo: PaintAdFrameInput["logo"],
  advertiserName: string,
  ink: string,
  paper: string
) {
  const r = rectOf(z, W, H);
  if (logo) {
    const place = fitRect(logo.width, logo.height, r.w, r.h, "contain", MAX_SCREENSHOT_UPSCALE);
    ctx.drawImage(
      logo,
      place.sx,
      place.sy,
      place.sw,
      place.sh,
      r.x + place.dx,
      r.y + place.dy,
      place.dw,
      place.dh
    );
    return;
  }
  const side = Math.min(r.w, r.h);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.arc(cx, cy, side / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = `700 ${Math.round(side * 0.5)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((advertiserName || "A").trim().slice(0, 1).toUpperCase(), cx, cy + side * 0.02);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function paintTextZone(
  ctx: CanvasRenderingContext2D,
  z: AdZone,
  W: number,
  H: number,
  text: string,
  opts: { weight?: number; color: string; sizeFrac?: number; dim?: boolean }
) {
  if (!text) return;
  const r = rectOf(z, W, H);
  const fontSize = Math.max(10, Math.round(r.h * (opts.sizeFrac ?? 0.42)));
  ctx.fillStyle = opts.color;
  ctx.font = `${opts.weight ?? 600} ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "alphabetic";
  wrapText(ctx, text, r.x, r.y + fontSize, r.w, Math.round(fontSize * 1.2));
}

function paintCtaZone(
  ctx: CanvasRenderingContext2D,
  z: AdZone,
  W: number,
  H: number,
  text: string,
  accent: string,
  onAccent: string
) {
  const r = rectOf(z, W, H);
  ctx.fillStyle = accent;
  roundRect(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.16);
  ctx.fill();
  ctx.fillStyle = onAccent;
  const fontSize = Math.max(9, Math.round(r.h * 0.4));
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((text || "Learn more").slice(0, 24), r.x + r.w / 2, r.y + r.h / 2 + fontSize * 0.03);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function paintPanelZone(ctx: CanvasRenderingContext2D, z: AdZone, W: number, H: number, paper: string) {
  const r = rectOf(z, W, H);
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = paper;
  roundRect(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.06);
  ctx.fill();
  ctx.restore();
}

function paintBadgeZone(ctx: CanvasRenderingContext2D, z: AdZone, W: number, H: number, warn: string, ink: string) {
  const r = rectOf(z, W, H);
  ctx.fillStyle = warn;
  roundRect(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.3);
  ctx.fill();
  ctx.fillStyle = ink;
  const fontSize = Math.max(8, Math.round(r.h * 0.5));
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AD", r.x + r.w / 2, r.y + r.h / 2 + fontSize * 0.03);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Draws the current video frame cover-fit into every image zone (respects partial-width
 *  zones like splitHalves — does not assume full-canvas video). Used by ad-video-export.ts. */
export function paintVideoFrameIntoZones(
  ctx: CanvasRenderingContext2D,
  wireframe: AdWireframe,
  size: { w: number; h: number },
  video: HTMLVideoElement
): void {
  const srcW = video.videoWidth || size.w;
  const srcH = video.videoHeight || size.h;
  for (const z of wireframe.zones) {
    if (z.kind !== "image") continue;
    const r = rectOf(z, size.w, size.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    const place = fitRect(srcW, srcH, r.w, r.h, "cover");
    ctx.drawImage(video, place.sx, place.sy, place.sw, place.sh, r.x + place.dx, r.y + place.dy, place.dw, place.dh);
    ctx.restore();
  }
}

export type AdOverlayInput = {
  size: { w: number; h: number };
  wireframe: AdWireframe;
  copy: AdCopy;
  logo: HTMLImageElement | HTMLCanvasElement | null;
  palette: string[];
};

/** Paints every non-image zone (panel/logo/headline/body/cta/legal/badge) onto whatever's
 *  already on the canvas — a static background fill, an uploaded image, or a live video frame.
 *  Shared by paintAdFrame (static PNG) and the video overlay window (ad-video-export.ts) so
 *  the end-card chrome is pixel-identical between the two, not two divergent implementations. */
export function paintAdOverlayZones(ctx: CanvasRenderingContext2D, input: AdOverlayInput): void {
  const { size, wireframe, copy, logo, palette } = input;
  const ink = "#0c0d10";
  const paper = "#f3f1ec";
  const accent = palette[0] || "#ff4d1a";
  const warn = "#e8b34a";
  const dim = "rgba(12,13,16,0.62)";

  const panels = wireframe.zones.filter((z) => z.kind === "panel");
  const onPanel = (z: AdZone) =>
    panels.some((p) => z.x >= p.x - 0.01 && z.y >= p.y - 0.01 && z.x + z.w <= p.x + p.w + 0.01 && z.y + z.h <= p.y + p.h + 0.01);

  for (const z of wireframe.zones) {
    switch (z.kind) {
      case "image":
        break; // background layer — painted separately (static image or live video frame)
      case "panel":
        paintPanelZone(ctx, z, size.w, size.h, paper);
        break;
      case "logo":
        paintLogoZone(ctx, z, size.w, size.h, logo, copy.advertiserName, ink, paper);
        break;
      case "headline":
        paintTextZone(ctx, z, size.w, size.h, copy.headline, {
          weight: 700,
          color: onPanel(z) ? ink : paper,
          sizeFrac: 0.4,
        });
        break;
      case "body":
        paintTextZone(ctx, z, size.w, size.h, copy.description, {
          weight: 400,
          color: onPanel(z) ? dim : "rgba(243,241,236,0.78)",
          sizeFrac: 0.3,
          dim: true,
        });
        break;
      case "cta":
        paintCtaZone(ctx, z, size.w, size.h, copy.cta, accent, ink);
        break;
      case "legal":
        paintTextZone(ctx, z, size.w, size.h, copy.legalLine, {
          weight: 400,
          color: onPanel(z) ? dim : "rgba(243,241,236,0.7)",
          sizeFrac: 0.6,
          dim: true,
        });
        break;
      case "badge":
        paintBadgeZone(ctx, z, size.w, size.h, warn, ink);
        break;
    }
  }
}

/** Composes the ad unit natively — headline/CTA/logo sized and placed for this exact aspect,
 *  not a phone screenshot letterboxed down. Returns the same canvas, resized to `size`. */
export function paintAdFrame(canvas: HTMLCanvasElement, input: PaintAdFrameInput): void {
  const { size, wireframe, copy, image, logo, palette } = input;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  applyHighQualitySmoothing(ctx);

  const fallbackBg = palette[1] || "#1e2129";
  ctx.fillStyle = fallbackBg;
  ctx.fillRect(0, 0, size.w, size.h);

  for (const z of wireframe.zones) {
    if (z.kind === "image") paintImageZone(ctx, z, size.w, size.h, image, fallbackBg);
  }
  paintAdOverlayZones(ctx, { size, wireframe, copy, logo, palette });
}

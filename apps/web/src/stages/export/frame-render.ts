/** OWNER: stages/export — shared PNG frame canvas render */
import { currentSet, state } from "../../app/app-state";
import { goalCta } from "../../modes/wizard/copy-builder";

export const EXPORT_W = 1290;
export const EXPORT_H = 2796;

function loadImg(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

/** Paint one marketing frame onto a canvas (mutates / returns same canvas). */
export async function paintExportFrame(
  canvas: HTMLCanvasElement,
  frameIndex: number
): Promise<boolean> {
  const set = currentSet();
  const frame = set?.frames[frameIndex];
  if (!set || !frame) return false;

  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const accent = set.palette[0] || "#ff4d1a";
  const bg = set.palette[1] || "#0c0d10";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  const shots =
    state.selectedShotIds.length
      ? state.lastScan?.capture?.assets?.filter(
          (a) => a.kind === "screenshot" && state.selectedShotIds.includes(a.id)
        ) || []
      : state.lastScan?.capture?.assets?.filter((a) => a.kind === "screenshot") || [];
  const shotUrl = shots.length ? shots[frameIndex % shots.length].url : null;
  if (shotUrl) {
    const img = await loadImg(shotUrl);
    if (img) {
      const scale = Math.max(EXPORT_W / img.width, EXPORT_H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (EXPORT_W - w) / 2, (EXPORT_H - h) / 2, w, h);
      ctx.fillStyle = "rgba(12,13,16,0.55)";
      ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
    }
  }

  const icon = state.lastScan?.capture?.assets?.find((a) => a.kind === "icon");
  if (icon) {
    const img = await loadImg(icon.url);
    if (img) ctx.drawImage(img, 96, 160, 160, 160);
  }

  ctx.fillStyle = "#3de0ff";
  ctx.font = "600 36px ui-monospace, monospace";
  ctx.fillText(frame.kicker.slice(0, 48), 96, 400);

  ctx.fillStyle = "#f3f1ec";
  ctx.font = "700 72px system-ui, sans-serif";
  wrapText(ctx, frame.headline, 96, 500, EXPORT_W - 192, 84);

  ctx.fillStyle = "#c8c4bb";
  ctx.font = "400 40px Georgia, serif";
  wrapText(ctx, frame.caption, 96, 900, EXPORT_W - 192, 52);

  const cta = (frame.cta || goalCta(state.inference?.goal || "install")).slice(0, 28);
  ctx.fillStyle = accent;
  ctx.fillRect(96, EXPORT_H - 280, 420, 96);
  ctx.fillStyle = "#0c0d10";
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.fillText(cta, 120, EXPORT_H - 218);

  return true;
}

export async function renderFramePng(
  frameIndex: number
): Promise<{ name: string; data: Uint8Array }> {
  const canvas = document.createElement("canvas");
  const ok = await paintExportFrame(canvas, frameIndex);
  if (!ok) throw new Error("missing frame");

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
  );
  const buf = new Uint8Array(await blob.arrayBuffer());
  const slug = (state.inference?.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    name: `screens/${slug}-${String(frameIndex + 1).padStart(2, "0")}.png`,
    data: buf,
  };
}

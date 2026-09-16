/** OWNER: stages/export — ExtraSlot on top of devices, under store type */
import { toWorldInstance, type ExtraSlot } from "@take/template-engine";
import { fitRect } from "@take/export-presets";
import { MAX_SCREENSHOT_UPSCALE } from "@take/device-catalog";
import type { Ink } from "../../shared/contrast-ink";
import { loadImg } from "./canvas-text";
import { roundRect } from "./canvas-round-rect";
import { ensureScriptFace, paintMarkedCopy } from "./paint-copy-marks";
import { paintShape } from "./paint-shapes";
import { paintSampleMarker, paintWidget } from "./paint-widgets";
import { shotUrlAt } from "./selected-shots";

export async function paintExtras(
  ctx: CanvasRenderingContext2D,
  extras: ExtraSlot[] | undefined,
  sliceW: number,
  sliceH: number,
  ink: Ink
) {
  if (!extras?.length) return;
  if (extras.some((s) => s.face === "script")) await ensureScriptFace();
  const ordered = [...extras].sort((a, b) => a.z - b.z);
  for (const slot of ordered) {
    const world = toWorldInstance(
      {
        id: slot.id,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        rotationDeg: slot.rotationDeg,
        z: slot.z,
        shotIndex: 0,
        placement: "center",
      },
      sliceW,
      sliceH
    );
    ctx.save();
    ctx.translate(world.x, world.y);
    ctx.rotate((world.rotationDeg * Math.PI) / 180);
    const x = -world.w / 2;
    const y = -world.h / 2;
    if (slot.widget) {
      paintWidget(ctx, slot, x, y, world.w, world.h, ink);
    } else if (slot.shape) {
      paintShape(ctx, slot.shape, x, y, world.w, world.h, slot.fill || "rgba(243,241,236,0.38)");
    } else if (slot.kind === "visual") {
      const fromShot =
        slot.shotIndex != null && !(slot.imageUrl && !slot.imageUrl.startsWith("blob:"))
          ? shotUrlAt(slot.shotIndex)
          : undefined;
      const url = slot.imageUrl && !slot.imageUrl.startsWith("blob:") ? slot.imageUrl : fromShot;
      const img = url ? await loadImg(url) : null;
      if (img) {
        roundRect(ctx, x, y, world.w, world.h, Math.min(18, world.w * 0.12));
        ctx.clip();
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const place = fitRect(iw, ih, world.w, world.h, "cover", MAX_SCREENSHOT_UPSCALE);
        ctx.drawImage(
          img,
          place.sx,
          place.sy,
          place.sw,
          place.sh,
          x + place.dx,
          y + place.dy,
          place.dw,
          place.dh
        );
      } else {
        ctx.fillStyle = slot.fill || "#f3f1ec";
        roundRect(ctx, x, y, world.w, world.h, Math.min(12, world.w * 0.08));
        ctx.fill();
      }
    } else {
      ctx.save();
      if (slot.sample) ctx.globalAlpha = 0.45;
      paintMarkedCopy(
        ctx,
        slot.text || "",
        slot.face,
        x,
        y,
        world.w,
        Math.max(14, Math.round(world.h * 0.5)),
        ink.text
      );
      ctx.restore();
      if (slot.sample) {
        paintSampleMarker(ctx, x, y, world.w, world.h);
      }
    }
    ctx.restore();
  }
}

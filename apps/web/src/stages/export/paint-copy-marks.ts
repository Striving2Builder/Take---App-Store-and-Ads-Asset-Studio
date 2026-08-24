/** OWNER: stages/export — ExtraSlot copy with pill / underline marks */
import { parseCopyMarks, type ExtraFace } from "@take/template-engine";
import { roundRect } from "./canvas-round-rect";

const SCRIPT_FACE = '"Take Script", cursive';
const DISPLAY_FACE = "system-ui, sans-serif";
const SCRIPT_PROBE = '600 48px "Take Script"';

let scriptReady = false;
let scriptLoading: Promise<void> | null = null;

export function ensureScriptFace(): Promise<void> {
  if (scriptReady) return Promise.resolve();
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  if (document.fonts.check(SCRIPT_PROBE)) {
    scriptReady = true;
    return Promise.resolve();
  }
  if (scriptLoading) return scriptLoading;
  scriptLoading = (async () => {
    try {
      await document.fonts.load(SCRIPT_PROBE);
      scriptReady = document.fonts.check(SCRIPT_PROBE);
    } catch {
      scriptReady = false;
    } finally {
      scriptLoading = null;
    }
  })();
  return scriptLoading;
}

type Token = { text: string; mark: "none" | "pill" | "underline"; w: number };

export function paintMarkedCopy(
  ctx: CanvasRenderingContext2D,
  text: string,
  face: ExtraFace | undefined,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  fill: string
) {
  const family = face === "script" ? SCRIPT_FACE : DISPLAY_FACE;
  const weight = face === "script" ? 600 : 700;
  ctx.font = `${weight} ${Math.max(12, Math.round(lineH * 0.9))}px ${family}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = fill;

  const tokens: Token[] = [];
  for (const run of parseCopyMarks(text)) {
    for (const part of run.text.split(/(\s+)/)) {
      if (!part) continue;
      tokens.push({ text: part, mark: run.mark, w: ctx.measureText(part).width });
    }
  }

  const lines: Token[][] = [[]];
  let lineW = 0;
  for (const tok of tokens) {
    const space = /^\s+$/.test(tok.text);
    if (!space && lineW + tok.w > maxW && lineW > 0) {
      lines.push([]);
      lineW = 0;
    }
    if (space && lineW === 0) continue;
    lines[lines.length - 1].push(tok);
    lineW += tok.w;
  }

  let yy = y;
  for (const line of lines) {
    let xx = x;
    let i = 0;
    while (i < line.length) {
      const mark = line[i].mark;
      let gw = 0;
      let gtext = "";
      let j = i;
      while (j < line.length && line[j].mark === mark) {
        gw += line[j].w;
        gtext += line[j].text;
        j += 1;
      }
      if (mark === "pill") {
        const padX = lineH * 0.16;
        const padY = lineH * 0.06;
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = fill;
        roundRect(ctx, xx - padX, yy - padY, gw + padX * 2, lineH * 0.92 + padY, lineH * 0.32);
        ctx.fill();
        ctx.restore();
      }
      if (mark === "underline") {
        ctx.strokeStyle = fill;
        ctx.lineWidth = Math.max(2, lineH * 0.07);
        ctx.beginPath();
        ctx.moveTo(xx, yy + lineH * 0.9);
        ctx.lineTo(xx + gw, yy + lineH * 0.9);
        ctx.stroke();
      }
      ctx.fillStyle = fill;
      ctx.fillText(gtext, xx, yy);
      xx += gw;
      i = j;
    }
    yy += lineH;
  }
}

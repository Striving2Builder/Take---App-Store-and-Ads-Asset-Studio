/** OWNER: modes/replicator — upload a layout you like, read it, turn it into a template.
 *
 *  Local pixel reading first; anything it could not read is listed as such,
 *  and can optionally be filled in by Claude (labelled, never passed off as measured). */
import { pushHistory, saveUserTemplate, type SavedTemplate } from "@take/storage";
import {
  analyseScreenshot,
  mergeVision,
  panelsNeedingHelp,
  recipeFromAnalysis,
  validateLayout,
  resolveMetrics,
  type Analysis,
  type DeriveResult,
  type Finding,
  type ReadStatus,
} from "@take/template-engine";
import { showStage } from "../../app/stage-machine";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { renderLibrary } from "../../stages/library/library.render";
import { dummyFrames } from "../../stages/library/library-thumb";
import { paintStripSlice } from "../../stages/export/paint-strip-slice";
import { loadKey, readWithClaude, saveKey } from "./claude-read";

const PHONE_ASPECT = 2.1641;
const STATUS_LABEL: Record<ReadStatus, string> = {
  measured: "Measured",
  estimated: "Estimated",
  unreadable: "Not read",
  vision: "Read by Claude",
};
const STATUS_COLOR: Record<ReadStatus, string> = {
  measured: "#1fbf6a",
  estimated: "#ffb020",
  unreadable: "#ff5a5a",
  vision: "#a78bfa",
};

type Session = {
  canvas: HTMLCanvasElement;
  analysis: Analysis;
  local: Analysis;
  derived: DeriveResult;
  panelCount?: number;
};
let session: Session | null = null;
let busy = false;

function setStatus(msg: string, isError = false) {
  const el = $("#rep-status") as HTMLElement | null;
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("is-error", isError);
}

function loadImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 3000 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

function derive(analysis: Analysis): DeriveResult {
  const name = ($("#rep-name") as HTMLInputElement | null)?.value.trim() || "Derived layout";
  const fillUnread = ($("#rep-fill") as HTMLInputElement | null)?.checked ?? false;
  return recipeFromAnalysis(analysis, { id: `user-${Date.now()}`, name, fillUnread });
}

function drawSource(s: Session) {
  const out = $("#rep-source") as HTMLCanvasElement | null;
  if (!out) return;
  const maxW = 640;
  const scale = Math.min(1, maxW / s.canvas.width);
  out.width = Math.round(s.canvas.width * scale);
  out.height = Math.round(s.canvas.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(s.canvas, 0, 0, out.width, out.height);
  const k = out.width / s.analysis.analysed.width;
  const H = s.analysis.analysed.height;
  ctx.lineWidth = 2;
  for (const p of s.analysis.panels) {
    const problem = p.bg.kind === "unreadable" || p.unresolved.length > 0;
    ctx.strokeStyle = problem ? "#ff5a5a" : "rgba(80,140,255,0.9)";
    ctx.setLineDash(problem ? [6, 4] : []);
    ctx.strokeRect(p.x0 * k + 1, 1, (p.x1 - p.x0) * k - 2, H * k - 2);
    ctx.setLineDash([]);
    ctx.fillStyle = problem ? "#ff5a5a" : "rgba(80,140,255,0.95)";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillText(`${p.index + 1}`, p.x0 * k + 6, 16);
    const pw = p.x1 - p.x0;
    for (const d of p.devices) {
      const cx = (p.x0 + d.cx * pw) * k;
      const cy = d.cy * H * k;
      const wd = d.w * pw * k;
      const ht = wd * PHONE_ASPECT;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((d.rotationDeg * Math.PI) / 180);
      ctx.strokeStyle = STATUS_COLOR[d.status];
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-wd / 2, -ht / 2, wd, ht);
      ctx.restore();
    }
  }
}

async function drawPreview(s: Session) {
  const host = $("#rep-preview") as HTMLElement | null;
  if (!host) return;
  host.innerHTML = "";
  const recipe = s.derived.recipe;
  if (s.derived.empty) {
    host.innerHTML = `<p class="hint">Nothing to preview: no phone was read on any panel. Try the Claude step below, or set the panel count.</p>`;
    return;
  }
  const m = resolveMetrics(recipe.deviceId || "apple.iphone-16-pro-max", "ios", "portrait");
  const legal = validateLayout(recipe, m.sliceW, m.sliceH, { inset: m.inset });
  if (!legal.ok) {
    host.innerHTML = `<p class="hint is-error">The derived layout isn't legal for the layout engine, so it can't be saved: ${escapeHtml(legal.errors.join("; "))}</p>`;
    return;
  }
  for (let i = 0; i < recipe.frameCount; i++) {
    const c = document.createElement("canvas");
    c.className = "rep-frame";
    c.width = 240;
    c.height = 520;
    host.appendChild(c);
    await paintStripSlice(c, i, {
      recipe,
      frames: dummyFrames(recipe.frameCount).map((f) => ({ ...f, headline: "Headline goes here" })),
      w: 240,
      h: 520,
      deviceId: recipe.deviceId,
      palette: recipe.palette,
    });
  }
}

function groupFindings(findings: Finding[]): string {
  const order: ReadStatus[] = ["unreadable", "vision", "estimated", "measured"];
  return order
    .map((st) => {
      const items = findings.filter((f) => f.status === st);
      if (!items.length) return "";
      return `<div class="rep-group rep-${st}">
        <h4><span class="rep-dot" style="background:${STATUS_COLOR[st]}"></span>${STATUS_LABEL[st]} <span class="mono">${items.length}</span></h4>
        <ul>${items.map((f) => `<li><strong>${escapeHtml(f.scope)}</strong> ${escapeHtml(f.detail)}</li>`).join("")}</ul>
      </div>`;
    })
    .join("");
}

function drawReport(s: Session) {
  const host = $("#rep-report") as HTMLElement | null;
  if (!host) return;
  const all: Finding[] = [
    ...s.analysis.findings,
    ...s.derived.notes.map((detail) => ({ scope: "Template", status: "estimated" as ReadStatus, detail })),
  ];
  const help = panelsNeedingHelp(s.analysis);
  const byClaude = s.analysis.panels.filter(
    (p) => p.bg.status === "vision" || p.devices.some((d) => d.status === "vision")
  ).length;
  const total = s.analysis.panels.length;
  const fromPixels = total - help.length - byClaude;
  const parts = [`<strong>${fromPixels} of ${total}</strong> panels read from the pixels`];
  if (byClaude) parts.push(`${byClaude} filled in by Claude (estimates, not measurements)`);
  if (help.length) parts.push(`panel${help.length === 1 ? "" : "s"} ${help.map((i) => i + 1).join(", ")} still unread`);
  host.innerHTML = `<p class="rep-summary">${parts.join(" · ")}.</p>${groupFindings(all)}`;
  const claudeBtn = $("#rep-claude") as HTMLButtonElement | null;
  if (claudeBtn) {
    claudeBtn.disabled = busy || help.length === 0;
    claudeBtn.textContent = help.length
      ? `Ask Claude to read panel${help.length === 1 ? "" : "s"} ${help.map((i) => i + 1).join(", ")}`
      : "Nothing left for Claude to read";
  }
  const saveBtn = $("#rep-save") as HTMLButtonElement | null;
  if (saveBtn) saveBtn.disabled = s.derived.empty;
}

async function render() {
  if (!session) return;
  session.derived = derive(session.analysis);
  drawSource(session);
  drawReport(session);
  await drawPreview(session);
  ($("#rep-results") as HTMLElement).hidden = false;
}

function analyse(canvas: HTMLCanvasElement, panelCount?: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const analysis = analyseScreenshot(
    { width: data.width, height: data.height, data: data.data },
    { panelCount }
  );
  session = { canvas, analysis, local: analysis, derived: derive(analysis), panelCount };
}

async function onFile(file: File) {
  try {
    setStatus("Reading the layout…");
    const canvas = await loadImage(file);
    analyse(canvas);
    const countInput = $("#rep-count") as HTMLInputElement | null;
    if (countInput) countInput.value = "";
    const nameInput = $("#rep-name") as HTMLInputElement | null;
    if (nameInput && !nameInput.value) nameInput.value = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Derived layout";
    await render();
    setStatus(`Read ${session?.analysis.panels.length} panel(s) from ${file.name}.`);
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "Couldn't read that file.", true);
  }
}

async function onAskClaude() {
  if (!session || busy) return;
  const key = ($("#rep-key") as HTMLInputElement).value.trim();
  if (!key) {
    setStatus("Paste your Anthropic API key first.", true);
    return;
  }
  saveKey(key);
  busy = true;
  drawReport(session);
  setStatus("Asking Claude to read the panels the local reader couldn't…");
  const result = await readWithClaude(key, session.canvas, session.local.panels.length);
  busy = false;
  if (!result.ok) {
    setStatus(result.error, true);
    drawReport(session);
    return;
  }
  const merged = mergeVision(session.local, result.read);
  if (merged.error) {
    setStatus(merged.error, true);
    drawReport(session);
    return;
  }
  session.analysis = merged.analysis;
  await render();
  setStatus("Claude's reading is merged in and labelled. Those values are estimates, not measurements.");
}

function onSave() {
  if (!session || session.derived.empty) return;
  const typed = ($("#rep-name") as HTMLInputElement | null)?.value.trim();
  const r = { ...session.derived.recipe, name: typed || session.derived.recipe.name };
  const row: SavedTemplate = {
    id: r.id,
    name: r.name,
    tags: r.tags,
    platform: "mobile",
    kind: "user",
    style: "derived",
    frames: r.frameCount,
    lockBrand: false,
    palette: r.palette,
    updated: new Date().toISOString(),
    version: r.version,
    deviceId: r.deviceId,
    defaultOrientation: r.defaultOrientation,
    composition: r.composition,
    layout: r,
  };
  saveUserTemplate(row);
  pushHistory("template.save", r.name);
  toast(`Saved “${r.name}” to your Library`);
  showStage("library");
  void renderLibrary();
}

export function bindReplicator(): void {
  const file = $("#rep-file") as HTMLInputElement | null;
  file?.addEventListener("change", () => {
    const f = file.files?.[0];
    if (f) void onFile(f);
  });
  const key = $("#rep-key") as HTMLInputElement | null;
  if (key) key.value = loadKey();
  $("#rep-claude")?.addEventListener("click", () => void onAskClaude());
  $("#rep-save")?.addEventListener("click", onSave);
  $("#rep-count")?.addEventListener("change", () => {
    if (!session) return;
    const n = Number(($("#rep-count") as HTMLInputElement).value);
    analyse(session.canvas, Number.isInteger(n) && n >= 1 && n <= 12 ? n : undefined);
    void render();
  });
  $("#rep-fill")?.addEventListener("change", () => void render());
}

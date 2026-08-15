/** OWNER: stages/library — templates + saved projects */
import {
  getTemplates,
  saveUserTemplate,
  pushHistory,
  listProjects,
  getProject,
  type SavedTemplate,
} from "@take/storage";
import type { InferenceBrief, ProjectSet } from "@take/core";
import type { CapturedPalette, ScanPack, ScanResult } from "@take/scan-client";
import { state } from "../../app/app-state";
import { showStage } from "../../app/stage-machine";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { renderReview } from "../review/review.render";
import { renderEditor } from "../../editor/canvas/edit-canvas";

export async function renderLibrary() {
  const all = getTemplates();
  const filtered = all.filter((t) => {
    if (state.filter === "all") return true;
    if (state.filter === "mine") return t.kind === "user";
    return t.platform === state.filter || (t.tags || []).includes(state.filter);
  });

  const projects = await listProjects();
  const grid = $("#library-grid");
  if (!grid) return;

  const projectHtml = projects.length
    ? `<h3 class="mono" style="grid-column:1/-1;margin:0.5rem 0 0">PROJECTS</h3>
      ${projects
        .map(
          (p) => `
      <article class="tpl-card" data-project="${escapeHtml(p.id)}">
        <div class="tpl-preview" style="background:linear-gradient(145deg, rgba(109,255,176,0.25), transparent 55%), #0c0d10">
          <span class="tpl-mark">PROJECT</span>
        </div>
        <div class="tpl-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="tpl-meta">${escapeHtml(p.updatedAt.slice(0, 10))}</p>
          <div class="tpl-actions">
            <button type="button" data-action="open-project">Open</button>
          </div>
        </div>
      </article>`
        )
        .join("")}`
    : "";

  if (!filtered.length && !projects.length) {
    grid.innerHTML = `<p class="hint">No templates or projects yet. Generate a set and save.</p>`;
    return;
  }

  grid.innerHTML =
    filtered
      .map(
        (t) => `
      <article class="tpl-card" data-tpl="${escapeHtml(t.id)}">
        <div class="tpl-preview" style="background:linear-gradient(145deg, ${
          t.kind === "user" ? "rgba(255,77,26,0.35)" : "rgba(61,224,255,0.15)"
        }, transparent 55%), #0c0d10">
          <span class="tpl-mark">${escapeHtml((t.platform || "").toUpperCase())} · ${t.frames || "—"}F</span>
        </div>
        <div class="tpl-body">
          <h3>${escapeHtml(t.name)}</h3>
          <p class="tpl-meta">${escapeHtml((t.tags || []).join(" · "))} · ${escapeHtml(t.style || "")}</p>
          <div class="tpl-actions">
            <button type="button" data-action="use">Use</button>
            <button type="button" data-action="refresh">Refresh</button>
            <button type="button" data-action="dupe">Duplicate</button>
          </div>
        </div>
      </article>`
      )
      .join("") + projectHtml;
}

export async function handleLibraryAction(id: string, action: string) {
  if (action === "open-project") {
    const proj = await getProject(id);
    if (!proj) return;
    const p = proj.payload;
    state.inference = p.inference as InferenceBrief;
    state.sets = p.sets as ProjectSet[];
    state.deviceId = p.deviceId;
    state.platform = p.platform;
    state.mode = p.mode;
    state.selectedSet = p.selectedSet;
    state.activeFrame = p.activeFrame;
    state.lastScan = p.lastScan as ScanResult | null;
    state.lastPack = p.lastPack as ScanPack | null;
    state.scanPalette = p.scanPalette as CapturedPalette | null;
    state.selectedShotIds = Array.isArray(p.selectedShotIds) ? [...p.selectedShotIds] : [];
    state.currentProjectId = id;
    renderReview();
    renderEditor();
    showStage("edit");
    toast(`Opened project “${proj.name}”`);
    pushHistory("project.open", id);
    return;
  }

  if (action === "use") {
    const tpl = getTemplates().find((t) => t.id === id);
    const radio = document.querySelector(
      'input[name="mode"][value="template"]'
    ) as HTMLInputElement | null;
    if (radio) radio.checked = true;
    state.mode = "template";
    showStage("intake");
    toast(
      tpl
        ? `Template “${tpl.name}” armed — scan then Generate in Template mode`
        : "Template loaded into intake"
    );
    pushHistory("template.use", id);
  } else if (action === "refresh") {
    toast("Re-generate from Template mode for a fresh structural variant");
    pushHistory("template.refresh", id);
  } else if (action === "dupe") {
    const src = getTemplates().find((t) => t.id === id);
    if (!src) return;
    const copy: SavedTemplate = {
      ...src,
      id: `user-${Date.now()}`,
      name: `${src.name} Copy`,
      kind: "user",
      updated: new Date().toISOString().slice(0, 10),
    };
    saveUserTemplate(copy);
    renderLibrary();
    toast("Template duplicated to your library");
  }
}

/** OWNER: stages/generate — compose theater after scan / generate */
import type { InferenceBrief } from "@take/core";
import { pushHistory } from "@take/storage";
import { state } from "../../app/app-state";
import { showStage } from "../../app/stage-machine";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { generateSets } from "../../modes/wizard/sets-builder";
import { renderReview } from "../review/review.render";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function tagFor(key: string, text: string): "CAPTURED" | "INFERRED" | "MISSING" {
  if (!String(text || "").trim()) return "MISSING";

  const cap = state.lastScan?.captured || {};
  if (key === "What" && ("name" in cap || state.lastScan?.capture?.fields.name.value)) {
    return "CAPTURED";
  }
  const map: Record<string, string> = {
    What: "name",
    Who: "audience",
    Where: "where",
    When: "when",
    How: "how",
    Positioning: "subtitle",
    Narrative: "narrative",
    Value: "description",
  };
  const field = map[key];
  if (field && field in cap) return "CAPTURED";
  if (state.lastScan?.source === "live" && state.lastScan.capture?.ok) {
    if (key === "Positioning" && state.lastScan.capture.fields.subtitle.value) return "CAPTURED";
    if (key === "Value" && state.lastScan.capture.fields.description.value) return "CAPTURED";
  }
  return "INFERRED";
}

function badgeClass(prov: string) {
  if (prov === "CAPTURED") return "truth-real";
  if (prov === "MISSING") return "truth-fake";
  return "truth-partial";
}

export async function runScanTheater(inf: InferenceBrief) {
  showStage("generate");
  const feed = $("#infer-feed");
  const status = $("#generate-status");
  if (!feed || !status) return;

  const live = state.lastScan?.source === "live" && state.lastScan.capture?.ok;
  feed.innerHTML = live
    ? `<p class="mono feed-title">BRIEF FROM SCAN <span class="truth-badge truth-partial" title="Captured store fields + Missing/Inferred narrative gaps">MIXED</span></p>
       <p class="hint tight">Green = Captured. Amber = heuristic Inferred. Red Missing = fill Advanced.</p>`
    : `<p class="mono feed-title">BRIEF <span class="truth-badge truth-fake" title="No successful live capture">FALLBACK</span></p>
       <p class="hint tight">No live capture — fill Advanced or scan a store/site URL. Gaps stay Missing (not invented).</p>`;

  const steps = [
    { status: "Resolving product…", line: { k: "What", t: `${inf.name} — ${inf.category}` } },
    { status: "Audience…", line: { k: "Who", t: inf.audience } },
    { status: "Context…", line: { k: "Where", t: inf.where } },
    { status: "Timing…", line: { k: "When", t: inf.when } },
    { status: "Loop…", line: { k: "How", t: inf.how } },
    { status: "Positioning…", line: { k: "Positioning", t: inf.positioning } },
    { status: "Narrative…", line: { k: "Narrative", t: inf.narrative } },
    { status: "Value…", line: { k: "Value", t: inf.value } },
  ];

  for (const step of steps) {
    status.textContent = step.status;
    const text = step.line.t?.trim() ? step.line.t : "—";
    const prov = tagFor(step.line.k, step.line.t);
    const div = document.createElement("p");
    div.className = "feed-line";
    div.innerHTML = `<span class="k">${escapeHtml(step.line.k)} <span class="truth-badge ${badgeClass(prov)}">${prov}</span></span>${escapeHtml(text)}`;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
    await wait(280 + Math.random() * 140);
  }

  status.textContent = "Sets ready.";
  await wait(360);
  if (!state.sets.length) {
    state.sets = generateSets(inf, state.qty, state.deviceId, {
      seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
    });
  }
  state.selectedSet = 0;
  state.activeFrame = 0;
  renderReview();
  showStage("review");
  pushHistory("generate", state.sets.map((s) => s.id).join(","));
}

/** OWNER: services/device-sync — diff candidates vs current catalog (no network) */
import type { DeviceProfile } from "@take/device-catalog";
import type { NormalizedCandidate } from "./discover.types";
import type { DeviceProposal, ProposalConfidence, ProposedDevice } from "./types";

function px(a?: { w: number; h: number }): string {
  return a ? `${a.w}×${a.h}` : "—";
}

function inset(a?: { x: number; y: number; w: number; h: number }): string {
  return a ? `${a.x},${a.y} ${a.w}×${a.h}` : "—";
}

export type ProposalKind = "new" | "change" | "unchanged" | "deprecate";

function idPrefix(id: string): string {
  const i = id.indexOf(".");
  return i > 0 ? id.slice(0, i) : id;
}

export function classifyChange(
  current: DeviceProfile | undefined,
  proposed: Pick<DeviceProfile, "id" | "exportPx" | "screenInset" | "status">
): { kind: ProposalKind; summary: string } {
  if (!current) {
    return { kind: "new", summary: `new ${proposed.id} · exportPx ${px(proposed.exportPx)}` };
  }
  const bits: string[] = [];
  if (px(current.exportPx) !== px(proposed.exportPx)) {
    bits.push(`exportPx ${px(current.exportPx)} → ${px(proposed.exportPx)}`);
  }
  if (inset(current.screenInset) !== inset(proposed.screenInset)) {
    bits.push(`inset ${inset(current.screenInset)} → ${inset(proposed.screenInset)}`);
  }
  if (current.status !== proposed.status) {
    bits.push(`status ${current.status} → ${proposed.status}`);
  }
  if (!bits.length) return { kind: "unchanged", summary: `${proposed.id} unchanged` };
  return { kind: "change", summary: bits.join(" · ") };
}

function confidence(kind: ProposalKind): ProposalConfidence {
  if (kind === "new" || kind === "change") return "high";
  if (kind === "deprecate") return "medium";
  return "low";
}

function asProposal(
  id: string,
  proposed: ProposedDevice,
  evidenceUrl: string,
  summary: string,
  kind: ProposalKind,
  now: string
): DeviceProposal {
  return {
    id,
    proposed,
    evidence: [{ url: evidenceUrl, note: summary, fetchedAt: now }],
    confidence: confidence(kind),
    reviewStatus: "pending",
    createdAt: now,
  };
}

/** Structured JSON candidates only — not HTML scrape. New + field-change; not deprecates. */
export function diffCatalog(
  current: DeviceProfile[],
  candidates: DeviceProfile[],
  evidenceUrl: string
): DeviceProposal[] {
  const now = new Date().toISOString();
  const byId = new Map(current.map((d) => [d.id, d]));
  const out: DeviceProposal[] = [];
  candidates.forEach((c, i) => {
    const prev = byId.get(c.id);
    const { kind, summary } = classifyChange(prev, c);
    if (kind === "unchanged" || kind === "deprecate") return;
    out.push(asProposal(`diff-${c.id}-${i}`, c, evidenceUrl, summary, kind, now));
  });
  return out;
}

/**
 * Opt-in: catalog rows in the same id-prefix family as the candidate set,
 * missing from that set, and not already deprecated.
 * Empty candidate set never deprecates the whole catalog.
 */
export function deprecateCandidates(
  current: DeviceProfile[],
  candidates: DeviceProfile[],
  evidenceUrl: string
): DeviceProposal[] {
  if (!candidates.length) return [];
  const now = new Date().toISOString();
  const present = new Set(candidates.map((c) => c.id));
  const prefixes = new Set(candidates.map((c) => idPrefix(c.id)));
  const out: DeviceProposal[] = [];
  for (const d of current) {
    if (!prefixes.has(idPrefix(d.id))) continue;
    if (present.has(d.id)) continue;
    if (d.status === "deprecated") continue;
    const proposed = { ...d, status: "deprecated" as const };
    const summary = `deprecate-candidate ${d.id} missing from source set`;
    out.push(asProposal(`diff-${d.id}-deprecate`, proposed, evidenceUrl, summary, "deprecate", now));
  }
  return out;
}

/**
 * Discovery-normalized rows keep adapter confidence (store-class + inherit ≠ high).
 * Structured --input JSON still uses diffCatalog (new/change = high).
 */
export function proposalsFromNormalized(
  current: DeviceProfile[],
  rows: NormalizedCandidate[]
): DeviceProposal[] {
  const now = new Date().toISOString();
  const byId = new Map(current.map((d) => [d.id, d]));
  const out: DeviceProposal[] = [];
  rows.forEach((row, i) => {
    const p = row.proposed;
    const prev = byId.get(p.id);
    const { kind, summary } = classifyChange(prev, {
      id: p.id,
      exportPx: p.exportPx || { w: 0, h: 0 },
      screenInset: p.screenInset || { x: 0, y: 0, w: 0, h: 0 },
      status: p.status || "current",
    });
    if (kind === "unchanged" || kind === "deprecate") return;
    out.push({
      id: `disc-${p.id}-${i}`,
      proposed: p,
      evidence: row.evidence.length
        ? row.evidence.map((e) => ({ ...e, note: e.note || summary }))
        : [{ url: "", note: summary, fetchedAt: now }],
      confidence: row.confidence,
      reviewStatus: "pending",
      createdAt: now,
    });
  });
  return out;
}

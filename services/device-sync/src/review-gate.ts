/** OWNER: services/device-sync — human review gate (scrapers lie) */
import { hasEvidence } from "./evidence";
import type { DeviceProposal, ReviewStatus } from "./types";

export type ReviewGate = {
  listAll(): Promise<DeviceProposal[]>;
  listPending(): Promise<DeviceProposal[]>;
  ingest(proposals: DeviceProposal[]): Promise<void>;
  approve(id: string, note?: string): Promise<DeviceProposal | null>;
  reject(id: string, note?: string): Promise<DeviceProposal | null>;
  reset(id: string): Promise<DeviceProposal | null>;
  get(id: string): Promise<DeviceProposal | null>;
  clear(): Promise<void>;
};

export function createMemoryReviewGate(
  seed: DeviceProposal[] = [],
  onChange?: (all: DeviceProposal[]) => void
): ReviewGate {
  const map = new Map(seed.map((p) => [p.id, { ...p, evidence: [...(p.evidence || [])] }]));

  function emit() {
    onChange?.([...map.values()].map((p) => ({ ...p, evidence: [...p.evidence] })));
  }

  async function setStatus(id: string, reviewStatus: ReviewStatus, note?: string) {
    const cur = map.get(id);
    if (!cur) return null;
    if (reviewStatus === "approved" && !hasEvidence(cur)) return null;
    const next: DeviceProposal = {
      ...cur,
      reviewStatus,
      reviewedAt: new Date().toISOString(),
      reviewerNote: note,
    };
    map.set(id, next);
    emit();
    return { ...next, evidence: [...next.evidence] };
  }

  return {
    async listAll() {
      return [...map.values()].map((p) => ({ ...p, evidence: [...p.evidence] }));
    },
    async listPending() {
      return [...map.values()]
        .filter((p) => p.reviewStatus === "pending")
        .map((p) => ({ ...p, evidence: [...p.evidence] }));
    },
    async ingest(proposals) {
      for (const p of proposals) {
        map.set(p.id, { ...p, evidence: [...(p.evidence || [])] });
      }
      emit();
    },
    approve: (id, note) => setStatus(id, "approved", note),
    reject: (id, note) => setStatus(id, "rejected", note),
    async reset(id) {
      const cur = map.get(id);
      if (!cur) return null;
      const next: DeviceProposal = {
        ...cur,
        reviewStatus: "pending",
        reviewedAt: undefined,
        reviewerNote: undefined,
      };
      map.set(id, next);
      emit();
      return { ...next, evidence: [...next.evidence] };
    },
    async get(id) {
      const cur = map.get(id);
      return cur ? { ...cur, evidence: [...cur.evidence] } : null;
    },
    async clear() {
      map.clear();
      emit();
    },
  };
}

/** @deprecated use createMemoryReviewGate */
export const createStubReviewGate = createMemoryReviewGate;

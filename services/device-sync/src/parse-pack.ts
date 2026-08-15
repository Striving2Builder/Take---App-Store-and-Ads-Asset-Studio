/** OWNER: services/device-sync — parse wizard / job JSON into CatalogPack */
import type { DeviceProfile } from "@take/device-catalog";
import type { CatalogPack, DeviceProposal, ProposedDevice } from "./types";

export type ParsePackResult =
  | { ok: true; pack: CatalogPack }
  | { ok: false; error: string };

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asProposed(raw: unknown): ProposedDevice | null {
  if (!isObj(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!id || !name) return null;
  return raw as ProposedDevice;
}

function wrapDevice(d: ProposedDevice, createdAt: string, i: number): DeviceProposal {
  return {
    id: `prop-${d.id}-${i}`,
    proposed: d,
    evidence: [],
    confidence: "low",
    reviewStatus: "pending",
    createdAt,
  };
}

function asProposal(raw: unknown, createdAt: string, i: number): DeviceProposal | null {
  if (!isObj(raw)) return null;
  const proposed = asProposed(raw.proposed);
  if (!proposed) return null;
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.filter(isObj).map((e) => ({
        url: String(e.url || ""),
        note: typeof e.note === "string" ? e.note : undefined,
        fetchedAt: typeof e.fetchedAt === "string" ? e.fetchedAt : undefined,
      }))
    : [];
  const status = raw.reviewStatus;
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : `prop-${proposed.id}-${i}`,
    proposed,
    evidence,
    confidence: raw.confidence === "high" || raw.confidence === "medium" ? raw.confidence : "low",
    reviewStatus: status === "approved" || status === "rejected" ? status : "pending",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : createdAt,
    reviewedAt: typeof raw.reviewedAt === "string" ? raw.reviewedAt : undefined,
    reviewerNote: typeof raw.reviewerNote === "string" ? raw.reviewerNote : undefined,
  };
}

/** Accept a CatalogPack, `{ proposals, devices }`, or a raw DeviceProfile array. */
export function parseProposalInput(raw: unknown): ParsePackResult {
  const createdAt = new Date().toISOString();
  if (Array.isArray(raw)) {
    const proposals: DeviceProposal[] = [];
    for (let i = 0; i < raw.length; i++) {
      const d = asProposed(raw[i]);
      if (!d) return { ok: false, error: `Item ${i} needs id and name` };
      proposals.push(wrapDevice(d, createdAt, i));
    }
    return {
      ok: true,
      pack: { version: "import", updatedAt: createdAt, devices: [], proposals },
    };
  }
  if (!isObj(raw)) return { ok: false, error: "Root must be a JSON array or CatalogPack object" };

  const fromProps = Array.isArray(raw.proposals)
    ? raw.proposals.map((p, i) => asProposal(p, createdAt, i)).filter((p): p is DeviceProposal => !!p)
    : [];
  const fromDevices: DeviceProposal[] = [];
  if (Array.isArray(raw.devices) && !fromProps.length) {
    for (let i = 0; i < raw.devices.length; i++) {
      const d = asProposed(raw.devices[i]);
      if (!d) return { ok: false, error: `devices[${i}] needs id and name` };
      fromDevices.push(wrapDevice(d, createdAt, i));
    }
  }
  const proposals = fromProps.length ? fromProps : fromDevices;
  const devices = Array.isArray(raw.devices)
    ? (raw.devices.filter((d) => asProposed(d)) as DeviceProfile[])
    : [];
  return {
    ok: true,
    pack: {
      version: typeof raw.version === "string" ? raw.version : "import",
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
      devices,
      proposals,
    },
  };
}

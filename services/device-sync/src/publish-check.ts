/** OWNER: services/device-sync — refuse publish without approved + evidenced proposals */
import { validateDevice, type DeviceProfile } from "@take/device-catalog";
import { hasEvidence } from "./evidence";
import { materializeDevice } from "./materialize";
import type { CatalogPack, DeviceProposal } from "./types";

export type PublishCheck = { ok: true; devices: DeviceProfile[] } | { ok: false; message: string };

export function devicesForApprovedPack(pack: CatalogPack): PublishCheck {
  const proposals = pack.proposals || [];
  const approved = proposals.filter((p) => p.reviewStatus === "approved");
  if (!approved.length) {
    return { ok: false, message: "Publisher refused — no approved proposals" };
  }
  const missingEv = approved.filter((p) => !hasEvidence(p));
  if (missingEv.length) {
    return { ok: false, message: `Publisher refused — approved without evidence: ${missingEv.map((p) => p.id).join(", ")}` };
  }

  const byId = new Map((pack.devices || []).map((d) => [d.id, d]));
  const devices: DeviceProfile[] = [];
  for (const p of approved) {
    const fromPack = byId.get(p.proposed.id);
    const mat = materializeDevice(p.proposed, fromPack);
    if (!mat.ok) {
      return { ok: false, message: `Publisher refused — invalid ${p.proposed.id}: ${mat.errors.join("; ")}` };
    }
    const v = validateDevice(mat.device);
    if (!v.ok) {
      return { ok: false, message: `Publisher refused — invalid ${mat.device.id}: ${v.errors.join("; ")}` };
    }
    devices.push(mat.device);
  }
  return { ok: true, devices };
}

export function approvedProposals(pack: CatalogPack): DeviceProposal[] {
  return (pack.proposals || []).filter((p) => p.reviewStatus === "approved" && hasEvidence(p));
}

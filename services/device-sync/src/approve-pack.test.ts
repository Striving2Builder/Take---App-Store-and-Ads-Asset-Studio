/** OWNER: services/device-sync — approveEvidencedPack refuses unevidenced / invalid */
import { loadCatalogDevices } from "@take/device-catalog";
import { approveEvidencedPack } from "./approve-pack";
import { devicesForApprovedPack } from "./publish-check";
import type { CatalogPack, DeviceProposal } from "./types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const base = loadCatalogDevices()[0];
assert(!!base, "catalog has a device");

function prop(partial: Partial<DeviceProposal> & Pick<DeviceProposal, "id" | "proposed">): DeviceProposal {
  return {
    evidence: [],
    confidence: "medium",
    reviewStatus: "pending",
    createdAt: "2026-08-15T00:00:00.000Z",
    ...partial,
  };
}

{
  const pack: CatalogPack = {
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [],
    proposals: [
      prop({
        id: "no-ev",
        proposed: { id: base.id, name: base.name },
      }),
    ],
  };
  const r = approveEvidencedPack(pack, "test");
  assert(r.approved === 0 && r.skipped === 1, "unevidenced skipped");
  assert(r.pack.proposals?.[0].reviewStatus === "pending", "stays pending");
}

{
  const pack: CatalogPack = {
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [],
    proposals: [
      prop({
        id: "ident",
        proposed: { id: "google.pixel-99", name: "Pixel 99" },
        evidence: [{ url: "https://store.google.com/" }],
      }),
    ],
  };
  const r = approveEvidencedPack(pack);
  assert(r.approved === 0 && r.skipped === 1, "incomplete materialize skipped");
}

{
  const pack: CatalogPack = {
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [base],
    proposals: [
      prop({
        id: "ok",
        proposed: base,
        evidence: [{ url: "https://developer.apple.com/iphone" }],
      }),
    ],
  };
  const r = approveEvidencedPack(pack, "reviewed");
  assert(r.approved === 1 && r.skipped === 0, "valid evidenced approved");
  assert(r.pack.proposals?.[0].reviewStatus === "approved", "status approved");
  assert(r.pack.proposals?.[0].reviewerNote === "reviewed", "note stamped");
  const pub = devicesForApprovedPack(r.pack);
  assert(pub.ok, "approved pack is publishable");
}

console.log("device-sync.approve-pack.test ok");

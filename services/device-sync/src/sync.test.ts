/** OWNER: services/device-sync — gate, parse, job, publish-check, allowlist */
import { loadCatalogDevices } from "@take/device-catalog";
import {
  assertAllowedSyncUrl,
  assertNoPrivateRecords,
  isAllowedSyncHost,
  isPrivateHostname,
} from "./allowlist";
import { deprecateCandidates } from "./diff-catalog";
import { createMemoryReviewGate } from "./review-gate";
import { hasEvidence } from "./evidence";
import { parseProposalInput } from "./parse-pack";
import { devicesForApprovedPack } from "./publish-check";
import { runDeviceSync } from "./job";
import { createNoopCatalogPublisher } from "./publishers/catalog-publisher";
import type { DeviceProposal } from "./types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const current = loadCatalogDevices();
const base = current[0];
assert(!!base, "catalog has a device");

{
  const parsed = parseProposalInput([base]);
  assert(parsed.ok, "array parses");
  if (!parsed.ok) throw new Error("unreachable");
  assert((parsed.pack.proposals || []).length === 1, "wraps array as proposals");
  assert(!hasEvidence(parsed.pack.proposals![0]), "raw array has no evidence");
}

{
  const parsed = parseProposalInput({
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [],
    proposals: [
      {
        id: "p1",
        proposed: { id: base.id, name: base.name },
        evidence: [{ url: "https://developer.apple.com/iphone" }],
        confidence: "high",
        reviewStatus: "pending",
        createdAt: "2026-08-15T00:00:00.000Z",
      },
    ],
  });
  assert(parsed.ok && parsed.ok && parsed.pack.proposals?.[0].id === "p1", "pack proposals");
}

{
  const gate = createMemoryReviewGate();
  const bare: DeviceProposal = {
    id: "no-ev",
    proposed: { id: base.id, name: base.name },
    evidence: [],
    confidence: "low",
    reviewStatus: "pending",
    createdAt: "2026-08-15T00:00:00.000Z",
  };
  await gate.ingest([bare]);
  assert((await gate.approve("no-ev")) === null, "approve without evidence fails");
  await gate.ingest([
    {
      ...bare,
      id: "ev",
      evidence: [{ url: "https://developer.apple.com/iphone" }],
    },
  ]);
  const ok = await gate.approve("ev");
  assert(ok?.reviewStatus === "approved", "approve with evidence");
}

{
  const candidate = { ...base, exportPx: { w: base.exportPx.w + 1, h: base.exportPx.h } };
  const result = runDeviceSync({
    current,
    candidates: [candidate],
    evidenceUrl: "https://developer.apple.com/iphone",
  });
  assert((result.pack.proposals || []).length === 1, "diff emits change");
  assert(result.pack.proposals![0].confidence === "high", "structured JSON is high confidence");
}

{
  const empty = runDeviceSync({ current });
  assert((empty.pack.proposals || []).length === 0, "no candidates → empty");
  assert(empty.message.includes("No candidates"), "explains empty job");
}

{
  const unapproved = {
    version: "t",
    updatedAt: "2026-08-15T00:00:00.000Z",
    devices: [base],
    proposals: [
      {
        id: "p",
        proposed: base,
        evidence: [{ url: "https://developer.apple.com/iphone" }],
        confidence: "high" as const,
        reviewStatus: "pending" as const,
        createdAt: "2026-08-15T00:00:00.000Z",
      },
    ],
  };
  const refused = devicesForApprovedPack(unapproved);
  assert(!refused.ok, "pending pack refused");
  const publisher = createNoopCatalogPublisher();
  const pub = await publisher.publish(unapproved);
  assert(!pub.ok, "noop publisher refuses");
  unapproved.proposals[0].reviewStatus = "approved";
  const allowed = devicesForApprovedPack(unapproved);
  assert(allowed.ok && allowed.ok && allowed.devices[0].id === base.id, "approved pack materializes");
}

{
  assert(isAllowedSyncHost("developer.apple.com"), "apple host allowed");
  assert(!isAllowedSyncHost("localhost"), "localhost blocked");
  assert(isPrivateHostname("100.64.1.2"), "CGNAT blocked");
  assert(isPrivateHostname("fc00::1"), "ULA blocked");
  assert(isPrivateHostname("::ffff:10.0.0.1"), "v4-mapped blocked");
  let threw = false;
  try {
    assertAllowedSyncUrl("http://developer.apple.com/x");
  } catch {
    threw = true;
  }
  assert(threw, "http rejected");
  assertAllowedSyncUrl("https://developer.apple.com/iphone");
  let dnsThrew = false;
  try {
    assertNoPrivateRecords("developer.apple.com", ["10.0.0.1"]);
  } catch {
    dnsThrew = true;
  }
  assert(dnsThrew, "private A record blocked");
  assertNoPrivateRecords("developer.apple.com", ["17.0.0.1"]);
}

{
  const httpBare: DeviceProposal = {
    id: "http-ev",
    proposed: { id: base.id, name: base.name },
    evidence: [{ url: "http://developer.apple.com/iphone" }],
    confidence: "low",
    reviewStatus: "pending",
    createdAt: "2026-08-15T00:00:00.000Z",
  };
  assert(!hasEvidence(httpBare), "http is not evidence");
  const gate = createMemoryReviewGate();
  await gate.ingest([httpBare]);
  assert((await gate.approve("http-ev")) === null, "approve with http evidence fails");
}

{
  const same = current.filter((d) => d.id.startsWith(base.id.split(".")[0] + "."));
  assert(same.length >= 2, "catalog has a prefix family");
  const one = same[0];
  const rest = same.filter((d) => d.id !== one.id && d.status !== "deprecated");
  const deps = deprecateCandidates(current, [one], "https://developer.apple.com/iphone");
  assert(
    rest.every((d) => deps.some((p) => p.proposed.id === d.id && p.proposed.status === "deprecated")),
    "missing same-prefix ids are deprecate-candidates"
  );
  assert(
    !deps.some((p) => p.proposed.id === one.id),
    "present id is not deprecated"
  );
  const noFlag = runDeviceSync({
    current,
    candidates: [one],
    evidenceUrl: "https://developer.apple.com/iphone",
  });
  assert(
    !(noFlag.pack.proposals || []).some((p) => String(p.evidence?.[0]?.note || "").includes("deprecate-candidate")),
    "default job does not deprecate"
  );
  const withFlag = runDeviceSync({
    current,
    candidates: [one],
    evidenceUrl: "https://developer.apple.com/iphone",
    deprecateMissing: true,
  });
  assert(
    (withFlag.pack.proposals || []).some((p) => p.proposed.status === "deprecated"),
    "opt-in deprecate-missing emits proposals"
  );
  const emptyDep = deprecateCandidates(current, [], "https://developer.apple.com/iphone");
  assert(emptyDep.length === 0, "empty candidate set never deprecates the catalog");
}

{
  const stamped = runDeviceSync({
    current,
    fetchedJson: [{ id: base.id, name: base.name, exportPx: { w: 1, h: 1 } }],
  });
  assert((stamped.pack.proposals || []).length === 0, "no generic citation");
  assert(stamped.message.includes("will not stamp"), "explains missing source URL");
}

{
  const src = runDeviceSync({
    current,
    fetchedSources: [
      {
        url: "https://developer.apple.com/iphone",
        json: [{ ...base, exportPx: { w: base.exportPx.w + 2, h: base.exportPx.h } }],
      },
    ],
  });
  assert((src.pack.proposals || []).length === 1, "fetchedSources diffs");
  assert(src.pack.proposals![0].evidence[0].url === "https://developer.apple.com/iphone", "cites fetched URL");
}

console.log("device-sync.sync.test ok");

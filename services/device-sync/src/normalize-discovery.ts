/** OWNER: services/device-sync — RawDiscovery → ProposedDevice (no fetch, no HTML) */
import type { DeviceProfile } from "@take/device-catalog";
import type { DeviceEvidence, ProposalConfidence, ProposedDevice } from "./types";
import type { NormalizeResult, RawDiscovery } from "./discover.types";
import { landscapeSwap, lookupStoreSizeClass } from "./store-size-classes";

const CATALOG_VERSION = "2026.08";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function httpsUrl(raw: string): string {
  const u = (raw || "").trim();
  return /^https:\/\//i.test(u) ? u : "";
}

function findSibling(
  id: string,
  current: DeviceProfile[],
  extras: DeviceProfile[]
): DeviceProfile | undefined {
  return current.find((d) => d.id === id) || extras.find((d) => d.id === id);
}

function confidenceFor(hasClass: boolean, inherited: boolean): ProposalConfidence {
  if (hasClass && inherited) return "medium";
  if (hasClass && !inherited) return "high";
  return "low";
}

/**
 * Map a discovery row onto DeviceProfile fields TAKE needs.
 * Shell / hardware copy only when inheritFrom resolves — never invent SKU chrome.
 */
export function normalizeDiscovery(
  raw: RawDiscovery,
  current: DeviceProfile[],
  extras: DeviceProfile[] = []
): NormalizeResult {
  const id = (raw.id || "").trim();
  const name = (raw.name || "").trim();
  if (!id || !name) return { ok: false, error: "discovery needs id and name" };
  if (raw.platform !== "ios" && raw.platform !== "android") {
    return { ok: false, error: `${id}: platform must be ios or android` };
  }
  if (!["phone", "tablet", "foldable"].includes(raw.formFactor)) {
    return { ok: false, error: `${id}: formFactor invalid` };
  }
  if (!raw.releasedAt || Number.isNaN(Date.parse(raw.releasedAt))) {
    return { ok: false, error: `${id}: releasedAt invalid` };
  }
  const evidenceUrl = httpsUrl(raw.evidenceUrl);
  if (!evidenceUrl) return { ok: false, error: `${id}: evidenceUrl must be https://…` };

  const inheritId = (raw.inheritFrom || "").trim();
  if (inheritId && inheritId === id) {
    return { ok: false, error: `${id}: inheritFrom cannot be self` };
  }
  const sibling = inheritId ? findSibling(inheritId, current, extras) : undefined;
  if (inheritId && !sibling) {
    return { ok: false, error: `${id}: inheritFrom ${inheritId} not in catalog` };
  }

  const sizeClass = raw.storeSizeClass ? lookupStoreSizeClass(raw.storeSizeClass) : undefined;
  if (raw.storeSizeClass && !sizeClass) {
    return { ok: false, error: `${id}: unknown storeSizeClass ${raw.storeSizeClass}` };
  }
  if (sizeClass && sizeClass.platform !== raw.platform) {
    return { ok: false, error: `${id}: storeSizeClass ${sizeClass.id} is ${sizeClass.platform}` };
  }

  const now = new Date().toISOString().slice(0, 10);
  const inferredFrom = sibling ? sibling.id : undefined;
  const sourceBits = [
    raw.evidenceNote || `${raw.adapter} ${evidenceUrl}`,
    inferredFrom ? `inferredFrom: ${inferredFrom} (family chrome, not SKU-measured)` : "",
    sizeClass ? `store class ${sizeClass.id}` : "",
  ].filter(Boolean);

  const proposed: ProposedDevice = {
    id,
    name,
    platform: raw.platform,
    formFactor: raw.formFactor,
    releasedAt: raw.releasedAt,
    status: "current",
    source: sourceBits.join(" · "),
    updatedAt: now,
    version: CATALOG_VERSION,
  };

  if (sizeClass) {
    proposed.exportPx = { ...sizeClass.exportPx };
    proposed.exportPxLandscape = landscapeSwap(sizeClass.exportPx);
    proposed.storeSizeClass = sizeClass.id;
    proposed.storeSizeNote = sizeClass.storeSizeNote;
    proposed.storeTargets = [...sizeClass.storeTargets];
  }

  if (sibling) {
    proposed.viewportPx = clone(sibling.viewportPx);
    proposed.shellPx = clone(sibling.shellPx);
    proposed.screenInset = clone(sibling.screenInset);
    proposed.safeArea = sibling.safeArea ? clone(sibling.safeArea) : undefined;
    proposed.hardware = sibling.hardware ? clone(sibling.hardware) : undefined;
    proposed.shellKind = sibling.shellKind;
    proposed.shellFamily = sibling.shellFamily;
    proposed.shellAssetFront = sibling.shellAssetFront;
    proposed.shellAssetBack = sibling.shellAssetBack;
    proposed.shellAssetFrontLandscape = sibling.shellAssetFrontLandscape;
    proposed.shellAssetBackLandscape = sibling.shellAssetBackLandscape;
    proposed.shellPxLandscape = sibling.shellPxLandscape ? clone(sibling.shellPxLandscape) : undefined;
    proposed.screenInsetLandscape = sibling.screenInsetLandscape
      ? clone(sibling.screenInsetLandscape)
      : undefined;
    if (!sizeClass) {
      proposed.exportPx = clone(sibling.exportPx);
      proposed.exportPxLandscape = sibling.exportPxLandscape
        ? clone(sibling.exportPxLandscape)
        : landscapeSwap(sibling.exportPx);
      proposed.storeSizeClass = sibling.storeSizeClass;
      proposed.storeSizeNote = sibling.storeSizeNote;
      proposed.storeTargets = [...(sibling.storeTargets || [])];
    }
  } else if (!proposed.storeTargets) {
    proposed.storeTargets = [];
  }

  const evidence: DeviceEvidence[] = [
    {
      url: evidenceUrl,
      note: raw.evidenceNote || `adapter ${raw.adapter}`,
      fetchedAt: new Date().toISOString(),
    },
  ];
  if (sizeClass && sizeClass.sourceUrl !== evidenceUrl) {
    evidence.push({
      url: sizeClass.sourceUrl,
      note: `store-size-class ${sizeClass.id}`,
    });
  }

  return {
    ok: true,
    candidate: {
      proposed,
      confidence: confidenceFor(!!sizeClass, !!sibling),
      evidence,
      inferredFrom,
    },
  };
}

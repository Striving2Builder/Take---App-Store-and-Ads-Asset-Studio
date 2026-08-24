/** OWNER: services/device-sync — on-demand research job (default: no fetch) */
import type { DeviceProfile } from "@take/device-catalog";
import { parseProposalInput } from "./parse-pack";
import { deprecateCandidates, diffCatalog, proposalsFromNormalized } from "./diff-catalog";
import type { NormalizedCandidate } from "./discover.types";
import type { CatalogPack } from "./types";

export type FetchedSyncSource = { url: string; json: unknown };

export type RunDeviceSyncInput = {
  current: DeviceProfile[];
  /** Structured candidates (manual pack). */
  candidates?: DeviceProfile[];
  /** Citation for the candidate pack (required when candidates provided). */
  evidenceUrl?: string;
  /**
   * JSON already fetched — requires evidenceUrl. Prefer fetchedSources so the
   * citation is the URL that was actually fetched.
   */
  fetchedJson?: unknown[];
  /** Allowlisted fetch results with the real source URL as evidence. */
  fetchedSources?: FetchedSyncSource[];
  /** Opt-in: propose status=deprecated for same-prefix catalog ids missing from the set. */
  deprecateMissing?: boolean;
  /** Normalized discovery rows (snapshots / Wikidata). Confidence comes from the adapter. */
  normalized?: NormalizedCandidate[];
};

export type RunDeviceSyncResult = {
  pack: CatalogPack;
  message: string;
};

function asProfiles(raw: unknown): DeviceProfile[] {
  const parsed = parseProposalInput(raw);
  if (!parsed.ok) return [];
  const fromProps = (parsed.pack.proposals || [])
    .map((p) => p.proposed as DeviceProfile)
    .filter((d) => d.id && d.exportPx);
  return parsed.pack.devices.length ? parsed.pack.devices : fromProps;
}

function emptyPack(now: string): CatalogPack {
  return { version: "sync", updatedAt: now, devices: [], proposals: [] };
}

function httpsUrl(raw: string): string {
  const u = raw.trim();
  return /^https:\/\//i.test(u) ? u : "";
}

/**
 * Device Sync is separate from App Scan.
 * Does not write catalogs. Does not fetch. CLI may pass fetchedSources after allowlist.
 */
export function runDeviceSync(input: RunDeviceSyncInput): RunDeviceSyncResult {
  const now = new Date().toISOString();
  const evidenceUrl = httpsUrl(input.evidenceUrl || "");
  if ((input.evidenceUrl || "").trim() && !evidenceUrl) {
    return {
      pack: emptyPack(now),
      message: "--evidence must be https://… (http is not a citation)",
    };
  }

  const groups: { profiles: DeviceProfile[]; evidenceUrl: string }[] = [];

  if ((input.candidates || []).length) {
    if (!evidenceUrl) {
      return {
        pack: emptyPack(now),
        message: "Candidate pack needs --evidence https://… (citations required)",
      };
    }
    groups.push({ profiles: input.candidates || [], evidenceUrl });
  }

  if ((input.fetchedJson || []).length && !evidenceUrl && !(input.fetchedSources || []).length) {
    return {
      pack: emptyPack(now),
      message:
        "fetched JSON needs the real source URL (fetchedSources) or --evidence — will not stamp a generic citation",
    };
  }
  for (const blob of input.fetchedJson || []) {
    if (!evidenceUrl) break;
    const profiles = asProfiles(blob);
    if (profiles.length) groups.push({ profiles, evidenceUrl });
  }

  for (const src of input.fetchedSources || []) {
    const url = httpsUrl(src.url);
    if (!url) {
      return {
        pack: emptyPack(now),
        message: "fetchedSources.url must be https://… (will not cite a stand-in host)",
      };
    }
    const profiles = asProfiles(src.json);
    if (profiles.length) groups.push({ profiles, evidenceUrl: url });
  }

  const candidates = groups.flatMap((g) => g.profiles);
  const normalized = input.normalized || [];
  if (!candidates.length && !normalized.length) {
    return {
      pack: emptyPack(now),
      message:
        "No candidates — pass --discover snapshots (default), --input, or DEVICE_SYNC_FETCH=1 with DEVICE_SYNC_SOURCES. Publisher will not write catalogs.",
    };
  }

  const proposals = groups.flatMap((g) => diffCatalog(input.current, g.profiles, g.evidenceUrl));
  proposals.push(...proposalsFromNormalized(input.current, normalized));
  if (input.deprecateMissing) {
    const cite =
      evidenceUrl ||
      groups[0]?.evidenceUrl ||
      normalized[0]?.evidence.find((e) => /^https:\/\//i.test(e.url))?.url ||
      "";
    if (!cite) {
      return {
        pack: emptyPack(now),
        message: "--deprecate-missing needs --evidence or a fetched source URL",
      };
    }
    const present = [
      ...candidates,
      ...normalized.map((n) => n.proposed).filter((p) => p.id && p.exportPx),
    ] as DeviceProfile[];
    proposals.push(...deprecateCandidates(input.current, present, cite));
  }

  const candidateCount = candidates.length + normalized.length;
  return {
    pack: {
      version: "sync",
      updatedAt: now,
      devices: candidates,
      proposals,
    },
    message: proposals.length
      ? `${proposals.length} proposal(s) from ${candidateCount} candidate(s) — awaiting human review`
      : "Candidates match current catalog — nothing to review",
  };
}

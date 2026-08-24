/** OWNER: services/device-sync — URL allowlist (not App Scan; no open crawl) */
const ALLOWED_HOSTS = new Set([
  "developer.apple.com",
  "support.apple.com",
  "www.apple.com",
  "developer.android.com",
  "store.google.com",
  "query.wikidata.org",
]);

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata"]);

function normHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

/** Literal private / loopback / link-local / CGNAT / ULA — DNS resolve lives in node/. */
export function isPrivateHostname(hostname: string): boolean {
  const h = normHost(hostname);
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "::") return true;
  const v4mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateHostname(v4mapped[1]);
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  return false;
}

export function isPrivateIp(ip: string): boolean {
  return isPrivateHostname(ip);
}

export function isAllowedSyncHost(hostname: string): boolean {
  const h = normHost(hostname);
  if (isPrivateHostname(h)) return false;
  if (ALLOWED_HOSTS.has(h)) return true;
  if (h.startsWith("www.") && ALLOWED_HOSTS.has(h.slice(4))) return true;
  return false;
}

/** https only, allowlisted host, no private literals. Does not fetch or resolve DNS. */
export function assertAllowedSyncUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "https:") throw new Error("Only https URLs allowed for Device Sync fetch");
  if (!isAllowedSyncHost(u.hostname)) {
    throw new Error(`Host not on Device Sync allowlist: ${u.hostname}`);
  }
  return u;
}

/** Throw if any resolved A/AAAA is private. Used by Node fetch after dns.lookup. */
export function assertNoPrivateRecords(hostname: string, addresses: string[]): void {
  for (const address of addresses) {
    if (isPrivateIp(address)) {
      throw new Error(`Resolved private address blocked (${address}) for ${hostname}`);
    }
  }
}

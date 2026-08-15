/**
 * OWNER: services/scan-api/security — host allowlist + SSRF guards
 */
import dns from "node:dns/promises";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

/** When SCAN_API_PUBLIC=1, resolve DNS and block private A/AAAA (F09). */
const RESOLVE_PRIVATE =
  process.env.SCAN_API_PUBLIC === "1" || process.env.SCAN_API_RESOLVE_PRIVATE === "1";

function normHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

export function isPrivateHostname(hostname: string): boolean {
  const h = normHost(hostname);
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h === "0.0.0.0" || h === "::1") return true;
  const v4mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateHostname(v4mapped[1]);
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  return false;
}

export function isPrivateIp(ip: string): boolean {
  return isPrivateHostname(ip);
}

export function assertSafeUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs allowed");
  }
  if (isPrivateHostname(u.hostname)) {
    throw new Error("Private/local hosts are blocked");
  }
  return u;
}

/** Async harden: resolve hostname and reject private IPs when public mode is on. */
export async function assertSafeUrlResolved(raw: string): Promise<URL> {
  const u = assertSafeUrl(raw);
  if (!RESOLVE_PRIVATE) return u;
  try {
    const records = await dns.lookup(u.hostname, { all: true });
    for (const r of records) {
      if (isPrivateIp(r.address)) {
        throw new Error(`Resolved private address blocked (${r.address})`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    throw new Error(`DNS resolve failed for ${u.hostname}`);
  }
  return u;
}

/**
 * Fetch with redirect following, re-validating each Location host (SSRF harden).
 */
export async function fetchSafe(
  raw: string,
  init: RequestInit = {},
  maxRedirects = 5
): Promise<Response> {
  let current = (await assertSafeUrlResolved(raw)).toString();
  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetch(current, {
      ...init,
      redirect: "manual",
      headers: {
        ...(init.headers || {}),
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without Location");
      const next = new URL(loc, current).toString();
      await assertSafeUrlResolved(next);
      current = next;
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

export function isAppleHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return h === "apps.apple.com" || h === "itunes.apple.com" || h.endsWith(".apps.apple.com");
}

export function isPlayHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  return h === "play.google.com";
}

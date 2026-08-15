/** OWNER: packages/scan-client — URL kind detection */
import type { DetectedKind } from "./capture.schema";

export function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function detectUrlKind(url: string): DetectedKind {
  try {
    const u = new URL(normalizeUrl(url));
    const host = u.hostname.replace(/^www\./, "");
    if (host === "apps.apple.com" || host.endsWith(".apps.apple.com")) return "ios";
    if (host === "itunes.apple.com") return "ios";
    if (host === "play.google.com") return "android";
    if (host.includes(".")) return "web";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** Extract numeric App Store id from common Apple URL shapes */
export function extractAppleAppId(url: string): string | null {
  const m = url.match(/\/id(\d+)\b/i) || url.match(/[?&]id=(\d+)/i);
  return m?.[1] ?? null;
}

export function extractPlayPackageId(url: string): string | null {
  try {
    const u = new URL(normalizeUrl(url));
    return u.searchParams.get("id");
  } catch {
    return null;
  }
}

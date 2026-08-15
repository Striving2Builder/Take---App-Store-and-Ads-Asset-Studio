/** OWNER: packages/scan-client — local fallback when no live capture (NOT scraped) */
import type { IntakeInput, InferenceBrief } from "@take/core";
import type { ScanResult } from "./scan.types";

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractHost(url: string) {
  if (!url) return "";
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

function guessName(host: string, url: string) {
  if (/apps\.apple\.com/i.test(url)) {
    const m = url.match(/\/app\/([^/]+)/i);
    if (m) return titleCase(m[1].replace(/-/g, " "));
  }
  if (/play\.google\.com/i.test(url)) {
    const m = url.match(/id=([a-z0-9_.]+)/i);
    if (m) {
      const parts = m[1].split(".");
      return titleCase(parts[parts.length - 1]);
    }
  }
  if (host) {
    const base = host.split(".")[0];
    if (!["apps", "play", "google", "apple"].includes(base)) return titleCase(base);
  }
  return "";
}

function guessCategory(url: string, positioning: string) {
  const blob = `${url} ${positioning}`.toLowerCase();
  if (/fit|health|habit|wellness|sleep/.test(blob)) return "Health & Fitness";
  if (/finance|bank|budget|money/.test(blob)) return "Finance";
  if (/photo|camera|edit/.test(blob)) return "Photo & Video";
  if (/game|play|puzzle/.test(blob)) return "Games";
  if (/social|chat|message/.test(blob)) return "Social Networking";
  return "Productivity";
}

/**
 * Used only when live scan fails / unavailable.
 * Prefer Advanced + URL guesses; invent minimal name/category only.
 * Do NOT invent commute/bedtime lifestyle narrative.
 */
export function fallbackInfer(input: IntakeInput): ScanResult {
  const host = extractHost(input.url);
  const captured: Record<string, string | string[]> = {};
  if (input.url) captured.url = input.url;
  if (host) captured.host = host;
  if (input.name) captured.name = input.name;
  if (input.category) captured.category = input.category;
  if (input.audience) captured.audience = input.audience;
  if (input.positioning) captured.positioning = input.positioning;

  const name = input.name || guessName(host, input.url) || "Your App";
  const category = input.category || guessCategory(input.url, input.positioning) || "Productivity";

  const inferredKeys: string[] = [];
  if (!input.audience) inferredKeys.push("audience");
  // where/when/how stay empty unless Advanced — honest Missing

  const brief: InferenceBrief = {
    name,
    category,
    audience: input.audience || "",
    where: input.where || "",
    when: input.when || "",
    how: "",
    features: [],
    positioning:
      input.positioning ||
      (name !== "Your App" ? `${name} — ${category}` : ""),
    narrative: input.narrative || "",
    value: input.positioning || "",
    differentiators: [],
    style: input.style,
    platform: input.platform,
    locale: input.locale,
    goal: input.goal,
    host,
    mode: input.mode,
    donot: input.donot || "",
    tone: input.tone || "",
    ux: input.ux || "",
    refs: input.refs || "",
    provenance: {
      captured: Object.keys(captured),
      inferred: inferredKeys,
    },
  };

  const inferred: Record<string, string | string[]> = {};
  if (brief.positioning && !input.positioning) {
    inferred.positioning = brief.positioning;
    brief.provenance!.inferred.push("positioning");
  }

  return {
    brief,
    captured,
    inferred,
    source: "fallback",
    warnings: [
      "Live App Scan not connected. Narrative gaps are Missing — fill Advanced or scan a store/site URL. No invented lifestyle copy.",
    ],
  };
}

/** OWNER: packages/scan-client — map AppCapture → InferenceBrief + ScanResult */
import type { InferenceBrief, IntakeInput } from "@take/core";
import type { AppCapture } from "./capture.schema";
import { fieldValue } from "./capture.schema";
import { narrativeFromDescription } from "./narrative-from-description";
import type { ScanResult } from "./scan.types";

const MISSING = "";

function collectByProvenance(capture: AppCapture, provenance: "captured" | "inferred") {
  const out: Record<string, string | string[]> = {};
  (Object.keys(capture.fields) as (keyof AppCapture["fields"])[]).forEach((key) => {
    const f = capture.fields[key];
    if (f.provenance === provenance && f.value != null && f.value !== "") {
      out[key] = String(f.value);
    }
  });
  if (provenance === "captured" && capture.assets.length) {
    out.assetCount = String(capture.assets.length);
    out.icon = capture.assets.find((a) => a.kind === "icon")?.url || "";
    out.screenshots = capture.assets.filter((a) => a.kind === "screenshot").map((a) => a.url);
  }
  return out;
}

function hostFromCapture(capture: AppCapture): string {
  try {
    return new URL(capture.inputUrl).hostname.replace(/^www\./, "");
  } catch {
    return fieldValue(capture.fields.developer) || "";
  }
}

/**
 * Live / partial capture → brief without inventing lifestyle narrative.
 * Order: Advanced → capture → description heuristics → empty (Missing).
 */
export function briefFromCapture(capture: AppCapture, input: IntakeInput): InferenceBrief {
  const name = input.name || fieldValue(capture.fields.name) || "Your App";
  const category =
    input.category || fieldValue(capture.fields.category) || "Productivity";
  const description = fieldValue(capture.fields.description);
  const subtitle = fieldValue(capture.fields.subtitle);
  const extracted = narrativeFromDescription(description);

  const audience = input.audience || extracted.audience || MISSING;
  const howFinal = extracted.how || MISSING;

  const features =
    extracted.features.length > 0
      ? extracted.features
      : description
        ? [description.slice(0, 100)]
        : [];

  const inferredKeys = new Set<string>();
  if (!input.audience && extracted.audience) inferredKeys.add("audience");
  if (extracted.how) inferredKeys.add("how");
  if (extracted.features.length) inferredKeys.add("features");
  if (!input.positioning && (subtitle || description)) inferredKeys.add("positioning");
  if (subtitle || description) inferredKeys.add("value");

  const capturedKeys = Object.keys(collectByProvenance(capture, "captured"));

  const brief: InferenceBrief = {
    name,
    category,
    audience,
    where: input.where || MISSING,
    when: input.when || MISSING,
    how: howFinal,
    features,
    positioning:
      input.positioning ||
      subtitle ||
      (description ? description.slice(0, 160) : MISSING),
    narrative: input.narrative || MISSING,
    value: subtitle || (description ? description.slice(0, 120) : MISSING),
    differentiators: [],
    style: input.style,
    platform: input.platform,
    locale: input.locale || fieldValue(capture.fields.locale) || "en-US",
    goal: input.goal,
    host: hostFromCapture(capture),
    mode: input.mode,
    donot: input.donot || "",
    tone: input.tone || "",
    ux: input.ux || "",
    refs: input.refs || "",
    provenance: {
      captured: capturedKeys,
      inferred: [...inferredKeys],
    },
  };

  // User Advanced stamps: remove from inferred if user supplied
  if (input.audience) {
    brief.provenance!.inferred = brief.provenance!.inferred.filter((k) => k !== "audience");
  }
  if (input.narrative) {
    brief.provenance!.inferred = brief.provenance!.inferred.filter((k) => k !== "narrative");
  }
  if (input.positioning) {
    brief.provenance!.inferred = brief.provenance!.inferred.filter((k) => k !== "positioning");
  }

  return brief;
}

export function scanResultFromCapture(
  capture: AppCapture,
  input: IntakeInput
): ScanResult {
  const brief = briefFromCapture(capture, input);
  const captured = collectByProvenance(capture, "captured");
  const inferred: Record<string, string | string[]> = {
    ...collectByProvenance(capture, "inferred"),
  };

  const maybeInfer = (key: string, value: string | string[]) => {
    if (key in captured) return;
    if (Array.isArray(value) ? value.length : String(value).trim()) {
      inferred[key] = value;
    }
  };

  maybeInfer("audience", brief.audience);
  maybeInfer("where", brief.where);
  maybeInfer("when", brief.when);
  maybeInfer("how", brief.how);
  maybeInfer("value", brief.value);
  maybeInfer("features", brief.features);
  maybeInfer("differentiators", brief.differentiators);

  return {
    brief,
    captured,
    inferred,
    source: capture.ok ? "live" : "fallback",
    warnings: [
      ...capture.warnings,
      ...capture.errors,
      ...(capture.ok
        ? []
        : ["Live capture incomplete — narrative gaps stay Missing unless Advanced is filled."]),
    ],
    capture,
  };
}

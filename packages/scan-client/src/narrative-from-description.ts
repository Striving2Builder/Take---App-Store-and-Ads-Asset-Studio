/**
 * OWNER: packages/scan-client — honest narrative heuristics from store description
 * No invented lifestyle copy. Empty = Missing until Advanced or clear text match.
 */
export type NarrativeExtract = {
  audience: string;
  how: string;
  features: string[];
  /** Keys that came from heuristics (stamp as inferred) */
  inferredKeys: string[];
};

const EMPTY: NarrativeExtract = {
  audience: "",
  how: "",
  features: [],
  inferredKeys: [],
};

/** Pull feature-ish bullets from listing description. */
export function featuresFromDescription(description: string): string[] {
  if (!description.trim()) return [];
  return description
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-\*]+/, "").trim())
    .filter((l) => l.length > 20 && l.length < 120)
    .slice(0, 4);
}

/**
 * Best-effort extract. where/when never invented here — Advanced only.
 */
export function narrativeFromDescription(description: string): NarrativeExtract {
  if (!description.trim()) return { ...EMPTY };

  const out: NarrativeExtract = {
    audience: "",
    how: "",
    features: featuresFromDescription(description),
    inferredKeys: [],
  };
  if (out.features.length) out.inferredKeys.push("features");

  const builtFor =
    description.match(
      /\b(?:built|designed|made|perfect)\s+for\s+([^.!?\n]{8,80})/i
    ) || description.match(/\bfor\s+(people who[^.!?\n]{8,80})/i);
  if (builtFor?.[1]) {
    out.audience = builtFor[1].trim().replace(/\s+/g, " ");
    out.inferredKeys.push("audience");
  }

  const howBlock = description.match(
    /how\s+it\s+works[:\s]+([^.!?\n]{12,140})/i
  );
  if (howBlock?.[1]) {
    out.how = howBlock[1].trim();
    out.inferredKeys.push("how");
  } else {
    const imperative = description
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .find((s) => /^(open|tap|start|create|send|share|track|set)\b/i.test(s) && s.length > 15 && s.length < 100);
    if (imperative) {
      out.how = imperative;
      out.inferredKeys.push("how");
    }
  }

  return out;
}

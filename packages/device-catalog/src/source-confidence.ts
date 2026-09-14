/** OWNER: packages/device-catalog — typed read of the `source` provenance string */
import type { SourceConfidence } from "./device.types";

/** "inferredFrom: <id>" in `source` means this profile's chrome/hardware
 * geometry was borrowed from a family relative, not measured for this SKU —
 * the same substring `inheritNote()` (apps/web catalog copy) already parses. */
export function sourceConfidenceOf(source: string | undefined): SourceConfidence {
  return /inferredFrom:/i.test(source || "") ? "inherited" : "measured";
}

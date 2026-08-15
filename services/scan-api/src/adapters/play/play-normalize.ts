/**
 * OWNER: services/scan-api/adapters/play — PlayRawListing → AppCapture
 */
import {
  type AppCapture,
  capturedField,
  emptyCapture,
  extractPlayPackageId,
} from "@take/scan-client";
import type { ScanAdapterInput } from "../adapter.types";
import type { PlayRawListing } from "./play-fetch";

const SRC = "play-meta";

export function normalizePlayListing(
  raw: PlayRawListing,
  input: ScanAdapterInput
): AppCapture {
  const base = emptyCapture({
    inputUrl: input.url,
    detectedKind: "android",
    adapter: SRC,
  });

  base.fields.locale = capturedField(input.locale, SRC);
  base.fields.bundleId = capturedField(raw.appId || extractPlayPackageId(input.url), SRC);
  base.fields.name = capturedField(raw.title || null, SRC);
  base.fields.subtitle = capturedField(raw.summary || null, SRC);
  base.fields.description = capturedField(raw.description || null, SRC);
  base.fields.category = capturedField(raw.genre || null, SRC);
  base.fields.developer = capturedField(raw.developer || null, SRC);
  base.fields.rating = capturedField(
    typeof raw.score === "number" ? raw.score : null,
    SRC
  );
  base.fields.ratingCount = capturedField(
    typeof raw.ratings === "number" ? raw.ratings : null,
    SRC
  );
  base.fields.storeUrl = capturedField(raw.url || input.url, SRC);

  if (raw.icon) {
    base.assets.push({ id: "icon-0", kind: "icon", url: raw.icon });
  }
  if (raw.headerImage) {
    base.assets.push({ id: "feature-0", kind: "feature", url: raw.headerImage });
  }
  raw.screenshots?.forEach((url, i) => {
    base.assets.push({ id: `shot-${i}`, kind: "screenshot", url });
  });

  base.ok = Boolean(base.fields.name.value && base.assets.some((a) => a.kind === "icon"));
  if (!base.fields.subtitle.value) {
    base.warnings.push("Play short description missing — left Missing (not invented).");
  }
  if (!raw.screenshots?.length) {
    base.warnings.push("No screenshots returned for this locale/listing.");
  }

  return base;
}

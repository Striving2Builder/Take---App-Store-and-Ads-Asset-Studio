/** OWNER: services/scan-api/routes — POST /scan/pack multi-URL */
import {
  buildScanPack,
  emptyCapture,
  type AppCapture,
  type ScanPack,
  type ScanSourceInput,
} from "@take/scan-client";
import { runScan, type ScanBody } from "./scan.route";

export type ScanPackBody = {
  primaryUrl?: string;
  sources?: ScanSourceInput[];
  locale?: string;
  language?: string;
  country?: string;
};

async function scanOne(
  url: string,
  role: string,
  base: ScanBody
): Promise<AppCapture> {
  try {
    const capture = await runScan({
      url,
      locale: base.locale,
      language: base.language,
      country: base.country,
    });
    return {
      ...capture,
      extensions: {
        ...capture.extensions,
        sourceRole: role,
        storefront: base.country,
        language: base.language,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "scan failed";
    const fail = emptyCapture({
      inputUrl: url,
      adapter: "error",
      errors: [message],
    });
    return {
      ...fail,
      extensions: {
        ...fail.extensions,
        sourceRole: role,
        storefront: base.country,
        language: base.language,
      },
      warnings: [message],
    };
  }
}

export async function runScanPack(body: ScanPackBody): Promise<ScanPack> {
  const primaryUrl = (body.primaryUrl || "").trim();
  const locale = body.locale || "en-US";
  const sources = (body.sources || []).filter((s) => s.url?.trim()).slice(0, 2);

  if (!primaryUrl) {
    throw new Error("primaryUrl is required");
  }

  const base: ScanBody = {
    locale,
    language: body.language,
    country: body.country,
  };

  const primaryPromise = scanOne(primaryUrl, "primary", base);
  const sourcePromises = sources.map((s) =>
    scanOne(s.url.trim(), s.role || "marketing", base)
  );

  const [primary, ...rest] = await Promise.all([primaryPromise, ...sourcePromises]);

  return buildScanPack({ primary, sources: rest, locale });
}

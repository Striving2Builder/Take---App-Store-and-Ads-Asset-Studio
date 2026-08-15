/** OWNER: services/scan-api/routes — POST /scan orchestrator (registry-based) */
import {
  detectUrlKind,
  emptyCapture,
  normalizeUrl,
  type AppCapture,
} from "@take/scan-client";
import { assertSafeUrl } from "../security/allowlist";
import { getAdapterForKind } from "../adapters/registry";
import { parseLocale } from "../locale/apply-locale";

export type ScanBody = {
  url?: string;
  locale?: string;
  language?: string;
  country?: string;
};

export async function runScan(body: ScanBody): Promise<AppCapture> {
  const url = normalizeUrl(body.url || "");
  const parsed = parseLocale(body.locale);
  const language = (body.language || parsed.language).toLowerCase();
  const country = (body.country || parsed.country).toLowerCase();
  const locale = body.locale || parsed.locale;

  if (!url) {
    return emptyCapture({ errors: ["url is required"] });
  }

  assertSafeUrl(url);
  const kind = detectUrlKind(url);
  const adapter = getAdapterForKind(kind);

  if (!adapter) {
    return emptyCapture({
      inputUrl: url,
      detectedKind: kind,
      errors: [`No adapter registered for kind "${kind}".`],
    });
  }

  return adapter.scan({ url, locale, language, country });
}

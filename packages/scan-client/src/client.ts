/** OWNER: packages/scan-client — HTTP client → scan-api */
import type { IntakeInput } from "@take/core";
import type { ScanResult } from "./scan.types";
import { fallbackInfer } from "./fallback-infer";
import { scanResultFromCapture } from "./from-capture";
import { emptyCapture } from "./empty-capture";
import type { AppCapture } from "./capture.schema";
import type { CapturedPalette } from "./palette.types";
import type { ScanPack, ScanSourceInput } from "./scan-pack.schema";
import { findLocalePreset } from "./locale.presets";

export type ScanClientOptions = {
  baseUrl?: string;
};

const DEFAULT_BASE = "/api";

function localeBody(locale?: string) {
  const preset = findLocalePreset(locale || "en-US");
  return {
    locale: preset.locale,
    language: preset.language,
    country: preset.country,
  };
}

function defaultIntake(primaryUrl: string, locale?: string): IntakeInput {
  return {
    url: primaryUrl,
    locale: locale || "en-US",
    platform: "both",
    mode: "wizard",
    qty: 3,
    name: "",
    category: "",
    audience: "",
    competitors: "",
    goal: "install",
    style: "realistic",
    positioning: "",
    narrative: "",
    where: "",
    when: "",
    ux: "",
    tone: "",
    refs: "",
    donot: "",
    uploads: 0,
  };
}

export async function scanApp(
  input: IntakeInput,
  options: ScanClientOptions = {}
): Promise<ScanResult> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE;

  if (!input.url && input.uploads === 0) {
    const fb = fallbackInfer(input);
    fb.warnings.push("No URL or uploads provided.");
    return fb;
  }

  if (!input.url) {
    const fb = fallbackInfer(input);
    fb.warnings.push(
      "Uploads only — no live URL. Upload assets will be merged client-side into the receipt."
    );
    return fb;
  }

  try {
    const res = await fetch(`${baseUrl}/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: input.url, ...localeBody(input.locale) }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`scan failed: ${res.status} ${text}`);
    }
    const capture = (await res.json()) as AppCapture;
    return scanResultFromCapture(capture, input);
  } catch (err) {
    const fb = fallbackInfer(input);
    fb.warnings.push(
      `Live scan unavailable (${err instanceof Error ? err.message : "error"}) — using Inferred fallback only.`
    );
    return fb;
  }
}

export async function scanPack(
  input: {
    primaryUrl: string;
    sources?: ScanSourceInput[];
    locale?: string;
    intake?: IntakeInput;
  },
  options: ScanClientOptions = {}
): Promise<{ pack: ScanPack; result: ScanResult }> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE;
  const intake = input.intake || defaultIntake(input.primaryUrl, input.locale);

  try {
    const res = await fetch(`${baseUrl}/scan/pack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        primaryUrl: input.primaryUrl,
        sources: input.sources || [],
        ...localeBody(input.locale || intake.locale),
      }),
    });
    if (!res.ok) {
      throw new Error(`scan pack failed: ${res.status} ${await res.text()}`);
    }
    const pack = (await res.json()) as ScanPack;
    // Pack warnings live on pack only — receipt reads pack.warnings (no duplicate into result)
    const result = scanResultFromCapture(pack.merged, {
      ...intake,
      url: input.primaryUrl,
    });
    return { pack, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "pack error";
    // Prefer primary-only recovery when pack endpoint fails
    try {
      const single = await scanApp(
        { ...intake, url: input.primaryUrl },
        options
      );
      single.warnings.push(
        `Pack endpoint failed (${message}) — fell back to primary-only scan.`
      );
      const capture = single.capture || emptyCapture({ inputUrl: input.primaryUrl, errors: [message] });
      return {
        pack: {
          schemaVersion: 1,
          packId: `pack-fallback-${Date.now()}`,
          locale: input.locale || intake.locale || "en-US",
          primary: capture,
          sources: [],
          merged: capture,
          warnings: single.warnings,
        },
        result: single,
      };
    } catch {
      const fb = fallbackInfer({ ...intake, url: input.primaryUrl });
      fb.warnings.push(
        `Live pack unavailable (${message}) — using Inferred fallback only.`
      );
      const capture = emptyCapture({
        inputUrl: input.primaryUrl,
        errors: [message],
      });
      return {
        pack: {
          schemaVersion: 1,
          packId: `pack-fallback-${Date.now()}`,
          locale: input.locale || intake.locale || "en-US",
          primary: capture,
          sources: [],
          merged: capture,
          warnings: fb.warnings,
        },
        result: fb,
      };
    }
  }
}

export async function fetchPalette(
  imageUrls: string[],
  options: ScanClientOptions = {}
): Promise<CapturedPalette> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE;
  const res = await fetch(`${baseUrl}/palette`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrls, maxColors: 6 }),
  });
  if (!res.ok) {
    throw new Error(`palette failed: ${res.status}`);
  }
  return (await res.json()) as CapturedPalette;
}

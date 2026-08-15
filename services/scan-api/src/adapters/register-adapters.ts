/**
 * OWNER: services/scan-api/adapters — boot-time adapter registration
 * Add future adapters here (ASO, Figma, etc.) without touching routes.
 */
import type { ScanAdapter } from "./adapter.types";
import { registerAdapter } from "./registry";
import { lookupAppleApp } from "./apple-lookup";
import { fetchOgMeta } from "./og-meta";
import { playAdapter } from "./play-meta";

const appleAdapter: ScanAdapter = {
  id: "apple-lookup",
  kinds: ["ios"],
  async scan(input) {
    // country derived in apply-locale; Lookup uses locale → country inside adapter
    return lookupAppleApp(input.url, input.locale);
  },
};

const ogAdapter: ScanAdapter = {
  id: "og-meta",
  kinds: ["web"],
  async scan(input) {
    return fetchOgMeta(input.url, input.locale);
  },
};

export function registerBuiltinAdapters(): void {
  registerAdapter(appleAdapter);
  registerAdapter(playAdapter);
  registerAdapter(ogAdapter);
}

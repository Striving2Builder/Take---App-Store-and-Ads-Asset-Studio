/** OWNER: packages/modes-sdk — ModeContext (injected services grow here) */
import type { InferenceBrief, IntakeInput } from "@take/core";

/** Duck-typed pack slice — avoid depending on scan-client from the SDK. */
export type ModePackSlice = {
  sources?: Array<{
    inputUrl?: string;
    ok?: boolean;
    assets?: Array<{ kind: string }>;
    fields?: { name?: { value?: string | null } };
    extensions?: { sourceRole?: string };
  }>;
};

export type ModeContext = {
  signal?: AbortSignal;
  /** When set, adapters skip network scan and build from this brief */
  priorBrief?: InferenceBrief;
  /** Hex swatches from scan palette extract */
  seedPalette?: string[];
  /** Injected services grow here without breaking adapters */
  scan?: (input: IntakeInput) => Promise<InferenceBrief>;
  lastPack?: ModePackSlice;
  templateId?: string;
  deviceId?: string;
  orientation?: "portrait" | "landscape";
  /** Selected screenshot count for ordered shot map / frame clamp */
  shotCount?: number;
};

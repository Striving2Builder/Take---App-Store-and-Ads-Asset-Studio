/** OWNER: packages/modes-sdk — CreationMode contract */
import type { IntakeInput, InferenceBrief, ProjectSet } from "@take/core";

export type ModeCapabilities = {
  needsUrl: boolean;
  needsUploads: boolean;
  supportsStorySequence: boolean;
  supportsVideo: boolean;
  supportsTrace: boolean;
};

export type ModeRunResult = {
  inference: InferenceBrief;
  sets: ProjectSet[];
};

export type ModeContext = {
  signal?: AbortSignal;
  /** When set, adapters skip network scan and build from this brief */
  priorBrief?: InferenceBrief;
  /** Hex swatches from scan palette extract */
  seedPalette?: string[];
  /** Injected services grow here without breaking adapters */
  scan?: (input: IntakeInput) => Promise<InferenceBrief>;
};

export interface CreationMode {
  id: string;
  label: string;
  capabilities: ModeCapabilities;
  validateIntake(input: IntakeInput): string[];
  run(input: IntakeInput, ctx: ModeContext): Promise<ModeRunResult>;
}

/** OWNER: packages/modes-sdk — CreationMode contract */
import type { IntakeInput, InferenceBrief, ProjectSet } from "@take/core";
import type { ModeContext } from "./context";
import type { ModeEditorPlugin, ModeExportHints } from "./plugins";

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
  /** Catalog consume — shell applies after run */
  deviceId?: string;
  orientation?: "portrait" | "landscape";
};

export interface CreationMode {
  id: string;
  label: string;
  capabilities: ModeCapabilities;
  validateIntake(input: IntakeInput): string[];
  run(input: IntakeInput, ctx: ModeContext): Promise<ModeRunResult>;
  getEditorPlugins?(): ModeEditorPlugin[];
  getExportHints?(): ModeExportHints;
}

export type { ModeContext } from "./context";
export type { ModeEditorPlugin, ModeExportHints } from "./plugins";

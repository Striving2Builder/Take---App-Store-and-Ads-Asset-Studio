/** OWNER: packages/modes-sdk — mode registry */
import type { CreationMode } from "./creation-mode";

const modes = new Map<string, CreationMode>();

export function registerMode(mode: CreationMode): void {
  modes.set(mode.id, mode);
}

export function getMode(id: string): CreationMode | undefined {
  return modes.get(id);
}

export function listModes(): CreationMode[] {
  return [...modes.values()];
}

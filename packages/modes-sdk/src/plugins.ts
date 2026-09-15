/** OWNER: packages/modes-sdk — editor plugin + export hint types */

export type ModeEditorSlot = "review" | "inspector" | "filmstrip" | "rail";

export type ModeEditorPlugin = {
  id: string;
  title: string;
  slot: ModeEditorSlot;
  render: (host: HTMLElement) => void;
};

export type ModeExportHints = {
  preferMotion?: boolean;
  defaultPresets?: string[];
};

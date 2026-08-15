/** OWNER: packages/export-presets — preset types */
export type ExportPreset = {
  id: string;
  label: string;
  sizes: string;
  destination: string;
  defaultOn?: boolean;
};

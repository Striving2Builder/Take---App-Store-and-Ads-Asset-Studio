/** OWNER: packages/export-presets — resolve saved vs default preset ids */
export function resolvePresetIds(opts: {
  session: string[] | null;
  stored: string[] | null;
  knownIds: string[];
  defaults: string[];
}): string[] {
  const known = new Set(opts.knownIds);
  const pick = (ids: string[]) => ids.filter((id) => known.has(id));
  if (opts.session) return pick(opts.session);
  if (opts.stored) return pick(opts.stored);
  return [...opts.defaults];
}

export function defaultPresetIds(presets: { id: string; defaultOn?: boolean }[]): string[] {
  return presets.filter((p) => p.defaultOn).map((p) => p.id);
}

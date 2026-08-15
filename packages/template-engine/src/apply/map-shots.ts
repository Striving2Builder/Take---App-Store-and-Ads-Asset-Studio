/** OWNER: packages/template-engine — ordered shot → frame (no modulo scramble) */
export function mapShotsToFrames<T>(shots: T[], frameCount: number): Array<T | undefined> {
  const n = Math.max(0, frameCount);
  return Array.from({ length: n }, (_, i) => (i < shots.length ? shots[i] : undefined));
}

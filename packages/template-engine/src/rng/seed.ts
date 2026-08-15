/** OWNER: packages/template-engine — splitmix32 from string seed */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

export function rngFromSeed(seed: string): () => number {
  return splitmix32(hashSeed(seed));
}

export function newSeed(): string {
  const a = Math.floor(Math.random() * 0xffffffff).toString(16);
  return `${Date.now().toString(16)}-${a}`;
}

export function lerp(rng: () => number, a: number, b: number): number {
  return a + (b - a) * rng();
}

export function pickWeighted(rng: () => number, weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0) || 1;
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

export function pickUniqueInts(rng: () => number, count: number, min: number, max: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  const out: number[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out.sort((a, b) => a - b);
}

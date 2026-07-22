export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const rand = () => Math.random();
export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const chance = (p: number) => Math.random() < p;

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function weightedPick<T>(arr: T[], weight: (t: T) => number): T {
  const total = arr.reduce((s, t) => s + weight(t), 0);
  let r = Math.random() * total;
  for (const t of arr) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return arr[arr.length - 1];
}

/** gaussian-ish noise in [-1,1] via averaging */
export function noise(): number {
  return (Math.random() + Math.random() + Math.random()) / 1.5 - 1;
}

export const round1 = (v: number) => Math.round(v * 10) / 10;

export function fmtMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

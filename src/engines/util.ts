// Seeded RNG. Every engine call goes through `rng()` so a career's random
// stream is stored in the save (no re-rolling by reloading) and the headless
// sim is reproducible.
let state = (Date.now() ^ 0x9e3779b9) >>> 0;

export function seedRng(seed: number) { state = seed >>> 0 || 1; }
export function rngState(): number { return state; }

export function rng(): number {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const randInt = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export const chance = (p: number) => rng() < p;
export const round1 = (v: number) => Math.round(v * 10) / 10;

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function weightedPick<T>(arr: T[], weight: (t: T) => number): T {
  const total = arr.reduce((s, t) => s + weight(t), 0);
  let r = rng() * total;
  for (const t of arr) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return arr[arr.length - 1];
}

/** roughly normal noise in [-1, 1] */
export function noise(): number {
  return (rng() + rng() + rng()) / 1.5 - 1;
}

export function poisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

let uidSeq = 0;
export function uid(prefix = 'u'): string {
  uidSeq = (uidSeq + 1) % 1e6;
  return `${prefix}${Math.floor(rng() * 1e9).toString(36)}${uidSeq.toString(36)}`;
}

export function fmtMoney(v: number): string {
  const sign = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 1_000) return `${sign}$${(a / 1_000).toFixed(0)}K`;
  return `${sign}$${Math.round(a)}`;
}

export const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const MONTHS_LONG = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];

/** calendar year of a season month (season Y runs July Y -> June Y+1) */
export function calYear(seasonYear: number, month: number): number {
  return month >= 6 ? seasonYear + 1 : seasonYear;
}

export function dayToMonth(day: number): number { return Math.min(11, Math.floor(day / 30)); }
export function fmtDay(day: number, seasonYear: number): string {
  const m = dayToMonth(day);
  return `${(day % 30) + 1} ${MONTHS[m]} ${calYear(seasonYear, m)}`;
}

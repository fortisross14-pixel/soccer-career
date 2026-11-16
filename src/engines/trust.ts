import type { Career } from '../game/types';
import { clamp } from './util';

/** change manager trust and remember why, for the month review and the hub */
export function adjTrust(c: Career, delta: number, label: string) {
  const p = c.player;
  const before = p.trust;
  p.trust = clamp(p.trust + delta, 0, 100);
  const d = p.trust - before;
  if (Math.abs(d) < 0.001) return;
  const log = (c.trustLog ??= []);
  const row = log.find((x) => x.label === label);
  if (row) row.delta += d;
  else log.push({ label, delta: d });
}

/** trust set directly (e.g. joining a new club) */
export function setTrust(c: Career, value: number, label: string) {
  adjTrust(c, value - c.player.trust, label);
}

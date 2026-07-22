import type { Player, PositionKey, SkillKey } from '../game/types';
import { POSITION_MAP } from '../data/positions';
import { clamp } from './util';

/**
 * Overall = weighted average of the player's skills using their position
 * weights, then a small age adjustment for very young players whose bodies
 * and game intelligence haven't matured. Physical decline with age is handled
 * by the progression engine lowering the underlying skills — so we do NOT
 * double-count it here (that was a bug in the original: potential multiplied
 * the score AND age scaled it).
 */
export function overallOf(skills: Record<SkillKey, number>, position: PositionKey, age: number): number {
  const pos = POSITION_MAP[position];
  let total = 0;
  let wSum = 0;
  for (const [k, w] of Object.entries(pos.weights)) {
    total += (skills[k as SkillKey] ?? 25) * (w as number);
    wSum += w as number;
  }
  let ovr = total / wSum;

  // youth maturity penalty (a 15-year-old with 70 skills isn't a 70 overall yet)
  if (age < 21) ovr *= 0.80 + (age - 14) * 0.028; // ~0.80 at 14 -> ~1.0 at ~21
  return clamp(Math.round(ovr), 20, 99);
}

export function playerOverall(p: Player): number {
  return overallOf(p.skills, p.position, p.age);
}

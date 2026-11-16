import type { Player, PositionKey, SkillKey } from '../game/types';
import { POSITION_MAP } from '../data/positions';
import { SKILL_KEYS, SKILL_MAP } from '../data/skills';
import { clamp } from './util';

/** weighted skills, with a maturity penalty for teenagers */
export function overallOf(skills: Record<SkillKey, number>, position: PositionKey, age: number): number {
  const pos = POSITION_MAP[position];
  let total = 0;
  let wSum = 0;
  for (const [k, w] of Object.entries(pos.weights)) {
    total += (skills[k as SkillKey] ?? 25) * (w as number);
    wSum += w as number;
  }
  let ovr = total / wSum;
  if (age < 21) ovr *= 0.8 + (age - 14) * 0.028;
  return clamp(Math.round(ovr), 20, 99);
}

/** skills including active match boosts */
export function effectiveSkills(p: Player): Record<SkillKey, number> {
  const s = { ...p.skills };
  for (const b of p.boosts) {
    for (const [k, v] of Object.entries(b.skills)) s[k as SkillKey] = clamp(s[k as SkillKey] + (v as number), 1, 99);
  }
  return s;
}

export function playerOverall(p: Player): number {
  return overallOf(p.skills, p.position, p.age);
}

export function matchOverall(p: Player): number {
  return overallOf(effectiveSkills(p), p.position, p.age);
}

/** per-skill ceiling driven by potential and how much the position uses it */
export function skillCap(p: Pick<Player, 'potential' | 'position'>, key: SkillKey): number {
  const pos = POSITION_MAP[p.position];
  const w = pos.weights[key] ?? 0;
  const gkSkill = SKILL_MAP[key].category === 'Goalkeeping';
  if (gkSkill && p.position !== 'GK') return 30;
  const relevance = w > 0 ? 0.55 + w * 2.2 : 0.38;
  return clamp(Math.round(40 + p.potential * relevance * 54), 35, 99);
}

export function allCaps(p: Pick<Player, 'potential' | 'position'>): Record<SkillKey, number> {
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, skillCap(p, k)])) as Record<SkillKey, number>;
}

/** POT: the overall this player reaches at their skill ceilings in their prime */
export function potentialOverall(p: Pick<Player, 'potential' | 'position'>): number {
  return overallOf(allCaps(p), p.position, 25);
}

/** the OVR shown to the player: plain weighted skills, without the hidden youth-maturity factor */
export function displayOverall(p: Player): number {
  return overallOf(p.skills, p.position, 21);
}

/** unrounded weighted skill average (no age factor) */
export function rawAverage(skills: Record<SkillKey, number>, position: PositionKey): number {
  const pos = POSITION_MAP[position];
  let total = 0;
  let wSum = 0;
  for (const [k, w] of Object.entries(pos.weights)) { total += (skills[k as SkillKey] ?? 25) * (w as number); wSum += w as number; }
  return total / wSum;
}

/** how many overall points are left before you hit your POT */
export function potRoom(p: Player): number {
  return Math.max(0, potentialOverall(p) + 0.49 - rawAverage(p.skills, p.position));
}

/**
 * Add to a skill under the POT budget: POT caps your overall, not each skill,
 * so any attribute can be specialised as long as the overall stays at or
 * below POT. Skills that don't count for your position can rise a little
 * above their natural level. Returns the amount actually added.
 */
export function addSkill(p: Player, key: SkillKey, amount: number): number {
  if (amount <= 0) { const b = p.skills[key]; p.skills[key] = clamp(b + amount, 5, 99); return p.skills[key] - b; }
  const before = p.skills[key];
  const w = POSITION_MAP[p.position].weights[key] ?? 0;
  let allowed = amount;
  if (w > 0) {
    const wSum = Object.values(POSITION_MAP[p.position].weights).reduce((a, b) => a + (b as number), 0);
    allowed = Math.min(amount, (potRoom(p) * wSum) / w);
  } else {
    allowed = Math.min(amount, Math.max(0, skillCap(p, key) + 15 - before));
  }
  p.skills[key] = clamp(before + Math.max(0, allowed), 5, 99);
  return p.skills[key] - before;
}

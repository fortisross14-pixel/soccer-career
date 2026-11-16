import type { Career, SkillKey } from '../game/types';
import { SKILL_KEYS, SKILL_MAP } from '../data/skills';
import { POSITION_MAP } from '../data/positions';
import { FOCUSES, balanceEffects } from '../data/training';
import { CLUB_MAP } from '../data/clubs';
import { skillCap } from './overall';
import { STAFF_PERK } from './perks';
import { clamp, rng } from './util';

/** share of growth that comes "for free"; the rest is earned through cards */
const NATURAL = 0.62;

/**
 * One month of natural development. Growth closes part of the gap to each
 * skill's ceiling; minutes, club coaching, focus and intensity scale it.
 * After the prime, skills decline — physical first, mental last.
 */
export function monthlyGrowth(c: Career, minutes: number, available: number): Partial<Record<SkillKey, number>> {
  const p = c.player;
  const pos = POSITION_MAP[p.position];
  const focus = FOCUSES.find((f) => f.id === c.focus) ?? FOCUSES[0];
  const bal = balanceEffects(c.plan.balance);
  const clubR = p.contract ? CLUB_MAP[p.contract.clubId]?.rating ?? 65 : 60;
  const coaching = clamp((clubR - 58) / 34, 0, 1);
  const minutesF = available > 0 ? 0.75 + 0.45 * clamp(minutes / (available * 90 * 0.75), 0, 1) : 0.85;
  const injured = p.injury && p.injury.year === c.year && p.injury.untilDay > c.month * 30 + 15;
  const deltas: Partial<Record<SkillKey, number>> = {};

  for (const key of SKILL_KEYS) {
    const def = SKILL_MAP[key];
    if (def.category === 'Goalkeeping' && p.position !== 'GK') continue;
    const w = pos.weights[key] ?? 0;
    const relevance = w > 0 ? 0.55 + w * 2.2 : 0.38;
    const cap = skillCap(p, key);
    const before = p.skills[key];
    let delta = 0;

    if (p.age <= p.peakEnd) {
      const room = cap - before;
      if (room > 0.05) {
        let frac = p.age < 19 ? 0.2 : p.age < 21 ? 0.18 : p.age < p.peakStart ? 0.15 : 0.05;
        frac *= 0.6 + relevance * 0.5;
        frac *= 0.8 + coaching * 0.4;
        frac *= minutesF;
        frac *= bal.growth * (1 + STAFF_PERK(p, 'growth')) * (p.age <= 21 ? 1 + c.mods.youthGrowth : 1);
        frac *= 0.9 + p.morale / 500;
        if (def.ageCurve === 'mental') frac *= 1.15;
        if (def.ageCurve === 'physical' && p.age > 24) frac *= 0.45;
        const focused = focus.key ? pos.keySkills.includes(key) : focus.category === def.category;
        if (focus.id !== 'balanced') frac *= focused ? 1.75 : 0.85;
        if (injured) frac *= 0.35;
        delta = (room * clamp(frac, 0, 0.5) * NATURAL / 10) * (0.8 + rng() * 0.4);
      }
    } else {
      const yearsPast = p.age - p.peakEnd;
      let rate = def.ageCurve === 'physical' ? 1.5 : def.ageCurve === 'technical' ? 0.65 : 0.15;
      rate *= 1 + yearsPast * 0.25;
      delta = -(rate / 10) * (0.6 + rng() * 0.8);
      const floor = def.ageCurve === 'physical' ? 30 : 45;
      if (before + delta < floor) delta = Math.min(0, floor - before);
    }

    if (delta !== 0) {
      p.skills[key] = clamp(Math.round((before + delta) * 100) / 100, 5, 99);
      deltas[key] = p.skills[key] - before;
    }
  }
  return deltas;
}

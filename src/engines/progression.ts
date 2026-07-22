import type { Player, SkillKey } from '../game/types';
import { SKILL_MAP } from '../data/skills';
import { POSITION_MAP } from '../data/positions';
import { clamp, chance } from './util';

export interface ProgressionResult {
  deltas: Partial<Record<SkillKey, number>>;
}

/**
 * Advance the player's underlying skills by one year.
 *
 * Growth is driven by:
 *  - age band (fast <21, plateau in prime, decline after peakEnd)
 *  - a per-skill soft cap derived from the player's potentialCeiling and how
 *    relevant the skill is to their position (key skills reach higher)
 *  - training focus this year (passed in) and the quality of their club
 *  - age curve of the skill: physical peaks & declines earliest, mental latest
 *
 * Returns per-skill deltas (already applied to the player) so the UI can show
 * year-over-year change.
 */
export function progressSkills(
  p: Player,
  opts: { trainedKeys?: SkillKey[]; clubRating: number; minutesFactor: number },
): ProgressionResult {
  const pos = POSITION_MAP[p.position];
  const deltas: Partial<Record<SkillKey, number>> = {};
  const trained = new Set(opts.trainedKeys ?? []);
  const coaching = clamp((opts.clubRating - 55) / 40, 0, 1); // 0..1

  for (const key of Object.keys(p.skills) as SkillKey[]) {
    const def = SKILL_MAP[key];
    const weight = pos.weights[key] ?? 0;
    const isKey = weight > 0;
    const before = p.skills[key];

    // per-skill soft cap: potential lifts key skills highest.
    // potential 0.4 -> ~62 ovr, 0.6 -> ~72, 0.8 -> ~82, 1.0 -> ~92.
    const relevance = isKey ? 0.55 + weight * 2.2 : 0.35;
    const softCap = clamp(40 + p.potentialCeiling * relevance * 54, 38, 99);

    let delta = 0;

    // --- growth phase: close a fraction of the gap to the soft cap ---
    // This guarantees a talented player approaches their ceiling by peak age,
    // so the hidden potential (not the growth rate) sets the level reached.
    if (p.age <= p.peakEnd) {
      const room = softCap - before;
      if (room > 0.5) {
        let frac =
          p.age < 16 ? 0.30 :
          p.age < 19 ? 0.24 :
          p.age < p.peakStart ? 0.15 :
          0.05; // in-peak: small polish, mostly mental
        frac *= 0.6 + relevance * 0.5;                 // key skills develop faster
        frac *= 0.8 + coaching * 0.4;                  // better clubs coach better
        frac *= 0.85 + opts.minutesFactor * 0.35;      // minutes drive growth
        if (def.ageCurve === 'mental') frac *= 1.15;   // game IQ keeps climbing
        if (def.ageCurve === 'physical' && p.age > 24) frac *= 0.45;
        if (trained.has(key)) frac *= 1.5;
        frac = clamp(frac, 0, 0.55);
        delta = room * frac * (0.85 + Math.random() * 0.3);
        // small guaranteed creep so late-blooming still moves
        if (delta < 0.4 && p.age < p.peakStart) delta = 0.4;
      }
    }

    // --- decline phase ---
    if (p.age > p.peakEnd) {
      const yearsPast = p.age - p.peakEnd;
      let rate =
        def.ageCurve === 'physical' ? 1.4 :
        def.ageCurve === 'technical' ? 0.6 :
        0.15; // mental barely declines
      rate *= 1 + yearsPast * 0.25;
      if (chance(0.85)) delta = -rate * (0.7 + Math.random() * 0.7);
      // floor: veterans keep a baseline of their technical/mental craft
      const floor = def.ageCurve === 'physical' ? 30 : 45;
      if (before + delta < floor) delta = floor - before;
    }

    if (delta !== 0) {
      p.skills[key] = clamp(Math.round((before + delta) * 10) / 10, 15, 99);
      deltas[key] = Math.round((p.skills[key] - before) * 10) / 10;
    }
  }

  return { deltas };
}

/** rounds all skills to integers (call after progression for clean display) */
export function roundSkills(p: Player) {
  for (const k of Object.keys(p.skills) as SkillKey[]) {
    p.skills[k] = Math.round(p.skills[k]);
  }
}

import type { SkillCategory } from '../game/types';

export interface FocusDef { id: string; label: string; desc: string; category?: SkillCategory; key?: boolean }

export const FOCUSES: FocusDef[] = [
  { id: 'key', label: 'Position Craft', desc: 'Prioritise the key attributes of your position.', key: true },
  { id: 'balanced', label: 'Balanced', desc: 'Even development across the board.' },
  { id: 'Attacking', label: 'Attacking', desc: 'Finishing, long shots, heading, crossing.', category: 'Attacking' },
  { id: 'Playmaking', label: 'Playmaking', desc: 'Passing, dribbling and set pieces.', category: 'Playmaking' },
  { id: 'Defending', label: 'Defending', desc: 'Tackling and defensive technique.', category: 'Defending' },
  { id: 'Physical', label: 'Physical', desc: 'Pace, strength, stamina, jumping.', category: 'Physical' },
  { id: 'Mental', label: 'Mental', desc: 'Decisions, work rate, leadership.', category: 'Mental' },
  { id: 'Goalkeeping', label: 'Goalkeeping', desc: 'Reflexes and handling.', category: 'Goalkeeping' },
];

/**
 * The monthly Training ground ↔ Match day balance (0..100).
 * Training grows attributes; match day sharpens performances,
 * draws scouts and keeps your legs fresh for games.
 */
export function balanceEffects(b: number) {
  const t = (100 - b) / 100;
  const m = b / 100;
  return {
    growth: 0.55 + t * 0.9,        // ×0.55 .. ×1.45 monthly growth
    rating: (m - 0.5) * 0.5,       // −0.25 .. +0.25 match rating
    share: 0.88 + m * 0.24,        // goal/assist involvement ×0.88 .. ×1.12
    scout: 0.7 + m * 0.6,          // reputation gains & offers
    injury: 0.8 + t * 0.5,         // training load raises injury risk
    recovery: 1.05 + m * 0.5,      // fitness regained per day
  };
}

export function balanceLabel(b: number): string {
  if (b <= 15) return 'Training camp';
  if (b <= 40) return 'Development month';
  if (b < 60) return 'Balanced';
  if (b < 85) return 'Match focus';
  return 'All-in on match day';
}

import type { PositionDef, PositionKey } from '../game/types';

// Weights per position sum to ~1.0. expGoals/expAssists are the season
// output of a *league-average starter* in that role over ~34 games — the
// awards & season engines scale these by skill, form and minutes.
export const POSITIONS: PositionDef[] = [
  {
    key: 'ST', name: 'Striker', short: 'ST', category: 'Attack',
    weights: { finishing: 0.30, dribbling: 0.12, pace: 0.12, heading: 0.12, longShots: 0.10, decisions: 0.12, strength: 0.06, workRate: 0.06 },
    keySkills: ['finishing', 'heading', 'pace', 'dribbling'],
    expGoals: 18, expAssists: 5,
  },
  {
    key: 'W', name: 'Winger', short: 'W', category: 'Attack',
    weights: { dribbling: 0.20, pace: 0.18, crossing: 0.14, finishing: 0.12, shortPass: 0.10, decisions: 0.12, workRate: 0.08, stamina: 0.06 },
    keySkills: ['dribbling', 'pace', 'crossing', 'finishing'],
    expGoals: 10, expAssists: 10,
  },
  {
    key: 'AM', name: 'Attacking Midfielder', short: 'AM', category: 'Midfield',
    weights: { shortPass: 0.16, longPass: 0.14, dribbling: 0.14, decisions: 0.16, finishing: 0.12, pace: 0.08, longShots: 0.10, setPieces: 0.10 },
    keySkills: ['shortPass', 'decisions', 'dribbling', 'longShots'],
    expGoals: 9, expAssists: 12,
  },
  {
    key: 'B2B', name: 'Box-to-Box Midfielder', short: 'B2B', category: 'Midfield',
    weights: { stamina: 0.16, workRate: 0.14, shortPass: 0.14, tackling: 0.12, decisions: 0.12, longShots: 0.10, strength: 0.10, longPass: 0.12 },
    keySkills: ['stamina', 'workRate', 'shortPass', 'tackling'],
    expGoals: 6, expAssists: 7,
  },
  {
    key: 'CM', name: 'Deep-Lying Playmaker', short: 'CM', category: 'Midfield',
    weights: { shortPass: 0.20, longPass: 0.18, decisions: 0.16, workRate: 0.10, stamina: 0.10, tackling: 0.12, leadership: 0.08, setPieces: 0.06 },
    keySkills: ['shortPass', 'longPass', 'decisions', 'tackling'],
    expGoals: 3, expAssists: 9,
  },
  {
    key: 'CB', name: 'Center Back', short: 'CB', category: 'Defense',
    weights: { tackling: 0.24, heading: 0.16, strength: 0.14, decisions: 0.14, pace: 0.10, jumping: 0.12, leadership: 0.06, shortPass: 0.04 },
    keySkills: ['tackling', 'heading', 'strength', 'decisions'],
    expGoals: 2, expAssists: 1,
  },
  {
    key: 'FB', name: 'Full Back', short: 'FB', category: 'Defense',
    weights: { tackling: 0.16, pace: 0.16, crossing: 0.14, stamina: 0.14, shortPass: 0.10, decisions: 0.12, workRate: 0.10, strength: 0.08 },
    keySkills: ['pace', 'crossing', 'tackling', 'stamina'],
    expGoals: 1, expAssists: 6,
  },
  {
    key: 'GK', name: 'Goalkeeper', short: 'GK', category: 'Goalkeeper',
    weights: { reflexes: 0.28, handling: 0.24, decisions: 0.16, jumping: 0.12, leadership: 0.08, longPass: 0.06, strength: 0.06 },
    keySkills: ['reflexes', 'handling', 'decisions', 'jumping'],
    expGoals: 0, expAssists: 0,
  },
];

export const POSITION_MAP: Record<PositionKey, PositionDef> = Object.fromEntries(
  POSITIONS.map((p) => [p.key, p]),
) as Record<PositionKey, PositionDef>;

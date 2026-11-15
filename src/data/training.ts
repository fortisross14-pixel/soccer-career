import type { Intensity, SkillCategory } from '../game/types';

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

export const INTENSITY: Record<Intensity, { label: string; desc: string; growth: number; injury: number; recovery: number }> = {
  light: { label: 'Light', desc: 'Fresher legs, slower growth, fewer injuries.', growth: 0.8, injury: 0.75, recovery: 1.6 },
  normal: { label: 'Normal', desc: 'The standard club programme.', growth: 1, injury: 1, recovery: 1.25 },
  intense: { label: 'Intense', desc: 'Faster growth, but fatigue and injury risk climb.', growth: 1.25, injury: 1.35, recovery: 0.95 },
};

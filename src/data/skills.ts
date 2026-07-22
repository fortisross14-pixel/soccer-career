import type { SkillDef, SkillKey } from '../game/types';

export const SKILLS: SkillDef[] = [
  { key: 'finishing', label: 'Finishing', category: 'Attacking', ageCurve: 'technical' },
  { key: 'longShots', label: 'Long Shots', category: 'Attacking', ageCurve: 'technical' },
  { key: 'heading', label: 'Heading', category: 'Attacking', ageCurve: 'physical' },
  { key: 'crossing', label: 'Crossing', category: 'Attacking', ageCurve: 'technical' },
  { key: 'shortPass', label: 'Short Passing', category: 'Playmaking', ageCurve: 'technical' },
  { key: 'longPass', label: 'Long Passing', category: 'Playmaking', ageCurve: 'mental' },
  { key: 'dribbling', label: 'Dribbling', category: 'Playmaking', ageCurve: 'technical' },
  { key: 'setPieces', label: 'Set Pieces', category: 'Playmaking', ageCurve: 'mental' },
  { key: 'tackling', label: 'Tackling', category: 'Defending', ageCurve: 'technical' },
  { key: 'pace', label: 'Pace', category: 'Physical', ageCurve: 'physical' },
  { key: 'strength', label: 'Strength', category: 'Physical', ageCurve: 'physical' },
  { key: 'stamina', label: 'Stamina', category: 'Physical', ageCurve: 'physical' },
  { key: 'jumping', label: 'Jumping', category: 'Physical', ageCurve: 'physical' },
  { key: 'decisions', label: 'Decisions', category: 'Mental', ageCurve: 'mental' },
  { key: 'workRate', label: 'Work Rate', category: 'Mental', ageCurve: 'mental' },
  { key: 'leadership', label: 'Leadership', category: 'Mental', ageCurve: 'mental' },
  { key: 'reflexes', label: 'Reflexes', category: 'Goalkeeping', ageCurve: 'technical' },
  { key: 'handling', label: 'Handling', category: 'Goalkeeping', ageCurve: 'technical' },
];

export const SKILL_KEYS: SkillKey[] = SKILLS.map((s) => s.key);

export const SKILL_MAP: Record<SkillKey, SkillDef> = Object.fromEntries(
  SKILLS.map((s) => [s.key, s]),
) as Record<SkillKey, SkillDef>;

export const CATEGORY_ORDER: SkillDef['category'][] = [
  'Attacking', 'Playmaking', 'Defending', 'Physical', 'Mental', 'Goalkeeping',
];

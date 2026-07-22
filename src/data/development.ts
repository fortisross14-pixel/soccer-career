import type { SeasonObjective, SkillKey } from '../game/types';

export interface TrainingOption { id: string; label: string; keys: SkillKey[] }

export const TRAINING: TrainingOption[] = [
  { id: 'fin', label: 'Finishing & Shooting', keys: ['finishing', 'longShots'] },
  { id: 'air', label: 'Aerial & Heading', keys: ['heading', 'jumping'] },
  { id: 'vis', label: 'Vision & Long Passing', keys: ['longPass', 'decisions'] },
  { id: 'tmp', label: 'Short Passing & Tempo', keys: ['shortPass', 'workRate'] },
  { id: 'dri', label: 'Dribbling & Flair', keys: ['dribbling', 'pace'] },
  { id: 'def', label: 'Defending & Tackling', keys: ['tackling', 'strength'] },
  { id: 'ath', label: 'Athleticism', keys: ['pace', 'stamina', 'strength'] },
  { id: 'set', label: 'Set Pieces & Crossing', keys: ['setPieces', 'crossing'] },
  { id: 'ldr', label: 'Leadership & Game IQ', keys: ['leadership', 'decisions', 'workRate'] },
  { id: 'gk', label: 'Goalkeeping', keys: ['reflexes', 'handling'] },
];

export const SEASON_OBJECTIVES: { value: SeasonObjective; label: string; desc: string }[] = [
  { value: 'develop', label: 'Develop', desc: 'Prioritize attribute growth and long-term ceiling.' },
  { value: 'play', label: 'Win minutes', desc: 'Push for at least 30 senior appearances.' },
  { value: 'perform', label: 'Perform', desc: 'Target an average rating of 7.2 or higher.' },
  { value: 'trophy', label: 'Win silverware', desc: 'Sacrifice personal priorities for a club trophy.' },
  { value: 'international', label: 'National team', desc: 'Build enough form and reputation to earn a cap.' },
  { value: 'transfer', label: 'Earn a move', desc: 'Increase visibility and attract a stronger or foreign club.' },
  { value: 'recover', label: 'Recover fitness', desc: 'Rebuild your body while accepting weaker output and growth.' },
];

import type { TraitDef } from '../game/types';

export const TRAITS: TraitDef[] = [
  { id: 'speedster', name: 'The Speedster', desc: 'Blistering acceleration nobody can track.', rarity: 5,
    boosts: { pace: 12, dribbling: 6, finishing: 5 }, positions: ['Attack', 'Defense'] },
  { id: 'poacher', name: 'The Poacher', desc: 'Lives in the six-yard box; never misses.', rarity: 4,
    boosts: { finishing: 13, heading: 7, decisions: 5 }, positions: ['Attack'] },
  { id: 'maestro', name: 'The Maestro', desc: 'Sees passes three moves ahead.', rarity: 4,
    boosts: { longPass: 12, shortPass: 9, decisions: 9, leadership: 5 }, positions: ['Midfield'] },
  { id: 'magician', name: 'The Magician', desc: 'Impossible dribbles in tight spaces.', rarity: 3,
    boosts: { dribbling: 14, pace: 6, finishing: 6, decisions: 6 }, positions: ['Attack', 'Midfield'] },
  { id: 'rock', name: 'The Rock', desc: 'An immovable defensive wall.', rarity: 4,
    boosts: { tackling: 12, heading: 9, strength: 9, decisions: 7 }, positions: ['Defense'] },
  { id: 'engine', name: 'The Engine', desc: 'Covers every blade of grass, all game.', rarity: 5,
    boosts: { stamina: 12, workRate: 11, tackling: 5 }, positions: ['Midfield', 'Defense'] },
  { id: 'wall', name: 'The Wall', desc: 'Cat-like reflexes between the sticks.', rarity: 3,
    boosts: { reflexes: 14, handling: 11, decisions: 7 }, positions: ['Goalkeeper'] },
  { id: 'captain', name: 'Born Leader', desc: 'Drags a team to another level.', rarity: 4,
    boosts: { leadership: 14, decisions: 8, workRate: 6 } },
  { id: 'deadball', name: 'Dead-Ball Specialist', desc: 'Free-kicks curl into the top corner.', rarity: 4,
    boosts: { setPieces: 15, longShots: 8, crossing: 6 } },
  { id: 'aerial', name: 'Aerial Dominator', desc: 'Wins everything in the air.', rarity: 4,
    boosts: { heading: 13, jumping: 12, strength: 7 }, positions: ['Attack', 'Defense'] },
];

export const TRAIT_MAP: Record<string, TraitDef> = Object.fromEntries(TRAITS.map((t) => [t.id, t]));

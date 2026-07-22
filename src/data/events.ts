import type { LifeEventDef } from '../game/types';

// Age-banded random life events. Effects are applied to skills each year.
export const EVENTS: LifeEventDef[] = [
  // --- youth (4-17) ---
  { id: 'mentor', desc: 'A wise coach took you under their wing.', minAge: 6, maxAge: 17, weight: 3, effects: { decisions: 8, workRate: 6 } },
  { id: 'street', desc: 'Endless street football with older kids.', minAge: 5, maxAge: 14, weight: 3, effects: { dribbling: 7, pace: 5, workRate: 4 } },
  { id: 'growth', desc: 'A sudden growth spurt.', minAge: 12, maxAge: 16, weight: 3, effects: { strength: 8, jumping: 6, heading: 4 } },
  { id: 'academy-star', desc: 'Named academy player of the year.', minAge: 12, maxAge: 17, weight: 2, effects: { finishing: 5, dribbling: 5, decisions: 5 } },
  { id: 'distracted', desc: 'Fell in with the wrong crowd.', minAge: 13, maxAge: 17, weight: 2, effects: { workRate: -7, decisions: -5, stamina: -4 } },
  { id: 'family', desc: 'A tough year at home built real resilience.', minAge: 10, maxAge: 17, weight: 2, effects: { decisions: 8, leadership: 6, stamina: -3 } },
  { id: 'tournament', desc: 'Shone at an international youth tournament.', minAge: 13, maxAge: 18, weight: 2, effects: { finishing: 6, dribbling: 5, decisions: 4 } },

  // --- adult (18+) ---
  { id: 'worldclass-coach', desc: 'A world-class manager reshaped your game.', minAge: 18, maxAge: 33, weight: 3, effects: { decisions: 9, shortPass: 6, workRate: 5 } },
  { id: 'newborn', desc: 'Welcomed a child — motivation through the roof.', minAge: 22, maxAge: 36, weight: 2, effects: { workRate: 8, leadership: 6 } },
  { id: 'leader', desc: 'Became a voice in the dressing room.', minAge: 24, maxAge: 37, weight: 2, effects: { leadership: 9, decisions: 5 } },
  { id: 'gym', desc: 'Spent the summer transforming your physique.', minAge: 18, maxAge: 30, weight: 3, effects: { strength: 8, stamina: 7, jumping: 4 } },
  { id: 'scandal', desc: 'An off-field scandal wrecked your focus.', minAge: 19, maxAge: 34, weight: 2, effects: { decisions: -8, leadership: -6, workRate: -4 } },
  { id: 'fallout', desc: 'Public fallout with the manager.', minAge: 20, maxAge: 35, weight: 2, effects: { decisions: -6, workRate: -6 } },
  { id: 'nutrition', desc: 'Overhauled your diet and recovery.', minAge: 26, maxAge: 37, weight: 2, effects: { stamina: 6, pace: 3, strength: 3 } },
  { id: 'complacent', desc: 'Big contract, comfort crept in.', minAge: 24, maxAge: 34, weight: 2, effects: { workRate: -6, stamina: -4, pace: -3 } },
  { id: 'reinvented', desc: 'Reinvented yourself in a deeper role.', minAge: 29, maxAge: 40, weight: 2, effects: { longPass: 7, decisions: 7, pace: -4 } },
  { id: 'veteran-voice', desc: 'The dressing-room elder now — pure game intelligence.', minAge: 32, maxAge: 40, weight: 3, effects: { leadership: 6, decisions: 6, pace: -3 } },
  { id: 'body-catches', desc: 'The body finally started catching up with you.', minAge: 33, maxAge: 40, weight: 3, effects: { stamina: -6, pace: -5, strength: -3 } },
  { id: 'last-dance', desc: 'One more season — you trained like a teenager again.', minAge: 34, maxAge: 40, weight: 2, effects: { workRate: 6, stamina: 4, decisions: 3 } },
];

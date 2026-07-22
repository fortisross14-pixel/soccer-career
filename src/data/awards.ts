import type { AwardDef } from '../game/types';

export const AWARDS: AwardDef[] = [
  { id: 'ballon', name: "Ballon d'Or", scope: 'individual', desc: "The world's best player." },
  { id: 'golden-boot', name: 'League Golden Boot', scope: 'individual', desc: 'Top scorer in your league.' },
  { id: 'playmaker', name: 'Playmaker of the Season', scope: 'individual', desc: 'Most assists in your league.' },
  { id: 'league-mvp', name: 'League MVP', scope: 'individual', desc: 'Best overall player in your league.' },
  { id: 'young-player', name: 'Best Young Player', scope: 'individual', desc: 'Best player aged 21 or under.' },
  { id: 'toty', name: 'Team of the Season', scope: 'individual', desc: 'Named in the league best XI.' },
  { id: 'golden-glove', name: 'Golden Glove', scope: 'individual', desc: 'Best goalkeeper in your league.' },
  { id: 'ucl-golden', name: 'Champions Cup Top Scorer', scope: 'individual', desc: 'Top scorer in continental play.' },
  { id: 'wc-golden-ball', name: 'World Cup Golden Ball', scope: 'national', desc: 'Best player at the World Cup.' },
  { id: 'wc-golden-boot', name: 'World Cup Golden Boot', scope: 'national', desc: 'Top scorer at the World Cup.' },
];

export const AWARD_MAP: Record<string, AwardDef> = Object.fromEntries(AWARDS.map((a) => [a.id, a]));

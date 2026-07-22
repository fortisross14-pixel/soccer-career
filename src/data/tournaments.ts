// Competition metadata + international cycle logic.
// Domestic league & cup are implicit per club; continental & international
// tournaments run on cycles keyed off the season counter.

export interface Tournament {
  id: string;
  name: string;
  scope: 'continental-club' | 'international';
  confederations?: string[];
}

export const CONTINENTAL_CLUB: Record<string, { cl: string; el: string }> = {
  UEFA: { cl: 'Champions Cup', el: 'Europa Cup' },
  CONMEBOL: { cl: 'Copa Libertadores', el: 'Copa Sudamericana' },
  CONCACAF: { cl: 'CONCACAF Champions Cup', el: 'CONCACAF League' },
  AFC: { cl: 'AFC Champions League', el: 'AFC Cup' },
  CAF: { cl: 'CAF Champions League', el: 'CAF Confed Cup' },
};

// The World Cup runs every 4 years; continental national cups on the even
// off-years. Season 0 == a World Cup year for a clean start.
export function worldCupThisYear(season: number): boolean {
  return season % 4 === 0;
}

export function continentalNationsThisYear(season: number): boolean {
  return season % 4 === 2;
}

export const CONTINENTAL_NATIONS: Record<string, string> = {
  UEFA: 'European Championship',
  CONMEBOL: 'Copa América',
  CONCACAF: 'Gold Cup',
  AFC: 'Asian Cup',
  CAF: 'Africa Cup of Nations',
};

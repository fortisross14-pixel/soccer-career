import type { Honor, Player } from '../game/types';

function honorCount(list: Honor[], match: (label: string) => boolean): number {
  return list.filter((h) => match(h.label)).reduce((s, h) => s + h.count, 0);
}

export interface LegacyResult { score: number; tier: string; blurb: string }

export function computeLegacy(p: Player): LegacyResult {
  const t = p.totals;
  const clubTitles = honorCount(p.honors.club, (l) => l.includes('Title'));
  const continental = honorCount(p.honors.club, (l) => l.includes('Winner') && !l.includes('World') && !l.includes('Cup Winner'));
  const cups = honorCount(p.honors.club, (l) => l.includes('Cup'));
  const ballons = honorCount(p.honors.individual, (l) => l.includes("Ballon d'Or"));
  const boots = honorCount(p.honors.individual, (l) => l.includes('Golden Boot'));
  const toty = honorCount(p.honors.individual, (l) => l.includes('Team of the Season'));
  const wcWins = honorCount(p.honors.national, (l) => l.includes('World Cup Winner'));
  const contNat = honorCount(p.honors.national, (l) => l.includes('Winner'));

  const score =
    t.games * 0.3 +
    t.goals * 1.1 +
    t.assists * 0.7 +
    t.caps * 0.6 +
    t.intlGoals * 1.2 +
    clubTitles * 18 +
    cups * 6 +
    continental * 34 +
    toty * 10 +
    boots * 16 +
    ballons * 90 +
    contNat * 40 +
    wcWins * 70;

  let tier: string, blurb: string;
  if (score >= 2600) { tier = 'Immortal'; blurb = 'A name spoken in the same breath as the greatest to ever play.'; }
  else if (score >= 1500) { tier = 'Icon'; blurb = 'A global icon who defined an era of the sport.'; }
  else if (score >= 800) { tier = 'Legend'; blurb = 'A bona fide legend, adored wherever the game is played.'; }
  else if (score >= 400) { tier = 'Club Hero'; blurb = 'A beloved figure whose shirt hangs in the rafters.'; }
  else if (score >= 150) { tier = 'Solid Pro'; blurb = 'A dependable professional with a respectable career.'; }
  else { tier = 'Journeyman'; blurb = 'A grafter who lived the dream, if only for a while.'; }

  return { score: Math.round(score), tier, blurb };
}

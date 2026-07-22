import { createPlayer } from '../src/engines/newgame';
import { advanceYear, signOffer, searchForClubs } from '../src/game/engine';
import { playerOverall } from '../src/engines/overall';
import { POSITIONS } from '../src/data/positions';
import type { Player, SquadRole } from '../src/game/types';
const RR: Record<SquadRole, number> = { star: 5, starter: 4, rotation: 3, youth: 2, fringe: 1, reserve: 0 };
function play(p0: Player): Player {
  let p = p0, g = 0;
  while (!p.retired && g++ < 60) {
    if (p.age >= 18 && !p.searchedThisYear && Math.random() < 0.6) p = searchForClubs(p, Math.random() < 0.5 ? 'international' : 'domestic');
    if (p.offers.length) {
      const ranked = [...p.offers].sort((a, b) => (RR[b.role] >= 3 ? 1 : 0) - (RR[a.role] >= 3 ? 1 : 0) || b.clubRating - a.clubRating);
      const pick = ranked.find((o) => RR[o.role] >= 3 || p.age <= 19) ?? ranked[0];
      p = signOffer(p, p.offers.indexOf(pick));
    }
    p = advanceYear(p, POSITIONS.find((x) => x.key === p.position)!.keySkills).player;
  }
  return p;
}
function dump(pos: any, seed: string) {
  let best: Player | null = null;
  for (let i = 0; i < 40; i++) { const p = play(createPlayer(seed, 'Brazil', pos)); if (!best || (p.legacyScore||0) > (best.legacyScore||0)) best = p; }
  const p = best!;
  console.log(`\n### Best ${pos} of 40 — ${p.name}: peak ovr ${Math.max(...p.history.map(h=>h.overall))}, ${p.totals.goals}g/${p.totals.assists}a in ${p.totals.games} apps, ${p.totals.caps} caps`);
  console.log('legacy:', p.legacyTier, p.legacyScore);
  console.log('honors:', JSON.stringify(p.honors.individual.map(h=>`${h.label}${h.count>1?' x'+h.count:''}`)));
  console.log('club:', JSON.stringify(p.honors.club.map(h=>`${h.label}${h.count>1?' x'+h.count:''}`)));
  const peak = p.history.reduce((a,b)=> b.goals>a.goals?b:a, p.history[0]);
  console.log('best season:', peak.age+'yo', peak.clubName, `${peak.games} apps ${peak.goals}g ${peak.assists}a rating ${peak.rating}`);
}
dump('ST', 'Ronaldo');
dump('GK', 'Buffon');
dump('CB', 'Maldini');
dump('CM', 'Pirlo');

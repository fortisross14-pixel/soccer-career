import { createPlayer } from '../src/engines/newgame';
import { advanceYear, signOffer, searchForClubs } from '../src/game/engine';
import { playerOverall } from '../src/engines/overall';
import { POSITIONS } from '../src/data/positions';
import { COUNTRIES } from '../src/data/countries';
import type { Player, SquadRole } from '../src/game/types';

const ROLE_RANK: Record<SquadRole, number> = { star: 5, starter: 4, rotation: 3, youth: 2, fringe: 1, reserve: 0 };

// Simple "ambitious" AI: sign the best offer that keeps you at least a
// rotation option, preferring the strongest club where you'd start.
function autoPlay(p0: Player): Player {
  let p = p0;
  let guard = 0;
  while (!p.retired && guard++ < 60) {
    // scouting: from 18, occasionally look abroad for a better move
    if (p.age >= 18 && !p.searchedThisYear && Math.random() < 0.6) {
      p = searchForClubs(p, Math.random() < 0.5 ? 'international' : 'domestic');
    }
    // choose an offer
    if (p.offers.length) {
      const ovr = playerOverall(p);
      // prefer: highest club rating where role >= rotation; else best role
      const ranked = [...p.offers].sort((a, b) => {
        const ra = ROLE_RANK[a.role] >= 3 ? 1 : 0;
        const rb = ROLE_RANK[b.role] >= 3 ? 1 : 0;
        if (ra !== rb) return rb - ra;
        return b.clubRating - a.clubRating;
      });
      // don't chase a bench role at a huge club unless very young
      const pick = ranked.find((o) => ROLE_RANK[o.role] >= 3 || p.age <= 19) ?? ranked[0];
      const idx = p.offers.indexOf(pick);
      if (idx >= 0 && (!p.contract || pick.clubRating > (playerOverall(p)))) {
        p = signOffer(p, idx);
      }
      void ovr;
    }
    // train position key skills
    const keys = POSITIONS.find((x) => x.key === p.position)!.keySkills;
    const res = advanceYear(p, keys);
    p = res.player;
  }
  return p;
}

function run(n: number) {
  const peakOveralls: number[] = [];
  const careerGoals: number[] = [];
  const careerGames: number[] = [];
  const bestSeasonGoals: number[] = [];
  let ballon = 0, boots = 0, wc = 0, anyNT = 0, crashed = 0, nan = 0;
  const tierCount: Record<string, number> = {};

  for (let i = 0; i < n; i++) {
    const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].name;
    let p = createPlayer(`Sim ${i}`, country, pos.key);
    try {
      p = autoPlay(p);
    } catch (e) {
      crashed++; continue;
    }
    const peak = Math.max(...p.history.map((h) => h.overall), playerOverall(p));
    if (Number.isNaN(peak) || Number.isNaN(p.totals.goals)) { nan++; continue; }
    peakOveralls.push(peak);
    careerGoals.push(p.totals.goals);
    careerGames.push(p.totals.games);
    bestSeasonGoals.push(Math.max(0, ...p.history.map((h) => h.goals)));
    ballon += p.honors.individual.filter((h) => h.label.includes('Ballon')).reduce((s, h) => s + h.count, 0);
    boots += p.honors.individual.filter((h) => h.label.includes('Golden Boot')).reduce((s, h) => s + h.count, 0);
    wc += p.honors.national.filter((h) => h.label.includes('World Cup Winner')).reduce((s, h) => s + h.count, 0);
    if (p.totals.caps > 0) anyNT++;
    tierCount[p.legacyTier || '?'] = (tierCount[p.legacyTier || '?'] || 0) + 1;
  }

  const stats = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    const q = (p: number) => s[Math.floor(p * (s.length - 1))];
    const mean = s.reduce((a, b) => a + b, 0) / s.length;
    return { min: s[0], p25: q(0.25), median: q(0.5), p75: q(0.75), p90: q(0.9), max: s[s.length - 1], mean: +mean.toFixed(1) };
  };

  console.log(`\n=== ${n} simulated careers ===`);
  console.log('crashes:', crashed, ' NaN:', nan);
  console.log('peak overall   ', stats(peakOveralls));
  console.log('career goals   ', stats(careerGoals));
  console.log('career apps    ', stats(careerGames));
  console.log('best-season goals', stats(bestSeasonGoals));
  console.log('Ballon d\'Or total:', ballon, `(${(ballon / n).toFixed(2)}/career)`);
  console.log('Golden Boots total:', boots, `(${(boots / n).toFixed(2)}/career)`);
  console.log('World Cups won:', wc);
  console.log('reached NT:', `${((anyNT / n) * 100).toFixed(0)}%`);
  console.log('legacy tiers:', tierCount);
}

run(400);

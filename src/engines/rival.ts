import type { Player, RivalSeason } from '../game/types';
import { POSITION_MAP } from '../data/positions';
import { clamp, randInt } from './util';

const CLUBS = ['Real Madrid','FC Barcelona','Manchester City','Liverpool','Arsenal','Bayern Munich','Paris Saint-Germain','Inter Milan','AC Milan','Atlético Madrid','Borussia Dortmund','Benfica'];

export function advanceRival(p: Player): RivalSeason {
  const prior = p.rivalOverall ?? 38;
  const growth = p.age < 18 ? randInt(2, 6) : p.age < 24 ? randInt(1, 4) : p.age < 30 ? randInt(-1, 2) : randInt(-3, 0);
  const overall = clamp(prior + growth, 25, 96);
  if (p.age >= 16 && (!p.rivalClubName || p.rivalClubName.includes('Academy') || Math.random() < .12)) {
    p.rivalClubName = CLUBS[randInt(0, CLUBS.length - 1)];
  }
  const senior = p.age >= 16;
  const games = senior ? randInt(14, 38) : randInt(8, 24);
  const pos = POSITION_MAP[p.rivalPosition ?? p.position];
  const quality = Math.max(.3, overall / 82);
  const goals = Math.max(0, Math.round((pos.expGoals / 38) * games * quality * (.7 + Math.random() * .65)));
  const assists = Math.max(0, Math.round((pos.expAssists / 38) * games * quality * (.7 + Math.random() * .65)));
  const rating = +(5.7 + (overall - 45) / 28 + Math.random() * .8).toFixed(1);
  const trophies = senior && overall > 75 && Math.random() < .18 ? 1 : 0;
  const row: RivalSeason = { age: p.age, season: p.season, clubName: p.rivalClubName ?? 'Youth Academy', overall, games, goals, assists, rating, trophies };
  p.rivalOverall = overall;
  p.rivalHistory ??= [];
  p.rivalHistory.push(row);
  p.rivalTotals ??= { games: 0, goals: 0, assists: 0, trophies: 0 };
  p.rivalTotals.games += games; p.rivalTotals.goals += goals; p.rivalTotals.assists += assists; p.rivalTotals.trophies += trophies;
  return row;
}

import type { Career, Fixture, SeasonState, SeasonStats, TableRow, ContinentalSpot } from '../game/types';
import { CLUBS, CLUB_MAP, clubsInCountry } from '../data/clubs';
import { COUNTRIES, getCountry, leagueNameFor } from '../data/countries';
import { realisticName } from '../data/names';
import { CONTINENTAL_CLUB, CONTINENTAL_NATIONS } from '../data/tournaments';
import { pick, shuffle, uid, poisson, clamp, chance, noise, rng } from './util';
import { teamRating } from './teams';
import { playerOverall } from './overall';
import { divOf, leagueClubs, leagueRepFor } from './world';

// Season Y runs from day 0 (1 July Y) to day 359 (30 June Y+1); 30-day months.
export const LEAGUE_START = 36;
export const LEAGUE_END = 318;
export const CUP_ROUNDS = [
  { day: 95, stage: 'Round of 32' }, { day: 155, stage: 'Round of 16' }, { day: 215, stage: 'Quarter-final' },
  { day: 262, stage: 'Semi-final' }, { day: 322, stage: 'Final' },
];
export const CONT_GROUP_DAYS = [74, 101, 116, 133, 146, 163];
export const CONT_KO = [
  { day: 228, stage: 'Round of 16' }, { day: 258, stage: 'Quarter-final' }, { day: 290, stage: 'Semi-final' }, { day: 328, stage: 'Final' },
];
export const INTL_BREAKS: Record<number, number[]> = { 2: [66, 69], 3: [96, 99], 4: [126, 129], 8: [246, 249] };
export const TOURNAMENT_DAYS = [333, 337, 341, 345, 349, 353, 357];

export function emptyStats(): SeasonStats {
  return {
    apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, ratingSum: 0, rated: 0, motm: 0, cleanSheets: 0,
    leagueApps: 0, leagueGoals: 0, leagueAssists: 0, leagueRatingSum: 0, leagueRated: 0, contGoals: 0,
    intlCaps: 0, intlGoals: 0, intlAssists: 0,
  };
}

/** circle-method double round robin */
function roundRobin(ids: string[]): [string, string][][] {
  const teams = [...ids];
  if (teams.length % 2 === 1) teams.push('BYE');
  const n = teams.length;
  const first: [string, string][][] = [];
  const arr = [...teams];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    first.push(pairs);
    arr.splice(1, 0, arr.pop()!);
  }
  const flipped = first.map((round) => round.map(([h, a]) => [a, h] as [string, string]));
  // small leagues meet more often so every league has ~30-34 matchdays
  const cycles = clamp(Math.round(33 / (n - 1)), 2, 6);
  const out: [string, string][][] = [];
  for (let c = 0; c < cycles; c++) out.push(...(c % 2 === 0 ? first : flipped));
  return out;
}

export function confedOf(country: string) { return getCountry(country).confederation; }

export function continentalName(country: string, key: ContinentalSpot): string {
  const names = CONTINENTAL_CLUB[confedOf(country)] ?? CONTINENTAL_CLUB.UEFA;
  return key === 'CL' ? names.cl : key === 'EL' ? names.el : '';
}

function continentalOpponent(clubId: string, key: ContinentalSpot, strong: boolean, exclude: Set<string>): string {
  const club = CLUB_MAP[clubId];
  const confed = confedOf(club.country);
  let pool = CLUBS.filter((c) => c.division === 1 && c.id !== clubId && !exclude.has(c.id) && confedOf(c.country) === confed && c.country !== club.country);
  if (pool.length < 4) pool = CLUBS.filter((c) => c.division === 1 && c.id !== clubId && !exclude.has(c.id) && confedOf(c.country) === confed);
  const tierPool = pool.filter((c) => (key === 'CL' ? c.rating >= 77 : c.rating >= 71 && c.rating <= 84));
  const base = tierPool.length >= 3 ? tierPool : pool;
  const sorted = [...base].sort((a, b) => b.rating - a.rating);
  return (strong ? pick(sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 3)))) : pick(sorted)).id;
}

export function cupOpponent(clubId: string, roundIdx: number): string {
  const club = CLUB_MAP[clubId];
  const pool = clubsInCountry(club.country).filter((c) => c.id !== clubId);
  const sorted = [...pool].sort((a, b) => b.rating - a.rating);
  // later rounds are tougher
  const slice = roundIdx >= 3 ? sorted.slice(0, Math.max(3, Math.ceil(sorted.length / 3))) : roundIdx >= 2 ? sorted.slice(0, Math.ceil(sorted.length * 0.6)) : sorted;
  return pick(slice).id;
}

export function contKnockoutOpponent(clubId: string, key: ContinentalSpot, idx: number): string {
  return continentalOpponent(clubId, key, idx >= 1, new Set());
}

export function makeFixture(f: Omit<Fixture, 'id' | 'played'>): Fixture {
  return { ...f, id: uid('f'), played: false };
}

/** Quick result for matches without the player. */
export function quickResult(homeId: string, awayId: string): [number, number] {
  const rh = teamRating(homeId) + 2.5;
  const ra = teamRating(awayId);
  const lh = clamp(1.35 * Math.exp((rh - ra) / 22), 0.25, 3.6);
  const la = clamp(1.15 * Math.exp((ra - rh) / 22), 0.2, 3.4);
  return [poisson(lh), poisson(la)];
}

export function applyToTable(table: TableRow[], homeId: string, awayId: string, hg: number, ag: number) {
  const h = table.find((r) => r.clubId === homeId);
  const a = table.find((r) => r.clubId === awayId);
  if (!h || !a) return;
  h.p++; a.p++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
  if (hg > ag) { h.w++; a.l++; h.pts += 3; h.form.push('W'); a.form.push('L'); }
  else if (hg < ag) { a.w++; h.l++; a.pts += 3; h.form.push('L'); a.form.push('W'); }
  else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('D'); a.form.push('D'); }
  if (h.form.length > 5) h.form.shift();
  if (a.form.length > 5) a.form.shift();
}

export function sortedTable(table: TableRow[]): TableRow[] {
  return [...table].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || teamRating(b.clubId) - teamRating(a.clubId));
}

export function tablePosition(s: SeasonState): number {
  return sortedTable(s.table).findIndex((r) => r.clubId === s.clubId) + 1;
}

/** World Cup in June of years where (Y+1) % 4 == 2 (2026, 2030...), continental cups two years later. */
export function nationalTournament(seasonYear: number, country: string): string | null {
  const y = seasonYear + 1;
  if (y % 4 === 2) return 'World Cup';
  if (y % 4 === 0) return CONTINENTAL_NATIONS[confedOf(country)] ?? 'Continental Championship';
  return null;
}

export function nationalOpponent(country: string, strong: boolean): string {
  const pool = COUNTRIES.filter((c) => c.name !== country).sort((a, b) => b.nationalStrength - a.nationalStrength);
  return `nat:${(strong ? pick(pool.slice(0, 6)) : pick(pool)).name}`;
}

/**
 * Build the season for a club. When joining mid-season (`fromDay` > 0), the
 * league rounds before that date are simulated without you, and you are
 * cup-tied for the cup and continental competitions.
 */
export function buildSeason(career: Career, clubId: string, fromDay = 0): SeasonState {
  const club = CLUB_MAP[clubId];
  const country = getCountry(club.country);
  const division = divOf(career, clubId);
  const peers = leagueClubs(career, club.country, division);
  const rr = roundRobin(shuffle(peers.map((c) => c.id)));
  const span = LEAGUE_END - LEAGUE_START;
  const rounds = rr.map((pairs, i) => ({ day: Math.round(LEAGUE_START + (span * i) / Math.max(1, rr.length - 1)), pairs }));
  const table: TableRow[] = peers.map((c) => ({ clubId: c.id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }));

  let roundsPlayed = 0;
  for (const r of rounds) {
    if (r.day >= fromDay) break;
    for (const [h, a] of r.pairs) {
      const [hg, ag] = quickResult(h, a);
      applyToTable(table, h, a, hg, ag);
    }
    roundsPlayed++;
  }

  const fixtures: Fixture[] = [];
  const leagueName = leagueNameFor(club.country, division);
  rounds.forEach((r, i) => {
    if (r.day < fromDay) return;
    const pair = r.pairs.find(([h, a]) => h === clubId || a === clubId);
    if (!pair) return;
    const home = pair[0] === clubId;
    fixtures.push(makeFixture({ day: r.day, comp: 'league', compName: leagueName, stage: `Matchday ${i + 1}`, usId: clubId, oppId: home ? pair[1] : pair[0], home }));
  });

  const fresh = fromDay === 0;
  let cupAlive = false;
  if (fresh) {
    cupAlive = true;
    fixtures.push(makeFixture({ day: CUP_ROUNDS[0].day, comp: 'cup', compName: `${country.name} Cup`, stage: CUP_ROUNDS[0].stage, usId: clubId, oppId: cupOpponent(clubId, 0), home: chance(0.5) }));
  }

  let contKey: ContinentalSpot = 'none';
  if (fresh && division === 1) {
    const q = career.qualified;
    contKey = q && q.clubId === clubId ? q.key : club.division === 1 ? club.continental : 'none';
  }
  const contName = continentalName(club.country, contKey);
  if (contKey !== 'none') {
    const opps: string[] = [];
    const ex = new Set<string>();
    for (let i = 0; i < 3; i++) { const o = continentalOpponent(clubId, contKey, i === 0, ex); ex.add(o); opps.push(o); }
    const order = [0, 1, 2, 0, 1, 2];
    CONT_GROUP_DAYS.forEach((day, i) => {
      fixtures.push(makeFixture({ day, comp: 'continental', compName: contName, stage: `Group · MD${i + 1}`, usId: clubId, oppId: opps[order[i]], home: i < 3 ? i % 2 === 0 : i % 2 === 1 }));
    });
  }

  fixtures.sort((a, b) => a.day - b.day);
  return {
    year: career.year,
    clubId,
    clubName: club.name,
    country: club.country,
    leagueName,
    division,
    table,
    rounds,
    roundsPlayed,
    fixtures,
    cupAlive,
    contKey,
    contName,
    contAlive: contKey !== 'none',
    stats: emptyStats(),
    scorers: makeScorers(club.country, division, peers.map((p) => p.id).filter((id) => id !== clubId), rounds.length, country.leagueRep),
    honors: [],
    awards: [],
    ovrStart: playerOverall(career.player),
    clubsThisSeason: [club.name],
    ended: false,
  };
}

/** the league's scoring race: rival forwards with season targets */
function makeScorers(country: string, div: number, clubIds: string[], rounds: number, baseRep: number) {
  const rep = leagueRepFor(baseRep, div);
  const leader = (17 + (rep - 70) * 0.08 + noise() * 3) * (rounds / 34);
  const ratios = [1, 0.9, 0.84, 0.78, 0.72, 0.68, 0.64, 0.6, 0.56];
  return ratios.map((r, i) => ({
    name: realisticName(country, `scorer-${country}-${div}-${i}-${rng()}`),
    clubId: clubIds[Math.floor(rng() * clubIds.length)] ?? clubIds[0],
    target: Math.max(3, Math.round(leader * r * (0.95 + rng() * 0.1))),
    jitter: rng() - 0.5,
  }));
}

export interface ScorerRow { name: string; clubId: string; goals: number; me: boolean }

/** current top-scorer table including the player */
export function scorerTable(s: SeasonState, playerName: string): { rows: ScorerRow[]; myRank: number } {
  const prog = s.rounds.length ? s.roundsPlayed / s.rounds.length : 0;
  const rows: ScorerRow[] = s.scorers.map((x) => ({ name: x.name, clubId: x.clubId, goals: Math.max(0, Math.floor(x.target * prog + x.jitter * prog + 0.5 * prog)), me: false }));
  rows.push({ name: playerName, clubId: s.clubId, goals: s.stats.leagueGoals, me: true });
  rows.sort((a, b) => b.goals - a.goals || (a.me ? -1 : b.me ? 1 : 0));
  return { rows, myRank: rows.findIndex((r) => r.me) + 1 };
}

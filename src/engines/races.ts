import type { Career, CompKind, PositionKey, SeasonState } from '../game/types';
import { realisticName } from '../data/names';
import { CLUB_MAP } from '../data/clubs';
import { clamp, chance, noise, rng, weightedPick } from './util';
import { teamName } from './teams';

// ------------------------------------------------------------
// Award races for every competition the player is in: scorers,
// MVP and best player by position. Each race has ~6 rivals whose
// final numbers are fixed at the start of the season and revealed
// as it progresses; the player's live numbers are compared to them.
// ------------------------------------------------------------

export type PosGroup = 'GK' | 'DEF' | 'MID' | 'FWD';
export const GROUP_LABEL: Record<PosGroup, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };

export function groupOf(pos: PositionKey): PosGroup {
  if (pos === 'GK') return 'GK';
  if (pos === 'CB' || pos === 'FB') return 'DEF';
  if (pos === 'ST' || pos === 'W') return 'FWD';
  return 'MID';
}

export interface RaceRival { name: string; team: string; target: number; jitter: number }
export interface Race {
  id: string;
  comp: CompKind;
  compName: string;
  kind: 'goals' | 'rating';
  label: string;        // award name
  group?: PosGroup;     // for best-by-position races
  rivals: RaceRival[];
  start: number;        // season day the race opens
  end: number;          // season day it is decided
  minApps: number;      // for rating races
}

type Mode = 'runaway' | 'tight' | 'normal';
const pickMode = (): Mode => weightedPick<Mode>(['runaway', 'tight', 'normal'], (m) => (m === 'normal' ? 45 : m === 'tight' ? 30 : 25));

function goalLadder(leader: number, mode: Mode): number[] {
  const r = mode === 'runaway' ? [1, 0.82, 0.78, 0.72, 0.69, 0.64] : mode === 'tight' ? [1, 0.97, 0.95, 0.95, 0.93, 0.9] : [1, 0.9, 0.85, 0.8, 0.75, 0.7];
  return r.map((x) => Math.max(1, Math.round(leader * x * (0.97 + rng() * 0.06))));
}

function ratingLadder(leader: number, mode: Mode): number[] {
  const gaps = mode === 'runaway' ? [0, 0.24, 0.29, 0.34, 0.38, 0.42] : mode === 'tight' ? [0, 0.01, 0.02, 0.04, 0.05, 0.07] : [0, 0.07, 0.12, 0.17, 0.22, 0.27];
  return gaps.map((g) => Math.round((leader - g - rng() * 0.015) * 100) / 100);
}

interface Ctx { country: string; teams: string[]; usTeam: string }

function rivals(ctx: Ctx, values: number[], seed: string): RaceRival[] {
  return values.map((v, i) => ({
    name: realisticName(ctx.country, `${seed}-${i}-${rng()}`),
    team: teamName(ctx.teams[Math.floor(rng() * ctx.teams.length)] ?? ctx.usTeam),
    target: v,
    jitter: rng() - 0.5,
  }));
}

function goalsRace(id: string, comp: CompKind, compName: string, label: string, ctx: Ctx, leader: number, start: number, end: number, extra: RaceRival[] = []): Race {
  const generic = rivals(ctx, goalLadder(leader, pickMode()), id);
  const all = [...extra, ...generic].sort((a, b) => b.target - a.target).slice(0, 6);
  return { id, comp, compName, kind: 'goals', label, rivals: all, start, end, minApps: 0 };
}

function ratingRace(id: string, comp: CompKind, compName: string, label: string, ctx: Ctx, leader: number, start: number, end: number, minApps: number, group?: PosGroup, extra: RaceRival[] = []): Race {
  const generic = rivals(ctx, ratingLadder(leader, pickMode()), id);
  const all = [...extra, ...generic].sort((a, b) => b.target - a.target).slice(0, 6);
  return { id, comp, compName, kind: 'rating', label, group, rivals: all, start, end, minApps };
}

/** races for a club or youth league season */
export function leagueRaces(c: Career, s: SeasonState, peerIds: string[], quality: number): Race[] {
  const ctx: Ctx = { country: s.country, teams: peerIds.filter((id) => id !== s.clubId), usTeam: s.clubId };
  const n = s.rounds.length;
  const scale = n / 34;
  const lname = s.leagueName;
  const start = s.rounds[0]?.day ?? 36;
  const end = s.rounds[n - 1]?.day ?? 318;
  const minApps = Math.ceil(n * 0.45);
  // world stars in this league join the goal race and the MVP race
  const stars = s.youth ? [] : (c.stars ?? []).filter((st) => peerIds.includes(st.clubId));
  const starGoals = stars.map((st) => ({ name: st.name, team: CLUB_MAP[st.clubId]?.name ?? '', target: Math.round(st.cur.goals * scale), jitter: rng() - 0.5 }));
  const starRating = stars.map((st) => ({ name: st.name, team: CLUB_MAP[st.clubId]?.name ?? '', target: Math.round(clamp(6.95 + (st.ovr - 80) * 0.07 + noise() * 0.08, 6.8, 8.2) * 100) / 100, jitter: rng() - 0.5 }));
  // better leagues have better players: the rating bar rises with league quality
  const lift = s.youth ? 0.05 : clamp((quality - 70) * 0.014, -0.15, 0.35);
  const leader = Math.max(4, (s.youth ? 13 + noise() * 3 : 18 + (quality - 70) * 0.1 + noise() * 4) * scale);
  const races: Race[] = [
    goalsRace('lg-goals', 'league', lname, `${lname} Golden Boot`, ctx, leader, start, end, starGoals),
    ratingRace('lg-mvp', 'league', lname, `${lname} Player of the Season`, ctx, lift + 7.5 + noise() * 0.2, start, end, minApps, undefined, starRating.slice(0, 3)),
  ];
  const base: Record<PosGroup, number> = { GK: 7.25, DEF: 7.22, MID: 7.3, FWD: 7.35 };
  for (const g of ['GK', 'DEF', 'MID', 'FWD'] as PosGroup[]) {
    races.push(ratingRace(`lg-${g}`, 'league', lname, `${lname} Best ${GROUP_LABEL[g]}`, ctx, lift + base[g] + noise() * 0.15, start, end, minApps, g, starRating.filter((_, i) => groupOf(stars[i].pos) === g)));
  }
  return races;
}

export function cupRaces(s: SeasonState, cupName: string, peerIds: string[]): Race[] {
  const ctx: Ctx = { country: s.country, teams: peerIds, usTeam: s.clubId };
  return [goalsRace('cup-goals', 'cup', cupName, `${cupName} Top Scorer`, ctx, 4 + Math.floor(rng() * 4), 95, 322)];
}

export function contRaces(c: Career, s: SeasonState, teamIds: string[]): Race[] {
  const ctx: Ctx = { country: s.country, teams: teamIds, usTeam: s.clubId };
  const starGoals = (c.stars ?? []).filter((st) => teamIds.includes(st.clubId) && st.cur.cont > 0).map((st) => ({ name: st.name, team: CLUB_MAP[st.clubId]?.name ?? '', target: st.cur.cont, jitter: rng() - 0.5 }));
  return [
    goalsRace('ct-goals', 'continental', s.contName, `${s.contName} Top Scorer`, ctx, 6 + Math.floor(rng() * 4), 74, 328, starGoals),
    ratingRace('ct-mvp', 'continental', s.contName, `${s.contName} Best Player`, ctx, 7.5 + noise() * 0.2, 74, 328, 4),
  ];
}

export function tournamentRaces(s: SeasonState, name: string, nations: string[]): Race[] {
  const ctx: Ctx = { country: s.country, teams: nations.map((n) => `nat:${n}`), usTeam: `nat:${s.country}` };
  const r = [
    goalsRace('nt-goals', 'national', name, `${name} Golden Boot`, ctx, 4 + Math.floor(rng() * 4), 330, 359),
    ratingRace('nt-mvp', 'national', name, `${name} Golden Ball`, ctx, 7.55 + noise() * 0.2, 330, 359, 3),
  ];
  // rivals in a tournament come from many countries
  for (const race of r) for (const x of race.rivals) { const n = nations[Math.floor(rng() * nations.length)]; x.name = realisticName(n, `${x.name}-${rng()}`); x.team = n; }
  return r;
}

// ---------------- reading the races ----------------

export interface RaceRow { name: string; team: string; value: number; me: boolean }

function myValue(s: SeasonState, race: Race): { value: number; apps: number } {
  const st = s.stats;
  const avg = (sum: number, n: number) => (n ? Math.round((sum / n) * 100) / 100 : 0);
  switch (race.comp) {
    case 'league': return race.kind === 'goals' ? { value: st.leagueGoals, apps: st.leagueApps } : { value: avg(st.leagueRatingSum, st.leagueRated), apps: st.leagueRated };
    case 'cup': return { value: st.cupGoals ?? 0, apps: 0 };
    case 'continental': return race.kind === 'goals' ? { value: st.contGoals, apps: 0 } : { value: avg(st.contRatingSum ?? 0, st.contRated ?? 0), apps: st.contRated ?? 0 };
    default: return race.kind === 'goals' ? { value: st.tournGoals ?? 0, apps: 0 } : { value: avg(st.tournRatingSum ?? 0, st.tournRated ?? 0), apps: st.tournRated ?? 0 };
  }
}

export function raceProgress(race: Race, day: number): number {
  return clamp((day - race.start) / Math.max(1, race.end - race.start), 0, 1);
}

/** standings: rivals' numbers so far plus you (if the race is for your position) */
export function raceRows(c: Career, s: SeasonState, race: Race, day = c.month * 30): { rows: RaceRow[]; myRank: number | null; eligible: boolean; mine: number } {
  const prog = raceProgress(race, day);
  const rows: RaceRow[] = race.rivals.map((r) => ({
    name: r.name, team: r.team, me: false,
    value: race.kind === 'goals'
      ? Math.max(0, Math.floor(r.target * prog + r.jitter * prog + 0.5 * prog))
      : prog <= 0 ? 0 : Math.round((r.target + r.jitter * 0.6 * (1 - prog)) * 100) / 100,
  }));
  const mineV = myValue(s, race);
  const forMe = !race.group || race.group === groupOf(c.player.position);
  const eligible = race.kind === 'goals' || mineV.apps >= Math.ceil(race.minApps * Math.max(prog, 0.15));
  if (forMe) rows.push({ name: c.player.name, team: s.clubName, value: mineV.value, me: true });
  rows.sort((a, b) => b.value - a.value || (a.me ? -1 : b.me ? 1 : 0));
  const idx = rows.findIndex((r) => r.me);
  return { rows, myRank: idx >= 0 ? idx + 1 : null, eligible, mine: mineV.value };
}

/** decide finished races; returns awards you won */
export function decideRaces(c: Career, s: SeasonState, comps: CompKind[]): { won: string[]; news: string[] } {
  const won: string[] = [];
  const news: string[] = [];
  for (const race of s.races ?? []) {
    if (!comps.includes(race.comp)) continue;
    const forMe = !race.group || race.group === groupOf(c.player.position);
    if (!forMe) continue;
    const mine = myValue(s, race);
    const best = Math.max(...race.rivals.map((r) => r.target));
    const enoughApps = race.kind === 'goals' ? mine.value >= (race.comp === 'league' ? 4 : 2) : mine.apps >= race.minApps;
    const beats = mine.value > best || (mine.value === best && chance(0.5));
    if (enoughApps && beats && mine.value > 0) won.push(race.label);
    else if (enoughApps && race.kind === 'goals' && mine.value >= 3) {
      const rank = [...race.rivals.map((r) => r.target), mine.value].sort((a, b) => b - a).indexOf(mine.value) + 1;
      if (rank <= 6) news.push(`${race.label}: you finish ${rank}${['th', 'st', 'nd', 'rd'][rank] ?? 'th'} with ${mine.value}.`);
    }
  }
  return { won, news };
}

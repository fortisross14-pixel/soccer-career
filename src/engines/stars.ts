import type { Career, PositionKey } from '../game/types';
import { CLUBS, CLUB_MAP } from '../data/clubs';
import { COUNTRIES, getCountry } from '../data/countries';
import { realisticName } from '../data/names';
import { clamp, noise, randInt, rng, uid, weightedPick } from './util';
import { confedOf } from './calendar';

// ------------------------------------------------------------
// The football world around you: ~45 persistent fictional stars
// who age, move clubs, score, win titles and compete with you for
// every individual award. They feed the scoring races, the Ballon
// d'Or vote and the all-time leaderboards.
// ------------------------------------------------------------

export interface StarSeason { goals: number; assists: number; cont: number; cleanSheets: number }

export interface WorldStar {
  id: string;
  name: string;
  country: string;
  pos: PositionKey;
  age: number;
  ovr: number;
  clubId: string;
  cur: StarSeason;           // this season's targets (revealed progressively)
  goals: number;             // career totals
  titles: number;
  ballons: number;
  awards: number;
  peak: number;
}

export interface AwardRow { name: string; clubName: string; points: number; me?: boolean }
export interface AwardYear {
  year: number;
  ballon: AwardRow[];        // top 10
  myBallonRank: number | null;
  glove: AwardRow;
  defender: AwardRow;
  champions: { label: string; club: string }[];
}

const POS_POOL: PositionKey[] = ['ST', 'ST', 'ST', 'ST', 'ST', 'ST', 'W', 'W', 'W', 'W', 'W', 'AM', 'AM', 'AM', 'CM', 'CM', 'B2B', 'B2B', 'CB', 'CB', 'CB', 'CB', 'FB', 'FB', 'FB', 'GK', 'GK', 'GK'];
const ATTACK: Partial<Record<PositionKey, number>> = { ST: 1, W: 0.72, AM: 0.62, B2B: 0.32, CM: 0.22, FB: 0.1, CB: 0.09, GK: 0 };
const CREATE: Partial<Record<PositionKey, number>> = { ST: 0.35, W: 0.7, AM: 0.9, B2B: 0.45, CM: 0.6, FB: 0.35, CB: 0.08, GK: 0 };

export const isDefender = (p: PositionKey) => p === 'CB' || p === 'FB';

function clubFor(ovr: number, exclude?: string): string {
  const pool = CLUBS.filter((c) => c.division === 1 && c.rating >= Math.min(ovr - 6, 86) && c.rating <= ovr + 4 && c.id !== exclude);
  const fallback = CLUBS.filter((c) => c.division === 1 && c.rating >= 80);
  const list = pool.length ? pool : fallback;
  return weightedPick(list, (c) => (c.rating - 70) ** 2).id;
}

function newStar(age: number, ovr: number): WorldStar {
  const country = weightedPick(COUNTRIES, (c) => (c.nationalStrength - 65) ** 2).name;
  return {
    id: uid('st'), name: realisticName(country, `star-${rng()}`), country, pos: POS_POOL[Math.floor(rng() * POS_POOL.length)],
    age, ovr, clubId: clubFor(ovr), cur: { goals: 0, assists: 0, cont: 0, cleanSheets: 0 }, goals: 0, titles: 0, ballons: 0, awards: 0, peak: ovr,
  };
}

export function initStars(): WorldStar[] {
  const out: WorldStar[] = [];
  for (let i = 0; i < 45; i++) {
    const ovr = Math.round(clamp(78 + Math.abs(noise()) * 15 + noise() * 2, 76, 94));
    const age = randInt(19, 33);
    const s = newStar(age, ovr);
    // give veterans some history so all-time tables start populated
    const yrs = Math.max(0, age - 19);
    s.goals = Math.round(yrs * (ATTACK[s.pos] ?? 0) * (ovr - 66) * 0.9);
    s.titles = Math.round(yrs * 0.25 * (ovr - 74) / 10);
    out.push(s);
  }
  return out;
}

/** season targets for every star (league goals scale to ~34 games) */
export function setSeasonTargets(stars: WorldStar[]) {
  for (const s of stars) {
    const club = CLUB_MAP[s.clubId];
    const strength = club ? 0.85 + (club.rating - 80) / 40 : 1;
    const base = Math.max(0, (s.ovr - 70) * 1.15 + 7);
    s.cur = {
      goals: Math.max(0, Math.round(base * (ATTACK[s.pos] ?? 0) * strength * (0.85 + rng() * 0.3))),
      assists: Math.max(0, Math.round(base * 0.55 * (CREATE[s.pos] ?? 0) * strength * (0.8 + rng() * 0.4))),
      cont: club && club.continental !== 'none' ? Math.max(0, Math.round(base * 0.3 * (ATTACK[s.pos] ?? 0) * (0.6 + rng() * 0.8))) : 0,
      cleanSheets: s.pos === 'GK' || isDefender(s.pos) ? Math.round(8 + (s.ovr - 75) * 0.5 + (club ? (club.rating - 80) * 0.3 : 0) + noise() * 3) : 0,
    };
  }
}

/** league champions everywhere this season; the player's league uses the real table */
function seasonChampions(c: Career): Record<string, string> {
  const out: Record<string, string> = {};
  for (const country of COUNTRIES) {
    const top = CLUBS.filter((cl) => cl.country === country.name && (c.world.div[cl.id] ?? cl.division) === 1);
    if (!top.length) continue;
    out[country.name] = weightedPick(top, (cl) => Math.max(1, cl.rating - 68) ** 3).id;
  }
  const s = c.season;
  if (s && !s.youth && s.division === 1) {
    const won = s.honors.find((h) => h.endsWith('Title'));
    if (won) out[s.country] = s.clubId;
    else if (out[s.country] === s.clubId) {
      const others = CLUBS.filter((cl) => cl.country === s.country && cl.id !== s.clubId && (c.world.div[cl.id] ?? cl.division) === 1);
      out[s.country] = weightedPick(others, (cl) => Math.max(1, cl.rating - 68) ** 3).id;
    }
  }
  return out;
}

function continentalWinners(c: Career): Record<string, string> {
  const out: Record<string, string> = {};
  const s = c.season;
  for (const confed of ['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF']) {
    const pool = CLUBS.filter((cl) => cl.division === 1 && cl.continental === 'CL' && confedOf(cl.country) === confed);
    if (!pool.length) continue;
    out[confed] = weightedPick(pool, (cl) => Math.max(1, cl.rating - 74) ** 3).id;
  }
  if (s && !s.youth && s.contKey === 'CL') {
    const confed = confedOf(s.country);
    if (s.honors.some((h) => h.includes(s.contName))) out[confed] = s.clubId;
    else if (out[confed] === s.clubId) delete out[confed];
  }
  return out;
}

const pts = (x: number) => Math.max(1, Math.round(x));

/**
 * End of season (June): titles for the world, then the Ballon d'Or vote,
 * the world Golden Glove and Defender of the Year — you included.
 */
export function worldSeasonEnd(c: Career, me: { ovr: number; goals: number; assists: number; cleanSheets: number; titles: number; cont: boolean; wc: boolean; leagueF: number; clubName: string; pos: PositionKey; eligible: boolean }): AwardYear {
  const champs = seasonChampions(c);
  const cont = continentalWinners(c);
  const s = c.season;
  const wcName = s?.natTournament?.name;
  const wcWinner = s?.natTournament ? (s.honors.some((h) => h.includes(wcName!)) ? c.player.country : weightedPick(COUNTRIES.filter((x) => x.name !== c.player.country), (x) => Math.max(1, x.nationalStrength - 70) ** 3).name) : null;

  const rows: (AwardRow & { star?: WorldStar; def: boolean; gk: boolean; cs: number })[] = [];
  for (const st of c.stars) {
    const club = CLUB_MAP[st.clubId];
    const lg = club && champs[club.country] === st.clubId ? 1 : 0;
    const cw = club && cont[confedOf(club.country)] === st.clubId ? 1 : 0;
    const wc = wcWinner && st.country === wcWinner ? 1 : 0;
    st.titles += lg + cw + wc;
    st.goals += st.cur.goals + st.cur.cont;
    const p = (st.ovr - 80) * 9 + (st.cur.goals + st.cur.cont) * 3 + st.cur.assists * 1.5 + lg * 30 + cw * 55 + wc * 50 + (isDefender(st.pos) || st.pos === 'GK' ? 25 : 0) + noise() * 25;
    rows.push({ name: st.name, clubName: club?.name ?? '—', points: pts(p), star: st, def: isDefender(st.pos), gk: st.pos === 'GK', cs: st.cur.cleanSheets });
  }
  if (me.eligible) {
    const p = ((me.ovr - 80) * 9 + me.goals * 3 * me.leagueF + me.assists * 1.5 * me.leagueF + me.titles * 30 * me.leagueF + (me.cont ? 55 : 0) + (me.wc ? 50 : 0) + (isDefender(me.pos) || me.pos === 'GK' ? 25 : 0) + noise() * 25);
    rows.push({ name: c.player.name, clubName: me.clubName, points: pts(p), me: true, def: isDefender(me.pos), gk: me.pos === 'GK', cs: me.cleanSheets });
  }
  rows.sort((a, b) => b.points - a.points);
  const top = rows.slice(0, 10).map(({ name, clubName, points, me: isMe }) => ({ name, clubName, points: points * 7, me: isMe }));
  const myRank = rows.findIndex((r) => r.me);
  if (rows[0]?.star) { rows[0].star.ballons++; rows[0].star.awards++; }

  const best = (filter: (r: typeof rows[number]) => boolean, score: (r: typeof rows[number]) => number) => {
    const list = rows.filter(filter).map((r) => ({ r, v: score(r) + noise() * 6 })).sort((a, b) => b.v - a.v);
    const w = list[0]?.r;
    if (w?.star) w.star.awards++;
    return w ? { name: w.name, clubName: w.clubName, points: Math.round(list[0].v), me: w.me } : { name: '—', clubName: '', points: 0 };
  };
  const glove = best((r) => r.gk, (r) => r.points + r.cs * 3);
  const defender = best((r) => r.def, (r) => r.points + r.cs * 2);

  const champions: AwardYear['champions'] = [];
  for (const [country, id] of Object.entries(champs)) if (['England', 'Spain', 'Italy', 'Germany', 'France'].includes(country)) champions.push({ label: getCountry(country).leagueName, club: CLUB_MAP[id].name });
  if (cont.UEFA) champions.push({ label: 'Champions Cup', club: CLUB_MAP[cont.UEFA].name });
  if (cont.CONMEBOL) champions.push({ label: 'Copa Libertadores', club: CLUB_MAP[cont.CONMEBOL].name });
  if (wcWinner && wcName) champions.push({ label: wcName, club: wcWinner });

  return { year: c.year, ballon: top, myBallonRank: myRank >= 0 ? myRank + 1 : null, glove, defender, champions };
}

/** age the world by a year: development, decline, transfers, retirements and new wonderkids */
export function ageStars(c: Career) {
  c.retiredStars ??= [];
  const next: WorldStar[] = [];
  for (const st of c.stars) {
    st.age++;
    const d = st.age <= 23 ? randInt(1, 3) : st.age <= 28 ? randInt(-1, 2) : st.age <= 31 ? randInt(-2, 0) : randInt(-4, -1);
    st.ovr = clamp(st.ovr + d, 60, 96);
    st.peak = Math.max(st.peak, st.ovr);
    if (st.age >= 37 || (st.age >= 33 && st.ovr < 77) || st.ovr < 72) {
      c.retiredStars.push({ ...st });
      continue;
    }
    const club = CLUB_MAP[st.clubId];
    if (club && (st.ovr > club.rating + 5 || st.ovr < club.rating - 7) && rng() < 0.5) st.clubId = clubFor(st.ovr, st.clubId);
    next.push(st);
  }
  while (next.length < 45) next.push(newStar(randInt(18, 21), randInt(76, 84)));
  c.stars = next;
  if (c.retiredStars.length > 200) c.retiredStars = c.retiredStars.slice(-200);
  setSeasonTargets(c.stars);
}

/** share of the season played, used to reveal star stats progressively */
export function seasonProgress(c: Career): number {
  return clamp((c.month - 1) / 10, 0, 1);
}

export interface RaceRow { name: string; clubName: string; points: number; me: boolean; detail: string }

/** provisional Ballon d'Or standings during the season */
export function ballonRace(c: Career, mine: { ovr: number; goals: number; assists: number; leagueF: number; eligible: boolean; clubName: string }): RaceRow[] {
  const prog = seasonProgress(c);
  const rows: RaceRow[] = c.stars.map((st) => {
    const g = Math.round((st.cur.goals + st.cur.cont) * prog);
    const a = Math.round(st.cur.assists * prog);
    const p = (st.ovr - 80) * 9 + g * 3 + a * 1.5 + (isDefender(st.pos) || st.pos === 'GK' ? 25 : 0);
    return { name: st.name, clubName: CLUB_MAP[st.clubId]?.name ?? '—', points: Math.max(1, Math.round(p)) * 7, me: false, detail: `${st.pos} · ${g}G ${a}A` };
  });
  if (mine.eligible) {
    const p = (mine.ovr - 80) * 9 + mine.goals * 3 * mine.leagueF + mine.assists * 1.5 * mine.leagueF;
    rows.push({ name: c.player.name, clubName: mine.clubName, points: Math.max(1, Math.round(p)) * 7, me: true, detail: `${mine.goals}G ${mine.assists}A` });
  }
  return rows.sort((a, b) => b.points - a.points);
}

export interface AllTimeRow { name: string; value: number; me: boolean; note: string }

export function allTime(c: Career, kind: 'ballons' | 'titles' | 'goals'): AllTimeRow[] {
  const everyone = [...c.stars, ...(c.retiredStars ?? [])];
  const rows: AllTimeRow[] = everyone.map((s) => ({ name: s.name, value: s[kind], me: false, note: `${s.country} · peak ${s.peak}${c.stars.includes(s) ? '' : ' · retired'}` }));
  const myTitles = [...c.honors.club, ...c.honors.national].filter((h) => !h.label.includes('Youth')).reduce((a, h) => a + h.count, 0);
  const myBallons = c.honors.individual.filter((h) => h.label.includes('Ballon')).reduce((a, h) => a + h.count, 0);
  rows.push({ name: c.player.name, value: kind === 'ballons' ? myBallons : kind === 'titles' ? myTitles : c.totals.goals + c.totals.intlGoals, me: true, note: 'You' });
  return rows.sort((a, b) => b.value - a.value || (a.me ? -1 : 1));
}

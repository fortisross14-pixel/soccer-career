import type { Career, Fixture, Involvement, MatchEvent, MatchReport, Player, PositionKey, SkillKey, SquadRole } from '../game/types';
import { CLUB_MAP } from '../data/clubs';
import { realisticName } from '../data/names';
import { STAFF_PERK } from './perks';
import { adjTrust } from './trust';
import { balanceEffects } from '../data/training';
import { effectiveSkills, matchOverall, overallOf } from './overall';
import { academyRating, lineOffset, teamCountry, teamName, teamRating, type Line } from './teams';
import { chance, clamp, noise, poisson, randInt, rng, round1, weightedPick } from './util';

export const ROLE_LABEL: Record<SquadRole, string> = {
  star: 'Key player', starter: 'Starter', rotation: 'Rotation', fringe: 'Fringe', reserve: 'Reserve',
};
const ROLE_RANK: Record<SquadRole, number> = { reserve: 0, fringe: 1, rotation: 2, starter: 3, star: 4 };
export const roleRank = (r: SquadRole) => ROLE_RANK[r];

export function squadRole(ovr: number, teamR: number): SquadRole {
  const d = ovr - teamR;
  if (d >= 5) return 'star';
  if (d >= -1) return 'starter';
  if (d >= -6) return 'rotation';
  if (d >= -12) return 'fringe';
  return 'reserve';
}

/** squad standing at the current club, including manager trust */
export function currentRole(c: Career): SquadRole {
  const p = c.player;
  const lv = squadLevels(c);
  if (!lv) return 'reserve';
  const base = squadRole(lv.meShown, lv.lineInternal);
  const shift = p.trust >= 80 ? 1 : p.trust < 30 ? -1 : 0;
  const order: SquadRole[] = ['reserve', 'fringe', 'rotation', 'starter', 'star'];
  return order[clamp(ROLE_RANK[base] + shift, 0, 4)];
}

const START_P: Record<SquadRole, number> = { star: 0.97, starter: 0.84, rotation: 0.45, fringe: 0.16, reserve: 0.04 };
const BENCH_P: Record<SquadRole, number> = { star: 1, starter: 1, rotation: 0.9, fringe: 0.7, reserve: 0.35 };
const SUB_P: Record<SquadRole, number> = { star: 0.9, starter: 0.75, rotation: 0.6, fringe: 0.42, reserve: 0.25 };

export function startChance(p: Player, role: SquadRole, fx: Fixture): number {
  let s = START_P[role];
  s += (p.trust - 55) / 220;
  s += (p.form - 6.7) * 0.14;
  if (p.fitness < 70) s -= (70 - p.fitness) / 55;
  if (p.contract && ROLE_RANK[p.contract.promisedRole] >= 3 && fx.comp !== 'national') s += 0.06;
  if (fx.comp === 'cup' && fx.stage.startsWith('Round')) s += role === 'star' ? -0.15 : 0.22; // cup rotation
  return clamp(s, 0.02, 0.99);
}

function attackIdx(s: Record<SkillKey, number>, pos: PositionKey): number {
  switch (pos) {
    case 'ST': return s.finishing * 0.5 + s.heading * 0.15 + s.longShots * 0.1 + s.dribbling * 0.1 + s.pace * 0.15;
    case 'W': return s.finishing * 0.4 + s.dribbling * 0.35 + s.pace * 0.25;
    case 'AM': return s.finishing * 0.4 + s.longShots * 0.35 + s.dribbling * 0.25;
    case 'B2B': return s.longShots * 0.5 + s.finishing * 0.3 + s.stamina * 0.2;
    case 'CM': return s.longShots * 0.5 + s.finishing * 0.2 + s.setPieces * 0.3;
    case 'CB': return s.heading * 0.6 + s.jumping * 0.25 + s.setPieces * 0.15;
    case 'FB': return s.crossing * 0.3 + s.pace * 0.4 + s.finishing * 0.3;
    default: return 20;
  }
}
function creationIdx(s: Record<SkillKey, number>, pos: PositionKey): number {
  switch (pos) {
    case 'ST': return s.shortPass * 0.5 + s.decisions * 0.5;
    case 'W': return s.crossing * 0.5 + s.shortPass * 0.25 + s.decisions * 0.25;
    case 'AM': return s.shortPass * 0.4 + s.longPass * 0.3 + s.decisions * 0.3;
    case 'B2B': return s.shortPass * 0.5 + s.longPass * 0.3 + s.decisions * 0.2;
    case 'CM': return s.longPass * 0.45 + s.shortPass * 0.35 + s.decisions * 0.2;
    case 'CB': return s.longPass * 0.6 + s.shortPass * 0.4;
    case 'FB': return s.crossing * 0.6 + s.shortPass * 0.4;
    default: return s.longPass * 0.5 + s.decisions * 0.5;
  }
}
function defenseIdx(s: Record<SkillKey, number>, pos: PositionKey): number {
  if (pos === 'GK') return s.reflexes * 0.45 + s.handling * 0.35 + s.decisions * 0.2;
  return s.tackling * 0.45 + s.decisions * 0.25 + s.strength * 0.15 + s.workRate * 0.15;
}

const GOAL_SHARE: Record<PositionKey, number> = { ST: 0.27, W: 0.17, AM: 0.15, B2B: 0.09, CM: 0.055, CB: 0.05, FB: 0.035, GK: 0 };
const ASSIST_SHARE: Record<PositionKey, number> = { ST: 0.11, W: 0.17, AM: 0.2, B2B: 0.12, CM: 0.15, CB: 0.035, FB: 0.12, GK: 0.01 };
/** how much the position's defending moves opposition chances (0 = none) */
const DEF_WEIGHT: Record<PositionKey, number> = { ST: 0, W: 0.02, AM: 0.02, B2B: 0.07, CM: 0.06, CB: 0.13, FB: 0.08, GK: 0.2 };

const INJURIES: [string, number, number, number][] = [
  ['Knock', 3, 8, 40], ['Hamstring strain', 10, 25, 22], ['Ankle sprain', 7, 20, 18],
  ['Calf tear', 18, 40, 8], ['Groin strain', 12, 28, 8], ['Broken metatarsal', 45, 80, 3], ['Knee ligament damage', 90, 200, 1],
];

export function injuryRisk(p: Player, minutes: number, intensityMult = 1): number {
  const staffCut = 1 - STAFF_PERK(p, 'injury');
  const age = p.age > 29 ? 1 + (p.age - 29) * 0.07 : 1;
  const fit = 1 + Math.max(0, 85 - p.fitness) / 35;
  return 0.011 * (minutes / 90) * fit * age * (1.3 - p.skills.stamina / 200) * staffCut * intensityMult;
}

function traitMult(p: Player, kind: 'goal' | 'assist' | 'rating'): number {
  const t = new Set(p.traits);
  if (kind === 'goal') return (t.has('poacher') ? 1.15 : 1) * (t.has('deadball') ? 1.06 : 1) * (t.has('aerial') ? 1.08 : 1) * (t.has('speedster') ? 1.05 : 1);
  if (kind === 'assist') return (t.has('maestro') ? 1.15 : 1) * (t.has('magician') ? 1.08 : 1) * (t.has('deadball') ? 1.05 : 1);
  return (t.has('wall') ? 0.2 : 0) + (t.has('rock') ? 0.15 : 0) + (t.has('captain') ? 0.08 : 0) + (t.has('engine') ? 0.08 : 0);
}

export interface MatchOutcome { usGoals: number; oppGoals: number; report: MatchReport; injuredDays: number }

/** Simulate one fixture involving the player's team. Mutates player condition. */
export function simulateMatch(c: Career, fx: Fixture): MatchOutcome {
  const p = c.player;
  const s = effectiveSkills(p);
  const ovr = fx.usId.startsWith('acad:') ? youthMatchOverall(p) : matchOverall(p);
  const usR = teamRating(fx.usId);
  const oppR = teamRating(fx.oppId);
  const events: MatchEvent[] = [];
  const isNat = fx.comp === 'national';

  // ---------- selection ----------
  let involvement: Involvement = 'none';
  let onMin = 0;
  let offMin = 0;
  const injuredNow = p.injury && fx.day < p.injury.untilDay && p.injury.year === c.year;
  if (injuredNow) involvement = 'injured';
  else {
    const role = isNat ? natRole(ovr, usR) : currentRole(c);
    if (chance(startChance(p, role, fx))) {
      involvement = 'started'; onMin = 0; offMin = 90;
      const subOff = p.position === 'GK' ? 0.01 : role === 'star' ? 0.12 : role === 'starter' ? 0.25 : 0.45;
      if (chance(subOff + (p.fitness < 70 ? 0.25 : 0))) offMin = randInt(58, 86);
    } else if (chance(BENCH_P[role])) {
      if (chance(p.position === 'GK' ? 0.03 : SUB_P[role])) { involvement = 'sub'; onMin = randInt(55, 86); offMin = 90; }
      else involvement = 'bench';
    } else involvement = 'dropped';
  }
  let minutes = offMin - onMin;

  // ---------- injury during the match ----------
  let injuredDays = 0;
  const bal = balanceEffects(c.plan.balance);
  const immune = c.year < c.mods.noInjuryUntil;
  if (minutes > 0 && !immune && chance(injuryRisk(p, minutes, bal.injury * (1 - c.mods.injuryCut)))) {
    const [name, lo, hi] = weightedPick(INJURIES, (x) => x[3]);
    injuredDays = randInt(lo, hi);
    const at = randInt(onMin + 1, offMin);
    offMin = at; minutes = offMin - onMin;
    p.injury = { name, untilDay: fx.day + injuredDays, year: c.year };
    events.push({ minute: at, side: 'us', type: 'injury', text: `${name} — you're forced off (${injuredDays} days)`, mine: true });
  }

  // ---------- team strength ----------
  const share = minutes / 90;
  const pos = p.position;
  const atk = attackIdx(s, pos);
  const def = defenseIdx(s, pos);
  let usEff = usR + clamp(ovr - usR, -10, 10) * 0.08 * share;
  if (fx.home) usEff += isNat ? 1.5 : 2.5;
  const oppEff = oppR + (!fx.home && !isNat ? 2.5 : 0);
  let lUs = clamp(1.35 * Math.exp((usEff - oppEff) / 22), 0.25, 3.6);
  let lOpp = clamp(1.15 * Math.exp((oppEff - usEff) / 22), 0.2, 3.4);
  lUs *= 1 + clamp((atk - usR) / 160, -0.15, 0.2) * share * (GOAL_SHARE[pos] * 2.5);
  lOpp *= 1 - clamp((def - usR) / 120, -0.2, 0.25) * share * DEF_WEIGHT[pos] * 3;
  const usGoalsN = poisson(lUs);
  const oppGoalsN = poisson(lOpp);

  const usCountry = teamCountry(fx.usId) ?? p.country;
  const oppCountry = teamCountry(fx.oppId) ?? p.country;

  // ---------- goals & involvement ----------
  const q = clamp(atk / Math.max(55, usR), 0.6, 1.35);
  const cq = clamp(creationIdx(s, pos) / Math.max(55, usR), 0.6, 1.35);
  const gShare = clamp(GOAL_SHARE[pos] * Math.pow(q, 1.6) * traitMult(p, 'goal') * bal.share * (1 + (c.luck ?? 0) * 0.12), 0, 0.45);
  const aShare = clamp(ASSIST_SHARE[pos] * Math.pow(cq, 1.5) * traitMult(p, 'assist') * bal.share, 0, 0.5);
  let goals = 0;
  let assists = 0;
  const minutesList = (n: number) => Array.from({ length: n }, () => randInt(1, 90)).sort((a, b) => a - b);
  let conceded = 0;
  for (const m of minutesList(usGoalsN)) {
    const onPitch = m > onMin && m <= offMin && minutes > 0;
    const r = rng();
    const mate = realisticName(usCountry, `${fx.id}-g${m}-${r}`);
    if (onPitch && r < gShare) {
      goals++;
      const helper = realisticName(usCountry, `${fx.id}-a${m}`);
      events.push({ minute: m, side: 'us', type: 'goal', text: chance(0.75) ? `GOAL! You score (assist ${helper})` : 'GOAL! You score a solo effort', mine: true });
    } else if (onPitch && r < gShare + aShare) {
      assists++;
      events.push({ minute: m, side: 'us', type: 'goal', text: `Goal ${mate} — your assist`, mine: true });
    } else {
      events.push({ minute: m, side: 'us', type: 'goal', text: `Goal ${mate}` });
    }
  }
  for (const m of minutesList(oppGoalsN)) {
    if (m > onMin && m <= offMin && minutes > 0) conceded++;
    events.push({ minute: m, side: 'them', type: 'goal', text: `Goal ${realisticName(oppCountry, `${fx.id}-o${m}`)}` });
  }

  // ---------- individual stats ----------
  const stats: Record<string, number> = {};
  let rating: number | null = null;
  let motm = false;
  const result = usGoalsN > oppGoalsN ? 'W' : usGoalsN < oppGoalsN ? 'L' : 'D';
  if (minutes > 0) {
    const f = share;
    if (pos === 'GK') {
      const sot = oppGoalsN + poisson(clamp(3.2 * Math.exp((oppEff - usEff) / 22), 1, 7) * f);
      stats.saves = Math.max(0, sot - conceded);
      stats.conceded = conceded;
      stats.passAcc = Math.round(clamp(62 + s.longPass / 4 + noise() * 6, 50, 92));
      if (stats.saves >= 4) events.push({ minute: randInt(onMin + 1, offMin), side: 'us', type: 'save', text: 'Huge save to deny a certain goal', mine: true });
    } else {
      const shotRate = (GOAL_SHARE[pos] * 9 + 0.3) * f;
      stats.shots = goals + poisson(shotRate);
      stats.onTarget = goals + Math.round((stats.shots - goals) * clamp(s.finishing / 140, 0.15, 0.6));
      stats.keyPasses = assists + poisson((ASSIST_SHARE[pos] * 9 + 0.2) * f * cq);
      stats.passes = Math.round(f * (22 + s.shortPass * 0.35 + (pos === 'CM' || pos === 'B2B' ? 18 : 0)) * (0.85 + rng() * 0.3));
      stats.passAcc = Math.round(clamp(66 + s.shortPass / 5.5 + s.decisions / 12 + noise() * 5, 55, 96));
      if (pos === 'ST' || pos === 'W' || pos === 'AM') stats.dribbles = poisson((s.dribbling / 32) * f);
      if (pos !== 'ST' && pos !== 'W') stats.tackles = poisson((s.tackling / (pos === 'AM' ? 55 : 26)) * f);
      if (pos === 'CB' || pos === 'B2B' || pos === 'CM' || pos === 'FB') stats.interceptions = poisson((s.decisions / 38) * f);
      if (pos === 'CB' || pos === 'ST') stats.aerials = poisson(((s.heading + s.jumping) / 40) * f);
    }

    let r = 6.42 + clamp(ovr - oppR, -15, 15) * 0.016 + noise() * 0.6 * Math.sqrt(f);
    r += goals * 0.85 - Math.max(0, goals - 1) * 0.15 + assists * 0.5;
    r += (result === 'W' ? 0.25 : result === 'L' ? -0.3 : 0) * f;
    const defensive = pos === 'GK' || pos === 'CB' || pos === 'FB' ? 1 : pos === 'CM' || pos === 'B2B' ? 0.35 : 0;
    if (conceded === 0 && minutes >= 60) r += defensive * (pos === 'GK' ? 0.55 : 0.4);
    r -= conceded * defensive * (pos === 'GK' ? 0.22 : 0.16);
    if (pos === 'GK') r += (stats.saves ?? 0) * 0.13;
    r += ((stats.keyPasses ?? 0) - assists) * 0.08 + (stats.tackles ?? 0) * 0.04 + (stats.interceptions ?? 0) * 0.04 + (stats.dribbles ?? 0) * 0.04;
    r += (p.form - 6.7) * 0.12 + traitMult(p, 'rating') + bal.rating + (c.mods.ratingBonus ?? 0) + (c.luck ?? 0) * 0.2;
    if (p.fitness < 60) r -= (60 - p.fitness) / 40;
    if (minutes < 25) r = 6.1 + (r - 6.1) * 0.5;
    rating = clamp(round1(r), 3.5, 10);
    motm = minutes >= 45 && (rating >= 8.5 || (rating >= 7.9 && result === 'W' && chance(0.4)));
    if (motm) stats.motm = 1;

    if (chance(0.05 + (stats.tackles ?? 0) * 0.025)) events.push({ minute: randInt(onMin + 1, offMin), side: 'us', type: 'yellow', text: 'Yellow card for a late challenge', mine: true });
    if (involvement === 'sub') events.push({ minute: onMin, side: 'us', type: 'sub-on', text: 'You come off the bench', mine: true });
    if (involvement === 'started' && offMin < 90 && !injuredDays) events.push({ minute: offMin, side: 'us', type: 'sub-off', text: 'You are substituted', mine: true });
    if ((stats.shots ?? 0) > goals && chance(0.6)) events.push({ minute: randInt(onMin + 1, offMin), side: 'us', type: 'chance', text: 'Your shot is saved / goes just wide', mine: true });
  }
  events.sort((a, b) => a.minute - b.minute);

  // ---------- condition updates ----------
  if (minutes > 0) {
    const cost = (minutes / 90) * (13.5 - s.stamina / 12) * (p.traits.includes('engine') ? 0.8 : 1);
    p.fitness = clamp(p.fitness - cost, 5, 100);
    p.form = round1(p.form * 0.7 + (rating ?? 6.5) * 0.3);
    if (!isNat) adjTrust(c, ((rating ?? 6.5) - 6.75) * 2.2 + (p.traits.includes('captain') ? 0.3 : 0), 'Match ratings');
    p.boosts = p.boosts.map((b) => ({ ...b, matchesLeft: b.matchesLeft - 1 })).filter((b) => b.matchesLeft > 0);
  } else if (involvement === 'dropped' || involvement === 'bench') {
    p.morale = clamp(p.morale - (p.contract && ROLE_RANK[p.contract.promisedRole] >= 3 ? 2 : 0.7), 0, 100);
  }
  p.morale = clamp(p.morale + (result === 'W' ? 1 : result === 'L' ? -1 : 0) + (motm ? 2 : 0), 0, 100);

  const notes: Record<Involvement, string> = {
    started: 'Started', sub: `On at ${onMin}'`, bench: 'Unused substitute', dropped: 'Not in the squad', injured: 'Injured', none: '',
  };
  return {
    usGoals: usGoalsN,
    oppGoals: oppGoalsN,
    injuredDays,
    report: { involvement, minutes, goals, assists, rating, motm, stats, events, note: notes[involvement] },
  };
}

export function natRole(ovr: number, natR: number): SquadRole {
  return squadRole(ovr + 2, natR);
}

export function describeOpp(fx: Fixture): string {
  return `${fx.home ? 'vs' : '@'} ${teamName(fx.oppId)}`;
}

const LINE_OF: Record<PositionKey, Line> = { GK: 'GK', CB: 'DEF', FB: 'DEF', CM: 'MID', B2B: 'MID', AM: 'MID', ST: 'FWD', W: 'FWD' };
export const LINE_LABEL: Record<Line, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' };

/**
 * What you compete against for a place. "internal" values are what selection uses;
 * "shown" values are on the same scale as your displayed OVR.
 */
export function squadLevels(c: Career): { line: Line; teamShown: number; lineShown: number; meShown: number; lineInternal: number; youth: boolean } | null {
  const p = c.player;
  const line = LINE_OF[p.position];
  if (c.academy) {
    // youth football is compared on the plain skill scale (the one your OVR shows)
    const team = academyRating(c.academy.clubId, p.age);
    const lineI = team + lineOffset(c.academy.clubId, line);
    return { line, teamShown: team, lineShown: lineI, meShown: youthMatchOverall(p), lineInternal: lineI, youth: true };
  }
  if (!p.contract) return null;
  const club = CLUB_MAP[p.contract.clubId];
  const lineI = club.rating + lineOffset(club.id, line);
  return { line, teamShown: club.rating, lineShown: lineI, meShown: matchOverall(p), lineInternal: lineI, youth: false };
}

/** youth matches: plain skills (with boosts), no adult maturity factor */
export function youthMatchOverall(p: Player): number {
  return overallOf(effectiveSkills(p), p.position, 21);
}

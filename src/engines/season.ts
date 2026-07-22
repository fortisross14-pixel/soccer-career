import type { ClubDef, Player, SquadRole } from '../game/types';
import { POSITION_MAP } from '../data/positions';
import { clubsInCountry } from '../data/clubs';
import { getCountry } from '../data/countries';
import { CONTINENTAL_CLUB } from '../data/tournaments';
import { clamp, chance, noise, randInt, round1 } from './util';

export interface SeasonOutput {
  role: SquadRole;
  games: number;
  goals: number;
  assists: number;
  rating: number;
  leagueFinish: number;
  leagueName: string;
  competition: string;
  clubHonors: string[];
  minutesFactor: number;
  injured: boolean;
  logs: string[];
  // exposed for the awards engine
  contKey: 'CL' | 'EL' | 'none';
  contGoals: number;
}

export function roleFor(overall: number, club: ClubDef): SquadRole {
  if (club.tier === 'Youth') return 'youth';
  const diff = overall - club.rating;
  if (diff >= 6) return 'star';
  if (diff >= -1) return 'starter';
  if (diff >= -7) return 'rotation';
  if (diff >= -13) return 'fringe';
  return 'reserve';
}

function attackIndex(p: Player): number {
  const s = p.skills;
  switch (p.position) {
    case 'ST': return s.finishing * 0.5 + s.heading * 0.15 + s.longShots * 0.15 + s.dribbling * 0.2;
    case 'W': return s.finishing * 0.4 + s.dribbling * 0.35 + s.pace * 0.25;
    case 'AM': return s.finishing * 0.4 + s.longShots * 0.35 + s.dribbling * 0.25;
    case 'B2B': return s.longShots * 0.5 + s.finishing * 0.3 + s.shortPass * 0.2;
    case 'CM': return s.longShots * 0.5 + s.finishing * 0.3 + s.setPieces * 0.2;
    case 'CB': return s.heading * 0.6 + s.strength * 0.25 + s.setPieces * 0.15;
    case 'FB': return s.crossing * 0.5 + s.pace * 0.3 + s.finishing * 0.2;
    default: return 0;
  }
}

function creationIndex(p: Player): number {
  const s = p.skills;
  switch (p.position) {
    case 'ST': return s.shortPass * 0.5 + s.decisions * 0.5;
    case 'W': return s.crossing * 0.5 + s.shortPass * 0.3 + s.decisions * 0.2;
    case 'AM': return s.shortPass * 0.4 + s.longPass * 0.3 + s.decisions * 0.3;
    case 'B2B': return s.shortPass * 0.5 + s.longPass * 0.3 + s.workRate * 0.2;
    case 'CM': return s.longPass * 0.45 + s.shortPass * 0.35 + s.decisions * 0.2;
    case 'CB': return s.longPass * 0.6 + s.shortPass * 0.4;
    case 'FB': return s.crossing * 0.6 + s.shortPass * 0.4;
    default: return s.longPass * 0.6 + s.handling * 0.4;
  }
}

const GAMES_BY_ROLE: Record<SquadRole, [number, number]> = {
  star: [42, 52], starter: [32, 42], rotation: [20, 30],
  fringe: [8, 18], reserve: [2, 8], youth: [16, 26],
};

export function simulateSeason(p: Player, club: ClubDef, overall: number): SeasonOutput {
  const country = getCountry(club.country);
  const pos = POSITION_MAP[p.position];
  const trust = p.managerTrust ?? 55;
  const morale = p.morale ?? 70;
  const fitness = p.fitness ?? 80;
  let role = roleFor(overall, club);
  if (trust >= 78 && role === 'rotation') role = 'starter';
  if (trust >= 88 && role === 'starter') role = 'star';
  if (trust < 30 && role === 'starter') role = 'rotation';
  if (trust < 20 && role === 'rotation') role = 'fringe';
  const logs: string[] = [];
  const clubHonors: string[] = [];

  // --- appearances (with injury risk) ---
  const [lo, hi] = GAMES_BY_ROLE[role];
  let games = randInt(lo, hi);
  let injured = false;
  const intensityRisk = p.trainingIntensity === 'intense' ? 0.07 : p.trainingIntensity === 'light' ? -0.025 : 0;
  const injuryRisk = clamp(0.06 + intensityRisk + (100 - fitness) / 500 + (p.age > 30 ? (p.age - 30) * 0.015 : 0) + (1 - p.skills.stamina / 130), 0.03, 0.45);
  if (chance(injuryRisk)) {
    injured = true;
    const lost = randInt(4, Math.min(games - 2, 22));
    games = Math.max(2, games - lost);
    logs.push(`Picked up an injury — missed roughly ${lost} games.`);
  }
  games = clamp(games, 0, 55);
  const minutesFactor = clamp(games / 42, 0.1, 1);

  // --- goals & assists ---
  const form = clamp(0.78 + noise() * 0.4 + (morale - 60) / 220 + (fitness - 70) / 300, 0.4, 1.5);
  const roleScoring = role === 'star' ? 1.12 : role === 'starter' ? 1.0 : 0.86;
  const gThreat = clamp(attackIndex(p) / 68, 0.2, 2.0);
  const cThreat = clamp(creationIndex(p) / 68, 0.2, 2.0);

  let goals = pos.expGoals * (games / 34) * gThreat * form * roleScoring;
  let assists = pos.expAssists * (games / 34) * cThreat * form * (role === 'star' ? 1.05 : 1);
  // youth academy: modest numbers, developmental
  if (club.tier === 'Youth') { goals *= 0.7; assists *= 0.7; }
  goals = Math.max(0, Math.round(goals + noise() * 1.5));
  assists = Math.max(0, Math.round(assists + noise() * 1.5));

  // --- match rating ---
  const contrib = (goals + assists) / Math.max(6, games);
  let rating = 6.35 + (overall - club.rating) * 0.02 + contrib * 1.6 + noise() * 0.35;
  if (overall >= 85) rating += 0.25;
  if (overall >= 90) rating += 0.25;
  rating = clamp(round1(rating), 5.6, 9.6);

  // --- league finish ---
  const leagueName = club.division === 2 ? `${country.leagueName} 2` : country.leagueName;
  let leagueFinish: number;
  let competition = leagueName;
  if (club.tier === 'Youth') {
    leagueFinish = randInt(1, 8);
    competition = 'Youth League';
  } else {
    const peers = clubsInCountry(club.country, club.division).sort((a, b) => b.rating - a.rating);
    const baseRank = Math.max(1, peers.findIndex((c) => c.id === club.id) + 1);
    let finish = baseRank + Math.round(noise() * 2.5);
    // a star player lifts the club above its station
    if (role === 'star') finish -= randInt(0, 3);
    if (role === 'reserve' || role === 'fringe') finish += randInt(0, 2);
    leagueFinish = clamp(finish, 1, peers.length);

    // --- domestic trophies ---
    if (leagueFinish === 1) { clubHonors.push(`${leagueName} Title`); logs.push(`🏆 Won the ${leagueName}!`); }
    const cupChance = clamp((club.rating - 62) / 60 + (role === 'star' ? 0.08 : 0), 0.05, 0.5);
    if (chance(cupChance)) { clubHonors.push('Domestic Cup'); logs.push('🏆 Lifted the Domestic Cup!'); }
  }

  // --- continental ---
  const contName = CONTINENTAL_CLUB[country.confederation] || CONTINENTAL_CLUB.UEFA;
  let contKey: 'CL' | 'EL' | 'none' = club.continental;
  let contGoals = 0;
  if (contKey !== 'none' && club.tier !== 'Youth') {
    const extra = randInt(3, 9);
    contGoals = Math.round((goals / Math.max(1, games)) * extra * (0.8 + Math.random() * 0.6));
    const compName = contKey === 'CL' ? contName.cl : contName.el;
    const winChance = clamp((club.rating - 78) / 40 + (role === 'star' ? 0.06 : 0), 0.02, 0.4);
    if (chance(winChance)) { clubHonors.push(`${compName} Winner`); logs.push(`🏆 Champions of the ${compName}!`); }
    else if (chance(0.25)) logs.push(`Reached the ${compName} knockout rounds.`);
  }

  return {
    role, games, goals, assists, rating, leagueFinish, leagueName, competition,
    clubHonors, minutesFactor, injured, logs, contKey, contGoals,
  };
}

import type { ClubDef, NationalMatch, NationalMatchType, Player } from '../game/types';
import { COUNTRIES, getCountry } from '../data/countries';
import { worldCupThisYear, continentalNationsThisYear, CONTINENTAL_NATIONS } from '../data/tournaments';
import { clamp, chance, noise, randInt, round1 } from './util';

export interface NationalOutput {
  status: string;
  caps: number;
  goals: number;
  assists: number;
  matches: NationalMatch[];
  nationalHonors: string[];
  individualHonors: string[];
  logs: string[];
}

export function nationalStatus(overall: number, age: number, club: ClubDef, nationStrength: number): string {
  if (age < 16 || club.tier === 'Youth') return 'Not called up';
  const d = overall - nationStrength;
  if (d >= 2) return 'Nailed-on starter';
  if (d >= -3) return 'Squad regular';
  if (d >= -8) return 'Rotation option';
  if (d >= -13) return 'On the radar';
  return 'Not called up';
}

const BASE_MATCHES: Record<string, [number, number]> = {
  'Nailed-on starter': [7, 10], 'Squad regular': [5, 8], 'Rotation option': [2, 5],
  'On the radar': [0, 2], 'Not called up': [0, 0],
};

function opponentFor(country: string): string {
  const pool = COUNTRIES.filter((c) => c.name !== country);
  return pool[randInt(0, pool.length - 1)]?.name ?? 'International XI';
}

function playerContribution(p: Player, started: boolean, minutes: number) {
  const involvement = minutes / 90;
  const goalRate = p.position === 'ST' ? 0.42 : p.position === 'W' || p.position === 'AM' ? 0.25 : p.position === 'B2B' || p.position === 'CM' ? 0.1 : 0.025;
  const assistRate = p.position === 'AM' ? 0.28 : p.position === 'W' || p.position === 'CM' || p.position === 'FB' ? 0.2 : 0.09;
  const goals = chance(clamp(goalRate * involvement * (0.55 + p.skills.finishing / 105), 0, 0.75)) ? 1 + (chance(0.1) ? 1 : 0) : 0;
  const assists = chance(clamp(assistRate * involvement * (0.5 + (p.skills.shortPass + p.skills.decisions) / 220), 0, 0.65)) ? 1 : 0;
  const rating = round1(clamp(6.35 + goals * 0.9 + assists * 0.55 + noise() * 0.3 + (started ? 0.05 : -0.1), 5.7, 9.5));
  return { goals, assists, rating };
}

function makeMatch(p: Player, type: NationalMatchType, stage: string, nationStrength: number, status: string): NationalMatch {
  const opponent = opponentFor(p.country);
  const oppStrength = getCountry(opponent).nationalStrength;
  const selected = status !== 'Not called up' && (status !== 'On the radar' || chance(0.45));
  const started = selected && (status === 'Nailed-on starter' || (status === 'Squad regular' && chance(0.7)) || chance(0.25));
  const minutes = !selected ? 0 : started ? randInt(68, 90) : randInt(12, 36);
  const contribution = selected ? playerContribution(p, started, minutes) : { goals: 0, assists: 0, rating: null };
  const strengthEdge = (nationStrength - oppStrength) / 18;
  let teamGoals = Math.max(0, Math.round(1.25 + strengthEdge + noise() * 1.05));
  let opponentGoals = Math.max(0, Math.round(1.1 - strengthEdge + noise() * 1.0));
  teamGoals = Math.max(teamGoals, contribution.goals);
  const result = teamGoals > opponentGoals ? 'W' : teamGoals < opponentGoals ? 'L' : 'D';
  return { season: p.season, age: p.age, opponent, competition: type, stage, result, teamGoals, opponentGoals, started, minutes, goals: contribution.goals, assists: contribution.assists, rating: contribution.rating };
}

function tournamentStages(isWorldCup: boolean): string[] {
  return isWorldCup
    ? ['Group stage', 'Group stage', 'Group stage', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final']
    : ['Group stage', 'Group stage', 'Group stage', 'Quarter-final', 'Semi-final', 'Final'];
}

export function simulateNational(p: Player, club: ClubDef, overall: number): NationalOutput {
  const country = getCountry(p.country);
  const status = nationalStatus(overall, p.age, club, country.nationalStrength);
  const nationalHonors: string[] = [];
  const individualHonors: string[] = [];
  const logs: string[] = [];
  const matches: NationalMatch[] = [];

  const [lo, hi] = BASE_MATCHES[status];
  const tournament = p.age >= 16 && (worldCupThisYear(p.season) || continentalNationsThisYear(p.season));
  const baseCount = randInt(lo, hi);
  const baseType: NationalMatchType = p.season % 2 === 1 ? 'World Cup Qualification' : 'Continental Qualification';
  for (let i = 0; i < baseCount; i++) {
    const type: NationalMatchType = i < 2 && chance(0.55) ? 'Friendly' : baseType;
    matches.push(makeMatch(p, type, type === 'Friendly' ? 'International window' : `Matchday ${i + 1}`, country.nationalStrength, status));
  }

  if (tournament && (status === 'Nailed-on starter' || status === 'Squad regular' || status === 'Rotation option')) {
    const isWC = worldCupThisYear(p.season);
    const compName = isWC ? 'World Cup' : CONTINENTAL_NATIONS[country.confederation] || 'Continental Championship';
    const type: NationalMatchType = isWC ? 'World Cup' : 'Continental Championship';
    const stages = tournamentStages(isWC);
    let eliminated = false;
    for (const stage of stages) {
      if (eliminated) break;
      const match = makeMatch(p, type, stage, country.nationalStrength, status);
      matches.push(match);
      if (stage !== 'Group stage' && match.result !== 'W') eliminated = true;
    }
    const final = matches.find((m) => m.competition === type && m.stage === 'Final');
    if (final?.result === 'W') {
      nationalHonors.push(`${compName} Winner`);
      logs.push(`🏆 Won the ${compName} with ${p.country}!`);
    } else {
      const lastTournamentMatch = [...matches].reverse().find((m) => m.competition === type);
      if (lastTournamentMatch) logs.push(`Reached the ${lastTournamentMatch.stage} at the ${compName}.`);
    }
  }

  const played = matches.filter((m) => m.minutes > 0);
  const caps = played.length;
  const goals = played.reduce((sum, m) => sum + m.goals, 0);
  const assists = played.reduce((sum, m) => sum + m.assists, 0);
  if (caps > 0 && p.national.debutAge === null) {
    p.national.debutAge = p.age;
    logs.push(`🌍 Made your senior debut for ${p.country}.`);
  }
  const tournamentMatches = played.filter((m) => m.competition === 'World Cup' || m.competition === 'Continental Championship');
  if (tournamentMatches.length >= 5) {
    const avg = tournamentMatches.reduce((sum, m) => sum + (m.rating ?? 0), 0) / tournamentMatches.length;
    const tg = tournamentMatches.reduce((sum, m) => sum + m.goals, 0);
    if (avg >= 8.1 && overall >= 88 && chance(0.45)) individualHonors.push(`${tournamentMatches[0].competition} Golden Ball`);
    if (tg >= 5 && chance(0.55)) individualHonors.push(`${tournamentMatches[0].competition} Golden Boot`);
  }

  p.national.status = status;
  p.national.matches ??= [];
  p.national.matches.push(...matches);
  return { status, caps, goals, assists, matches, nationalHonors, individualHonors, logs };
}

import type { ClubDef, Player } from '../game/types';
import { getCountry } from '../data/countries';
import {
  worldCupThisYear, continentalNationsThisYear, CONTINENTAL_NATIONS,
} from '../data/tournaments';
import { clamp, chance, noise, randInt } from './util';

export interface NationalOutput {
  status: string;
  caps: number;
  goals: number;
  nationalHonors: string[];
  individualHonors: string[]; // e.g. Golden Ball (counts as individual)
  logs: string[];
}

export function nationalStatus(overall: number, age: number, club: ClubDef, nationStrength: number): string {
  if (age < 17 || club.tier === 'Youth') return 'Not called up';
  const d = overall - nationStrength;
  if (d >= 2) return 'Nailed-on starter';
  if (d >= -3) return 'Squad regular';
  if (d >= -8) return 'Rotation option';
  if (d >= -13) return 'On the radar';
  return 'Not called up';
}

const CAPS: Record<string, [number, number]> = {
  'Nailed-on starter': [8, 12],
  'Squad regular': [5, 8],
  'Rotation option': [2, 5],
  'On the radar': [0, 2],
  'Not called up': [0, 0],
};

export function simulateNational(p: Player, club: ClubDef, overall: number): NationalOutput {
  const country = getCountry(p.country);
  const status = nationalStatus(overall, p.age, club, country.nationalStrength);
  const nationalHonors: string[] = [];
  const individualHonors: string[] = [];
  const logs: string[] = [];

  const [lo, hi] = CAPS[status];
  const caps = randInt(lo, hi);
  let goals = 0;
  if (caps > 0) {
    const threat = p.position === 'ST' ? 0.5 : p.position === 'W' || p.position === 'AM' ? 0.32 : p.position === 'CB' || p.position === 'GK' ? 0.04 : 0.14;
    goals = Math.max(0, Math.round(caps * threat * (0.6 + p.skills.finishing / 130) + noise()));
    if (p.national.debutAge === null) {
      p.national.debutAge = p.age;
      logs.push(`🌍 Made your senior debut for ${p.country}.`);
    }
  }

  // --- tournaments ---
  const involved = status === 'Nailed-on starter' || status === 'Squad regular';
  const isWC = worldCupThisYear(p.season);
  const isCont = continentalNationsThisYear(p.season);
  if ((isWC || isCont) && involved && p.age >= 17) {
    const compName = isWC ? 'World Cup' : CONTINENTAL_NATIONS[country.confederation] || 'Continental Cup';
    // nation run: win probability from strength + player quality
    const playerBoost = clamp((overall - country.nationalStrength) * 0.01, -0.05, 0.08);
    const winP = clamp((country.nationalStrength - 74) / 60 + playerBoost, 0.03, 0.42);
    const tournGoals = randInt(1, 6);
    const tg = Math.max(0, Math.round(tournGoals * (p.position === 'ST' ? 0.7 : 0.3) + noise()));
    goals += tg;
    if (chance(winP)) {
      nationalHonors.push(`${compName} Winner`);
      logs.push(`🏆 Won the ${compName} with ${p.country}!`);
      if (overall >= 86 && chance(0.5)) {
        individualHonors.push(`${compName} Golden Ball`);
        logs.push(`🏅 Named best player of the ${compName}.`);
      }
    } else if (chance(0.35)) {
      const round = ['Round of 16', 'Quarter-finals', 'Semi-finals'][randInt(0, 2)];
      logs.push(`Reached the ${round} at the ${compName}.`);
    }
    if (p.position === 'ST' && tg >= 4 && chance(0.4)) {
      individualHonors.push(`${compName} Golden Boot`);
      logs.push(`🏅 ${compName} top scorer with ${tg} goals.`);
    }
  }

  p.national.status = status;
  return { status, caps, goals, nationalHonors, individualHonors, logs };
}

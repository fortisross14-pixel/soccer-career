import type { Player, PositionKey, SkillKey } from '../game/types';
import { SKILL_KEYS } from '../data/skills';
import { POSITION_MAP } from '../data/positions';
import { clamp, randInt } from './util';
import { realisticName } from '../data/names';

export const START_AGE = 10;

export function createPlayer(name: string, country: string, position: PositionKey): Player {
  // Bell-shaped prospect distribution: most are 3-star, 2/4 are uncommon, 1/5 are rare.
  const roll = Math.random();
  const prospectStars: 1 | 2 | 3 | 4 | 5 = roll < 0.05 ? 1 : roll < 0.25 ? 2 : roll < 0.75 ? 3 : roll < 0.95 ? 4 : 5;
  const ceilingRanges: Record<1 | 2 | 3 | 4 | 5, [number, number]> = {
    1: [0.40, 0.54], 2: [0.52, 0.66], 3: [0.63, 0.79], 4: [0.76, 0.91], 5: [0.89, 1.00],
  };
  const [ceilingLow, ceilingHigh] = ceilingRanges[prospectStars];
  const potentialCeiling = clamp(ceilingLow + Math.random() * (ceilingHigh - ceilingLow), 0.4, 1);

  const peakStart = 23 + randInt(-1, 3);
  const peakEnd = peakStart + randInt(4, 7);

  const pos = POSITION_MAP[position];
  const keySet = new Set(pos.keySkills);

  const skills = {} as Record<SkillKey, number>;
  for (const k of SKILL_KEYS) {
    // GK skills only meaningful for keepers; everyone starts low there
    const isGkSkill = k === 'reflexes' || k === 'handling';
    let base = randInt(18, 28);
    if (position === 'GK' && isGkSkill) base = randInt(26, 36);
    if (position !== 'GK' && isGkSkill) base = randInt(10, 16);
    if (keySet.has(k)) base += 8;
    // talent lifts the starting floor a touch
    base += Math.round(potentialCeiling * 6);
    skills[k] = clamp(base, 12, 55);
  }

  return {
    id: `p${Date.now()}`,
    name: name || 'New Talent',
    country,
    position,
    age: START_AGE,
    season: 0,
    skills,
    potentialCeiling,
    peakStart,
    peakEnd,
    reputation: 4,
    marketValue: 0,
    money: 0,
    traits: [],
    contract: null,
    academyClubId: undefined,
    academyFocus: undefined,
    professionalDebutAge: null,
    role: 'youth',
    national: { debutAge: null, caps: 0, goals: 0, assists: 0, status: 'Not called up', matches: [] },
    honors: { club: [], national: [], individual: [] },
    totals: { games: 0, goals: 0, assists: 0, caps: 0, intlGoals: 0, intlAssists: 0 },
    history: [],
    log: [
      { season: 0, age: START_AGE, kind: 'system', text: `${name} enters a local academy at age 10 as a ${prospectStars}-star prospect.` },
    ],
    offers: [],
    trainedThisYear: false,
    searchedThisYear: false,
    searchedDomesticThisYear: false,
    searchedInternationalThisYear: false,
    sponsoredThisYear: false,
    renegotiatedThisYear: false,
    transferRequestedThisYear: false,
    trainingIntensity: 'balanced',
    seasonObjective: 'develop',
    morale: 72,
    fitness: 82,
    managerTrust: 55,
    clubContinental: 'none',
    prospectStars,
    peakOverall: 0,
    injurySeasons: 0,
    intenseTrainingYears: 0,
    careerDecisionScore: 0,
    rivalName: realisticName(country, `${name}-${country}-${position}-${Date.now()}`),
    rivalOverall: randInt(28, 42),
    rivalCountry: country,
    rivalPosition: position,
    rivalClubName: `${country} Youth Academy`,
    rivalTotals: { games: 0, goals: 0, assists: 0, trophies: 0 },
    rivalHistory: [],
    worldHeadlines: [],
    tacticalRole: position === 'ST' ? 'complete-forward' : position === 'W' ? 'winger' : position === 'AM' ? 'advanced-playmaker' : position === 'B2B' ? 'box-to-box' : position === 'CM' ? 'deep-playmaker' : position === 'CB' ? 'ball-playing-defender' : position === 'FB' ? 'overlapping-fullback' : 'shot-stopper',
    agentType: 'family',
    loanRequestedThisYear: false,
    eventPerformanceModifier: 0, eventDevelopmentModifier: 0, eventInjuryModifier: 0,
    personality: { professionalism: 50, loyalty: 50, humility: 50, teamFirst: 50, courage: 50, mediaComfort: 50 },
    characters: [
      { name: realisticName(country, `mentor-${name}`), role: 'mentor', relationship: 68, overall: 76, clubName: `${country} Academy` },
      { name: realisticName(country, `captain-${name}`), role: 'captain', relationship: 52, overall: 80, clubName: `${country} Academy` },
      { name: realisticName(country, `prospect-${name}`), role: 'prospect', relationship: 45, overall: 34, clubName: `${country} Academy` },
      { name: realisticName(country, `friend-${name}`), role: 'friend', relationship: 60, overall: 36, clubName: `${country} Academy` },
    ],
    retired: false,
  };
}

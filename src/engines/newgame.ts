import type { Player, PositionKey, SkillKey } from '../game/types';
import { SKILL_KEYS } from '../data/skills';
import { POSITION_MAP } from '../data/positions';
import { clamp, randInt } from './util';

export const START_AGE = 10;

export function createPlayer(name: string, country: string, position: PositionKey): Player {
  // hidden talent ceiling — most players are ordinary, a rare few are special.
  const r = Math.random();
  const potentialCeiling = clamp(0.4 + r * r * 0.55 + (Math.random() < 0.05 ? 0.12 : 0), 0.4, 1);
  const prospectStars = Math.max(1, Math.min(5, Math.round((potentialCeiling - 0.35) * 7))) as 1 | 2 | 3 | 4 | 5;

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
    rivalName: ['Alex Vega', 'Noah Silva', 'Leo Marin', 'Kenji Sato'][randInt(0, 3)],
    rivalOverall: randInt(28, 42),
    rivalCountry: country,
    rivalPosition: position,
    rivalClubName: `${country} Youth Academy`,
    rivalTotals: { games: 0, goals: 0, assists: 0, trophies: 0 },
    rivalHistory: [],
    worldHeadlines: [],
    retired: false,
  };
}

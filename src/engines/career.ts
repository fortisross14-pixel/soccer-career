import type { Career, Intensity, PositionKey, SkillKey } from '../game/types';
import { SKILL_KEYS, SKILL_MAP } from '../data/skills';
import { getCountry } from '../data/countries';
import { CLUB_MAP } from '../data/clubs';
import { allCaps, playerOverall } from './overall';
import { addPack } from './cards';
import { firstOffers, loanOffers, windowOffers } from './market';
import { currentRole, roleRank } from './match';
import { isWindow } from './month';
import { clamp, randInt, rng, rngState, seedRng, uid } from './util';

export const START_AGE = 17;
export const START_YEAR = 2026;

export function createCareer(name: string, country: string, position: PositionKey, seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0): Career {
  seedRng(seed);
  const roll = rng();
  const stars: 1 | 2 | 3 | 4 | 5 = roll < 0.06 ? 1 : roll < 0.27 ? 2 : roll < 0.75 ? 3 : roll < 0.94 ? 4 : 5;
  const ranges: Record<number, [number, number]> = { 1: [0.42, 0.54], 2: [0.52, 0.65], 3: [0.62, 0.77], 4: [0.75, 0.89], 5: [0.87, 0.98] };
  const [lo, hi] = ranges[stars];
  const potential = lo + rng() * (hi - lo);
  const peakStart = 24 + randInt(-1, 2);
  const peakEnd = peakStart + randInt(4, 7);

  const caps = allCaps({ potential, position });
  const skills = {} as Record<SkillKey, number>;
  for (const k of SKILL_KEYS) {
    const gk = SKILL_MAP[k].category === 'Goalkeeping';
    skills[k] = gk && position !== 'GK' ? randInt(10, 18) : clamp(Math.round(caps[k] * 0.82 + randInt(-3, 3)), 10, caps[k]);
  }

  const c: Career = {
    version: 2,
    id: uid('car'),
    rng: 0,
    player: {
      name: name.trim() || 'New Talent', country, position, age: START_AGE, skills, potential, stars, peakStart, peakEnd,
      traits: [], form: 6.6, fitness: 92, morale: 70, trust: 50, reputation: 4 + stars * 3, money: 15_000,
      contract: null, injury: null, boosts: [], staff: [], transferListed: false,
    },
    year: START_YEAR,
    month: 0,
    season: null,
    cards: [],
    packs: [],
    purchases: 0,
    focus: 'key',
    intensity: 'normal',
    offers: [],
    decisions: [],
    notices: [],
    asked: { loan: false, transfer: false },
    lastReport: null,
    history: [],
    pastFixtures: [],
    honors: { club: [], individual: [], national: [] },
    totals: { apps: 0, goals: 0, assists: 0, caps: 0, intlGoals: 0, motm: 0 },
    national: { debutAge: null, status: 'Not called up' },
    log: [],
    peakOvr: 0,
    retired: false,
  };
  c.offers = firstOffers(c);
  c.peakOvr = playerOverall(c.player);
  addPack(c, 'silver', 'Welcome pack');
  addPack(c, 'bronze', 'Academy graduation');
  addPack(c, 'bronze', 'Academy graduation');
  c.notices = [
    `You are a ${stars}-star prospect from ${country}. Three clubs want to sign you — choose your first contract.`,
    'Open your welcome packs in the Cards tab before the season starts.',
  ];
  c.log.unshift({ year: c.year, month: 0, kind: 'milestone', text: `${c.player.name} turns professional at 17 as a ${stars}-star prospect from ${country} (${getCountry(country).leagueName}).` });
  c.rng = rngState();
  return c;
}

export function setTraining(c: Career, focus: string, intensity: Intensity) {
  c.focus = focus;
  c.intensity = intensity;
}

export function canRequestLoan(c: Career): string | null {
  const p = c.player;
  if (!isWindow(c.month)) return 'Loans can only be arranged during a transfer window.';
  if (!p.contract || p.contract.parentClubId) return 'Not available right now.';
  if (p.age > 23) return 'Loans are for players aged 23 or younger.';
  if (roleRank(currentRole(c)) >= 3) return 'You are already a regular — the club will not loan you out.';
  if (c.asked.loan) return 'Already asked this window.';
  return null;
}

export function requestLoan(c: Career): string {
  const why = canRequestLoan(c);
  if (why) return why;
  c.asked.loan = true;
  const offers = loanOffers(c);
  c.offers.push(...offers);
  return `${offers.length} clubs want you on loan.`;
}

export function requestTransfer(c: Career): string {
  const p = c.player;
  if (!p.contract) return 'You are a free agent.';
  if (c.asked.transfer || p.transferListed) return 'You are already on the transfer list.';
  c.asked.transfer = true;
  p.transferListed = true;
  p.trust = clamp(p.trust - 12, 0, 100);
  p.morale = clamp(p.morale + 3, 0, 100);
  c.log.unshift({ year: c.year, month: c.month, kind: 'transfer', text: `Handed in a transfer request at ${CLUB_MAP[p.contract.clubId].name}.` });
  if (isWindow(c.month)) {
    const more = windowOffers(c, c.month === 6).filter((o) => !c.offers.some((x) => x.clubId === o.clubId));
    c.offers.push(...more);
    return `Transfer request submitted — ${more.length} new clubs called your agent. Manager trust −12.`;
  }
  return 'Transfer request submitted. Expect more offers when the window opens. Manager trust −12.';
}

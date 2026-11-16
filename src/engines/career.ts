import type { Career, CareerMods, PositionKey, SkillKey } from '../game/types';
import { POSITION_MAP } from '../data/positions';
import { milestone } from './coins';
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

export interface CareerSetup {
  upgrades: Record<string, number>;
  relics: string[];
}

export const NO_SETUP: CareerSetup = { upgrades: {}, relics: [] };

export function baseMods(): CareerMods {
  return { injuryCut: 0, handBonus: 0, extraBoosts: 0, extraPlays: 0, luck: 0, youthGrowth: 0, repBonus: 0, offerBonus: 0, wageBonus: 0, coinMult: 1, noInjuryUntil: 0 };
}

const POT_STEP = 0.0125; // ≈ +1 POT

export function createCareer(name: string, country: string, position: PositionKey, setup: CareerSetup = NO_SETUP, seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0): Career {
  seedRng(seed);
  const up = (id: string) => setup.upgrades[id] ?? 0;
  const has = (id: string) => setup.relics.includes(id);

  const roll = rng();
  let stars = (roll < 0.06 ? 1 : roll < 0.27 ? 2 : roll < 0.75 ? 3 : roll < 0.94 ? 4 : 5) as 1 | 2 | 3 | 4 | 5;
  const minStars = up('scouting') ? 2 + up('scouting') : 1;
  stars = Math.max(stars, minStars) as typeof stars;
  if (has('hype')) stars = Math.min(5, stars + 1) as typeof stars;
  if (has('chosen')) stars = Math.min(5, stars + 1) as typeof stars;
  const ranges: Record<number, [number, number]> = { 1: [0.42, 0.54], 2: [0.52, 0.65], 3: [0.62, 0.77], 4: [0.75, 0.89], 5: [0.87, 0.98] };
  const [lo, hi] = ranges[stars];
  const potBonus = [0, 1, 2, 4][up('gifted')] + (has('gene') ? 2 : 0) + (has('chosen') ? 1 : 0);
  const potential = Math.min(1, lo + rng() * (hi - lo) + potBonus * POT_STEP);
  const peakStart = 24 + randInt(-1, 2);
  const peakEnd = peakStart + randInt(4, 7) + up('longevity');

  const caps = allCaps({ potential, position });
  const keys = POSITION_MAP[position].keySkills;
  const keyBonus = up('academy') * 2 + (has('socks') ? 2 : 0);
  const skills = {} as Record<SkillKey, number>;
  for (const k of SKILL_KEYS) {
    const gk = SKILL_MAP[k].category === 'Goalkeeping';
    const base = gk && position !== 'GK' ? randInt(10, 18) : clamp(Math.round(caps[k] * 0.82 + randInt(-3, 3)), 10, caps[k]);
    skills[k] = keys.includes(k) ? Math.min(caps[k], base + keyBonus) : base;
  }
  if (has('armband')) skills.leadership = Math.min(99, skills.leadership + 3);

  const mods = baseMods();
  mods.injuryCut = up('body') * 0.15;
  mods.handBonus = up('binder') >= 1 ? 6 : 0;
  mods.extraPlays = (up('binder') >= 1 ? 1 : 0) + (has('twin') ? 1 : 0);
  mods.extraBoosts = up('binder') >= 2 ? 1 : 0;
  mods.luck = up('luck');
  mods.youthGrowth = has('notebook') ? 0.25 : 0;
  mods.offerBonus = up('agent');
  mods.wageBonus = up('agent') * 0.08;
  mods.coinMult = has('midas') ? 1.5 : 1;
  mods.noInjuryUntil = has('steel') ? START_YEAR + 2 : 0;

  const c: Career = {
    version: 2,
    id: uid('car'),
    rng: 0,
    player: {
      name: name.trim() || 'New Talent', country, position, age: START_AGE, skills, potential, stars, peakStart, peakEnd,
      traits: [], form: 6.6, fitness: 92, morale: 70, trust: 50 + (has('armband') ? 20 : 0),
      reputation: 4 + stars * 3 + up('fame') * 10 + (has('local') ? 8 : 0), money: 15_000 + (has('piggy') ? 300_000 : 0),
      contract: null, injury: null, boosts: [], staff: [], transferListed: false,
    },
    year: START_YEAR,
    month: 0,
    season: null,
    cards: [],
    packs: [],
    purchases: 0,
    focus: 'key',
    plan: { balance: 50 },
    cardsThisMonth: 0,
    mods,
    relics: [...setup.relics],
    milestones: [],
    pendingCoins: [],
    coinsEarned: 0,
    world: { div: {} },
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
  if (up('kit') >= 1) addPack(c, 'silver', 'Starter Kit');
  if (up('kit') >= 2) addPack(c, 'gold', 'Starter Kit');
  if (up('kit') >= 3) addPack(c, 'elite', 'Starter Kit');
  if (has('ticket')) addPack(c, 'elite', 'Golden Ticket');
  if (has('chosen')) addPack(c, 'elite', 'The Chosen One');
  if (has('energy')) for (let i = 0; i < 3; i++) c.cards.push({ uid: uid('cd'), defId: 're-ice', isNew: true });
  milestone(c, 'start');
  c.notices = [
    `You are a ${stars}-star prospect from ${country}. Three clubs want to sign you. Choose your first contract.`,
    'Open your welcome packs in the Cards tab before the season starts.',
  ];
  c.log.unshift({ year: c.year, month: 0, kind: 'milestone', text: `${c.player.name} turns professional at 17 as a ${stars}-star prospect from ${country} (${getCountry(country).leagueName}).` });
  c.rng = rngState();
  return c;
}

export function setPlan(c: Career, focus: string, balance: number) {
  c.focus = focus;
  c.plan = { balance: clamp(Math.round(balance), 0, 100) };
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

import type { Career, CareerMods, PositionKey, Rarity, SkillKey } from '../game/types';
import { POSITION_MAP } from '../data/positions';
import { milestone } from './coins';
import { initStars, setSeasonTargets } from './stars';
import { TRINKET_MAP, type TrinketFx } from '../data/legacy';
import { SKILL_KEYS, SKILL_MAP } from '../data/skills';
import { getCountry } from '../data/countries';
import { CLUB_MAP } from '../data/clubs';
import { allCaps, playerOverall } from './overall';
import { addPack } from './cards';
import { academyStartOffers, loanOffers, windowOffers } from './market';
import { currentRole, roleRank } from './match';
import { isWindow } from './month';
import { clamp, randInt, rng, rngState, seedRng, uid } from './util';

export const START_AGE = 11;
export const START_YEAR = 2026;

export interface CareerSetup {
  upgrades: Record<string, number>;
  relics: string[];
  /** best card rarity unlocked (by completed careers) */
  cardTier?: Rarity;
}

export const NO_SETUP: CareerSetup = { upgrades: {}, relics: [], cardTier: 'common' };

/** card quality unlocks: rare after 1 completed career, epic after 3, legendary after 6 */
export function cardTierFor(completed: number): Rarity {
  return completed >= 6 ? 'legendary' : completed >= 3 ? 'epic' : completed >= 1 ? 'rare' : 'common';
}
export const CARD_UNLOCKS: { tier: Rarity; careers: number }[] = [
  { tier: 'common', careers: 0 }, { tier: 'rare', careers: 1 }, { tier: 'epic', careers: 3 }, { tier: 'legendary', careers: 6 },
];

export function baseMods(): CareerMods {
  return { injuryCut: 0, handBonus: 0, extraBoosts: 0, extraPlays: 0, luck: 0, youthGrowth: 0, repBonus: 0, offerBonus: 0, wageBonus: 0, coinMult: 1, noInjuryUntil: 0, ratingBonus: 0, maxRarity: 'legendary' };
}

const POT_STEP = 0.021; // ≈ +1 POT

export function createCareer(name: string, country: string, position: PositionKey, setup: CareerSetup = NO_SETUP, seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0): Career {
  seedRng(seed);
  const up = (id: string) => setup.upgrades[id] ?? 0;
  const trinkets = setup.relics.map((id) => TRINKET_MAP[id]).filter(Boolean);
  const sum = (f: (fx: TrinketFx) => number | undefined) => trinkets.reduce((acc, t) => acc + (f(t.fx) ?? 0), 0);

  const roll = rng();
  let stars = (roll < 0.15 ? 1 : roll < 0.5 ? 2 : roll < 0.82 ? 3 : roll < 0.96 ? 4 : 5) as 1 | 2 | 3 | 4 | 5;
  const minStars = up('scouting') ? 2 + up('scouting') : 1;
  stars = Math.min(5, Math.max(stars, minStars) + sum((f) => f.stars)) as typeof stars;
  // first runs are humble: most prospects top out in the lower divisions or a modest top-flight side
  const ranges: Record<number, [number, number]> = { 1: [0.27, 0.37], 2: [0.34, 0.45], 3: [0.42, 0.54], 4: [0.52, 0.65], 5: [0.62, 0.76] };
  const [lo, hi] = ranges[stars];
  const potBonus = [0, 1, 2, 4][up('gifted')] + sum((f) => f.pot);
  const potential = Math.min(1.2, lo + rng() * (hi - lo) + potBonus * POT_STEP);
  const peakStart = 24 + randInt(-1, 2);
  const peakEnd = peakStart + randInt(4, 7) + up('longevity') + sum((f) => f.prime);

  const caps = allCaps({ potential, position });
  const keys = POSITION_MAP[position].keySkills;
  const keyBonus = up('academy') * 2 + sum((f) => f.key);
  const skills = {} as Record<SkillKey, number>;
  for (const k of SKILL_KEYS) {
    const gk = SKILL_MAP[k].category === 'Goalkeeping';
    const base = gk && position !== 'GK' ? randInt(8, 14) : clamp(Math.round(caps[k] * 0.62 + randInt(-3, 3)), 10, caps[k]);
    skills[k] = keys.includes(k) ? Math.min(caps[k], base + keyBonus) : base;
  }
  skills.leadership = Math.min(99, skills.leadership + sum((f) => f.leadership));

  const mods = baseMods();
  mods.injuryCut = Math.min(0.7, up('body') * 0.15 + sum((f) => f.injury));
  mods.handBonus = up('binder') >= 1 ? 6 : 0;
  mods.extraPlays = (up('binder') >= 1 ? 1 : 0) + sum((f) => f.plays);
  mods.extraBoosts = up('binder') >= 2 ? 1 : 0;
  mods.luck = up('luck');
  mods.youthGrowth = sum((f) => f.growth);
  mods.offerBonus = up('agent');
  mods.wageBonus = up('agent') * 0.08;
  mods.coinMult = 1 + sum((f) => f.coinMult);
  mods.noInjuryUntil = sum((f) => f.noInjurySeasons) ? START_YEAR + sum((f) => f.noInjurySeasons) : 0;
  mods.ratingBonus = sum((f) => f.rating);
  mods.maxRarity = setup.cardTier ?? 'legendary';

  const c: Career = {
    version: 2,
    id: uid('car'),
    rng: 0,
    player: {
      name: name.trim() || 'New Talent', country, position, age: START_AGE, skills, potential, stars, peakStart, peakEnd,
      traits: [], form: 6.6, fitness: 92, morale: 70, trust: 50 + sum((f) => f.trust),
      reputation: 4 + stars * 3 + up('fame') * 10 + sum((f) => f.rep), money: 15_000 + sum((f) => f.money),
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
    academy: null,
    stars: [],
    retiredStars: [],
    awardsHistory: [],
    bestDiv: 9,
    firstEver: [],
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
  c.stars = initStars();
  setSeasonTargets(c.stars);
  c.offers = academyStartOffers(c);
  c.peakOvr = playerOverall(c.player);
  addPack(c, 'silver', 'Welcome pack');
  addPack(c, 'bronze', 'Academy graduation');
  addPack(c, 'bronze', 'Academy graduation');
  if (up('kit') >= 1) addPack(c, 'silver', 'Starter Kit');
  if (up('kit') >= 2) addPack(c, 'gold', 'Starter Kit');
  if (up('kit') >= 3) addPack(c, 'elite', 'Starter Kit');
  for (const t of trinkets) for (const tier of t.fx.packs ?? []) addPack(c, tier, t.name);
  for (let i = 0; i < sum((f) => f.iceBaths); i++) c.cards.push({ uid: uid('cd'), defId: 're-ice', isNew: true });
  milestone(c, 'start');
  c.notices = [
    `You are an 11-year-old ${stars}-star prospect from ${country}. Academies want you. Pick where to grow up.`,
    'You stay in the academy until a club signs you, you are promoted to the first team, or you turn 20.',
  ];
  c.log.unshift({ year: c.year, month: 0, kind: 'milestone', text: `${c.player.name} is scouted at 11 as a ${stars}-star prospect from ${country} (${getCountry(country).leagueName}).` });
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

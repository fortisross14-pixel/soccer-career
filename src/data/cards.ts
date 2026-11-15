import type { CardDef, PackTier, Rarity, SkillKey } from '../game/types';
import { SKILLS } from './skills';
import { TRAITS } from './traits';

// ------------------------------------------------------------
// Card catalogue. Skill cards are generated per attribute, the rest
// are hand-authored. Packs draw from this list by rarity, weighted
// toward cards that matter for the player's position.
// ------------------------------------------------------------

const CARDS: CardDef[] = [];

// --- single-skill training cards ---
for (const s of SKILLS) {
  CARDS.push({ id: `sk-${s.key}-1`, name: `${s.label} Drill`, kind: 'skill', rarity: 'common', desc: `+1 ${s.label} permanently.`, skills: { [s.key]: 1 } });
  CARDS.push({ id: `sk-${s.key}-2`, name: `${s.label} Session`, kind: 'skill', rarity: 'rare', desc: `+2 ${s.label} permanently.`, skills: { [s.key]: 2 } });
  CARDS.push({ id: `sk-${s.key}-4`, name: `${s.label} Masterclass`, kind: 'skill', rarity: 'epic', desc: `+4 ${s.label} permanently.`, skills: { [s.key]: 4 } });
}

// --- combo training cards ---
const COMBOS: { id: string; name: string; keys: SkillKey[] }[] = [
  { id: 'shoot', name: 'Shooting Clinic', keys: ['finishing', 'longShots'] },
  { id: 'air', name: 'Aerial Work', keys: ['heading', 'jumping'] },
  { id: 'vision', name: 'Vision Training', keys: ['longPass', 'decisions'] },
  { id: 'tempo', name: 'Rondo Circuit', keys: ['shortPass', 'workRate'] },
  { id: 'flair', name: 'Street Football', keys: ['dribbling', 'pace'] },
  { id: 'duel', name: 'Duel Training', keys: ['tackling', 'strength'] },
  { id: 'athlete', name: 'Athletics Block', keys: ['pace', 'stamina', 'strength'] },
  { id: 'dead', name: 'Dead-Ball Hour', keys: ['setPieces', 'crossing'] },
  { id: 'iq', name: 'Video Analysis', keys: ['decisions', 'leadership', 'workRate'] },
  { id: 'gk', name: 'Keeper Camp', keys: ['reflexes', 'handling'] },
];
for (const c of COMBOS) {
  const label = c.keys.length;
  CARDS.push({ id: `cb-${c.id}-1`, name: c.name, kind: 'skill', rarity: 'rare', desc: `+1 to ${label} linked attributes.`, skills: Object.fromEntries(c.keys.map((k) => [k, 1])) });
  CARDS.push({ id: `cb-${c.id}-3`, name: `Elite ${c.name}`, kind: 'skill', rarity: 'epic', desc: `+3 to ${label} linked attributes.`, skills: Object.fromEntries(c.keys.map((k) => [k, 3])) });
}
CARDS.push({ id: 'sk-keyall', name: 'Perfect Pre-Season', kind: 'skill', rarity: 'legendary', desc: '+3 to every key attribute for your position.', skills: {} });

// --- match boosts (temporary) ---
CARDS.push(
  { id: 'bo-hot', name: 'Hot Streak', kind: 'boost', rarity: 'rare', desc: '+6 Finishing & Long Shots for 3 matches.', skills: { finishing: 6, longShots: 6 }, matches: 3 },
  { id: 'bo-engine', name: 'Second Lungs', kind: 'boost', rarity: 'common', desc: '+6 Stamina & Work Rate for 3 matches.', skills: { stamina: 6, workRate: 6 }, matches: 3 },
  { id: 'bo-vision', name: 'In the Zone', kind: 'boost', rarity: 'rare', desc: '+6 Passing & Decisions for 3 matches.', skills: { shortPass: 6, longPass: 4, decisions: 6 }, matches: 3 },
  { id: 'bo-wall', name: 'Brick Wall', kind: 'boost', rarity: 'rare', desc: '+6 Tackling, Heading & Strength for 3 matches.', skills: { tackling: 6, heading: 5, strength: 5 }, matches: 3 },
  { id: 'bo-cat', name: 'Cat Reflexes', kind: 'boost', rarity: 'rare', desc: '+8 Reflexes & Handling for 3 matches.', skills: { reflexes: 8, handling: 6 }, matches: 3, positions: ['Goalkeeper'] },
  { id: 'bo-turbo', name: 'Turbo Boots', kind: 'boost', rarity: 'common', desc: '+7 Pace & Dribbling for 2 matches.', skills: { pace: 7, dribbling: 5 }, matches: 2 },
  { id: 'bo-big', name: 'Big Game Player', kind: 'boost', rarity: 'epic', desc: '+5 to all key attributes for 4 matches.', skills: {}, matches: 4 },
  { id: 'bo-god', name: 'God Mode', kind: 'boost', rarity: 'legendary', desc: '+9 to all key attributes for 5 matches.', skills: {}, matches: 5 },
);

// --- recovery & relationship ---
CARDS.push(
  { id: 're-ice', name: 'Ice Bath', kind: 'recovery', rarity: 'common', desc: '+20 Fitness.', fitness: 20 },
  { id: 're-spa', name: 'Recovery Retreat', kind: 'recovery', rarity: 'rare', desc: '+45 Fitness and +5 Morale.', fitness: 45, morale: 5 },
  { id: 're-physio', name: 'Physio Miracle', kind: 'recovery', rarity: 'rare', desc: 'Shortens an injury by 14 days.', heal: 14 },
  { id: 're-surgeon', name: 'Top Surgeon', kind: 'recovery', rarity: 'epic', desc: 'Cures any injury instantly, +20 Fitness.', heal: 365, fitness: 20 },
  { id: 're-psych', name: 'Sports Psychologist', kind: 'recovery', rarity: 'common', desc: '+15 Morale.', morale: 15 },
  { id: 're-talk', name: 'Coffee with the Manager', kind: 'recovery', rarity: 'common', desc: '+8 Manager trust.', trust: 8 },
  { id: 're-extra', name: 'First In, Last Out', kind: 'recovery', rarity: 'rare', desc: '+15 Manager trust.', trust: 15 },
  { id: 're-media', name: 'Viral Interview', kind: 'recovery', rarity: 'rare', desc: '+4 Reputation.', reputation: 4 },
  { id: 're-doc', name: 'Documentary Deal', kind: 'recovery', rarity: 'epic', desc: '+8 Reputation and +10 Morale.', reputation: 8, morale: 10 },
);

// --- potential ---
CARDS.push(
  { id: 'po-1', name: 'Breakthrough', kind: 'potential', rarity: 'epic', desc: 'Raises your Potential (+1–2 POT). Under 30 only.', potential: 0.025, maxAge: 29 },
  { id: 'po-2', name: 'Generational Talent', kind: 'potential', rarity: 'legendary', desc: 'Raises your Potential (+3–4 POT) and extends your prime by a year.', potential: 0.06, maxAge: 31 },
);

// --- traits (permanent playstyles) ---
for (const t of TRAITS) {
  CARDS.push({
    id: `tr-${t.id}`, name: t.name, kind: 'trait', rarity: t.rarity <= 3 ? 'legendary' : 'epic',
    desc: `${t.desc} Permanent trait.`, traitId: t.id, positions: t.positions,
    skills: Object.fromEntries(Object.entries(t.boosts).map(([k, v]) => [k, Math.round((v as number) * 0.4)])),
  });
}

// --- staff (persistent perks with monthly cost) ---
CARDS.push(
  { id: 'st-chef', name: 'Personal Chef', kind: 'staff', rarity: 'rare', desc: 'Faster fitness recovery between matches.', staff: { recovery: 0.35 }, monthlyCost: 9_000 },
  { id: 'st-physio', name: 'Private Physio', kind: 'staff', rarity: 'rare', desc: 'Injury risk −35%.', staff: { injury: 0.35 }, monthlyCost: 14_000 },
  { id: 'st-coach', name: 'Skills Coach', kind: 'staff', rarity: 'epic', desc: 'Monthly growth +25%.', staff: { growth: 0.25 }, monthlyCost: 22_000 },
  { id: 'st-agent', name: 'Super Agent', kind: 'staff', rarity: 'epic', desc: '+1 offer per window, +12% wages on new deals.', staff: { offers: 1, wage: 0.12 }, monthlyCost: 30_000 },
  { id: 'st-pr', name: 'PR Manager', kind: 'staff', rarity: 'rare', desc: 'Reputation gains +40%.', staff: { reputation: 0.4 }, monthlyCost: 12_000 },
  { id: 'st-guru', name: 'Performance Guru', kind: 'staff', rarity: 'legendary', desc: 'Growth +20%, injury risk −25%, faster recovery.', staff: { growth: 0.2, injury: 0.25, recovery: 0.25 }, monthlyCost: 45_000 },
);

export const CARD_DEFS = CARDS;
export const CARD_MAP: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export interface PackDef {
  tier: PackTier;
  name: string;
  size: number;
  odds: Record<Rarity, number>;
  guarantee: Rarity;
  price: number;
}

export const PACKS: Record<PackTier, PackDef> = {
  bronze: { tier: 'bronze', name: 'Bronze Pack', size: 2, odds: { common: 0.8, rare: 0.18, epic: 0.02, legendary: 0 }, guarantee: 'common', price: 25_000 },
  silver: { tier: 'silver', name: 'Silver Pack', size: 3, odds: { common: 0.56, rare: 0.35, epic: 0.08, legendary: 0.01 }, guarantee: 'rare', price: 140_000 },
  gold: { tier: 'gold', name: 'Gold Pack', size: 4, odds: { common: 0.3, rare: 0.46, epic: 0.2, legendary: 0.04 }, guarantee: 'epic', price: 700_000 },
  elite: { tier: 'elite', name: 'Elite Pack', size: 5, odds: { common: 0.1, rare: 0.42, epic: 0.36, legendary: 0.12 }, guarantee: 'epic', price: 3_000_000 },
};

export const MAX_HAND = 24;
export const MAX_BOOSTS = 3;
export const MAX_STAFF = 2;
export const MAX_TRAITS = 3;

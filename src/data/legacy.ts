import type { PackTier } from '../game/types';

// ------------------------------------------------------------
// Legacy content bought with legacy coins from the main menu.
// Upgrades are permanent and levelled. Trinkets are permanent
// collectibles: you own them forever and slot up to three into
// each new career. Their rarity sets how much they help.
// ------------------------------------------------------------

export interface UpgradeDef { id: string; name: string; icon: string; costs: number[]; levels: string[] }

export const UPGRADES: UpgradeDef[] = [
  { id: 'slots', name: 'Trinket Slots', icon: '🎒', costs: [500, 1800], levels: ['2 trinket slots per career', '3 trinket slots per career'] },
  { id: 'academy', name: 'Elite Academy', icon: '🏟', costs: [300, 900, 2000], levels: ['+2 to key attributes at the start', '+4 to key attributes at the start', '+6 to key attributes at the start'] },
  { id: 'gifted', name: 'Gifted', icon: '✦', costs: [600, 1600, 3600], levels: ['+1 POT', '+2 POT', '+4 POT'] },
  { id: 'scouting', name: 'Scouting Report', icon: '🔭', costs: [800, 2400], levels: ['Always start as a 2★ prospect or better', 'Always start as a 3★ prospect or better'] },
  { id: 'kit', name: 'Starter Kit', icon: '📦', costs: [240, 700, 1800], levels: ['+1 Silver pack at the start', '+1 Silver and +1 Gold pack', '+1 Silver, Gold and Elite pack'] },
  { id: 'body', name: 'Iron Body', icon: '🦴', costs: [400, 1100], levels: ['Injury risk −15%', 'Injury risk −30%'] },
  { id: 'binder', name: 'Card Binder', icon: '🗂', costs: [500, 1400], levels: ['+6 hand size and +1 card play per month', 'Also +1 match-boost slot'] },
  { id: 'luck', name: 'Lucky Packs', icon: '🍀', costs: [800, 2200], levels: ['Better rarity odds in every pack', 'Much better rarity odds'] },
  { id: 'agent', name: 'Family Agent', icon: '🤝', costs: [600], levels: ['+1 offer per window and +8% wages'] },
  { id: 'fame', name: 'Viral Clip', icon: '📱', costs: [400], levels: ['Start with +10 reputation'] },
  { id: 'longevity', name: 'Longevity', icon: '⏳', costs: [1400], levels: ['Your prime lasts one year longer'] },
];
export const UPGRADE_MAP: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export type TrinketRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const TRINKET_RARITIES: TrinketRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const TRINKET_COLOR: Record<TrinketRarity, string> = { common: '#c9d0d6', uncommon: '#3fcf7f', rare: '#3d8bff', epic: '#a259ff', legendary: '#ffb800' };

/** what a trinket does when slotted into a career */
export interface TrinketFx {
  pot?: number;          // POT points
  stars?: number;        // extra prospect stars
  key?: number;          // starting bonus to key attributes
  growth?: number;       // growth bonus until age 21
  injury?: number;       // injury risk reduction (0..1)
  plays?: number;        // extra card plays per month
  packs?: PackTier[];
  rep?: number;
  trust?: number;
  leadership?: number;
  money?: number;
  coinMult?: number;     // extra legacy coin multiplier
  prime?: number;        // years added to the prime
  noInjurySeasons?: number;
  rating?: number;       // match rating bonus
  iceBaths?: number;
}

export interface TrinketDef { id: string; name: string; icon: string; rarity: TrinketRarity; desc: string; fx: TrinketFx }

export const TRINKETS: TrinketDef[] = [
  { id: 'socks', name: 'Lucky Socks', icon: '🧦', rarity: 'common', desc: '+2 to every key attribute and +2 POT.', fx: { key: 2, pot: 2 } },
  { id: 'piggy', name: 'Piggy Bank', icon: '🐷', rarity: 'common', desc: 'Start with $300K in the bank and +2 POT.', fx: { money: 300_000, pot: 2 } },
  { id: 'local', name: 'Local Hero', icon: '📰', rarity: 'common', desc: '+8 starting reputation and +2 POT.', fx: { rep: 8, pot: 2 } },
  { id: 'energy', name: 'Energy Drinks', icon: '🥤', rarity: 'common', desc: 'Start with three Ice Bath cards and +3 POT.', fx: { iceBaths: 3, pot: 3 } },
  { id: 'shinpads', name: 'Shin Pads', icon: '🛡', rarity: 'common', desc: 'Injury risk −15% and +3 POT.', fx: { injury: 0.15, pot: 3 } },

  { id: 'notebook', name: "Mentor's Notebook", icon: '📓', rarity: 'uncommon', desc: '+30% growth until age 21 and +4 POT.', fx: { growth: 0.3, pot: 4 } },
  { id: 'armband', name: "Captain's Armband", icon: '©', rarity: 'uncommon', desc: '+20 manager trust, +4 leadership, +4 POT.', fx: { trust: 20, leadership: 4, pot: 4 } },
  { id: 'ticket', name: 'Golden Ticket', icon: '🎫', rarity: 'uncommon', desc: 'Start with an Elite pack and +4 POT.', fx: { packs: ['elite'], pot: 4 } },
  { id: 'diploma', name: 'Academy Diploma', icon: '🎓', rarity: 'uncommon', desc: '+6 POT and +1 to key attributes.', fx: { pot: 6, key: 1 } },

  { id: 'talent', name: 'Natural Talent', icon: '🌟', rarity: 'rare', desc: '+6 POT.', fx: { pot: 6 } },
  { id: 'twin', name: 'Twin Engine', icon: '⚙', rarity: 'rare', desc: '+1 card play every month and +5 POT.', fx: { plays: 1, pot: 5 } },
  { id: 'biggame', name: 'Big Game Mentality', icon: '🎯', rarity: 'rare', desc: '+0.15 match rating and +6 POT.', fx: { rating: 0.15, pot: 6 } },
  { id: 'bloom', name: 'Late Bloomer', icon: '🌱', rarity: 'rare', desc: 'Prime lasts 2 years longer and +6 POT.', fx: { prime: 2, pot: 6 } },

  { id: 'hype', name: 'Wonderkid Hype', icon: '🔥', rarity: 'epic', desc: '+1 prospect star and +5 POT.', fx: { stars: 1, pot: 5 } },
  { id: 'gene', name: 'Generational Gene', icon: '🧬', rarity: 'epic', desc: '+8 POT and +2 to key attributes.', fx: { pot: 8, key: 2 } },
  { id: 'steel', name: 'Indestructible', icon: '🦾', rarity: 'epic', desc: 'No injuries for 3 seasons, −30% after. +8 POT.', fx: { noInjurySeasons: 3, injury: 0.3, pot: 8 } },
  { id: 'midas', name: 'Midas Touch', icon: '🪙', rarity: 'epic', desc: '+60% legacy coins and +7 POT.', fx: { coinMult: 0.6, pot: 7 } },

  { id: 'chosen', name: 'The Chosen One', icon: '👑', rarity: 'legendary', desc: '+2 prospect stars, +8 POT and an Elite pack.', fx: { stars: 2, pot: 8, packs: ['elite'] } },
  { id: 'feet', name: 'Golden Feet', icon: '👟', rarity: 'legendary', desc: '+14 POT, +4 key attributes, +0.1 match rating.', fx: { pot: 14, key: 4, rating: 0.1 } },
  { id: 'eternal', name: 'Eternal Prime', icon: '♾', rarity: 'legendary', desc: 'Prime lasts 3 years longer, +11 POT, injury risk −25%.', fx: { prime: 3, pot: 11, injury: 0.25 } },
];
export const TRINKET_MAP: Record<string, TrinketDef> = Object.fromEntries(TRINKETS.map((r) => [r.id, r]));

export interface CrateDef { id: 'basic' | 'premium' | 'legend'; name: string; cost: number; odds: Record<TrinketRarity, number> }
export const CRATES: CrateDef[] = [
  { id: 'basic', name: 'Kit Bag', cost: 300, odds: { common: 0.6, uncommon: 0.3, rare: 0.09, epic: 0.01, legendary: 0 } },
  { id: 'premium', name: 'Trophy Case', cost: 1200, odds: { common: 0, uncommon: 0.35, rare: 0.45, epic: 0.17, legendary: 0.03 } },
  { id: 'legend', name: 'Legend Chest', cost: 3600, odds: { common: 0, uncommon: 0, rare: 0.35, epic: 0.5, legendary: 0.15 } },
];

/** share of the crate cost refunded when you pull a trinket you already own */
export const DUPLICATE_REFUND = 0.4;

export function trinketSlots(upgrades: Record<string, number>): number {
  return 1 + (upgrades.slots ?? 0);
}

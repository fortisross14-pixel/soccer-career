import type { Rarity } from '../game/types';

// ------------------------------------------------------------
// Legacy content bought with legacy coins from the main menu.
// Upgrades are permanent and levelled; relics are one-run
// boosts found in crates and equipped before a new career.
// ------------------------------------------------------------

export interface UpgradeDef { id: string; name: string; icon: string; costs: number[]; levels: string[] }

export const UPGRADES: UpgradeDef[] = [
  { id: 'academy', name: 'Elite Academy', icon: '🏟', costs: [150, 400, 900], levels: ['+2 to key attributes at the start', '+4 to key attributes at the start', '+6 to key attributes at the start'] },
  { id: 'scouting', name: 'Scouting Report', icon: '🔭', costs: [300, 1000], levels: ['Always start as a 3★ prospect or better', 'Always start as a 4★ prospect or better'] },
  { id: 'gifted', name: 'Gifted', icon: '✦', costs: [250, 650, 1400], levels: ['+1 POT', '+2 POT', '+4 POT'] },
  { id: 'kit', name: 'Starter Kit', icon: '🎒', costs: [120, 350, 900], levels: ['+1 Silver pack at the start', '+1 Silver and +1 Gold pack', '+1 Silver, Gold and Elite pack'] },
  { id: 'body', name: 'Iron Body', icon: '🦴', costs: [200, 550], levels: ['Injury risk −15%', 'Injury risk −30%'] },
  { id: 'binder', name: 'Card Binder', icon: '🗂', costs: [250, 700], levels: ['+6 hand size and +1 card play per month', 'Also +1 match-boost slot'] },
  { id: 'luck', name: 'Lucky Packs', icon: '🍀', costs: [400, 1100], levels: ['Better rarity odds in every pack', 'Much better rarity odds'] },
  { id: 'agent', name: 'Family Agent', icon: '🤝', costs: [300], levels: ['+1 offer per window and +8% wages'] },
  { id: 'fame', name: 'Viral Clip', icon: '📱', costs: [200], levels: ['Start with +10 reputation'] },
  { id: 'longevity', name: 'Longevity', icon: '⏳', costs: [700], levels: ['Your prime lasts one year longer'] },
];
export const UPGRADE_MAP: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export interface RelicDef { id: string; name: string; icon: string; rarity: Rarity; desc: string }

export const RELICS: RelicDef[] = [
  { id: 'socks', name: 'Lucky Socks', icon: '🧦', rarity: 'common', desc: '+2 to every key attribute.' },
  { id: 'energy', name: 'Energy Drinks', icon: '🥤', rarity: 'common', desc: 'Start with three Ice Bath cards.' },
  { id: 'piggy', name: 'Piggy Bank', icon: '🐷', rarity: 'common', desc: 'Start with $300K in the bank.' },
  { id: 'local', name: 'Local Hero', icon: '📰', rarity: 'common', desc: '+8 starting reputation.' },
  { id: 'ticket', name: 'Golden Ticket', icon: '🎫', rarity: 'rare', desc: 'Start with an Elite pack.' },
  { id: 'notebook', name: "Mentor's Notebook", icon: '📓', rarity: 'rare', desc: '+25% growth until age 21.' },
  { id: 'armband', name: "Captain's Armband", icon: '©', rarity: 'rare', desc: '+20 manager trust and +3 leadership.' },
  { id: 'hype', name: 'Wonderkid Hype', icon: '🔥', rarity: 'rare', desc: '+1 prospect star (max 5).' },
  { id: 'gene', name: 'Generational Gene', icon: '🧬', rarity: 'epic', desc: '+2 POT.' },
  { id: 'steel', name: 'Indestructible', icon: '🛡', rarity: 'epic', desc: 'No injuries in your first two seasons.' },
  { id: 'twin', name: 'Twin Engine', icon: '⚙', rarity: 'epic', desc: '+1 card play every month.' },
  { id: 'chosen', name: 'The Chosen One', icon: '👑', rarity: 'legendary', desc: '+1 star, +1 POT and an Elite pack.' },
  { id: 'midas', name: 'Midas Touch', icon: '🪙', rarity: 'legendary', desc: '+50% legacy coins this career.' },
];
export const RELIC_MAP: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

export interface CrateDef { id: 'basic' | 'premium'; name: string; cost: number; odds: Record<Rarity, number> }
export const CRATES: CrateDef[] = [
  { id: 'basic', name: 'Kit Bag', cost: 150, odds: { common: 0.58, rare: 0.3, epic: 0.1, legendary: 0.02 } },
  { id: 'premium', name: 'Trophy Case', cost: 500, odds: { common: 0, rare: 0.55, epic: 0.35, legendary: 0.1 } },
];

export const RELIC_SLOTS = 3;

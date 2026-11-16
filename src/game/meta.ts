import type { CoinEvent } from './types';
import { CRATES, DUPLICATE_REFUND, TRINKETS, TRINKET_RARITIES, UPGRADE_MAP, trinketSlots, type TrinketRarity } from '../data/legacy';
import { cardTierFor, type CareerSetup } from '../engines/career';

// Profile-wide progression that survives between careers.
const META_KEY = 'xi2_meta';

export interface Meta {
  coins: number;
  lifetime: number;
  upgrades: Record<string, number>;
  trinkets: string[];    // owned (permanent, unique)
  equipped: string[];    // slotted for the next career
  milestones: Record<string, number>; // times achieved across all careers
  careers: number;
  completed: number;     // careers played through to retirement
}

const EMPTY: Meta = { coins: 0, lifetime: 0, upgrades: {}, trinkets: [], equipped: [], milestones: {}, careers: 0, completed: 0 };

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Meta> & { relics?: string[] };
    // older profiles kept consumable "relics"; they become owned trinkets
    const owned = new Set([...(parsed.trinkets ?? []), ...(parsed.relics ?? [])].filter((id) => TRINKETS.some((t) => t.id === id)));
    const m: Meta = { ...EMPTY, ...parsed, trinkets: [...owned], equipped: (parsed.equipped ?? []).filter((id) => owned.has(id)) };
    m.equipped = m.equipped.slice(0, trinketSlots(m.upgrades));
    return m;
  } catch { return { ...EMPTY }; }
}

export function saveMeta(m: Meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* storage unavailable */ }
}

export function creditCoins(m: Meta, events: CoinEvent[]): Meta {
  const next = { ...m, milestones: { ...m.milestones } };
  for (const e of events) {
    next.coins += e.amount;
    next.lifetime += e.amount;
    if (e.milestone) next.milestones[e.milestone] = (next.milestones[e.milestone] ?? 0) + 1;
  }
  return next;
}

export function upgradeCost(m: Meta, id: string): number | null {
  const def = UPGRADE_MAP[id];
  const lvl = m.upgrades[id] ?? 0;
  return lvl >= def.costs.length ? null : def.costs[lvl];
}

export function buyUpgrade(m: Meta, id: string): Meta | string {
  const cost = upgradeCost(m, id);
  if (cost === null) return 'Already maxed.';
  if (m.coins < cost) return 'Not enough legacy coins.';
  return { ...m, coins: m.coins - cost, upgrades: { ...m.upgrades, [id]: (m.upgrades[id] ?? 0) + 1 } };
}

export interface CrateResult { meta: Meta; trinket: string; duplicate: boolean; refund: number }

export function openCrate(m: Meta, crateId: string, roll: () => number = Math.random): CrateResult | string {
  const crate = CRATES.find((c) => c.id === crateId);
  if (!crate) return 'Unknown crate.';
  if (m.coins < crate.cost) return 'Not enough legacy coins.';
  let r = roll();
  let rarity: TrinketRarity = 'common';
  for (const k of TRINKET_RARITIES) { r -= crate.odds[k]; if (r <= 0) { rarity = k; break; } }
  if (crate.odds[rarity] === 0) rarity = TRINKET_RARITIES.find((k) => crate.odds[k] > 0)!;
  const pool = TRINKETS.filter((x) => x.rarity === rarity);
  // favour trinkets you don't own yet
  const fresh = pool.filter((x) => !m.trinkets.includes(x.id));
  const pickFrom = fresh.length && roll() < 0.7 ? fresh : pool;
  const t = pickFrom[Math.floor(roll() * pickFrom.length)];
  const duplicate = m.trinkets.includes(t.id);
  const refund = duplicate ? Math.round(crate.cost * DUPLICATE_REFUND) : 0;
  return {
    meta: { ...m, coins: m.coins - crate.cost + refund, trinkets: duplicate ? m.trinkets : [...m.trinkets, t.id] },
    trinket: t.id, duplicate, refund,
  };
}

export function toggleEquip(m: Meta, id: string): Meta {
  if (m.equipped.includes(id)) return { ...m, equipped: m.equipped.filter((x) => x !== id) };
  if (!m.trinkets.includes(id)) return m;
  const slots = trinketSlots(m.upgrades);
  if (m.equipped.length >= slots) return slots === 1 ? { ...m, equipped: [id] } : m;
  return { ...m, equipped: [...m.equipped, id] };
}

/** setup for a new career; trinkets stay owned and equipped */
export function startRun(m: Meta): { meta: Meta; setup: CareerSetup } {
  return {
    meta: { ...m, careers: m.careers + 1 },
    setup: { upgrades: { ...m.upgrades }, relics: m.equipped.slice(0, trinketSlots(m.upgrades)), cardTier: cardTierFor(m.completed) },
  };
}

export function completeCareer(m: Meta): Meta {
  return { ...m, completed: (m.completed ?? 0) + 1 };
}

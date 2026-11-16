import type { CoinEvent, Rarity } from './types';
import { CRATES, RELICS, RELIC_SLOTS, UPGRADE_MAP } from '../data/legacy';
import type { CareerSetup } from '../engines/career';

// Profile-wide progression that survives between careers.
const META_KEY = 'xi2_meta';

export interface Meta {
  coins: number;
  lifetime: number;
  upgrades: Record<string, number>;
  relics: string[];      // inventory (duplicates allowed)
  equipped: string[];    // relic ids queued for the next career
  milestones: Record<string, number>; // times achieved across all careers
  careers: number;
}

const EMPTY: Meta = { coins: 0, lifetime: 0, upgrades: {}, relics: [], equipped: [], milestones: {}, careers: 0 };

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Meta) } : { ...EMPTY };
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

export function openCrate(m: Meta, crateId: string): { meta: Meta; relic: string } | string {
  const crate = CRATES.find((c) => c.id === crateId);
  if (!crate) return 'Unknown crate.';
  if (m.coins < crate.cost) return 'Not enough legacy coins.';
  let r = Math.random();
  let rarity: Rarity = 'common';
  for (const k of ['common', 'rare', 'epic', 'legendary'] as Rarity[]) { r -= crate.odds[k]; if (r <= 0) { rarity = k; break; } }
  const pool = RELICS.filter((x) => x.rarity === rarity);
  const relic = pool[Math.floor(Math.random() * pool.length)];
  return { meta: { ...m, coins: m.coins - crate.cost, relics: [...m.relics, relic.id] }, relic: relic.id };
}

export function toggleEquip(m: Meta, relicId: string): Meta {
  if (m.equipped.includes(relicId)) return { ...m, equipped: m.equipped.filter((x) => x !== relicId) };
  if (m.equipped.length >= RELIC_SLOTS) return m;
  if (!m.relics.includes(relicId)) return m;
  return { ...m, equipped: [...m.equipped, relicId] };
}

/** setup for a new career; equipped relics are consumed */
export function startRun(m: Meta): { meta: Meta; setup: CareerSetup } {
  const relics = [...m.relics];
  for (const id of m.equipped) { const i = relics.indexOf(id); if (i >= 0) relics.splice(i, 1); }
  return {
    meta: { ...m, relics, equipped: [], careers: m.careers + 1 },
    setup: { upgrades: { ...m.upgrades }, relics: [...m.equipped] },
  };
}

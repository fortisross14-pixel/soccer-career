import type { Career, PositionKey } from './types';
import { displayOverall } from '../engines/overall';
import { CLUB_MAP } from '../data/clubs';
import { POSITION_MAP } from '../data/positions';
import { playerGrade } from '../engines/awards';
import { initStars, setSeasonTargets } from '../engines/stars';

// v2 saves. Old (v1) saves are intentionally not migrated.
const SLOT_KEY = (n: number) => `xi2_save_${n}`;
const HOF_KEY = 'xi2_hall_of_fame';
export const NUM_SLOTS = 3;

export interface SaveMeta {
  slot: number; name: string; age: number; position: PositionKey; country: string; clubName: string; overall: number; retired: boolean; year: number;
}

function safe<T>(fn: () => T, fallback: T): T { try { return fn(); } catch { return fallback; } }

/** returns false if the browser refused to store the save (e.g. storage full or disabled) */
export function saveToSlot(slot: number, c: Career): boolean {
  try { localStorage.setItem(SLOT_KEY(slot), JSON.stringify(c)); return true; }
  catch (e) { console.error('Could not save career', e); return false; }
}

/** a slot holds data, even if it cannot be read */
export function slotOccupied(slot: number): boolean {
  return safe(() => localStorage.getItem(SLOT_KEY(slot)) !== null, false);
}

/** saves from the original version of the game (before the rebuild) */
export function legacySaveCount(): number {
  return safe(() => Object.keys(localStorage).filter((k) => /^sc_save_\d$/.test(k)).length, 0);
}

export function loadSlot(slot: number): Career | null {
  return safe(() => {
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return null;
    const c = JSON.parse(raw) as Career;
    if (c.version !== 2) return null;
    // careers saved before the world existed get one now
    if (!c.stars?.length) { c.stars = initStars(); setSeasonTargets(c.stars); }
    c.awardsHistory ??= [];
    c.retiredStars ??= [];
    c.academy ??= null;
    c.firstEver ??= [];
    c.bestDiv ??= 9;
    c.world ??= { div: {} };
    c.milestones ??= [];
    c.pendingCoins ??= [];
    c.mods ??= { injuryCut: 0, handBonus: 0, extraBoosts: 0, extraPlays: 0, luck: 0, youthGrowth: 0, repBonus: 0, offerBonus: 0, wageBonus: 0, coinMult: 1, noInjuryUntil: 0, ratingBonus: 0, maxRarity: 'legendary' };
    c.plan ??= { balance: 50 };
    return c;
  }, null);
}

export function deleteSlot(slot: number) { safe(() => localStorage.removeItem(SLOT_KEY(slot)), undefined); }

export function slotMeta(slot: number): SaveMeta | null {
  const c = loadSlot(slot);
  if (!c) return null;
  const p = c.player;
  return { slot, name: p.name, age: p.age, position: p.position, country: p.country, clubName: c.academy ? `${CLUB_MAP[c.academy.clubId]?.name ?? ''} academy` : p.contract ? CLUB_MAP[p.contract.clubId]?.name ?? '—' : 'Free agent', overall: displayOverall(p), retired: c.retired, year: c.year };
}

export function allSlots(): (SaveMeta | null)[] { return Array.from({ length: NUM_SLOTS }, (_, i) => slotMeta(i + 1)); }
export function firstFreeSlot(): number | null {
  for (let i = 1; i <= NUM_SLOTS; i++) if (!slotOccupied(i)) return i;
  return null;
}

export interface HofEntry {
  id: string; name: string; country: string; position: string; apps: number; goals: number; assists: number;
  trophies: number; ballons: number; legacyScore: number; legacyTier: string; age: number; peakOvr: number; grade?: string;
}

export function loadHof(): HofEntry[] {
  return safe(() => JSON.parse(localStorage.getItem(HOF_KEY) || '[]') as HofEntry[], []);
}

export function addToHof(c: Career) {
  const list = loadHof().filter((e) => e.id !== c.id);
  const trophies = [...c.honors.club, ...c.honors.national].reduce((s, h) => s + h.count, 0);
  const ballons = c.honors.individual.filter((h) => h.label.includes('Ballon')).reduce((s, h) => s + h.count, 0);
  list.push({
    id: c.id, name: c.player.name, country: c.player.country, position: POSITION_MAP[c.player.position].name,
    apps: c.totals.apps, goals: c.totals.goals, assists: c.totals.assists, trophies, ballons,
    legacyScore: c.legacy?.score ?? 0, legacyTier: c.legacy?.tier ?? 'Journeyman', age: c.player.age, peakOvr: c.peakOvr, grade: playerGrade(c).letter,
  });
  list.sort((a, b) => b.legacyScore - a.legacyScore);
  safe(() => localStorage.setItem(HOF_KEY, JSON.stringify(list.slice(0, 50))), undefined);
}

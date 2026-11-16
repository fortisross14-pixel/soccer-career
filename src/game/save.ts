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

export function saveToSlot(slot: number, c: Career) {
  safe(() => localStorage.setItem(SLOT_KEY(slot), JSON.stringify(c)), undefined);
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
    return c;
  }, null);
}

export function deleteSlot(slot: number) { safe(() => localStorage.removeItem(SLOT_KEY(slot)), undefined); }

export function slotMeta(slot: number): SaveMeta | null {
  const c = loadSlot(slot);
  if (!c) return null;
  const p = c.player;
  return { slot, name: p.name, age: p.age, position: p.position, country: p.country, clubName: p.contract ? CLUB_MAP[p.contract.clubId]?.name ?? '—' : 'Free agent', overall: displayOverall(p), retired: c.retired, year: c.year };
}

export function allSlots(): (SaveMeta | null)[] { return Array.from({ length: NUM_SLOTS }, (_, i) => slotMeta(i + 1)); }
export function firstFreeSlot(): number | null {
  for (let i = 1; i <= NUM_SLOTS; i++) if (!slotMeta(i)) return i;
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

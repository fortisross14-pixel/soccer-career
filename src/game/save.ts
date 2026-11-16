import type { Career, PositionKey } from './types';
import { displayOverall } from '../engines/overall';
import { CLUB_MAP } from '../data/clubs';
import { POSITION_MAP } from '../data/positions';
import { playerGrade } from '../engines/awards';
import { initStars, setSeasonTargets } from '../engines/stars';
import { upgradeSave } from './migrate';
import { kvGet, kvRemove, kvSet } from './storage';

// v2 saves. Old (v1) saves are intentionally not migrated.
const SLOT_KEY = (n: number) => `xi2_save_${n}`;
const BACKUP_KEY = (n: number) => `xi2_backup_${n}`;
const HOF_KEY = 'xi2_hall_of_fame';
export const NUM_SLOTS = 3;

export interface SaveMeta {
  slot: number; name: string; age: number; position: PositionKey; country: string; clubName: string; overall: number; retired: boolean; year: number;
}

function safe<T>(fn: () => T, fallback: T): T { try { return fn(); } catch { return fallback; } }

/** returns false if the browser refused to store the save (e.g. storage full or disabled) */
export function saveToSlot(slot: number, c: Career): boolean {
  try { return kvSet(SLOT_KEY(slot), JSON.stringify(c)); }
  catch (e) { console.error('Could not save career', e); return false; }
}

/** a slot holds data, even if it cannot be read */
export function slotOccupied(slot: number): boolean {
  return safe(() => kvGet(SLOT_KEY(slot)) !== null, false);
}

/** saves from the original version of the game (before the rebuild) */
export function legacySaveCount(): number {
  return safe(() => Object.keys(localStorage).filter((k) => /^sc_save_\d$/.test(k)).length, 0);
}

export function loadSlot(slot: number): Career | null {
  return parseSave(safe(() => kvGet(SLOT_KEY(slot)), null));
}

function parseSave(raw: string | null): Career | null {
  return safe(() => {
    if (!raw) return null;
    const c = JSON.parse(raw) as Career;
    if (!c || typeof c !== 'object' || !c.player) return null;
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
    c.asked ??= { loan: false, transfer: false };
    c.national ??= { debutAge: null, status: 'Not called up' };
    try { return upgradeSave(c); } catch (e) { console.error('Save upgrade failed', e); return c; }
  }, null);
}

/** keep a copy of the save as it was when last opened, so an update can never cost a career */
export function backupSlot(slot: number) {
  safe(() => { const raw = kvGet(SLOT_KEY(slot)); if (raw) kvSet(BACKUP_KEY(slot), raw); }, undefined);
}
export function hasBackup(slot: number): boolean { return safe(() => kvGet(BACKUP_KEY(slot)) !== null, false); }
export function restoreBackup(slot: number): boolean {
  return safe(() => { const raw = kvGet(BACKUP_KEY(slot)); if (!raw) return false; kvSet(SLOT_KEY(slot), raw); return true; }, false);
}
export function backupMeta(slot: number): SaveMeta | null {
  const c = parseSave(safe(() => kvGet(BACKUP_KEY(slot)), null));
  return c ? safe(() => metaOf(slot, c), null) : null;
}

/** the raw save text, for downloading */
export function exportSlot(slot: number): string | null { return safe(() => kvGet(SLOT_KEY(slot)), null); }
/** put a downloaded save file into a slot; returns an error message or null */
export function importToSlot(slot: number, text: string): string | null {
  try {
    const c = JSON.parse(text) as Career;
    if (!c?.player?.name) return 'That file is not a saved career.';
    kvSet(SLOT_KEY(slot), text);
    return loadSlot(slot) ? null : 'That save could not be read.';
  } catch { return 'That file is not a saved career.'; }
}

export function deleteSlot(slot: number) {
  // the deleted career stays restorable from its backup until the slot is used again
  safe(() => { backupSlot(slot); kvRemove(SLOT_KEY(slot)); }, undefined);
}

export function slotMeta(slot: number): SaveMeta | null {
  const c = loadSlot(slot);
  return c ? safe(() => metaOf(slot, c), null) : null;
}

function metaOf(slot: number, c: Career): SaveMeta {
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
  return safe(() => JSON.parse(kvGet(HOF_KEY) || '[]') as HofEntry[], []);
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
  safe(() => kvSet(HOF_KEY, JSON.stringify(list.slice(0, 50))), undefined);
}

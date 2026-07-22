import type { Player, SaveMeta } from './types';
import { playerOverall } from '../engines/overall';
import { currentClub } from './engine';
import { POSITION_MAP } from '../data/positions';

const SLOT_KEY = (n: number) => `sc_save_${n}`;
const HOF_KEY = 'sc_hall_of_fame';
export const NUM_SLOTS = 3;

function migratePlayer(p: Player): Player {
  p.searchedDomesticThisYear ??= p.searchedThisYear ?? false;
  p.searchedInternationalThisYear ??= false;
  p.sponsoredThisYear ??= false;
  p.renegotiatedThisYear ??= false;
  p.transferRequestedThisYear ??= false;
  p.trainingIntensity ??= 'balanced';
  p.seasonObjective ??= 'develop';
  p.morale ??= 72;
  p.fitness ??= 82;
  p.managerTrust ??= 55;
  p.clubContinental ??= p.contract ? currentClub(p).continental : 'none';
  p.offers = (p.offers ?? []).map((o) => ({ ...o, source: o.source ?? (o.international ? 'international-scout' : 'automatic') }));
  return p;
}

export function saveToSlot(slot: number, p: Player) {
  localStorage.setItem(SLOT_KEY(slot), JSON.stringify(p));
}

export function loadSlot(slot: number): Player | null {
  const raw = localStorage.getItem(SLOT_KEY(slot));
  if (!raw) return null;
  try { return migratePlayer(JSON.parse(raw) as Player); } catch { return null; }
}

export function deleteSlot(slot: number) { localStorage.removeItem(SLOT_KEY(slot)); }

export function slotMeta(slot: number): SaveMeta | null {
  const p = loadSlot(slot);
  if (!p) return null;
  return { slot, name: p.name, age: p.age, position: p.position, country: p.country, clubName: currentClub(p).name, overall: playerOverall(p), retired: p.retired };
}

export function allSlots(): (SaveMeta | null)[] { return Array.from({ length: NUM_SLOTS }, (_, i) => slotMeta(i + 1)); }
export function firstFreeSlot(): number | null {
  for (let i = 1; i <= NUM_SLOTS; i++) if (!localStorage.getItem(SLOT_KEY(i))) return i;
  return null;
}

export interface HofEntry { name: string; country: string; position: string; games: number; goals: number; assists: number; trophies: number; ballons: number; legacyScore: number; legacyTier: string; age: number; }
export function loadHof(): HofEntry[] { try { return JSON.parse(localStorage.getItem(HOF_KEY) || '[]'); } catch { return []; } }
export function addToHof(p: Player) {
  const list = loadHof();
  const trophies = p.honors.club.reduce((s, h) => s + h.count, 0) + p.honors.national.reduce((s, h) => s + h.count, 0);
  const ballons = p.honors.individual.filter((h) => h.label.includes('Ballon')).reduce((s, h) => s + h.count, 0);
  list.push({ name: p.name, country: p.country, position: POSITION_MAP[p.position].name, games: p.totals.games, goals: p.totals.goals, assists: p.totals.assists, trophies, ballons, legacyScore: p.legacyScore ?? 0, legacyTier: p.legacyTier ?? 'Journeyman', age: p.age });
  localStorage.setItem(HOF_KEY, JSON.stringify(list));
}

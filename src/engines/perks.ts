import type { Player, StaffPerks } from '../game/types';
import { CARD_MAP } from '../data/cards';

/** summed perk from all equipped staff cards */
export function STAFF_PERK(p: Player, key: keyof StaffPerks): number {
  return p.staff.reduce((sum, id) => sum + (CARD_MAP[id]?.staff?.[key] ?? 0), 0);
}

export function staffMonthlyCost(p: Player): number {
  return p.staff.reduce((sum, id) => sum + (CARD_MAP[id]?.monthlyCost ?? 0), 0);
}

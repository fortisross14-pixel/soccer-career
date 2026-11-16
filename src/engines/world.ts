import type { Career, ClubDef } from '../game/types';
import { CLUBS, CLUB_MAP } from '../data/clubs';
import { weightedPick } from './util';

/** a club's current division, after any promotions/relegations in this career */
export function divOf(c: Pick<Career, 'world'>, clubId: string): 1 | 2 {
  return c.world?.div[clubId] ?? CLUB_MAP[clubId]?.division ?? 1;
}

export function leagueClubs(c: Pick<Career, 'world'>, country: string, div: 1 | 2): ClubDef[] {
  return CLUBS.filter((cl) => cl.country === country && divOf(c, cl.id) === div);
}

export function divLabel(c: Pick<Career, 'world'>, clubId: string): string {
  return divOf(c, clubId) === 2 ? ' 2' : '';
}

/**
 * Swap clubs between the two divisions of one country at season end.
 * `d1Order` / `d2Order` are final standings when known (the player's league);
 * the other division is decided by weighted chance on club strength.
 */
export function promoteRelegate(c: Career, country: string, d1Order: string[] | null, d2Order: string[] | null): { up: string[]; down: string[] } {
  const d1 = leagueClubs(c, country, 1);
  const d2 = leagueClubs(c, country, 2);
  if (!d1.length || !d2.length) return { up: [], down: [] };
  const n = d1.length <= 8 || d2.length <= 4 ? 1 : 2;
  const pickN = (pool: ClubDef[], w: (x: ClubDef) => number) => {
    const out: string[] = [];
    const left = [...pool];
    while (out.length < n && left.length) {
      const x = weightedPick(left, w);
      out.push(x.id);
      left.splice(left.indexOf(x), 1);
    }
    return out;
  };
  const down = d1Order ? d1Order.slice(-n) : pickN(d1, (x) => Math.max(1, 90 - x.rating) ** 2);
  const up = d2Order ? d2Order.slice(0, n) : pickN(d2, (x) => Math.max(1, x.rating - 52) ** 2);
  for (const id of down) c.world.div[id] = 2;
  for (const id of up) c.world.div[id] = 1;
  return { up, down };
}

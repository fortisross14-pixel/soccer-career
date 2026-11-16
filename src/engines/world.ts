import type { Career, ClubDef, Division } from '../game/types';
import { CLUBS, CLUB_MAP } from '../data/clubs';
import { leagueNameFor, maxDivision } from '../data/countries';
import { weightedPick } from './util';

/** a club's current division, after any promotions/relegations in this career */
export function divOf(c: Pick<Career, 'world'>, clubId: string): Division {
  return c.world?.div[clubId] ?? CLUB_MAP[clubId]?.division ?? 1;
}

export function leagueClubs(c: Pick<Career, 'world'>, country: string, div: Division): ClubDef[] {
  return CLUBS.filter((cl) => cl.country === country && divOf(c, cl.id) === div);
}

export function clubLeague(c: Pick<Career, 'world'>, clubId: string): string {
  const club = CLUB_MAP[clubId];
  return leagueNameFor(club.country, divOf(c, clubId));
}

/** short tier label: "1st tier" etc */
export function tierLabel(div: number): string {
  return div === 1 ? 'Top flight' : div === 2 ? '2nd tier' : '3rd tier';
}

/**
 * Season-end swaps between adjacent divisions of one country.
 * `known` is the final standings of the player's division; other
 * divisions are decided by weighted chance on club strength.
 */
export function promoteRelegate(c: Career, country: string, knownDiv: Division, knownOrder: string[]): { up: string[]; down: string[] } {
  const maxD = maxDivision(country);
  const up: string[] = [];
  const down: string[] = [];
  const moves: [string, Division][] = [];
  for (let d = 1; d < maxD; d++) {
    const upper = leagueClubs(c, country, d as Division);
    const lower = leagueClubs(c, country, (d + 1) as Division);
    if (!upper.length || !lower.length) continue;
    const n = swapCount(upper.length, lower.length);
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
    const goingDown = knownDiv === d ? knownOrder.slice(-n) : pickN(upper, (x) => Math.max(1, 95 - x.rating) ** 2);
    const goingUp = knownDiv === d + 1 ? knownOrder.slice(0, n) : pickN(lower, (x) => Math.max(1, x.rating - 40) ** 2);
    goingDown.forEach((id) => moves.push([id, (d + 1) as Division]));
    goingUp.forEach((id) => moves.push([id, d as Division]));
    down.push(...goingDown);
    up.push(...goingUp);
  }
  for (const [id, div] of moves) c.world.div[id] = div;
  return { up, down };
}

export function swapCount(upperLen: number, lowerLen: number): number {
  if (!upperLen || !lowerLen) return 0;
  return upperLen <= 8 || lowerLen <= 6 ? 1 : 2;
}

export function leagueRepFor(baseRep: number, div: number): number {
  return baseRep - (div - 1) * 12;
}

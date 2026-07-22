import type { ClubDef, Offer, Player, SquadRole } from '../game/types';
import { CLUBS, clubsInCountry } from '../data/clubs';
import { clamp, chance, randInt, pick } from './util';
import { roleFor } from './season';

export function marketValue(overall: number, age: number, reputation: number): number {
  const base = overall <= 60
    ? Math.max(0.05, (overall - 45) * 0.2)
    : (overall - 60) * (overall - 60) * 0.26 + 2;
  const ageF =
    age < 18 ? 0.6 :
    age < 20 ? 0.85 :
    age <= 27 ? 1 :
    age <= 30 ? 0.78 :
    age <= 33 ? 0.5 : 0.25;
  const repF = 0.8 + reputation / 250;
  return Math.round(base * ageF * repF * 1_000_000);
}

const TIER_WAGE_BASE: Record<ClubDef['tier'], number> = {
  Elite: 4_000_000, Strong: 2_200_000, Mid: 1_000_000, Small: 350_000, Youth: 45_000,
};
const ROLE_WAGE_MULT: Record<SquadRole, number> = {
  star: 2.3, starter: 1.4, rotation: 0.85, fringe: 0.45, reserve: 0.22, youth: 1,
};

export function wageFor(club: ClubDef, role: SquadRole, overall: number): number {
  const base = TIER_WAGE_BASE[club.tier];
  const mult = ROLE_WAGE_MULT[role];
  const skillF = 1 + (overall - 70) / 50;
  return Math.max(20_000, Math.round(base * mult * clamp(skillF, 0.4, 2.2)));
}

/**
 * Generate transfer offers. `scope` gates who's willing to bid:
 *  - youth: pre-16, only academies / small clubs
 *  - domestic: clubs in the player's own country
 *  - international: clubs abroad
 * A club only bids if the player fits between "prospect" and "clear upgrade".
 */
export function generateOffers(p: Player, overall: number, scope: 'youth' | 'domestic' | 'international', source?: Offer['source']): Offer[] {
  const youthScope = scope === 'youth' || p.age < 16;
  const target = youthScope ? 65 + p.potentialCeiling * 22 : overall * 0.62 + p.reputation * 0.38;
  let pool: ClubDef[];

  if (scope === 'youth' || p.age < 16) {
    pool = clubsInCountry(p.country, 1);
  } else if (scope === 'domestic') {
    pool = clubsInCountry(p.country);
  } else {
    pool = CLUBS.filter((c) => c.country !== p.country && c.division === 1);
  }

  // interested clubs: rating within a band of the player's level
  const spread = clamp(6 + p.reputation / 12, 6, 14);
  let interested = youthScope ? pool.filter((c) => c.rating <= target + 9 && c.rating >= target - 18) : pool.filter((c) => {
    if (p.contract && c.id === p.contract.clubId) return false;
    return c.rating >= target - spread - 6 && c.rating <= target + spread;
  });

  // young high-potential players attract elite clubs even if not ready yet
  if (p.age <= 20 && p.potentialCeiling > 0.8) {
    const elites = pool.filter((c) => c.tier === 'Elite' && overall >= c.rating - 16);
    interested = [...new Set([...interested, ...elites])];
  }

  // how many offers — better reputation => more suitors
  const maxOffers = youthScope ? clamp(3 + Math.round(p.potentialCeiling * 2), 3, 5) : clamp(Math.round(2 + (overall + p.reputation) / 40), 2, 7);
  const shuffled = interested.sort(() => Math.random() - 0.5).slice(0, maxOffers * 2);

  const offers: Offer[] = [];
  const seen = new Set<string>();
  for (const club of shuffled) {
    if (offers.length >= maxOffers) break;
    if (seen.has(club.id)) continue;
    seen.add(club.id);
    const role = roleFor(overall, club);
    // clubs don't sign clear reserves unless the player is a young prospect
    if ((role === 'reserve') && !(p.age <= 20)) continue;
    if (!chance(0.85)) continue;
    offers.push({
      clubId: club.id,
      clubName: club.name,
      clubRating: club.rating,
      tier: club.tier,
      country: club.country,
      role,
      wage: scope === 'youth' || p.age < 16 ? 0 : wageFor(club, role, overall),
      years: randInt(2, 5),
      continental: club.continental,
      international: scope === 'international',
      source: source ?? (scope === 'international' ? 'international-scout' : scope === 'domestic' ? 'domestic-scout' : 'automatic'),
      academyFocus: scope === 'youth' || p.age < 16 ? club.academyFocus : undefined,
    });
  }

  // guarantee at least one modest offer so a career never dead-ends
  if (offers.length === 0 && scope !== 'international') {
    const fallback = pick(pool.filter((c) => c.rating <= target + 4)) || pick(pool);
    if (fallback) {
      const role = roleFor(overall, fallback);
      offers.push({
        clubId: fallback.id, clubName: fallback.name, clubRating: fallback.rating,
        tier: fallback.tier, country: fallback.country, role,
        wage: scope === 'youth' || p.age < 16 ? 0 : wageFor(fallback, role, overall), years: randInt(2, 3),
        continental: fallback.continental, international: false, source: source ?? 'automatic', academyFocus: scope === 'youth' || p.age < 16 ? fallback.academyFocus : undefined,
      });
    }
  }

  return offers.sort((a, b) => b.clubRating - a.clubRating);
}

import type { Career, ClubDef, Division, Offer, SquadRole } from '../game/types';
import { CLUBS, CLUB_MAP } from '../data/clubs';
import { getCountry } from '../data/countries';
import { buildSeason, buildYouthSeason } from './calendar';
import { academyRating } from './teams';
import { currentRole, roleRank, squadRole, ROLE_LABEL } from './match';
import { playerOverall, potentialOverall } from './overall';
import { STAFF_PERK } from './perks';
import { divOf, leagueClubs } from './world';
import { maxDivision } from '../data/countries';
import { milestone } from './coins';
import { chance, clamp, pick, randInt, rng, shuffle, uid } from './util';

const TIER_WAGE: Record<ClubDef['tier'], number> = { Elite: 4_200_000, Strong: 2_200_000, Mid: 1_000_000, Small: 380_000, Youth: 60_000 };
const ROLE_WAGE: Record<SquadRole, number> = { star: 2.3, starter: 1.4, rotation: 0.85, fringe: 0.5, reserve: 0.3 };

export function wageFor(club: ClubDef, role: SquadRole, ovr: number, age: number): number {
  const skillF = clamp(1 + (ovr - 72) / 40, 0.3, 2.2);
  const youthF = age < 20 ? 0.55 : age < 22 ? 0.8 : 1;
  return Math.max(24_000, Math.round((TIER_WAGE[club.tier] * ROLE_WAGE[role] * skillF * youthF) / 1000) * 1000);
}

/** the level of club that will realistically come for you */
export function interestLevel(c: Career): number {
  const p = c.player;
  const ovr = playerOverall(p);
  const pot = potentialOverall(p);
  const youth = p.age <= 22 ? Math.max(0, pot - ovr) * 0.35 : 0;
  return ovr + youth + (p.form - 6.8) * 3 + (p.reputation - 40) * 0.06;
}

function yearsFor(age: number): number {
  if (age >= 33) return 1;
  if (age >= 30) return randInt(1, 2);
  return randInt(2, 5);
}

function makeOffer(c: Career, club: ClubDef, kind: Offer['kind'], note?: string): Offer {
  const ovr = playerOverall(c.player);
  let role = squadRole(ovr, club.rating);
  if (kind === 'loan' && roleRank(role) < 3) role = 'starter';
  const wage = Math.round(wageFor(club, role, ovr, c.player.age) * (1 + STAFF_PERK(c.player, 'wage') + c.mods.wageBonus));
  return { uid: uid('of'), kind, clubId: club.id, wage, years: kind === 'loan' ? 1 : yearsFor(c.player.age), role, pushes: 0, final: false, note };
}

export function windowOffers(c: Career, winter: boolean): Offer[] {
  const p = c.player;
  const T = interestLevel(c);
  const intl = p.reputation >= 28 || p.age >= 20;
  const current = p.contract?.clubId;
  const pool = CLUBS.filter((cl) => cl.id !== current && cl.id !== p.contract?.parentClubId && (cl.country === p.country || (intl && cl.division === 1)));
  const band = pool.filter((cl) => cl.rating >= T - 9 && cl.rating <= T + 5);
  let interested = shuffle(band);
  // elite clubs gamble on young, high-ceiling talent
  if (p.age <= 21 && potentialOverall(p) >= 85) {
    const elites = shuffle(CLUBS.filter((cl) => cl.tier === 'Elite' && cl.id !== current)).slice(0, 2);
    interested = [...elites, ...interested];
  }
  let count = Math.round(1 + p.reputation / 30 + (p.form - 6.6) * 1.5 + STAFF_PERK(p, 'offers') + c.mods.offerBonus + (c.plan.balance >= 65 ? 1 : 0));
  if (p.transferListed) count += 2;
  if (winter) count = Math.round(count * 0.5);
  count = clamp(count, winter ? 0 : 1, 6);
  const out: Offer[] = [];
  const seen = new Set<string>();
  for (const club of interested) {
    if (out.length >= count) break;
    if (seen.has(club.id)) continue;
    seen.add(club.id);
    // clubs in a higher division only bid for lower-league players who are clearly ready
    const curDiv = p.contract ? divOf(c, p.contract.clubId) : 9;
    const tgtDiv = divOf(c, club.id);
    if (tgtDiv < curDiv && club.rating > T - 3 - (curDiv - tgtDiv - 1) * 4) continue;
    // clubs avoid signing pure reserves unless young
    const role = squadRole(playerOverall(p), club.rating);
    if (role === 'reserve' && p.age > 21) continue;
    out.push(makeOffer(c, club, 'transfer', club.country !== p.country ? 'Move abroad' : undefined));
  }
  // free agents always get something
  if (!p.contract && out.length === 0) {
    const fallback = [...pool].filter((cl) => cl.rating <= T + 2).sort((a, b) => b.rating - a.rating).slice(0, 6);
    out.push(makeOffer(c, pick(fallback.length ? fallback : pool), 'transfer', 'Free agent deal'));
  }
  return out.sort((a, b) => CLUB_MAP[b.clubId].rating - CLUB_MAP[a.clubId].rating);
}

/** does the current club want to extend? */
export function renewalOffer(c: Career): Offer | null {
  const p = c.player;
  if (!p.contract || p.contract.parentClubId || p.contract.yearsLeft > 1) return null;
  const club = CLUB_MAP[p.contract.clubId];
  const ovr = playerOverall(p);
  const wanted = ovr >= club.rating - 8 || (p.age <= 22 && potentialOverall(p) >= club.rating) || p.trust >= 70;
  if (!wanted || (p.age >= 34 && ovr < club.rating - 3)) return null;
  const o = makeOffer(c, club, 'renewal', 'Contract extension');
  o.role = currentRole(c);
  o.wage = Math.max(Math.round(p.contract.wage * 1.05), o.wage);
  return o;
}

export function loanOffers(c: Career): Offer[] {
  const p = c.player;
  const ovr = playerOverall(p);
  const pool = CLUBS.filter((cl) => cl.id !== p.contract?.clubId && cl.rating >= ovr - 3 && cl.rating <= ovr + 2 && (cl.country === p.country || p.age >= 19));
  return shuffle(pool).slice(0, randInt(2, 3)).map((cl) => makeOffer(c, cl, 'loan', 'Season-long loan · starter minutes'));
}

/** opening choice: lower-league clubs from the bottom of the pyramid */
export function firstOffers(c: Career): Offer[] {
  const p = c.player;
  const ovr = playerOverall(p);
  const bottom = maxDivision(p.country);
  const lowest = [...leagueClubs(c, p.country, bottom)];
  const above = [...leagueClubs(c, p.country, (bottom - 1) as Division)];
  const closest = (pool: ClubDef[], target: number, exclude: string[]) => [...pool].filter((cl) => !exclude.includes(cl.id)).sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target))[0];
  const a = closest(lowest, ovr + 3, []);
  const b = closest(lowest, ovr + 8, [a.id]) ?? a;
  const cc = closest(above, ovr + 12, []) ?? b;
  const offers = [
    { ...makeOffer(c, a, 'first', 'Play now'), years: 2 },
    { ...makeOffer(c, b, 'first', 'Fight for a place'), years: 2 },
    { ...makeOffer(c, cc, 'first', 'Step up a level'), years: 3 },
  ];
  // generational talents also get a big-club academy offer
  if (p.stars >= 5) {
    const giant = pick(leagueClubs(c, p.country, 1).sort((x, y) => y.rating - x.rating).slice(0, 3));
    if (giant) offers.push({ ...makeOffer(c, giant, 'first', 'Big-club academy gamble'), years: 4 });
  }
  return offers;
}

function clubInterest(c: Career, o: Offer): number {
  const club = CLUB_MAP[o.clubId];
  const p = c.player;
  const ovr = playerOverall(p);
  let x = 0.5 + (ovr - club.rating) / 18 + (p.reputation - 50) / 220 + (p.form - 6.8) * 0.12;
  if (o.kind === 'renewal') x += (p.trust - 55) / 120;
  if (p.age <= 21) x += (potentialOverall(p) - club.rating) / 40;
  return clamp(x, 0.08, 0.92);
}

export type PushAsk = 'wage' | 'role' | 'years';

export function pushOffer(c: Career, offerUid: string, ask: PushAsk): string {
  const o = c.offers.find((x) => x.uid === offerUid);
  if (!o) return 'Offer not found.';
  if (o.final) return 'This is their final offer.';
  const club = CLUB_MAP[o.clubId];
  const p = (clubInterest(c, o) - o.pushes * 0.14);
  o.pushes++;
  if (chance(p)) {
    if (ask === 'wage') { o.wage = Math.round((o.wage * (1.15 + rng() * 0.1)) / 1000) * 1000; }
    else if (ask === 'role') {
      const order: SquadRole[] = ['reserve', 'fringe', 'rotation', 'starter', 'star'];
      o.role = order[Math.min(4, roleRank(o.role) + 1)];
      o.wage = Math.round(o.wage * 1.08);
    } else { o.years = Math.min(5, o.years + 1); }
    if (o.pushes >= 2) o.final = true;
    return `${club.name} agreed: ${ask === 'wage' ? 'wage improved' : ask === 'role' ? `promised role → ${ROLE_LABEL[o.role]}` : `${o.years}-year deal`}.`;
  }
  if (o.kind !== 'first' && chance(0.4)) {
    c.offers = c.offers.filter((x) => x.uid !== offerUid);
    return `${club.name} walked away from talks.`;
  }
  o.final = true;
  return `${club.name} refused. This is now their final offer.`;
}

export function rejectOffer(c: Career, offerUid: string) {
  c.offers = c.offers.filter((x) => x.uid !== offerUid);
}

export function acceptOffer(c: Career, offerUid: string): string {
  const o = c.offers.find((x) => x.uid === offerUid);
  if (!o) return 'Offer not found.';
  const p = c.player;
  const club = CLUB_MAP[o.clubId];
  const day = c.month * 30;
  if (o.kind === 'renewal' && p.contract) {
    p.contract.wage = o.wage;
    p.contract.yearsLeft = o.years + 1; // extension starts after this season
    p.contract.promisedRole = o.role;
    p.trust = clamp(p.trust + 6, 0, 100);
    c.offers = c.offers.filter((x) => x.kind !== 'renewal');
    c.log.unshift({ year: c.year, month: c.month, kind: 'transfer', text: `Signed a contract extension with ${club.name} until ${c.year + o.years + 1} (${ROLE_LABEL[o.role]}).` });
    return `Extension signed with ${club.name}.`;
  }
  if (o.kind === 'academy') {
    const fromYouth = !!c.academy;
    c.academy = { clubId: club.id };
    c.offers = [];
    p.trust = 50;
    c.log.unshift({ year: c.year, month: c.month, kind: 'transfer', text: `${fromYouth ? 'Moved to' : 'Joined'} the ${club.name} academy at age ${p.age}.` });
    const playedAny = c.season?.fixtures.some((f) => f.played);
    c.season = buildYouthSeason(c, club.id, playedAny ? day : 0);
    return `Welcome to the ${club.name} academy!`;
  }
  const leavingAcademy = !!c.academy;
  c.academy = null;
  const prev = p.contract;
  if (o.kind === 'loan' && prev) {
    p.contract = { clubId: club.id, wage: prev.wage, yearsLeft: 1, promisedRole: o.role, parentClubId: prev.clubId, parentWage: prev.wage, parentYears: prev.yearsLeft };
  } else {
    p.contract = { clubId: club.id, wage: o.wage, yearsLeft: o.years, promisedRole: o.role };
  }
  p.trust = 52 + (roleRank(o.role) - 2) * 4;
  p.transferListed = false;
  c.offers = [];
  milestone(c, 'contract');
  if (club.country !== p.country) milestone(c, 'abroad');
  if (club.tier === 'Elite') milestone(c, 'elite');
  const kindText = o.kind === 'loan' ? 'Joined on loan' : o.kind === 'promotion' ? 'Promoted from the academy to the first team of' : o.kind === 'first' || leavingAcademy ? 'Signed your first professional contract with' : 'Transferred to';
  c.log.unshift({ year: c.year, month: c.month, kind: 'transfer', text: `${kindText} ${club.name} (${getCountry(club.country).leagueName}) — ${ROLE_LABEL[o.role]}, ${o.years} yr.` });

  // rebuild the calendar for the new club
  const playedAny = c.season?.fixtures.some((f) => f.played);
  const old = c.season;
  const fresh = buildSeason(c, club.id, playedAny ? day : 0);
  if (old && playedAny && !old.youth) {
    fresh.fixtures = [...old.fixtures.filter((f) => f.played), ...fresh.fixtures];
    fresh.stats = old.stats;
    fresh.honors = old.honors;
    fresh.ovrStart = old.ovrStart;
    fresh.clubsThisSeason = [...old.clubsThisSeason, club.name];
    fresh.natTournament = old.natTournament;
    // keep any national fixtures already scheduled
    fresh.fixtures.push(...old.fixtures.filter((f) => !f.played && f.comp === 'national'));
    fresh.fixtures.sort((a, b) => a.day - b.day);
  }
  c.season = fresh;
  return `Welcome to ${club.name}!`;
}

// ---------------- academy (ages 11-19) ----------------

function academyOffer(c: Career, club: ClubDef, note: string): Offer {
  const role = squadRole(playerOverall(c.player), academyRating(club.id, c.player.age));
  return { uid: uid('of'), kind: 'academy', clubId: club.id, wage: 0, years: Math.max(1, 20 - c.player.age), role, pushes: 0, final: true, note };
}

/** the three academies that want an 11-year-old, matched to prospect quality */
export function academyStartOffers(c: Career): Offer[] {
  const p = c.player;
  const ovr = playerOverall(p);
  const home = CLUBS.filter((cl) => cl.country === p.country);
  const by = (target: number, exclude: string[]) => [...home].filter((cl) => !exclude.includes(cl.id)).sort((a, b) => Math.abs(academyRating(a.id, p.age) - target) - Math.abs(academyRating(b.id, p.age) - target))[0];
  const a = by(ovr + 1, []);
  const b = by(ovr + 4, [a.id]);
  const cc = by(ovr + 8, [a.id, b.id]);
  const offers = [academyOffer(c, a, 'Local academy · lots of minutes'), academyOffer(c, b, 'Regional academy'), academyOffer(c, cc, 'Ambitious academy · fight for a place')];
  if (p.stars >= 5) {
    const giant = [...home].sort((x, y) => y.rating - x.rating)[Math.floor(rng() * 3)];
    if (giant && !offers.some((o) => o.clubId === giant.id)) offers.push(academyOffer(c, giant, 'Elite academy gamble'));
  }
  return offers;
}

/** offers for an academy player during a transfer window */
export function academyWindowOffers(c: Career): Offer[] {
  const p = c.player;
  if (!c.academy) return [];
  const ovr = playerOverall(p);
  const parent = CLUB_MAP[c.academy.clubId];
  const out: Offer[] = [];
  if (p.age < 16) {
    // outgrowing your academy: bigger academies come knocking
    if (ovr >= academyRating(parent.id, p.age) + 3 && c.month === 0) {
      const pool = CLUBS.filter((cl) => cl.country === p.country && cl.rating > parent.rating && Math.abs(academyRating(cl.id, p.age) - (ovr + 2)) <= 4);
      shuffle(pool).slice(0, randInt(1, 2)).forEach((cl) => out.push(academyOffer(c, cl, 'Bigger academy scouted you')));
    }
    return out;
  }
  // promotion to your own first team
  const toFirst = squadRole(ovr, parent.rating);
  if (roleRank(toFirst) >= 1 || (p.age >= 18 && roleRank(toFirst) >= 0 && chance(0.35))) {
    const o = makeOffer(c, parent, 'promotion', 'Promoted to the first team');
    out.push(o);
  }
  // professional clubs that want to sign you
  const T = interestLevel(c);
  const pool = CLUBS.filter((cl) => cl.id !== parent.id && cl.country === p.country && cl.rating >= T - 8 && cl.rating <= T + 3);
  const n = p.age >= 19 ? randInt(2, 3) : p.age >= 17 ? randInt(0, 2) : chance(0.35) ? 1 : 0;
  for (const cl of shuffle(pool).slice(0, n)) {
    const o = makeOffer(c, cl, 'transfer', 'Turn pro');
    if (roleRank(o.role) >= 1 || p.age >= 19) out.push(o);
  }
  return out;
}

/** ask your agent for a move where you will actually play (any window, academy included) */
export function seekMinutes(c: Career): { offers: Offer[]; msg: string } {
  const p = c.player;
  const ovr = playerOverall(p);
  const out: Offer[] = [];
  const currentId = c.academy?.clubId ?? p.contract?.clubId;
  const home = CLUBS.filter((cl) => cl.country === p.country && cl.id !== currentId);
  if (c.academy && p.age < 19) {
    // academies where you'd be a regular
    const fits = home.filter((cl) => roleRank(squadRole(ovr, academyRating(cl.id, p.age))) >= 3);
    const pickA = shuffle(fits).sort((a, b) => b.rating - a.rating).slice(0, 4);
    shuffle(pickA).slice(0, randInt(1, 2)).forEach((cl) => out.push(academyOffer(c, cl, 'Academy where you would play')));
  }
  if (!c.academy || p.age >= 16) {
    const intl = p.reputation >= 28 || p.age >= 20;
    const pool = (c.academy ? home : CLUBS.filter((cl) => cl.id !== currentId && (cl.country === p.country || intl)))
      .filter((cl) => roleRank(squadRole(ovr, cl.rating)) >= (c.academy ? 2 : 3) && cl.rating >= ovr - 10);
    const best = [...pool].sort((a, b) => b.rating - a.rating).slice(0, 6);
    shuffle(best).slice(0, randInt(1, 3)).forEach((cl) => out.push(makeOffer(c, cl, 'transfer', c.academy ? 'Turn pro · regular minutes' : 'More minutes')));
  }
  return { offers: out, msg: out.length ? `Your agent found ${out.length} club${out.length > 1 ? 's' : ''} where you would play more.` : 'Your agent found nobody this time. Try again next window.' };
}

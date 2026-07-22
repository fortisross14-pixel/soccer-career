import type { Honor, Player, SkillKey, SeasonRecord } from './types';
import { EVENTS } from '../data/events';
import { TRAITS } from '../data/traits';
import { POSITION_MAP } from '../data/positions';
import { CLUB_MAP, youthClub } from '../data/clubs';
import { clamp, chance, weightedPick, randInt } from '../engines/util';
import { playerOverall } from '../engines/overall';
import { progressSkills, roundSkills } from '../engines/progression';
import { simulateSeason } from '../engines/season';
import { decideAwards } from '../engines/awards';
import { simulateNational } from '../engines/national';
import { generateOffers, marketValue, wageFor } from '../engines/transfers';
import { computeLegacy } from '../engines/legacy';

export const MAX_AGE = 40;

function applyHonor(list: Honor[], label: string) {
  const found = list.find((h) => h.label === label);
  if (found) found.count += 1;
  else list.push({ label, count: 1 });
}

function log(p: Player, kind: Player['log'][number]['kind'], text: string) {
  p.log.unshift({ season: p.season, age: p.age, kind, text });
  if (p.log.length > 400) p.log.length = 400;
}

/** deep clone so React state updates are clean */
export function clone(p: Player): Player {
  return JSON.parse(JSON.stringify(p));
}

export function currentClub(p: Player) {
  if (p.contract && CLUB_MAP[p.contract.clubId]) return CLUB_MAP[p.contract.clubId];
  return youthClub(p.country);
}

export interface YearSummary {
  seasonRecord: SeasonRecord;
  event: string;
  logs: string[];
  overallBefore: number;
  overallAfter: number;
  skillDeltas: Partial<Record<SkillKey, number>>;
  retired: boolean;
}

export function advanceYear(input: Player, trainingFocus: SkillKey[] | null): { player: Player; summary: YearSummary } {
  const p = clone(input);
  const yearLogs: string[] = [];
  const overallBefore = playerOverall(p);

  // ---- 1. life event ----
  const eligible = EVENTS.filter((e) => p.age >= e.minAge && p.age <= e.maxAge);
  let eventText = 'A quiet year of steady work.';
  if (eligible.length > 0) {
    const ev = weightedPick(eligible, (e) => e.weight);
    eventText = ev.desc;
    for (const [k, v] of Object.entries(ev.effects)) {
      const key = k as SkillKey;
      if (p.skills[key] !== undefined) p.skills[key] = clamp(p.skills[key] + (v as number), 12, 99);
    }
    log(p, 'event', ev.desc);
  }

  // ---- 2. trait unlock (teenage years) ----
  if (p.traits.length === 0 && p.age >= 12 && p.age <= 19 && chance(0.2)) {
    const posCat = POSITION_MAP[p.position].category;
    const pool = TRAITS.filter((t) => !t.positions || t.positions.includes(posCat));
    const t = weightedPick(pool, (x) => x.rarity);
    p.traits.push(t.id);
    for (const [k, v] of Object.entries(t.boosts)) {
      const key = k as SkillKey;
      if (p.skills[key] !== undefined) p.skills[key] = clamp(p.skills[key] + (v as number), 12, 99);
    }
    log(p, 'milestone', `Unlocked a signature trait: ${t.name} — ${t.desc}`);
    yearLogs.push(`✨ Signature trait unlocked: ${t.name}`);
  }

  // overall the player will play this season at
  const seasonOverall = playerOverall(p);
  const club = currentClub(p);

  // ---- 3. club season ----
  const season = simulateSeason(p, club, seasonOverall);
  p.role = season.role;
  season.logs.forEach((l) => { log(p, l.includes('🏆') ? 'trophy' : l.includes('injury') ? 'injury' : 'system', l); yearLogs.push(l); });

  // ---- 4. awards ----
  const awards = decideAwards(p, club, seasonOverall, season);
  awards.logs.forEach((l) => { log(p, 'award', l); yearLogs.push(l); });

  // ---- 5. national team ----
  const nat = simulateNational(p, club, seasonOverall);
  nat.logs.forEach((l) => { log(p, 'national', l); yearLogs.push(l); });

  // ---- 6. record honors ----
  season.clubHonors.forEach((h) => applyHonor(p.honors.club, h));
  awards.individualHonors.forEach((h) => applyHonor(p.honors.individual, h));
  nat.individualHonors.forEach((h) => applyHonor(p.honors.individual, h));
  nat.nationalHonors.forEach((h) => applyHonor(p.honors.national, h));

  // ---- 7. totals, reputation, money ----
  p.totals.games += season.games;
  p.totals.goals += season.goals;
  p.totals.assists += season.assists;
  p.totals.caps += nat.caps;
  p.totals.intlGoals += nat.goals;
  p.national.caps += nat.caps;
  p.national.goals += nat.goals;

  p.reputation = clamp(p.reputation + awards.reputationGain, 5, 100);

  let income = 0;
  if (p.contract) income += p.contract.wage;
  const trophyBonus = (season.clubHonors.length + nat.nationalHonors.length) * Math.round(p.contract ? p.contract.wage * 0.15 : 50_000);
  income += trophyBonus;
  p.money += income;

  // ---- 8. build season record (at pre-progression level) ----
  const seasonRecord: SeasonRecord = {
    age: p.age,
    season: p.season,
    clubName: club.name,
    clubId: club.id,
    role: season.role,
    competition: season.competition,
    games: season.games,
    goals: season.goals,
    assists: season.assists,
    rating: season.rating,
    leagueFinish: club.tier === 'Youth' ? null : season.leagueFinish,
    leagueName: season.leagueName,
    overall: seasonOverall,
    capsThisYear: nat.caps,
    intlGoals: nat.goals,
    clubHonors: season.clubHonors,
    individualHonors: [...awards.individualHonors, ...nat.individualHonors],
    nationalHonors: nat.nationalHonors,
  };
  p.history.push(seasonRecord);

  // ---- 9. progression (skills grow/decline) ----
  const prog = progressSkills(p, {
    trainedKeys: trainingFocus ?? [],
    clubRating: club.rating,
    minutesFactor: season.minutesFactor,
  });
  roundSkills(p);

  // ---- 10. contract & age ----
  if (p.contract) {
    p.contract.yearsLeft -= 1;
    if (p.contract.yearsLeft <= 0) {
      log(p, 'transfer', `Contract with ${club.name} expired — you're a free agent.`);
      yearLogs.push(`📄 Your contract with ${club.name} has expired.`);
      p.contract = null;
    }
  }

  p.age += 1;
  p.season += 1;
  p.trainedThisYear = false;
  p.searchedThisYear = false;

  const overallAfter = playerOverall(p);
  p.marketValue = marketValue(overallAfter, p.age, p.reputation);
  p.national.status = nat.status;

  // ---- 11. offseason offers (clubs approach automatically) ----
  const scope = p.age < 16 ? 'youth' : 'domestic';
  p.offers = generateOffers(p, overallAfter, scope);

  // milestone logs
  if (p.totals.goals >= 100 && p.totals.goals - season.goals < 100) yearLogs.push('🎯 Reached 100 career goals!');

  // ---- 12. retirement checks ----
  let retired = false;
  if (p.age >= MAX_AGE) { retired = true; }
  else if (p.age >= 34 && overallAfter < 60 && chance(0.5)) { retired = true; }
  if (retired) finalizeRetirement(p);

  return {
    player: p,
    summary: {
      seasonRecord, event: eventText, logs: yearLogs,
      overallBefore, overallAfter, skillDeltas: prog.deltas, retired,
    },
  };
}

export function finalizeRetirement(p: Player) {
  if (p.retired) return;
  p.retired = true;
  const legacy = computeLegacy(p);
  p.legacyScore = legacy.score;
  p.legacyTier = legacy.tier;
  log(p, 'milestone', `Retired at ${p.age}. Legacy: ${legacy.tier} (${legacy.score} pts). ${legacy.blurb}`);
}

// ---------------- action helpers ----------------

export function signOffer(p: Player, offerIndex: number): Player {
  const next = clone(p);
  const offer = next.offers[offerIndex];
  if (!offer) return next;
  next.contract = { clubId: offer.clubId, wage: offer.wage, yearsLeft: offer.years };
  next.role = offer.role;
  next.offers = [];
  next.searchedThisYear = true;
  log(next, 'transfer', `Signed for ${offer.clubName} (${offer.role}, ${offer.years}yr).`);
  return next;
}

export function searchForClubs(p: Player, scope: 'domestic' | 'international'): Player {
  const next = clone(p);
  const ovr = playerOverall(next);
  const found = generateOffers(next, ovr, scope);
  // merge, de-dupe by club
  const map = new Map(next.offers.map((o) => [o.clubId, o]));
  found.forEach((o) => map.set(o.clubId, o));
  next.offers = [...map.values()].sort((a, b) => b.clubRating - a.clubRating);
  next.searchedThisYear = true;
  log(next, 'system', `Scouted ${scope === 'international' ? 'international' : 'domestic'} clubs — ${found.length} showed interest.`);
  return next;
}

export function signSponsorship(p: Player): { player: Player; amount: number } {
  const next = clone(p);
  const ovr = playerOverall(next);
  const club = currentClub(next);
  const amount = Math.round((150_000 + ovr * ovr * 400 + next.reputation * 20_000) * (0.6 + club.prestige / 120));
  next.money += amount;
  log(next, 'system', `Signed a sponsorship deal worth ${amount.toLocaleString()}.`);
  return { player: next, amount };
}

export function requestContract(p: Player): { player: Player; ok: boolean; msg: string } {
  const next = clone(p);
  if (!next.contract) return { player: next, ok: false, msg: "You're a free agent — find a club first." };
  const club = CLUB_MAP[next.contract.clubId];
  const ovr = playerOverall(next);
  const deserved = wageFor(club, next.role, ovr);
  if (deserved > next.contract.wage * 1.05) {
    next.contract.wage = deserved;
    next.contract.yearsLeft = Math.max(next.contract.yearsLeft, randInt(2, 4));
    log(next, 'transfer', `Renegotiated terms with ${club.name}: ${deserved.toLocaleString()}/yr.`);
    return { player: next, ok: true, msg: `New deal agreed: ${deserved.toLocaleString()}/yr.` };
  }
  return { player: next, ok: false, msg: `${club.name} won't improve your terms right now.` };
}

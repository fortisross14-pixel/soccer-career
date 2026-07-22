import type { Honor, Player, SkillKey, SeasonRecord, SeasonObjective, TrainingIntensity } from './types';
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
import { careerVerdict, seasonNarrative, worldHeadlines } from '../engines/narrative';
import { advanceRival } from '../engines/rival';

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
  return youthClub(p.country, p.academyClubId);
}

export interface YearSummary {
  seasonRecord: SeasonRecord;
  event: string;
  logs: string[];
  overallBefore: number;
  overallAfter: number;
  skillDeltas: Partial<Record<SkillKey, number>>;
  retired: boolean;
  narrative: string[];
  worldHeadlines: string[];
  careerVerdict?: string;
}

function buildPositionStats(p: Player, games:number, goals:number, assists:number, rating:number): Record<string,number> {
  if (p.position === 'GK') return { saves: Math.round(games*(2.2+p.skills.reflexes/55)), cleanSheets: Math.round(games*(0.18+p.skills.handling/260)), penaltiesSaved: Math.round(games*p.skills.reflexes/1800), errors: Math.max(0,Math.round(games*(100-p.skills.decisions)/1200)) };
  if (p.position === 'CB' || p.position === 'FB') return { tackles: Math.round(games*(1.5+p.skills.tackling/45)), interceptions: Math.round(games*(1+p.skills.decisions/75)), aerialDuels: Math.round(games*(p.skills.heading+p.skills.jumping)/90), cleanSheets: Math.round(games*(0.15+p.skills.tackling/300)) };
  if (p.position === 'CM' || p.position === 'B2B' || p.position === 'AM') return { chancesCreated: Math.round(assists*4+games*p.skills.decisions/90), progressivePasses: Math.round(games*(2+p.skills.longPass/35)), recoveries: Math.round(games*(p.skills.workRate+p.skills.tackling)/85), passCompletion: Math.round(68+(p.skills.shortPass+p.skills.decisions)/7) };
  return { shots: Math.round(goals*3.2+games*1.4), keyPasses: Math.round(assists*3+games*p.skills.decisions/110), dribbles: Math.round(games*p.skills.dribbling/55), matchWinners: Math.max(0,Math.round(goals*rating/28)) };
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
  const baseClub = currentClub(p);
  const club = { ...baseClub, continental: p.clubContinental ?? baseClub.continental };

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
  const isProfessionalSeason = Boolean(p.contract) && p.age >= 16;
  if (isProfessionalSeason) {
    p.totals.games += season.games;
    p.totals.goals += season.goals;
    p.totals.assists += season.assists;
  }
  p.totals.caps += nat.caps;
  p.totals.intlGoals += nat.goals;
  p.totals.intlAssists = (p.totals.intlAssists ?? 0) + nat.assists;
  p.national.caps += nat.caps;
  p.national.goals += nat.goals;
  p.national.assists = (p.national.assists ?? 0) + nat.assists;

  const repResistance = p.reputation >= 95 ? 0.08 : p.reputation >= 90 ? 0.18 : p.reputation >= 80 ? 0.35 : p.reputation >= 65 ? 0.6 : 0.82;
  const achievementCeiling = awards.wonBallon ? 100 : p.honors.individual.some((h) => h.label.includes("Ballon")) ? 97 : season.clubHonors.some((h) => h.includes('Champions')) || nat.nationalHonors.some((h) => h.includes('World Cup')) ? 94 : 89;
  p.reputation = clamp(p.reputation + awards.reputationGain * repResistance, 5, achievementCeiling);

  // Persistent player-state consequences. Performance changes trust; planning changes fitness.
  const objective = p.seasonObjective ?? 'develop';
  const performanceTrust = season.rating >= 7.4 ? 7 : season.rating >= 6.8 ? 2 : -6;
  p.managerTrust = clamp((p.managerTrust ?? 55) + performanceTrust + (season.injured ? -2 : 0), 0, 100);
  const intensity = p.trainingIntensity ?? 'balanced';
  const recoveryFitnessGain = objective === 'recover' ? 30 : 0;
  p.fitness = clamp((p.fitness ?? 80) + recoveryFitnessGain + (intensity === 'light' ? 8 : intensity === 'intense' ? -10 : 1) + (season.injured ? -12 : 0), 20, 100);
  if (season.injured) p.injurySeasons = (p.injurySeasons ?? 0) + 1;
  if (intensity === 'intense') p.intenseTrainingYears = (p.intenseTrainingYears ?? 0) + 1;

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
    games: isProfessionalSeason ? season.games : 0,
    goals: isProfessionalSeason ? season.goals : 0,
    assists: isProfessionalSeason ? season.assists : 0,
    rating: isProfessionalSeason ? season.rating : 0,
    leagueFinish: club.tier === 'Youth' ? null : season.leagueFinish,
    leagueName: season.leagueName,
    overall: seasonOverall,
    capsThisYear: nat.caps,
    intlGoals: nat.goals,
    intlAssists: nat.assists,
    clubHonors: season.clubHonors,
    individualHonors: [...awards.individualHonors, ...nat.individualHonors],
    nationalHonors: nat.nationalHonors,
    narrative: [],
    worldHeadlines: [],
    positionStats: buildPositionStats(p, season.games, season.goals, season.assists, season.rating),
  };
  p.history.push(seasonRecord);

  // ---- 9. progression (skills grow/decline) ----
  const prog = progressSkills(p, {
    trainedKeys: trainingFocus ?? [],
    clubRating: club.rating,
    minutesFactor: season.minutesFactor,
    intensity: p.trainingIntensity ?? 'balanced',
    recoverySeason: objective === 'recover',
    academySeason: p.age < 16 || !p.contract,
    academyFocus: p.academyFocus ?? club.academyFocus,
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
  p.searchedDomesticThisYear = false;
  p.searchedInternationalThisYear = false;
  p.sponsoredThisYear = false;
  p.renegotiatedThisYear = false;
  p.transferRequestedThisYear = false;
  p.loanRequestedThisYear = false;
  p.eventPerformanceModifier = 0;
  p.eventDevelopmentModifier = 0;
  p.eventInjuryModifier = 0;

  const overallAfter = playerOverall(p);
  p.marketValue = marketValue(overallAfter, p.age, p.reputation);
  p.national.status = nat.status;

  // ---- 11. offseason offers (reputation and exposure can now attract foreign clubs) ----
  if (p.age < 16) {
    p.offers = generateOffers(p, overallAfter, 'youth', 'automatic');
  } else {
    const domestic = generateOffers(p, overallAfter, 'domestic', 'automatic');
    const internationalChance = clamp((p.reputation - 35) / 70 + (nat.caps > 0 ? 0.16 : 0) + (season.clubHonors.length > 0 ? 0.1 : 0), 0, 0.85);
    const foreign = chance(internationalChance) ? generateOffers(p, overallAfter, 'international', 'automatic') : [];
    const merged = new Map([...domestic, ...foreign].map((o) => [o.clubId, o]));
    p.offers = [...merged.values()].sort((a, b) => b.clubRating - a.clubRating);
  }

  const objectiveMet =
    objective === 'develop' ? overallAfter > overallBefore :
    objective === 'play' ? season.games >= 30 :
    objective === 'perform' ? season.rating >= 7.2 :
    objective === 'trophy' ? season.clubHonors.length > 0 :
    objective === 'international' ? nat.caps > 0 :
    objective === 'recover' ? (p.fitness ?? 0) >= 82 :
    p.offers.some((o) => o.clubRating > club.rating || o.international);
  if (objectiveMet) {
    p.morale = clamp((p.morale ?? 70) + 8, 0, 100);
    p.managerTrust = clamp((p.managerTrust ?? 55) + 5, 0, 100);
    p.reputation = clamp(p.reputation + (p.reputation < 80 ? 2 : 0.5), 5, p.reputation >= 95 ? 97 : 92);
    yearLogs.push(`✅ Season objective achieved: ${objectiveLabel(objective)}.`);
  } else {
    p.morale = clamp((p.morale ?? 70) - 7, 0, 100);
    yearLogs.push(`❌ Season objective missed: ${objectiveLabel(objective)}.`);
  }

  const narrative = seasonNarrative(p, season, overallBefore, overallAfter, objectiveMet);
  advanceRival(p);
  const headlines = worldHeadlines(p, seasonRecord);
  seasonRecord.narrative = narrative;
  seasonRecord.worldHeadlines = headlines;
  p.worldHeadlines = headlines;
  narrative.forEach((line) => log(p, 'system', line));
  headlines.forEach((line) => log(p, 'system', `WORLD: ${line}`));
  p.peakOverall = Math.max(p.peakOverall ?? 0, overallBefore, overallAfter);

  // Continental qualification is earned for the next season rather than permanently fixed.
  if (club.tier !== 'Youth' && club.division === 1) {
    p.clubContinental = season.leagueFinish <= 4 ? 'CL' : season.leagueFinish <= 6 ? 'EL' : 'none';
  } else p.clubContinental = 'none';

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
      overallBefore, overallAfter, skillDeltas: prog.deltas, retired, narrative, worldHeadlines: headlines,
      careerVerdict: retired ? careerVerdict(p) : undefined,
    },
  };
}

function objectiveLabel(o: SeasonObjective): string {
  return ({ develop: 'Improve your overall', play: 'Play 30 matches', perform: 'Average 7.2+', trophy: 'Win a trophy', international: 'Earn an international cap', transfer: 'Attract a better move', recover: 'Recover fitness' } as Record<SeasonObjective, string>)[o];
}

export function setSeasonPlan(p: Player, objective: SeasonObjective, intensity: TrainingIntensity): Player {
  const next = clone(p);
  next.seasonObjective = objective;
  next.trainingIntensity = intensity;
  log(next, 'system', `Season plan set: ${objectiveLabel(objective)} · ${intensity} training.`);
  return next;
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
  if (next.age < 16) {
    next.academyClubId = offer.clubId;
    next.academyFocus = offer.academyFocus;
    next.contract = null;
    next.role = 'youth';
    next.offers = [];
    next.searchedThisYear = true;
    next.careerDecisionScore = (next.careerDecisionScore ?? 0) + 1;
    log(next, 'transfer', `Joined ${offer.clubName} academy — development focus: ${offer.academyFocus ?? 'Balanced'}.`);
    return next;
  }
  next.contract = { clubId: offer.clubId, wage: offer.wage, yearsLeft: offer.years };
  next.professionalDebutAge ??= next.age;
  next.role = offer.role;
  next.offers = [];
  next.searchedThisYear = true;
  next.clubContinental = offer.continental;
  const currentRating = currentClub(p).rating;
  next.careerDecisionScore = (next.careerDecisionScore ?? 0) + (offer.clubRating >= currentRating - 2 ? 2 : -1) + (offer.role === 'starter' || offer.role === 'star' ? 1 : -1);
  log(next, 'transfer', `Signed your first professional contract with ${offer.clubName} (${offer.role}, ${offer.years}yr).`);
  return next;
}

export function searchForClubs(p: Player, scope: 'domestic' | 'international'): Player {
  const next = clone(p);
  if (scope === 'domestic' && next.searchedDomesticThisYear) return next;
  if (scope === 'international' && next.searchedInternationalThisYear) return next;
  const ovr = playerOverall(next);
  const found = generateOffers(next, ovr, scope, scope === 'international' ? 'international-scout' : 'domestic-scout');
  // Keep unsolicited offers, but replace earlier results from the same search type.
  next.offers = next.offers.filter((o) => o.source !== (scope === 'international' ? 'international-scout' : 'domestic-scout'));
  const map = new Map(next.offers.map((o) => [o.clubId, o]));
  found.forEach((o) => map.set(o.clubId, o));
  next.offers = [...map.values()].sort((a, b) => b.clubRating - a.clubRating);
  next.searchedThisYear = true;
  if (scope === 'domestic') next.searchedDomesticThisYear = true;
  else next.searchedInternationalThisYear = true;
  log(next, 'system', `Scouted ${scope === 'international' ? 'international' : 'domestic'} clubs — ${found.length} showed interest.`);
  return next;
}

export function signSponsorship(p: Player): { player: Player; amount: number } {
  const next = clone(p);
  if (next.sponsoredThisYear) return { player: next, amount: 0 };
  const ovr = playerOverall(next);
  const club = currentClub(next);
  const amount = Math.round((150_000 + ovr * ovr * 400 + next.reputation * 20_000) * (0.6 + club.prestige / 120));
  next.money += amount;
  next.sponsoredThisYear = true;
  log(next, 'system', `Signed a sponsorship deal worth ${amount.toLocaleString()}.`);
  return { player: next, amount };
}

export function requestContract(p: Player, priority: 'wage' | 'role' | 'security' = 'wage'): { player: Player; ok: boolean; msg: string } {
  const next = clone(p);
  if (!next.contract) return { player: next, ok: false, msg: "You're a free agent — find a club first." };
  if (next.renegotiatedThisYear) return { player: next, ok: false, msg: 'You already approached the club this season.' };
  next.renegotiatedThisYear = true;
  const club = CLUB_MAP[next.contract.clubId];
  const ovr = playerOverall(next);
  const deserved = wageFor(club, next.role, ovr);
  const leverage = (next.managerTrust ?? 55) + next.reputation * 0.35 + (priority === 'role' ? 5 : 0);
  if (deserved > next.contract.wage * 1.05 || leverage >= 78) {
    if (priority === 'wage') next.contract.wage = Math.max(deserved, Math.round(next.contract.wage * 1.12));
    if (priority === 'security') next.contract.yearsLeft = Math.max(next.contract.yearsLeft, randInt(4, 5));
    if (priority === 'role') next.managerTrust = clamp((next.managerTrust ?? 55) + 8, 0, 100);
    next.contract.yearsLeft = Math.max(next.contract.yearsLeft, priority === 'security' ? 4 : randInt(2, 4));
    log(next, 'transfer', `Renegotiated terms with ${club.name}: ${deserved.toLocaleString()}/yr.`);
    return { player: next, ok: true, msg: priority === 'wage' ? `New deal agreed: ${next.contract.wage.toLocaleString()}/yr.` : priority === 'security' ? `Long-term security agreed: ${next.contract.yearsLeft} years.` : 'Improved squad-role assurances agreed.' };
  }
  next.managerTrust = clamp((next.managerTrust ?? 55) - 4, 0, 100);
  next.morale = clamp((next.morale ?? 70) - 2, 0, 100);
  return { player: next, ok: false, msg: `${club.name} won't improve your terms right now. Manager trust fell slightly.` };
}

export function requestTransfer(p: Player): { player: Player; count: number } {
  const next = clone(p);
  if (next.transferRequestedThisYear || next.age < 17) return { player: next, count: 0 };
  const found = generateOffers(next, playerOverall(next), 'international', 'transfer-request');
  const domestic = generateOffers(next, playerOverall(next), 'domestic', 'transfer-request');
  const map = new Map([...next.offers, ...found, ...domestic].map((o) => [o.clubId, o]));
  next.offers = [...map.values()].sort((a, b) => b.clubRating - a.clubRating);
  next.transferRequestedThisYear = true;
  next.managerTrust = clamp((next.managerTrust ?? 55) - 12, 0, 100);
  next.careerDecisionScore = (next.careerDecisionScore ?? 0) - 1;
  next.morale = clamp((next.morale ?? 70) + 3, 0, 100);
  log(next, 'transfer', `Submitted a transfer request — ${found.length + domestic.length} clubs responded.`);
  return { player: next, count: found.length + domestic.length };
}

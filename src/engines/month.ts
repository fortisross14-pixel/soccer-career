import type { Career, Fixture, MonthReport, SeasonSummary } from '../game/types';
import { CLUB_MAP } from '../data/clubs';
import { getCountry } from '../data/countries';
import { balanceEffects } from '../data/training';
import { earn, milestone, volumeMilestones, PER_EVENT } from './coins';
import { scorerTable, CONT_KO, CUP_ROUNDS, applyToTable, contKnockoutOpponent, cupOpponent, makeFixture, quickResult, tablePosition, buildSeason } from './calendar';
import { simulateMatch, roleRank } from './match';
import { monthlyGrowth } from './growth';
import { addPack } from './cards';
import { playerOverall } from './overall';
import { STAFF_PERK, staffMonthlyCost } from './perks';
import { windowOffers, renewalOffer } from './market';
import { nationalCallUp, setupTournament, afterTournamentMatch } from './national';
import { endLeagueSeason, ballonDor, gainReputation, computeLegacy, ordinal } from './awards';
import { rollDecision, retirementDecision } from './decisions';
import { chance, clamp, randInt, MONTHS_LONG, calYear } from './util';

export const isWindow = (m: number) => m === 0 || m === 6;

export function canPlay(c: Career): string | null {
  if (c.retired) return 'Career over.';
  if (c.decisions.length) return 'Make your decision first.';
  if (!c.player.contract) return 'You need a club. Pick an offer.';
  return null;
}

function log(c: Career, kind: Career['log'][number]['kind'], text: string) {
  c.log.unshift({ year: c.year, month: c.month, kind, text });
  if (c.log.length > 300) c.log.length = 300;
}

/** set up the month that is about to be played */
export function beginMonth(c: Career) {
  const notes: string[] = [];
  const p = c.player;
  c.notices = [];

  if (isWindow(c.month)) {
    c.asked = { loan: false, transfer: false };
    const winter = c.month === 6;
    const offers = windowOffers(c, winter);
    const renewal = renewalOffer(c);
    c.offers = [...(renewal ? [renewal] : []), ...offers];
    notes.push(`🔁 The ${winter ? 'January' : 'summer'} transfer window is open — ${c.offers.length} offer${c.offers.length === 1 ? '' : 's'} on the table.`);
    if (p.contract && !p.contract.parentClubId && p.contract.yearsLeft <= 1 && !renewal) notes.push(`⚠️ ${CLUB_MAP[p.contract.clubId].name} have not offered you a new deal. Your contract ends in June.`);
    if (!p.contract) notes.push('You are a free agent. Sign with a club to start the season.');
    // broken promises
    if (winter && p.contract && c.season) {
      const lg = c.season.fixtures.filter((f) => f.played && f.comp === 'league');
      const starts = lg.filter((f) => f.report?.involvement === 'started').length;
      if (roleRank(p.contract.promisedRole) >= 3 && lg.length >= 8 && starts / lg.length < 0.45) {
        p.morale = clamp(p.morale - 10, 0, 100);
        notes.push('😠 You were promised regular football and it has not happened. Morale −10.');
      }
    }
  } else if (c.month === 1 || c.month === 7) {
    c.offers = c.offers.filter((o) => o.kind === 'first');
  }

  notes.push(...nationalCallUp(c));
  if (c.month === 11) notes.push(...setupTournament(c));

  if (c.decisions.length === 0 && c.month !== 0) {
    const d = rollDecision(c);
    if (d) c.decisions.push(d);
  }
  c.notices = notes;
}

function recover(c: Career, days: number) {
  if (days <= 0) return;
  const p = c.player;
  const rate = balanceEffects(c.plan.balance).recovery + STAFF_PERK(p, 'recovery') + (p.age > 31 ? -0.15 : 0);
  p.fitness = clamp(p.fitness + days * rate, 0, 100);
}

function recordMatch(c: Career, fx: Fixture) {
  const s = c.season!;
  const r = fx.report!;
  const st = s.stats;
  const t = c.totals;
  if (r.minutes <= 0) return;
  const defensive = ['GK', 'CB', 'FB'].includes(c.player.position);
  milestone(c, fx.comp === 'national' ? 'cap1' : 'debut');
  if (r.involvement === 'started') milestone(c, 'start11');
  if (r.goals) { milestone(c, 'goal1'); earn(c, `${r.goals} goal${r.goals > 1 ? 's' : ''}`, r.goals * PER_EVENT.goal); }
  if (r.goals >= 3) { milestone(c, 'hattrick1'); earn(c, 'Hat-trick', PER_EVENT.hattrick); }
  if (r.assists) { milestone(c, 'assist1'); earn(c, `${r.assists} assist${r.assists > 1 ? 's' : ''}`, r.assists * PER_EVENT.assist); }
  if (r.motm) { milestone(c, 'motm1'); earn(c, 'Man of the Match', PER_EVENT.motm); }
  if (defensive && (fx.oppGoals ?? 0) === 0 && r.minutes >= 60) { milestone(c, 'clean1'); earn(c, 'Clean sheet', PER_EVENT.cleanSheet); }
  if (fx.comp === 'continental') { milestone(c, 'cont1'); if (r.goals) milestone(c, 'contgoal1'); }
  if (fx.comp === 'national' && r.goals) milestone(c, 'intlgoal1');
  if (fx.compName === 'World Cup') milestone(c, 'wc1');
  if (fx.comp === 'league') {
    if (s.division < c.bestDiv) {
      if (c.bestDiv !== 9) milestone(c, 'climb1');
      c.bestDiv = s.division;
    }
    if (s.division === 1) milestone(c, 'topflight1');
  }
  if (fx.comp === 'national') {
    st.intlCaps++; st.intlGoals += r.goals; st.intlAssists += r.assists;
    t.caps++; t.intlGoals += r.goals;
    if (c.national.debutAge === null) { c.national.debutAge = c.player.age; log(c, 'national', `International debut for ${c.player.country}!`); addPack(c, 'silver', 'International debut'); }
  } else {
    t.apps++; t.goals += r.goals; t.assists += r.assists;
    if (fx.comp === 'league') {
      st.leagueApps++; st.leagueGoals += r.goals; st.leagueAssists += r.assists;
      if (r.rating !== null) { st.leagueRatingSum += r.rating; st.leagueRated++; }
    }
    if (fx.comp === 'continental') st.contGoals += r.goals;
  }
  st.apps++; st.minutes += r.minutes; st.goals += r.goals; st.assists += r.assists;
  if (r.involvement === 'started') st.starts++;
  if (r.rating !== null) { st.ratingSum += r.rating; st.rated++; }
  if (r.motm) { st.motm++; t.motm++; }
  if ((fx.oppGoals ?? 0) === 0 && r.minutes >= 60) st.cleanSheets++;
}

function milestoneCheck(c: Career, goalsBefore: number, news: string[]) {
  const g = c.totals.goals;
  for (const m of [1, 50, 100, 200, 300, 400, 500]) {
    if (goalsBefore < m && g >= m) {
      const txt = m === 1 ? 'First professional goal!' : `${m} career club goals!`;
      news.push(`🎯 ${txt}`);
      log(c, 'milestone', txt);
      addPack(c, m === 1 ? 'silver' : 'gold', txt);
    }
  }
}

function knockouts(c: Career, fx: Fixture, news: string[]) {
  const s = c.season!;
  const won = (fx.usGoals ?? 0) > (fx.oppGoals ?? 0) || fx.penalties?.startsWith('W');
  if (fx.comp === 'cup') {
    const idx = CUP_ROUNDS.findIndex((r) => r.stage === fx.stage);
    if (!won) { s.cupAlive = false; news.push(`Knocked out of the ${fx.compName} (${fx.stage}).`); return; }
    if (idx === CUP_ROUNDS.length - 1) {
      s.cupAlive = false; s.honors.push(fx.compName); milestone(c, 'trophy1'); earn(c, fx.compName, PER_EVENT.trophy);
      news.push(`🏆 ${s.clubName} win the ${fx.compName}!`);
      log(c, 'trophy', `Won the ${fx.compName}.`);
      return;
    }
    const next = CUP_ROUNDS[idx + 1];
    s.fixtures.push(makeFixture({ day: next.day, comp: 'cup', compName: fx.compName, stage: next.stage, usId: fx.usId, oppId: cupOpponent(fx.usId, idx + 1), home: next.stage === 'Final' ? false : chance(0.5) }));
  }
  if (fx.comp === 'continental') {
    if (fx.stage === 'Group · MD6') {
      const pts = s.fixtures.filter((f) => f.comp === 'continental' && f.stage.startsWith('Group')).reduce((sum, f) => sum + ((f.usGoals ?? 0) > (f.oppGoals ?? 0) ? 3 : f.usGoals === f.oppGoals ? 1 : 0), 0);
      const through = pts >= 10 || (pts >= 7 && chance((pts - 6) / 4));
      if (!through) { s.contAlive = false; news.push(`Out of the ${s.contName} at the group stage (${pts} pts).`); return; }
      news.push(`Through to the ${s.contName} knockouts (${pts} pts)!`);
      s.fixtures.push(makeFixture({ day: CONT_KO[0].day, comp: 'continental', compName: s.contName, stage: CONT_KO[0].stage, usId: fx.usId, oppId: contKnockoutOpponent(fx.usId, s.contKey, 0), home: chance(0.5) }));
      return;
    }
    if (fx.stage.startsWith('Group')) return;
    const idx = CONT_KO.findIndex((r) => r.stage === fx.stage);
    if (!won) { s.contAlive = false; news.push(`Eliminated from the ${s.contName} (${fx.stage}).`); return; }
    if (idx === CONT_KO.length - 1) {
      s.contAlive = false; s.honors.push(`${s.contName} Winner`); milestone(c, 'trophy1'); milestone(c, 'contwin1'); earn(c, `${s.contName} Winner`, PER_EVENT.trophy * 2);
      news.push(`🏆 ${s.clubName} are ${s.contName} champions!`);
      log(c, 'trophy', `Won the ${s.contName}.`);
      return;
    }
    const next = CONT_KO[idx + 1];
    s.fixtures.push(makeFixture({ day: next.day, comp: 'continental', compName: s.contName, stage: next.stage, usId: fx.usId, oppId: contKnockoutOpponent(fx.usId, s.contKey, idx + 1), home: chance(0.5) }));
  }
  s.fixtures.sort((a, b) => a.day - b.day);
}

function playFixture(c: Career, fx: Fixture, news: string[]) {
  const goalsBefore = c.totals.goals;
  const out = simulateMatch(c, fx);
  fx.played = true;
  fx.usGoals = out.usGoals;
  fx.oppGoals = out.oppGoals;
  fx.report = out.report;
  const knockout = (fx.comp === 'cup') || (fx.comp === 'continental' && !fx.stage.startsWith('Group')) || (fx.comp === 'national' && !fx.stage.startsWith('Group') && fx.stage !== 'International break');
  if (knockout && out.usGoals === out.oppGoals) {
    const winP = 0.5 + (CLUB_MAP[fx.usId]?.rating ?? 0) / 1000 - (CLUB_MAP[fx.oppId]?.rating ?? 0) / 1000;
    const a = randInt(3, 5);
    const b = Math.max(0, a - randInt(1, 2));
    fx.penalties = chance(winP) ? `W ${a}-${b} pens` : `L ${b}-${a} pens`;
  }
  if (out.injuredDays) {
    news.push(`🚑 ${c.player.injury!.name} — out for about ${out.injuredDays} days.`);
    log(c, 'injury', `${c.player.injury!.name} (${out.injuredDays} days).`);
  }
  recordMatch(c, fx);
  milestoneCheck(c, goalsBefore, news);
  if (fx.comp === 'cup' || fx.comp === 'continental') knockouts(c, fx, news);
  if (fx.comp === 'national') news.push(...afterTournamentMatch(c, fx));
}

/** Play every fixture of the current month and advance the calendar. */
export function playMonth(c: Career): MonthReport {
  const blocker = canPlay(c);
  if (blocker) throw new Error(blocker);
  const p = c.player;
  const s = c.season!;
  const start = c.month * 30;
  const end = start + 30;
  const ovrBefore = playerOverall(p);
  const news: string[] = [...c.notices];
  const played: string[] = [];
  const packsBefore = new Set(c.packs.map((x) => x.uid));
  const coinsBefore = c.pendingCoins.length;

  let lastDay = start;
  let guard = 0;
  // process league rounds and our other fixtures in date order; knockouts can add fixtures as we go
  while (guard++ < 200) {
    const nextRound = s.rounds[s.roundsPlayed];
    const roundDay = nextRound && nextRound.day < end ? nextRound.day : Infinity;
    const nextFx = s.fixtures.filter((f) => !f.played && f.comp !== 'league' && f.day >= start && f.day < end).sort((a, b) => a.day - b.day)[0];
    const fxDay = nextFx ? nextFx.day : Infinity;
    if (roundDay === Infinity && fxDay === Infinity) break;
    if (roundDay <= fxDay) {
      recover(c, roundDay - lastDay); lastDay = roundDay;
      for (const [h, a] of nextRound.pairs) {
        if (h === s.clubId || a === s.clubId) {
          const fx = s.fixtures.find((f) => f.comp === 'league' && f.day === nextRound.day && !f.played);
          if (fx) {
            playFixture(c, fx, news); played.push(fx.id);
            const hg = fx.home ? fx.usGoals! : fx.oppGoals!;
            const ag = fx.home ? fx.oppGoals! : fx.usGoals!;
            applyToTable(s.table, h, a, hg, ag);
            continue;
          }
        }
        const [hg, ag] = quickResult(h, a);
        applyToTable(s.table, h, a, hg, ag);
      }
      s.roundsPlayed++;
    } else {
      recover(c, fxDay - lastDay); lastDay = fxDay;
      playFixture(c, nextFx, news); played.push(nextFx.id);
    }
  }
  recover(c, end - lastDay);

  // injuries heal
  if (p.injury && (p.injury.year !== c.year || p.injury.untilDay < end)) { news.push(`✅ Recovered from ${p.injury.name.toLowerCase()}.`); p.injury = null; }

  // ---- month review ----
  const mine = played.map((id) => s.fixtures.find((f) => f.id === id)!).filter((f) => f.report && f.report.minutes > 0);
  const clubMatches = played.map((id) => s.fixtures.find((f) => f.id === id)!).filter((f) => f.comp !== 'national');
  const minutes = mine.filter((f) => f.comp !== 'national').reduce((sum, f) => sum + f.report!.minutes, 0);
  const deltas = monthlyGrowth(c, minutes, clubMatches.length);
  const rated = mine.filter((f) => f.report!.rating !== null);
  const avg = rated.length ? rated.reduce((sum, f) => sum + f.report!.rating!, 0) / rated.length : 0;
  const ga = mine.reduce((sum, f) => sum + f.report!.goals + f.report!.assists, 0);
  const motms = mine.filter((f) => f.report!.motm).length;
  const cleanSheets = mine.filter((f) => f.report!.minutes >= 60 && f.oppGoals === 0).length;

  // ---- rewards ----
  if (c.month >= 1 && c.month <= 10) addPack(c, 'bronze', `${MONTHS_LONG[c.month]} training`);
  if (motms > 0) addPack(c, 'bronze', motms > 1 ? `${motms}× Man of the Match` : 'Man of the Match');
  const defensive = p.position === 'GK' || p.position === 'CB' || p.position === 'FB';
  if (ga >= 4 || (defensive && cleanSheets >= 3)) addPack(c, 'silver', `Big month: ${defensive && ga < 4 ? `${cleanSheets} clean sheets` : `${ga} goal involvements`}`);
  const leagueMine = mine.filter((f) => f.comp === 'league');
  if (leagueMine.length >= 3 && avg >= 7.6) {
    addPack(c, 'gold', 'Player of the Month');
    milestone(c, 'potm1'); earn(c, 'Player of the Month', PER_EVENT.potm);
    news.push(`⭐ ${s.leagueName} Player of the Month for ${MONTHS_LONG[c.month]}!`);
    log(c, 'award', `${s.leagueName} Player of the Month (${MONTHS_LONG[c.month]} ${calYear(c.year, c.month)}).`);
    gainReputation(c, 2);
  }

  // ---- reputation, trust, morale, money ----
  const lgF = getCountry(s.country).leagueRep / 85 * ([1, 0.6, 0.4][s.division - 1] ?? 0.4);
  const scout = balanceEffects(c.plan.balance).scout * (1 + c.mods.repBonus);
  if (rated.length) gainReputation(c, ((avg - 6.7) * 0.6 * Math.min(rated.length, 4) / 4 + ga * 0.07) * lgF * scout);
  else if (p.reputation > 40) gainReputation(c, -0.2);
  if (clubMatches.length && minutes === 0 && !p.injury) p.trust = clamp(p.trust - 2, 0, 100);
  p.morale = clamp(p.morale + (66 - p.morale) * 0.08, 0, 100);
  const income = p.contract ? Math.round(p.contract.wage / 12) : 0;
  const costs = staffMonthlyCost(p);
  p.money += income - costs;

  // ---- end of season pieces ----
  if (c.month === 10) news.push(...endLeagueSeason(c));
  const ovrAfter = playerOverall(p);
  c.peakOvr = Math.max(c.peakOvr, ovrAfter);
  volumeMilestones(c, ovrAfter);
  c.cardsThisMonth = 0;

  const packs = c.packs.filter((x) => !packsBefore.has(x.uid));
  const report: MonthReport = { year: c.year, month: c.month, fixtures: played, skillDeltas: deltas, ovrBefore, ovrAfter, packs, news, income, costs, coins: [] };

  if (c.month === 11) {
    const b = ballonDor(c);
    if (b) news.push(b);
    report.seasonEnd = rollover(c, news);
  } else {
    c.month++;
  }
  if (!c.retired) beginMonth(c);
  report.coins = c.pendingCoins.slice(coinsBefore);
  c.lastReport = report;
  return report;
}

function rollover(c: Career, news: string[]): SeasonSummary {
  const s = c.season!;
  const p = c.player;
  const st = s.stats;
  const summary: SeasonSummary = {
    year: s.year, age: p.age, clubs: s.clubsThisSeason.join(' → '), leagueName: s.leagueName,
    leaguePos: tablePosition(s), apps: st.apps - st.intlCaps, starts: s.fixtures.filter((f) => f.comp !== 'national' && f.report?.involvement === 'started').length, minutes: st.minutes,
    goals: st.goals - st.intlGoals, assists: st.assists - st.intlAssists,
    avgRating: st.rated ? Math.round((st.ratingSum / st.rated) * 100) / 100 : 0, motm: st.motm,
    caps: st.intlCaps, intlGoals: st.intlGoals, honors: [...s.honors], awards: [...s.awards],
    ovrStart: s.ovrStart, ovrEnd: playerOverall(p),
  };
  summary.division = s.division;
  summary.scorerRank = scorerTable(s, p.name).myRank;
  if (summary.goals >= 20) milestone(c, 'season20');
  if (s.fixtures.filter((f) => f.comp === 'league' && f.report?.involvement === 'started').length >= 20) milestone(c, 'regular1');
  c.history.push(summary);
  c.pastFixtures = s.fixtures;

  // contracts
  const ct = p.contract;
  if (ct) {
    if (ct.parentClubId) {
      const parent = CLUB_MAP[ct.parentClubId];
      const yrs = (ct.parentYears ?? 1) - 1;
      if (yrs > 0) {
        p.contract = { clubId: parent.id, wage: ct.parentWage ?? ct.wage, yearsLeft: yrs, promisedRole: 'rotation' };
        news.push(`↩️ Loan over — back at ${parent.name}.`);
        log(c, 'transfer', `Returned from loan to ${parent.name}.`);
      } else {
        p.contract = null;
        news.push(`Loan over, and your ${parent.name} contract has expired. You are a free agent.`);
      }
      p.trust = 50;
    } else {
      ct.yearsLeft--;
      if (ct.yearsLeft <= 0) {
        news.push(`📄 Your contract with ${CLUB_MAP[ct.clubId].name} has expired. You are a free agent.`);
        log(c, 'transfer', `Left ${CLUB_MAP[ct.clubId].name} as a free agent.`);
        p.contract = null;
      }
    }
  }

  p.age++;
  c.year++;
  c.month = 0;
  c.purchases = 0;
  p.injury = p.injury ? { ...p.injury, untilDay: p.injury.untilDay - 360, year: c.year } : null;
  if (p.injury && p.injury.untilDay <= 0) p.injury = null;
  c.season = p.contract ? buildSeason(c, p.contract.clubId) : null;
  news.push(`— Season ${c.year}/${String((c.year + 1) % 100).padStart(2, '0')} begins. You are now ${p.age}. —`);

  const ovr = playerOverall(p);
  const forced = p.age >= 40 || (p.age >= 36 && ovr < 62);
  if (forced || p.age >= 33) c.decisions.push(retirementDecision(c, forced));
  return summary;
}

export function finalizeRetirement(c: Career) {
  c.retired = true;
  c.decisions = [];
  c.offers = [];
  c.legacy = computeLegacy(c);
  earn(c, `Retirement · ${c.legacy.tier}`, Math.round(c.legacy.score / 10));
  log(c, 'milestone', `Retired at ${c.player.age}. Legacy: ${c.legacy.tier} (${c.legacy.score}).`);
}

export function seasonLabel(year: number) {
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
}

export function leaguePosText(c: Career): string {
  if (!c.season) return '—';
  return ordinal(tablePosition(c.season));
}

export { buildSeason };

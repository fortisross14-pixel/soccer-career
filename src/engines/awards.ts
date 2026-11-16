import type { Career, Honor } from '../game/types';
import { getCountry } from '../data/countries';
import { sortedTable, tablePosition } from './calendar';
import { addPack } from './cards';
import { playerOverall } from './overall';
import { chance, clamp, noise } from './util';
import { earn, milestone, PER_EVENT } from './coins';
import { promoteRelegate } from './world';
import { teamName } from './teams';

export function addHonor(list: Honor[], label: string) {
  const h = list.find((x) => x.label === label);
  if (h) h.count++;
  else list.push({ label, count: 1 });
}

export function repCeiling(c: Career): number {
  const has = (s: string) => [...c.honors.individual, ...c.honors.club, ...c.honors.national].some((h) => h.label.includes(s));
  if (has("Ballon d'Or")) return 99;
  if (has('World Cup Winner') || has('Champions Cup Winner') || has('Libertadores Winner')) return 95;
  return 91;
}

export function gainReputation(c: Career, amount: number) {
  const p = c.player;
  const res = p.reputation >= 92 ? 0.12 : p.reputation >= 82 ? 0.3 : p.reputation >= 65 ? 0.55 : 0.85;
  const pr = 1 + p.staff.reduce((s, id) => s + (id === 'st-pr' ? 0.4 : 0), 0);
  const delta = amount > 0 ? amount * res * pr : amount;
  p.reputation = clamp(p.reputation + delta, 0, Math.max(p.reputation, repCeiling(c)));
}

/** end of the domestic season (after May): titles, qualification, league awards */
export function endLeagueSeason(c: Career): string[] {
  const s = c.season;
  if (!s || s.ended) return [];
  s.ended = true;
  const news: string[] = [];
  const pos = tablePosition(s);
  const n = s.table.length;
  const country = getCountry(s.country);
  const st = s.stats;
  const p = c.player;
  const ovr = playerOverall(p);

  if (pos === 1) {
    s.honors.push(`${s.leagueName} Title`); news.push(`🏆 ${s.clubName} are ${s.leagueName} champions!`);
    milestone(c, 'trophy1'); milestone(c, 'title1'); earn(c, `${s.leagueName} Title`, PER_EVENT.trophy);
  } else news.push(`${s.clubName} finish ${ordinal(pos)} in the ${s.leagueName}.`);

  // promotion & relegation
  const order = sortedTable(s.table).map((r) => r.clubId);
  const pr = promoteRelegate(c, s.country, s.division === 1 ? order : null, s.division === 2 ? order : null);
  if (pr.up.includes(s.clubId)) {
    news.push(`⬆️ PROMOTED! ${s.clubName} go up to the top flight.`);
    s.awards.push('Promotion');
    milestone(c, 'promo1'); earn(c, 'Promotion', 50);
    addPack(c, 'gold', 'Promotion');
    p.morale = clamp(p.morale + 10, 0, 100);
  } else if (pr.down.includes(s.clubId)) {
    news.push(`⬇️ Relegated. ${s.clubName} drop to the second division.`);
    p.morale = clamp(p.morale - 12, 0, 100);
  }
  const others = [...pr.up, ...pr.down].filter((id) => id !== s.clubId);
  if (others.length) news.push(`Also: ${pr.up.filter((id) => id !== s.clubId).map(teamName).join(', ') || 'none'} promoted · ${pr.down.filter((id) => id !== s.clubId).map(teamName).join(', ') || 'none'} relegated.`);

  // next season's continental place for this club
  const clKey = s.division === 1 && !pr.down.includes(s.clubId) ? (pos <= Math.max(1, Math.round(n / 4)) ? 'CL' : pos <= Math.round(n / 2.4) ? 'EL' : 'none') : 'none';
  c.qualified = { clubId: s.clubId, key: clKey };
  if (clKey !== 'none') news.push(`Qualified for next season's ${clKey === 'CL' ? 'top' : 'second-tier'} continental competition.`);

  // league awards (based on league stats only)
  const leagueGames = s.rounds.length;
  const scale = leagueGames / 34;
  const rep = country.leagueRep;
  const avg = st.leagueRated ? st.leagueRatingSum / st.leagueRated : 0;
  const regular = st.leagueApps >= leagueGames * 0.55;
  const topFlight = s.division === 1;
  const awards: string[] = [];
  const bootLine = Math.round((17 + (rep - 68) * 0.2 + noise() * 2.5) * scale);
  const assistLine = Math.round((11 + (rep - 68) * 0.12 + noise() * 1.5) * scale);
  if (st.leagueGoals >= bootLine && st.leagueGoals >= 8) awards.push(`${s.leagueName} Golden Boot`);
  if (st.leagueAssists >= assistLine && st.leagueAssists >= 6) awards.push(`${s.leagueName} Playmaker`);
  if (regular && avg >= 7.25 && chance(0.65)) awards.push('Team of the Season');
  if (regular && avg >= 7.55 && pos <= 3 && topFlight && ovr >= rep - 6 && chance(0.55)) awards.push(`${s.leagueName} Player of the Season`);
  if (p.age <= 21 && st.leagueApps >= leagueGames * 0.45 && avg >= 7.0 && chance(0.6)) awards.push('Young Player of the Season');
  if (p.position === 'GK' && regular && avg >= 7.15 && st.cleanSheets >= leagueGames * 0.3 && chance(0.6)) awards.push(`${s.leagueName} Golden Glove`);
  if (s.contKey !== 'none' && st.contGoals >= 7) awards.push(`${s.contName} Top Scorer`);
  s.awards.push(...awards);
  for (const a of awards) { addHonor(c.honors.individual, a); addPack(c, 'silver', a); news.push(`⭐ ${a}`); milestone(c, 'award1'); earn(c, a, PER_EVENT.award); }

  const trophies = s.honors.length;
  for (const h of s.honors) { addHonor(c.honors.club, h); addPack(c, 'gold', h); }
  gainReputation(c, trophies * 2 + awards.length * 2.5 + (avg - 6.8) * 4);
  c.log.unshift({ year: c.year, month: c.month, kind: 'trophy', text: `Season ends: ${s.clubName} ${ordinal(pos)} in ${s.leagueName}. ${trophies ? `Trophies: ${s.honors.join(', ')}.` : ''}` });
  return news;
}

/** Ballon d'Or after the summer tournament */
export function ballonDor(c: Career): string | null {
  const s = c.season;
  if (!s) return null;
  const p = c.player;
  const ovr = playerOverall(p);
  const st = s.stats;
  const avg = st.rated ? st.ratingSum / st.rated : 0;
  const trophyPts = s.honors.reduce((sum, h) => sum + (h.includes('World Cup') ? 12 : h.includes('Winner') ? 8 : h.includes('Title') ? 5 : 3), 0);
  const output = p.position === 'GK' || p.position === 'CB' ? st.cleanSheets * 0.5 : (st.goals + st.assists * 0.7) / 2.2;
  const campaign = (ovr - 84) * 2.2 + trophyPts + output + (avg - 7) * 10 + (p.reputation - 80) * 0.4 + noise() * 4;
  if (ovr >= 88 && s.division === 1 && chance(clamp((campaign - 34) / 45, 0, 0.55))) {
    s.awards.push("Ballon d'Or");
    addHonor(c.honors.individual, "Ballon d'Or");
    addPack(c, 'elite', "Ballon d'Or");
    milestone(c, 'ballon1'); earn(c, "Ballon d'Or", 200);
    gainReputation(c, 10);
    return "🏅 You win the Ballon d'Or — the best player in the world!";
  }
  if (ovr >= 84 && campaign >= 22) return `You finished in the top 10 of the Ballon d'Or voting.`;
  return null;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function computeLegacy(c: Career): { score: number; tier: string; blurb: string } {
  const count = (list: Honor[], m: (l: string) => boolean) => list.filter((h) => m(h.label)).reduce((s, h) => s + h.count, 0);
  const t = c.totals;
  const titles = count(c.honors.club, (l) => l.includes('Title'));
  const cont = count(c.honors.club, (l) => l.includes('Winner'));
  const cups = count(c.honors.club, (l) => l.endsWith('Cup'));
  const ballons = count(c.honors.individual, (l) => l.includes('Ballon'));
  const boots = count(c.honors.individual, (l) => l.includes('Golden Boot'));
  const otherInd = count(c.honors.individual, (l) => !l.includes('Ballon') && !l.includes('Golden Boot'));
  const wc = count(c.honors.national, (l) => l.includes('World Cup'));
  const natCont = count(c.honors.national, (l) => !l.includes('World Cup'));
  const score = t.apps * 0.3 + t.goals * 1.0 + t.assists * 0.7 + t.caps * 0.8 + t.intlGoals * 1.2 + t.motm * 0.5 +
    titles * 18 + cups * 6 + cont * 34 + otherInd * 8 + boots * 15 + ballons * 90 + natCont * 40 + wc * 75 + c.peakOvr * 2;
  let tier: string; let blurb: string;
  if (score >= 2700) { tier = 'Immortal'; blurb = 'Spoken of in the same breath as the greatest ever to play.'; }
  else if (score >= 1700) { tier = 'Icon'; blurb = 'A global icon who defined an era.'; }
  else if (score >= 1000) { tier = 'Legend'; blurb = 'A bona fide legend, adored wherever the game is played.'; }
  else if (score >= 600) { tier = 'Club Hero'; blurb = 'A beloved figure whose shirt still hangs in the stands.'; }
  else if (score >= 300) { tier = 'Solid Pro'; blurb = 'A dependable professional with a respectable career.'; }
  else { tier = 'Journeyman'; blurb = 'A grafter who lived the dream, if only for a while.'; }
  return { score: Math.round(score), tier, blurb };
}

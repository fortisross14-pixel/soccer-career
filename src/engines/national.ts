import type { Career, Fixture } from '../game/types';
import { getCountry } from '../data/countries';
import { INTL_BREAKS, TOURNAMENT_DAYS, makeFixture, nationalOpponent, nationalTournament } from './calendar';
import { matchOverall } from './overall';
import { natRole, ROLE_LABEL } from './match';
import { chance, clamp, noise } from './util';
import { addHonor } from './awards';
import { addPack } from './cards';

const natId = (c: Career) => `nat:${c.player.country}`;

function selected(c: Career, margin: number): boolean {
  const p = c.player;
  if (p.age < 17) return false;
  if (p.injury && p.injury.year === c.year && p.injury.untilDay > c.month * 30 + 10) return false;
  const str = getCountry(p.country).nationalStrength;
  const score = matchOverall(p) + (p.form - 6.8) * 3 + p.reputation * 0.04 + noise() * 2;
  return score >= str - margin;
}

export function nationalStatus(c: Career): string {
  const str = getCountry(c.player.country).nationalStrength;
  return ROLE_LABEL[natRole(matchOverall(c.player), str)];
}

/** international break: maybe a call-up with two matches */
export function nationalCallUp(c: Career): string[] {
  const days = INTL_BREAKS[c.month];
  if (!days || !c.season) return [];
  if (!selected(c, 6)) {
    if (c.national.debutAge !== null) c.national.status = 'Left out';
    return c.national.debutAge !== null ? [`Not included in the ${c.player.country} squad this international break.`] : [];
  }
  const qual = nationalTournament(c.year + 1, c.player.country) === 'World Cup' ? 'World Cup Qualifier' : nationalTournament(c.year + 1, c.player.country) ? 'Continental Qualifier' : 'Nations League';
  days.forEach((day, i) => {
    c.season!.fixtures.push(makeFixture({ day, comp: 'national', compName: i === 0 && chance(0.35) ? 'International Friendly' : qual, stage: 'International break', usId: natId(c), oppId: nationalOpponent(c.player.country, false), home: i % 2 === 0 }));
  });
  c.season.fixtures.sort((a, b) => a.day - b.day);
  c.national.status = nationalStatus(c);
  return [`📣 Called up by ${c.player.country}! (${c.national.status})`];
}

export function setupTournament(c: Career): string[] {
  const name = nationalTournament(c.year, c.player.country);
  if (!name || !c.season) return [];
  const str = getCountry(c.player.country).nationalStrength;
  const qualified = chance(clamp(0.55 + (str - 74) / 28, 0.35, 0.97));
  c.season.natTournament = { name, alive: qualified, qualified };
  if (!qualified) return [`${c.player.country} failed to qualify for the ${name}.`];
  if (!selected(c, 5)) return [`${c.player.country} qualified for the ${name}, but you weren't in the squad.`];
  for (let i = 0; i < 3; i++) {
    c.season.fixtures.push(makeFixture({ day: TOURNAMENT_DAYS[i], comp: 'national', compName: name, stage: `Group · MD${i + 1}`, usId: natId(c), oppId: nationalOpponent(c.player.country, i === 0), home: false }));
  }
  c.season.fixtures.sort((a, b) => a.day - b.day);
  return [`🌍 Selected for the ${name} with ${c.player.country}!`];
}

function koStages(name: string): string[] {
  return name === 'World Cup' ? ['Round of 16', 'Quarter-final', 'Semi-final', 'Final'] : ['Quarter-final', 'Semi-final', 'Final'];
}

/** progress the tournament after one of our matches; returns news */
export function afterTournamentMatch(c: Career, fx: Fixture): string[] {
  const t = c.season?.natTournament;
  if (!t || fx.compName !== t.name || !c.season) return [];
  const news: string[] = [];
  const stages = koStages(t.name);
  const ours = c.season.fixtures.filter((f) => f.compName === t.name);
  const push = (stage: string) => {
    const idx = stages.indexOf(stage);
    const day = TOURNAMENT_DAYS[TOURNAMENT_DAYS.length - stages.length + idx];
    c.season!.fixtures.push(makeFixture({ day, comp: 'national', compName: t.name, stage, usId: fx.usId, oppId: nationalOpponent(c.player.country, idx >= 1), home: false }));
    c.season!.fixtures.sort((a, b) => a.day - b.day);
  };
  if (fx.stage === 'Group · MD3') {
    const pts = ours.filter((f) => f.stage.startsWith('Group')).reduce((s, f) => s + ((f.usGoals ?? 0) > (f.oppGoals ?? 0) ? 3 : f.usGoals === f.oppGoals ? 1 : 0), 0);
    const through = pts >= 6 || (pts >= 4 && chance(0.8)) || (pts === 3 && chance(0.35));
    if (through) { news.push(`${c.player.country} advance from the group (${pts} pts).`); push(stages[0]); }
    else { t.alive = false; news.push(`${c.player.country} are knocked out in the group stage (${pts} pts).`); }
  } else if (!fx.stage.startsWith('Group')) {
    const won = (fx.usGoals ?? 0) > (fx.oppGoals ?? 0) || fx.penalties?.startsWith('W');
    if (!won) { t.alive = false; news.push(`${c.player.country} are eliminated in the ${fx.stage}.`); }
    else if (fx.stage === 'Final') {
      t.alive = false;
      c.season.honors.push(`${t.name} Winner`);
      addHonor(c.honors.national, `${t.name} Winner`);
      addPack(c, 'elite', `${t.name} Winner`);
      news.push(`🏆 ${c.player.country} WIN THE ${t.name.toUpperCase()}!`);
    } else push(stages[stages.indexOf(fx.stage) + 1]);
  }
  return news;
}

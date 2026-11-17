import { useState } from 'react';
import { OppCrest } from '../Crest';
import { useGame } from '../../game/store';
import type { CompKind, Division, Fixture, SeasonState } from '../../game/types';
import { sortedTable } from '../../engines/calendar';
import { teamName } from '../../engines/teams';
import { leagueClubs, swapCount, tierLabel } from '../../engines/world';
import { GROUP_LABEL, groupOf, raceProgress, raceRows, type Race } from '../../engines/races';
import { ordinal } from '../../engines/awards';
import { maxDivision } from '../../data/countries';
import { fmtDay } from '../../engines/util';
import { CompBadge, EmptyState, RatingBadge, ResultPill, SectionTitle, SubTabs } from '../ui';
import { involvementLine, oppLabel } from '../format';

type CompTab = CompKind;

export default function Competitions() {
  const { career } = useGame();
  const s = career?.season;
  const tabs: { id: CompTab; label: string }[] = [];
  if (s) {
    tabs.push({ id: 'league', label: s.leagueName });
    if (s.fixtures.some((f) => f.comp === 'cup')) tabs.push({ id: 'cup', label: `${s.country} Cup` });
    if (s.contKey !== 'none') tabs.push({ id: 'continental', label: s.contName });
    if (s.fixtures.some((f) => f.comp === 'national')) tabs.push({ id: 'national', label: career!.player.country });
  }
  const [tab, setTab] = useState<CompTab>('league');
  if (!career || !s) return <div className="panel p-5"><EmptyState>No competitions yet. Sign with an academy or a club first.</EmptyState></div>;
  const current = tabs.some((t) => t.id === tab) ? tab : 'league';
  const races = (s.races ?? []).filter((r) => r.comp === current);

  return (
    <div>
      <SubTabs tabs={tabs} value={current} onChange={setTab} />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 animate-fade-up" key={current}>
        <div className="min-w-0">
          {current === 'league' && <LeagueTable s={s} />}
          {current !== 'league' && <CompFixtures s={s} comp={current} />}
        </div>
        <RacePanel races={races} s={s} />
      </div>
    </div>
  );
}

function LeagueTable({ s }: { s: SeasonState }) {
  const { career } = useGame();
  const c = career!;
  const rows = sortedTable(s.table);
  const n = rows.length;
  const d = s.division;
  const maxD = maxDivision(s.country);
  const promo = !s.youth && d > 1 ? swapCount(leagueClubs(c, s.country, (d - 1) as Division).length, n) : 0;
  const releg = !s.youth && d < maxD ? swapCount(n, leagueClubs(c, s.country, (d + 1) as Division).length) : 0;
  const cl = !s.youth && d === 1 ? Math.max(1, Math.round(n / 4)) : 0;
  const el = !s.youth && d === 1 ? Math.round(n / 2.4) : 0;
  const zone = (i: number) => (i < promo ? 'bg-[#3fcf7f]' : i < cl ? 'bg-sky' : i < el ? 'bg-[#ffa53f]' : i >= n - releg ? 'bg-red' : 'bg-transparent');
  return (
    <section className="panel p-5">
      <SectionTitle title={s.leagueName} kicker={`${s.youth ? 'Youth league' : tierLabel(d)} · matchday ${s.roundsPlayed}/${s.rounds.length}`} />
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm min-w-[360px]">
          <thead><tr className="text-[10px] uppercase tracking-wider text-muted font-black">
            <th className="w-2" /><th className="text-left px-2 py-2 w-8">#</th><th className="text-left">Club</th><th className="w-8">P</th><th className="w-10">GD</th><th className="w-10">Pts</th><th className="w-24 hidden sm:table-cell">Form</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.clubId} className={`border-t border-ink/10 ${r.clubId === s.clubId ? 'bg-sun font-extrabold' : ''}`}>
                <td className="p-0"><div className={`w-1.5 h-7 ${zone(i)}`} /></td>
                <td className="px-2 py-1.5 stat-num text-muted">{i + 1}</td>
                <td className="truncate max-w-[170px] font-semibold"><span className="flex items-center gap-1.5"><OppCrest id={r.clubId} size={18} /><span className="truncate">{teamName(r.clubId)}</span></span></td>
                <td className="text-center stat-num">{r.p}</td>
                <td className="text-center stat-num">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</td>
                <td className="text-center stat-num">{r.pts}</td>
                <td className="hidden sm:table-cell"><div className="flex gap-0.5 justify-center">{r.form.map((x, k) => <span key={k} className={`w-4 h-4 rounded-sm text-[8px] grid place-items-center font-black border border-ink result-${x}`}>{x}</span>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold mt-3">
        {promo > 0 && <span><span className="inline-block w-2.5 h-2.5 bg-[#3fcf7f] border border-ink mr-1" />Promotion</span>}
        {cl > 0 && <span><span className="inline-block w-2.5 h-2.5 bg-sky border border-ink mr-1" />Top continental</span>}
        {el > 0 && <span><span className="inline-block w-2.5 h-2.5 bg-[#ffa53f] border border-ink mr-1" />Second continental</span>}
        {releg > 0 && <span><span className="inline-block w-2.5 h-2.5 bg-red border border-ink mr-1" />Relegation</span>}
      </div>
    </section>
  );
}

function CompFixtures({ s, comp }: { s: SeasonState; comp: CompKind }) {
  const { career, openMatch } = useGame();
  const fx: Fixture[] = s.fixtures.filter((f) => f.comp === comp).sort((a, b) => a.day - b.day);
  const played = fx.filter((f) => f.played);
  const status = comp === 'cup' ? (s.honors.some((h) => h.endsWith('Cup')) ? 'Winners 🏆' : s.cupAlive ? 'Still in' : 'Knocked out')
    : comp === 'continental' ? (s.honors.some((h) => h.includes(s.contName)) ? 'Winners 🏆' : s.contAlive ? 'Still in' : 'Knocked out')
    : s.natTournament ? (!s.natTournament.qualified ? `${s.natTournament.name}: did not qualify` : s.honors.some((h) => h.includes(s.natTournament!.name)) ? `${s.natTournament.name} winners 🏆` : s.natTournament.alive ? `${s.natTournament.name}: playing` : `${s.natTournament.name}: out`) : `${played.filter((f) => (f.report?.minutes ?? 0) > 0).length} caps this season`;
  const groupPts = comp === 'continental' ? fx.filter((f) => f.played && f.stage.startsWith('Group')).reduce((a, f) => a + ((f.usGoals ?? 0) > (f.oppGoals ?? 0) ? 3 : f.usGoals === f.oppGoals ? 1 : 0), 0) : null;
  const title = comp === 'cup' ? `${s.country} Cup` : comp === 'continental' ? s.contName : `${career!.player.country} national team`;
  return (
    <section className="panel p-5">
      <SectionTitle title={title} kicker={status} right={groupPts !== null ? <span className="sticker-flat px-2 py-1 text-xs font-bold">Group: {groupPts} pts</span> : undefined} />
      {fx.length === 0 ? <EmptyState>No fixtures yet.</EmptyState> : (
        <div className="space-y-2">
          {fx.map((f) => (
            <button key={f.id} disabled={!f.played} onClick={() => openMatch(f.id)} className="w-full sticker-flat flex items-center gap-3 px-3 py-2 text-sm text-left row-hover disabled:cursor-default">
              <span className="stat-num text-[11px] w-14 shrink-0 text-muted">{fmtDay(f.day, career!.year).split(' ').slice(0, 2).join(' ')}</span>
              <CompBadge fx={f} />
              <OppCrest id={f.oppId} /><span className="flex-1 min-w-0"><span className="block truncate font-bold">{oppLabel(f)}</span><span className="block text-[10px] text-muted font-semibold">{f.stage}{f.played ? ` · ${involvementLine(f)}` : ''}</span></span>
              <ResultPill fx={f} />
              <span className="w-10 text-right">{f.played ? <RatingBadge value={f.report?.rating ?? null} /> : null}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function RacePanel({ races, s }: { races: Race[]; s: SeasonState }) {
  const { career } = useGame();
  const c = career!;
  const mine = groupOf(c.player.position);
  const notMineR = (r: Race) => !!r.group && r.group !== mine && !(r.stat === 'cleanSheets' && mine === 'DEF');
  const ordered = [...races].sort((a, b) => Number(a.kind === 'stat') - Number(b.kind === 'stat') || Number(notMineR(a)) - Number(notMineR(b)));
  const [sel, setSel] = useState<string | null>(null);
  const [per90, setPer90] = useState(false);
  if (!races.length) return <section className="panel p-5 h-fit"><SectionTitle title="Awards race" /><EmptyState>No individual awards here this season.</EmptyState></section>;
  const race = ordered.find((r) => r.id === sel) ?? ordered[0];
  const show90 = per90 && race.kind === 'stat' && race.stat !== 'cleanSheets';
  const { rows, myRank, eligible } = raceRows(c, s, race, c.month * 30, show90);
  const prog = raceProgress(race, c.month * 30);
  const STAT_SHORT: Record<string, string> = { assists: 'Assists', tackles: 'Tackles', dribbles: 'Dribbles', cleanSheets: 'Clean sheets' };
  const short = (r: Race) => (r.kind === 'stat' ? STAT_SHORT[r.stat!] : r.group ? GROUP_LABEL[r.group] : r.kind === 'goals' ? 'Top scorer' : r.id.endsWith('mvp') ? 'MVP' : 'Best');
  const fmt = (v: number) => (race.kind === 'rating' || show90 ? (v ? v.toFixed(2) : '—') : String(v));
  const notMine = (r: Race) => !!r.group && r.group !== mine && !(r.stat === 'cleanSheets' && mine === 'DEF');
  const top = rows.slice(0, 5);
  const meRow = myRank && myRank > 5 ? rows[myRank - 1] : null;
  return (
    <section className="panel p-5 h-fit">
      <SectionTitle title="Awards race" kicker={prog >= 1 ? 'Final' : prog <= 0 ? 'Not started' : `${Math.round(prog * 100)}% played`} />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ordered.map((r) => <button key={r.id} onClick={() => setSel(r.id)} className={`chip !px-2 !py-1 ${r.id === race.id ? 'chip-on' : ''} ${notMine(r) ? 'opacity-60' : ''} ${r.kind === 'stat' ? '!bg-bone' : ''}`}>{r.kind === 'stat' ? '📊 ' : ''}{short(r)}</button>)}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="font-display uppercase text-sm flex-1">{race.label}</div>
        {race.kind === 'stat' && race.stat !== 'cleanSheets' && (
          <div className="flex border-2 border-ink rounded-md overflow-hidden text-[10px] font-black uppercase">
            <button className={`px-2 py-0.5 ${!per90 ? 'bg-ink text-bone' : ''}`} onClick={() => setPer90(false)}>Total</button>
            <button className={`px-2 py-0.5 ${per90 ? 'bg-ink text-bone' : ''}`} onClick={() => setPer90(true)}>Per 90</button>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        {top.map((r, i) => <RaceLine key={r.name + i} rank={i + 1} name={r.name} team={r.team} value={fmt(r.value)} me={r.me} />)}
        {meRow && <><div className="text-center text-muted text-xs font-black">⋯</div><RaceLine rank={null} name={meRow.name} team={meRow.team} value={fmt(meRow.value)} me /></>}
      </div>
      <p className="text-[11px] text-muted font-semibold mt-3">
        {race.kind === 'stat' ? (notMine(race) ? 'For goalkeepers and defenders.' : show90 && !eligible ? 'Per 90 counts once you have played 30% of the league minutes so far.' : `${show90 ? 'Per 90 minutes' : 'Season total'} in league games. A ranking only, no award.`)
          : race.group && race.group !== mine ? `This race is for ${GROUP_LABEL[race.group].toLowerCase()}s. You compete as a ${GROUP_LABEL[mine].toLowerCase()}.`
          : race.kind === 'rating' ? `Average match rating${race.minApps ? ` · needs ${race.minApps}+ rated games to qualify` : ''}.${!eligible ? ' You need more games to qualify.' : myRank && myRank > 1 ? ` Gap to the top: ${(rows[0].value - (rows[myRank - 1]?.value ?? 0)).toFixed(2)}.` : ''}`
          : `Goals in this competition.${myRank && myRank > 1 ? ` You are ${ordinal(myRank)}, ${rows[0].value - (rows[myRank - 1]?.value ?? 0)} behind.` : ''}`}
      </p>
    </section>
  );
}

function RaceLine({ rank, name, team, value, me }: { rank: number | null; name: string; team: string; value: string; me?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${me ? 'bg-sun border-2 border-ink font-extrabold shadow-[3px_3px_0_#121212]' : 'sticker-flat'}`}>
      <span className="stat-num w-6 text-muted">{rank ?? '–'}</span>
      <span className="flex-1 min-w-0"><span className="block truncate">{name}</span><span className="block text-[10px] text-muted font-semibold truncate">{team}</span></span>
      <span className="stat-num text-lg">{value}</span>
    </div>
  );
}

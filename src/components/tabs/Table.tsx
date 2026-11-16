import { useGame } from '../../game/store';
import { scorerTable, sortedTable } from '../../engines/calendar';
import { teamName } from '../../engines/teams';
import { leagueClubs, swapCount, tierLabel } from '../../engines/world';
import { ordinal } from '../../engines/awards';
import { maxDivision } from '../../data/countries';
import type { Division } from '../../game/types';
import { EmptyState, SectionTitle } from '../ui';

export default function Table() {
  const { career } = useGame();
  const c = career;
  const s = c?.season;
  if (!c || !s) return <div className="panel p-5"><EmptyState>No league yet. Sign with a club first.</EmptyState></div>;
  const rows = sortedTable(s.table);
  const n = rows.length;
  const d = s.division;
  const maxD = maxDivision(s.country);
  const promo = d > 1 ? swapCount(leagueClubs(c, s.country, (d - 1) as Division).length, n) : 0;
  const releg = d < maxD ? swapCount(n, leagueClubs(c, s.country, (d + 1) as Division).length) : 0;
  const cl = d === 1 ? Math.max(1, Math.round(n / 4)) : 0;
  const el = d === 1 ? Math.round(n / 2.4) : 0;
  const zone = (i: number) => (i < promo ? 'bg-[#3fcf7f]' : i < cl ? 'bg-sky' : i < el ? 'bg-[#ffa53f]' : i >= n - releg ? 'bg-red' : 'bg-transparent');
  const race = scorerTable(s, c.player.name);
  const cupStatus = s.cupAlive ? 'Still in' : s.honors.some((h) => h.endsWith('Cup')) ? 'Winners 🏆' : s.fixtures.some((f) => f.comp === 'cup') ? 'Knocked out' : 'Not entered';
  const contStatus = s.contKey === 'none' ? null : s.contAlive ? 'Still in' : s.honors.some((h) => h.includes(s.contName)) ? 'Winners 🏆' : 'Knocked out';

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
      <section className="panel p-5 min-w-0">
        <SectionTitle title={s.leagueName} kicker={`${tierLabel(d)} · matchday ${s.roundsPlayed}/${s.rounds.length}`} />
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted font-black">
                <th className="w-2" /><th className="text-left px-2 py-2 w-8">#</th><th className="text-left">Club</th>
                <th className="w-8">P</th><th className="w-10">GD</th><th className="w-10">Pts</th><th className="w-24 hidden sm:table-cell">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const me = r.clubId === s.clubId;
                return (
                  <tr key={r.clubId} className={`border-t border-ink/10 ${me ? 'bg-sun font-extrabold' : ''}`}>
                    <td className="p-0"><div className={`w-1.5 h-7 ${zone(i)}`} /></td>
                    <td className="px-2 py-1.5 stat-num text-muted">{i + 1}</td>
                    <td className="truncate max-w-[170px] font-semibold">{teamName(r.clubId)}</td>
                    <td className="text-center stat-num">{r.p}</td>
                    <td className="text-center stat-num">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</td>
                    <td className="text-center stat-num">{r.pts}</td>
                    <td className="hidden sm:table-cell"><div className="flex gap-0.5 justify-center">{r.form.map((x, k) => <span key={k} className={`w-4 h-4 rounded-sm text-[8px] grid place-items-center font-black border border-ink result-${x}`}>{x}</span>)}</div></td>
                  </tr>
                );
              })}
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

      <div className="space-y-6">
        <section className="panel p-5">
          <SectionTitle title="Golden Boot race" kicker={race.myRank === 1 && s.stats.leagueGoals > 0 ? 'You lead!' : `You are ${ordinal(race.myRank)}`} />
          <div className="space-y-1.5">
            {race.rows.slice(0, 8).map((r, i) => (
              <div key={r.name + i} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${r.me ? 'bg-sun border-2 border-ink font-extrabold shadow-[3px_3px_0_#121212]' : 'sticker-flat'}`}>
                <span className="stat-num w-5 text-muted">{i + 1}</span>
                <span className="flex-1 min-w-0"><span className="block truncate">{r.name}</span><span className="block text-[10px] text-muted font-semibold truncate">{teamName(r.clubId)}</span></span>
                <span className="stat-num text-lg">{r.goals}</span>
              </div>
            ))}
            {race.myRank > 8 && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm bg-sun border-2 border-ink font-extrabold">
                <span className="stat-num w-5">{race.myRank}</span><span className="flex-1">{c.player.name}</span><span className="stat-num text-lg">{s.stats.leagueGoals}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted font-semibold mt-3">League goals only. Finish top to win the {s.leagueName} Golden Boot.</p>
        </section>
        <section className="panel p-5">
          <SectionTitle title="Cups" />
          <div className="space-y-2 text-sm font-semibold">
            <div className="flex justify-between gap-2"><span>{s.country} Cup</span><span className="tag tag-white">{cupStatus}</span></div>
            {contStatus && <div className="flex justify-between gap-2"><span>{s.contName}</span><span className="tag tag-white">{contStatus}</span></div>}
            {s.natTournament && <div className="flex justify-between gap-2"><span>{s.natTournament.name}</span><span className="tag tag-white">{!s.natTournament.qualified ? 'Did not qualify' : s.honors.some((h) => h.includes(s.natTournament!.name)) ? 'Winners 🏆' : s.natTournament.alive ? 'Playing' : 'Finished'}</span></div>}
          </div>
        </section>
      </div>
    </div>
  );
}

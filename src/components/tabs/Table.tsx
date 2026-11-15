import { useGame } from '../../game/store';
import { sortedTable } from '../../engines/calendar';
import { teamName } from '../../engines/teams';
import { CLUB_MAP } from '../../data/clubs';
import { EmptyState, SectionTitle } from '../ui';

export default function Table() {
  const { career } = useGame();
  const s = career?.season;
  if (!s) return <EmptyState>No league yet.</EmptyState>;
  const rows = sortedTable(s.table);
  const n = rows.length;
  const cl = s.division === 1 ? Math.max(1, Math.round(n / 4)) : 0;
  const el = s.division === 1 ? Math.round(n / 2.4) : 0;
  const cupStatus = s.cupAlive ? 'Still in' : s.honors.some((h) => h.endsWith('Cup')) ? 'Winners 🏆' : s.fixtures.some((f) => f.comp === 'cup') ? 'Eliminated' : 'Not entered';
  const contStatus = s.contKey === 'none' ? null : s.contAlive ? 'Still in' : s.honors.some((h) => h.includes(s.contName)) ? 'Winners 🏆' : 'Eliminated';

  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
      <section className="panel p-5 min-w-0">
        <SectionTitle kicker={`Matchday ${s.roundsPlayed} / ${s.rounds.length}`} title={s.leagueName} />
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[460px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted">
                <th className="text-left px-2 py-2 w-8">#</th><th className="text-left">Club</th>
                <th className="w-8">P</th><th className="w-8">W</th><th className="w-8">D</th><th className="w-8">L</th><th className="w-12">GD</th><th className="w-10">Pts</th><th className="w-24 hidden sm:table-cell">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const me = r.clubId === s.clubId;
                const zone = i < cl ? 'border-l-sky' : i < el ? 'border-l-orange' : 'border-l-transparent';
                return (
                  <tr key={r.clubId} className={`border-t border-line/50 ${me ? 'bg-lime/10 text-lime font-semibold' : ''}`}>
                    <td className={`px-2 py-1.5 stat-num text-muted border-l-2 ${zone}`}>{i + 1}</td>
                    <td className="truncate max-w-[160px]">{teamName(r.clubId)} <span className="text-[10px] text-muted stat-num">{CLUB_MAP[r.clubId]?.rating}</span></td>
                    <td className="text-center stat-num">{r.p}</td><td className="text-center stat-num">{r.w}</td><td className="text-center stat-num">{r.d}</td><td className="text-center stat-num">{r.l}</td>
                    <td className="text-center stat-num">{r.gf - r.ga > 0 ? '+' : ''}{r.gf - r.ga}</td>
                    <td className="text-center stat-num">{r.pts}</td>
                    <td className="hidden sm:table-cell"><div className="flex gap-0.5 justify-center">{r.form.map((x, k) => <span key={k} className={`w-3.5 h-3.5 rounded-sm text-[8px] grid place-items-center font-black result-${x}`}>{x}</span>)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {s.division === 1 && <div className="flex gap-4 text-[11px] text-muted mt-3"><span><span className="inline-block w-2 h-2 bg-sky mr-1" />Top continental</span><span><span className="inline-block w-2 h-2 bg-orange mr-1" />Second-tier continental</span></div>}
      </section>
      <section className="panel p-5 h-fit">
        <SectionTitle kicker="Competitions" title="Cups" />
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span>{s.country} Cup</span><span className="text-muted">{cupStatus}</span></div>
          {contStatus && <div className="flex justify-between"><span>{s.contName}</span><span className="text-muted">{contStatus}</span></div>}
          {s.natTournament && <div className="flex justify-between"><span>{s.natTournament.name}</span><span className="text-muted">{!s.natTournament.qualified ? 'Did not qualify' : s.honors.some((h) => h.includes(s.natTournament!.name)) ? 'Winners 🏆' : s.natTournament.alive ? 'Playing' : 'Finished'}</span></div>}
        </div>
      </section>
    </div>
  );
}

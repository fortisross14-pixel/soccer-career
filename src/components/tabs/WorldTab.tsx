import { useState } from 'react';
import { useGame } from '../../game/store';
import { getCountry } from '../../data/countries';
import { CLUB_MAP } from '../../data/clubs';
import { POSITION_MAP } from '../../data/positions';
import { allTime, ballonRace } from '../../engines/stars';
import { leagueRepFor } from '../../engines/world';
import { playerOverall } from '../../engines/overall';
import { seasonLabel } from '../../engines/month';
import { ordinal } from '../../engines/awards';
import { clamp } from '../../engines/util';
import { EmptyState, SectionTitle, SubTabs } from '../ui';

type Board = 'ballons' | 'titles' | 'goals';

function Row({ rank, name, sub, value, me }: { rank: number; name: string; sub?: string; value: string | number; me?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${me ? 'bg-sun border-2 border-ink font-extrabold shadow-[3px_3px_0_#121212]' : 'sticker-flat'}`}>
      <span className="stat-num w-6 text-muted">{rank}</span>
      <span className="flex-1 min-w-0"><span className="block truncate">{name}</span>{sub && <span className="block text-[10px] text-muted font-semibold truncate">{sub}</span>}</span>
      <span className="stat-num">{value}</span>
    </div>
  );
}

function TopList<T>({ rows, isMe, render, limit = 10 }: { rows: T[]; isMe: (r: T) => boolean; render: (r: T, rank: number) => React.ReactNode; limit?: number }) {
  const myIdx = rows.findIndex(isMe);
  return (
    <div className="space-y-1.5">
      {rows.slice(0, limit).map((r, i) => <div key={i}>{render(r, i + 1)}</div>)}
      {myIdx >= limit && <><div className="text-center text-muted text-xs font-black">⋯</div>{render(rows[myIdx], myIdx + 1)}</>}
    </div>
  );
}

export default function WorldTab() {
  const { career } = useGame();
  const [board, setBoard] = useState<Board>('titles');
  const [view, setView] = useState<'race' | 'years' | 'alltime' | 'best'>('race');
  if (!career) return null;
  const c = career;
  const p = c.player;
  const s = c.season;
  const st = s?.stats;
  const rep = s ? leagueRepFor(getCountry(s.country).leagueRep, s.division) : 60;
  const leagueF = s && !s.youth ? clamp((rep / 90) ** 2, 0.2, 1.1) * ([1, 0.45, 0.2][s.division - 1] ?? 0.2) : 0;
  const race = ballonRace(c, { ovr: playerOverall(p), goals: (st?.goals ?? 0) - (st?.intlGoals ?? 0), assists: (st?.assists ?? 0) - (st?.intlAssists ?? 0), leagueF, eligible: !!s && !s.youth, clubName: s?.clubName ?? '—' });
  const history = [...c.awardsHistory].reverse();
  const leaders = allTime(c, board);
  const best = [...c.stars].sort((a, b) => b.ovr - a.ovr).slice(0, 15);

  return (
    <div>
      <SubTabs tabs={[{ id: 'race', label: "Ballon d'Or race" }, { id: 'years', label: 'Awards by year' }, { id: 'alltime', label: 'All-time' }, { id: 'best', label: 'Best players' }]} value={view} onChange={setView} />
      <div className="animate-fade-up" key={view}>
        {view === 'race' && (
          <section className="panel p-5 max-w-2xl">
            <SectionTitle title="Ballon d'Or race" kicker={`${seasonLabel(c.year)} · provisional`} />
            <TopList rows={race} isMe={(r) => r.me} render={(r, i) => <Row rank={i} name={r.name} sub={`${r.clubName} · ${r.detail}`} value={r.points} me={r.me} />} />
            {!s || s.youth ? <p className="text-[11px] text-muted font-semibold mt-3">Academy players are not eligible yet.</p> : <p className="text-[11px] text-muted font-semibold mt-3">Votes reward level, goals, assists and trophies. Lower leagues count for less. Decided in June.</p>}
          </section>
        )}
        {view === 'years' && (
          <section className="panel p-5 min-w-0">
            <SectionTitle title="Awards by year" kicker="Best players of each season" />
            {history.length === 0 ? <EmptyState>The first vote happens at the end of this season.</EmptyState> : (
              <div className="overflow-x-auto -mx-1 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-[10px] uppercase tracking-wider text-muted font-black text-left">
                    <th className="px-2 py-2">Season</th><th>Ballon d'Or</th><th className="text-center">You</th><th>Golden Glove</th><th>Defender</th><th>Champions</th>
                  </tr></thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.year} className={`border-t border-ink/10 align-top ${h.ballon[0]?.me ? 'bg-sun' : ''}`}>
                        <td className="px-2 py-1.5 stat-num">{seasonLabel(h.year)}</td>
                        <td className="font-bold">{h.ballon[0]?.name}<span className="block text-[10px] text-muted font-semibold">{h.ballon[0]?.clubName}</span></td>
                        <td className="text-center stat-num">{h.myBallonRank ? ordinal(h.myBallonRank) : '—'}</td>
                        <td className={h.glove.me ? 'font-black' : 'font-semibold'}>{h.glove.name}</td>
                        <td className={h.defender.me ? 'font-black' : 'font-semibold'}>{h.defender.name}</td>
                        <td className="text-[11px] text-muted font-semibold">{h.champions.slice(0, 3).map((x) => `${x.label}: ${x.club}`).join(' · ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {view === 'alltime' && (
          <section className="panel p-5 max-w-2xl">
            <SectionTitle title="All-time leaders" right={
              <div className="flex gap-1.5">{(['titles', 'goals', 'ballons'] as Board[]).map((b) => <button key={b} className={`chip !px-2 !py-1 ${board === b ? 'chip-on' : ''}`} onClick={() => setBoard(b)}>{b === 'ballons' ? "Ballon d'Or" : b === 'titles' ? 'Titles' : 'Goals'}</button>)}</div>
            } />
            <TopList rows={leaders} isMe={(r) => r.me} render={(r, i) => <Row rank={i} name={r.name} sub={r.note} value={r.value} me={r.me} />} />
          </section>
        )}
        {view === 'best' && (
          <section className="panel p-5 max-w-2xl">
            <SectionTitle title="Best players right now" kicker="World stars" />
            <div className="space-y-1.5">
              {best.map((x, i) => <Row key={x.id} rank={i + 1} name={x.name} sub={`${POSITION_MAP[x.pos].short} · ${x.age} · ${CLUB_MAP[x.clubId]?.name} · ${x.country}${x.ballons ? ` · ${x.ballons}× Ballon` : ''}`} value={x.ovr} />)}
            </div>
            <p className="text-[11px] text-muted font-semibold mt-3">Your overall: <span className="stat-num">{playerOverall(p)}</span></p>
          </section>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useGame } from '../../game/store';
import type { Fixture, SeasonSummary } from '../../game/types';
import { STAT_DEFS, STAT_MAP, addLines, aggregate, statValue, type StatLine } from '../../engines/statline';
import { MONTHS, dayToMonth } from '../../engines/util';
import { seasonLabel } from '../../engines/month';
import { EmptyState, SectionTitle, Stat } from '../ui';

type Scope = 'all' | 'club' | 'intl';
type Grain = 'month' | 'season';

const POS_STATS: Record<string, string[]> = {
  GK: ['saves', 'conceded', 'cleanSheets', 'passAcc'],
  DEF: ['tackles', 'interceptions', 'aerials', 'cleanSheets', 'passes', 'passAcc', 'keyPasses'],
  MID: ['keyPasses', 'passes', 'passAcc', 'tackles', 'interceptions', 'shots', 'dribbles'],
  FWD: ['shots', 'onTarget', 'keyPasses', 'dribbles', 'aerials', 'passAcc'],
};
const groupFor = (pos: string) => (pos === 'GK' ? 'GK' : pos === 'CB' || pos === 'FB' ? 'DEF' : pos === 'ST' || pos === 'W' ? 'FWD' : 'MID');

function summaryLine(h: SeasonSummary, scope: Scope): StatLine {
  const club: StatLine = h.stats ?? { apps: h.apps, starts: h.starts, minutes: h.minutes, goals: h.goals, assists: h.assists, motm: h.motm, ratingSum: h.avgRating * h.apps, rated: h.apps };
  const intl: StatLine = h.intlStats ?? { apps: h.caps, goals: h.intlGoals, minutes: 0 };
  return scope === 'club' ? club : scope === 'intl' ? intl : addLines(club, intl);
}

const fmt = (id: string, v: number | null) => (v === null ? '—' : STAT_MAP[id]?.kind === 'avg' ? v.toFixed(2) : STAT_MAP[id]?.kind === 'pct' ? `${v}%` : Number.isInteger(v) ? String(v) : v.toFixed(2));

export default function PlayerStats() {
  const { career } = useGame();
  const [scope, setScope] = useState<Scope>('all');
  const [grain, setGrain] = useState<Grain>('month');
  const [metric, setMetric] = useState('goals');
  const [per90, setPer90] = useState(false);
  if (!career) return null;
  const c = career;
  const s = c.season;
  const inScope = (f: Fixture) => (scope === 'all' ? true : scope === 'club' ? f.comp !== 'national' : f.comp === 'national');
  const seasonFx = (s?.fixtures ?? []).filter(inScope);
  const season = aggregate(seasonFx);
  const careerLine = [...c.history.map((h) => summaryLine(h, scope)), season].reduce(addLines, {} as StatLine);
  const group = groupFor(c.player.position);
  const extra = POS_STATS[group];
  const tableIds = ['apps', 'starts', 'minutes', 'goals', 'assists', 'ga', 'rating', 'motm', ...extra];
  const metricIds = ['goals', 'assists', 'ga', 'minutes', 'apps', 'rating', 'motm', ...extra];

  // evolution series
  const points: { label: string; value: number | null; note?: string }[] = grain === 'month'
    ? Array.from({ length: 12 }, (_, m) => m).filter((m) => m <= c.month || seasonFx.some((f) => dayToMonth(f.day) === m && f.played))
        .map((m) => ({ label: MONTHS[m], value: statValue(aggregate(seasonFx.filter((f) => f.played && dayToMonth(f.day) === m)), metric, per90) }))
    : [...c.history.map((h) => ({ label: seasonLabel(h.year).slice(2), value: statValue(summaryLine(h, scope), metric, per90), note: h.youth ? 'youth' : undefined })), ...(s ? [{ label: `${seasonLabel(c.year).slice(2)}*`, value: statValue(season, metric, per90), note: 'in progress' }] : [])];

  const perGoal = season.goals ? Math.round(season.minutes / season.goals) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'club', 'intl'] as Scope[]).map((x) => <button key={x} className={`chip ${scope === x ? 'chip-on' : ''}`} onClick={() => setScope(x)}>{x === 'all' ? 'All matches' : x === 'club' ? 'Club' : 'National team'}</button>)}
      </div>

      <section className="panel p-5">
        <SectionTitle title="This season" kicker={s ? `${seasonLabel(c.year)} · ${s.clubName}` : 'No season'} />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Stat label="Matches" value={season.apps} sub={`${season.starts} starts`} />
          <Stat label="Minutes" value={season.minutes} sub={season.apps ? `${Math.round(season.minutes / season.apps)}' per game` : undefined} />
          <Stat label="Goals" value={season.goals} sub={`${fmt('goals', statValue(season, 'goals', true))} per 90`} tone="red" />
          <Stat label="Assists" value={season.assists} sub={`${fmt('assists', statValue(season, 'assists', true))} per 90`} />
          <Stat label="G + A" value={season.goals + season.assists} sub={`${fmt('ga', statValue(season, 'ga', true))} per 90`} tone="sun" />
          <Stat label="Avg rating" value={fmt('rating', statValue(season, 'rating'))} />
          <Stat label="MOTM" value={season.motm} />
          <Stat label="Mins / goal" value={perGoal ?? '—'} />
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <section className="panel p-5 min-w-0">
          <SectionTitle title="Evolution" kicker={`${STAT_MAP[metric]?.label}${per90 && STAT_MAP[metric]?.per90 ? ' per 90' : ''}`} right={
            <div className="flex gap-1.5">
              <button className={`chip !px-2 !py-1 ${grain === 'month' ? 'chip-on' : ''}`} onClick={() => setGrain('month')}>By month</button>
              <button className={`chip !px-2 !py-1 ${grain === 'season' ? 'chip-on' : ''}`} onClick={() => setGrain('season')}>By season</button>
            </div>
          } />
          <div className="flex flex-wrap gap-1.5 mb-3">
            {metricIds.map((id) => <button key={id} className={`chip !px-2 !py-1 !text-[11px] ${metric === id ? 'chip-on' : ''}`} onClick={() => setMetric(id)}>{STAT_MAP[id].label}</button>)}
            {STAT_MAP[metric]?.per90 && <button className={`chip !px-2 !py-1 !text-[11px] ${per90 ? 'chip-on' : ''}`} onClick={() => setPer90((v) => !v)}>Per 90</button>}
          </div>
          {points.length === 0 ? <EmptyState>No data yet.</EmptyState> : <BarChart points={points} format={(v) => fmt(metric, v)} />}
          <p className="text-[11px] text-muted font-semibold mt-2">{grain === 'month' ? 'This season, month by month.' : 'Season by season. * season in progress; academy seasons are youth football.'}</p>
        </section>

        <section className="panel p-5 min-w-0">
          <SectionTitle title="Totals & per 90" kicker={STAT_DEFS.find((d) => d.id === metric) ? 'Season vs career' : ''} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[10px] uppercase tracking-wider text-muted font-black"><th className="text-left py-1">Stat</th><th className="text-right">Season</th><th className="text-right">/90</th><th className="text-right">Career</th><th className="text-right">/90</th></tr></thead>
              <tbody>
                {tableIds.map((id) => (
                  <tr key={id} className={`border-t border-ink/10 cursor-pointer ${metric === id ? 'bg-sun' : 'row-hover'}`} onClick={() => setMetric(id)}>
                    <td className="py-1.5 font-semibold">{STAT_MAP[id].label}</td>
                    <td className="text-right stat-num">{fmt(id, statValue(season, id))}</td>
                    <td className="text-right stat-num text-muted">{STAT_MAP[id].per90 ? fmt(id, statValue(season, id, true)) : ''}</td>
                    <td className="text-right stat-num">{fmt(id, statValue(careerLine, id))}</td>
                    <td className="text-right stat-num text-muted">{STAT_MAP[id].per90 ? fmt(id, statValue(careerLine, id, true)) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted font-semibold mt-2">Tap a row to chart it. Career totals include academy football.</p>
        </section>
      </div>
    </div>
  );
}

function BarChart({ points, format }: { points: { label: string; value: number | null; note?: string }[]; format: (v: number | null) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640; const H = 220; const padL = 34; const padB = 26; const padT = 16;
  const vals = points.map((p) => p.value ?? 0);
  const max = Math.max(1, ...vals);
  const niceMax = max <= 5 ? Math.ceil(max) : max <= 10 ? Math.ceil(max / 2) * 2 : Math.ceil(max / 5) * 5;
  const innerW = W - padL - 8;
  const innerH = H - padT - padB;
  const slot = innerW / points.length;
  const bw = Math.max(6, Math.min(36, slot - 6));
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;
  const ticks = [0, niceMax / 2, niceMax];
  const showEvery = Math.ceil(points.length / 14);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Stat evolution chart" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} stroke="#121212" strokeOpacity={t === 0 ? 0.8 : 0.12} strokeWidth={t === 0 ? 2 : 1} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5b6259" fontFamily="IBM Plex Mono, monospace">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = padL + slot * i + (slot - bw) / 2;
          const v = p.value ?? 0;
          const top = y(v);
          const h = Math.max(0, padT + innerH - top);
          const r = Math.min(4, h / 2, bw / 2);
          const d = h > 0 ? `M${x},${padT + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${padT + innerH} Z` : '';
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={innerH} fill="transparent" />
              {d && <path d={d} fill={hover === i ? '#121212' : p.note === 'in progress' ? '#ffd23f' : '#e0262f'} stroke="#121212" strokeWidth={1.5} />}
              {i % showEvery === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#5b6259" fontFamily="Archivo, sans-serif" fontWeight={700}>{p.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && points[hover] && (
        <div className="absolute top-0 pointer-events-none sticker px-2 py-1 text-xs font-bold whitespace-nowrap" style={{ left: `${((padL + slot * hover + slot / 2) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          {points[hover].label}: <span className="stat-num">{format(points[hover].value)}</span>{points[hover].note ? <span className="text-muted"> · {points[hover].note}</span> : null}
        </div>
      )}
    </div>
  );
}

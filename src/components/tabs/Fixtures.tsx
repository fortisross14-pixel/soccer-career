import { useState } from 'react';
import { useGame } from '../../game/store';
import type { Fixture } from '../../game/types';
import { MONTHS_LONG, calYear, dayToMonth } from '../../engines/util';
import { seasonLabel } from '../../engines/month';
import { CompBadge, EmptyState, RatingBadge, ResultPill } from '../ui';
import { involvementLine, oppLabel } from '../format';

export default function Fixtures() {
  const { career, openMatch } = useGame();
  const [showPast, setShowPast] = useState(false);
  if (!career) return null;
  const c = career;
  const list: Fixture[] = showPast ? c.pastFixtures : c.season?.fixtures ?? [];
  const year = showPast ? c.year - 1 : c.year;
  const byMonth = new Map<number, Fixture[]>();
  for (const f of list) {
    const m = dayToMonth(f.day);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(f);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="h-outline text-3xl sm:text-4xl">Season {seasonLabel(year)}</h2>
        {c.pastFixtures.length > 0 && (
          <div className="flex gap-1">
            <button className={`chip ${!showPast ? 'chip-on' : ''}`} onClick={() => setShowPast(false)}>This season</button>
            <button className={`chip ${showPast ? 'chip-on' : ''}`} onClick={() => setShowPast(true)}>Last season</button>
          </div>
        )}
      </div>
      {list.length === 0 && <EmptyState>No fixtures yet. Sign with a club to get your calendar.</EmptyState>}
      {[...byMonth.entries()].sort((a, b) => a[0] - b[0]).map(([m, fx]) => (
        <section key={m} className="panel overflow-hidden">
          <div className={`px-4 py-2 text-xs font-bold uppercase tracking-[.14em] border-b border-ink ${m === c.month && !showPast ? 'text-ink' : 'text-muted'}`}>{MONTHS_LONG[m]} {calYear(year, m)}</div>
          <div className="divide-y divide-ink/15">
            {fx.sort((a, b) => a.day - b.day).map((f) => (
              <button key={f.id} disabled={!f.played} onClick={() => openMatch(f.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left row-hover disabled:opacity-60 disabled:cursor-default">
                <span className="stat-num text-xs text-muted w-6">{(f.day % 30) + 1}</span>
                <CompBadge fx={f} />
                <span className="flex-1 min-w-0">
                  <span className="truncate block">{oppLabel(f)}</span>
                  <span className="text-[11px] text-muted truncate block">{f.compName} · {f.stage}</span>
                </span>
                <span className="text-xs text-muted hidden sm:inline w-28 text-right">{involvementLine(f)}</span>
                {f.report?.motm && <span title="Man of the Match">⭐</span>}
                <ResultPill fx={f} />
                <span className="w-10 text-right">{f.played ? <RatingBadge value={f.report?.rating ?? null} /> : null}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

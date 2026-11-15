import { useGame } from '../../game/store';
import type { Intensity } from '../../game/types';
import type { TabId } from '../Game';
import { FOCUSES, INTENSITY } from '../../data/training';
import { POSITION_MAP } from '../../data/positions';
import { CARD_MAP } from '../../data/cards';
import { setTraining } from '../../engines/career';
import { currentRole } from '../../engines/match';
import { injuryRisk } from '../../engines/match';
import { sortedTable, tablePosition } from '../../engines/calendar';
import { teamName } from '../../engines/teams';
import { isWindow } from '../../engines/month';
import { ordinal } from '../../engines/awards';
import { MONTHS_LONG, fmtDay } from '../../engines/util';
import { CompBadge, Meter, RatingBadge, ResultPill, RoleBadge, SectionTitle, Stat, EmptyState } from '../ui';
import { involvementLine, oppLabel } from '../format';
import { OffersList } from './Contract';

export default function Hub({ goTo }: { goTo: (t: TabId) => void }) {
  const { career, act, openMatch } = useGame();
  if (!career) return null;
  const c = career;
  const p = c.player;
  const s = c.season;
  const start = c.month * 30;
  const upcoming = s ? s.fixtures.filter((f) => !f.played && f.day >= start && f.day < start + 30) : [];
  const recent = s ? s.fixtures.filter((f) => f.played).slice(-5).reverse() : [];
  const st = s?.stats;
  const avg = st && st.rated ? (st.ratingSum / st.rated).toFixed(2) : '—';
  const pos = s ? tablePosition(s) : 0;
  const role = p.contract ? currentRole(c) : null;
  const injured = p.injury && p.injury.year === c.year && p.injury.untilDay > start;
  const gkFocus = p.position === 'GK';

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
      <div className="space-y-5">
        {/* this month */}
        <section className="panel p-5">
          <SectionTitle kicker="This month" title={`${MONTHS_LONG[c.month]}`} right={isWindow(c.month) && !c.retired ? <button className="pill border-orange/50 text-orange" onClick={() => goTo('contract')}>Transfer window open · {c.offers.length} offers</button> : undefined} />
          {c.notices.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {c.notices.map((n, i) => <li key={i} className="text-sm rounded-md bg-white/[.03] border border-line px-3 py-2">{n}</li>)}
            </ul>
          )}
          {!p.contract && !c.retired ? (
            <div>
              <div className="text-sm text-muted mb-3">Pick a club to start your season. Compare roles carefully: minutes drive growth, form and your market value.</div>
              <OffersList />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState>No competitive fixtures this month. Training, recovery and cards carry on.</EmptyState>
          ) : (
            <div className="divide-y divide-line/60">
              {upcoming.map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="text-xs text-muted w-16 shrink-0">{fmtDay(f.day, c.year).split(' ').slice(0, 2).join(' ')}</span>
                  <CompBadge fx={f} />
                  <span className="flex-1 truncate">{oppLabel(f)}</span>
                  <span className="text-xs text-muted hidden sm:inline">{f.stage}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* recent results */}
        {recent.length > 0 && (
          <section className="panel p-5">
            <SectionTitle kicker="Latest" title="Recent matches" right={<button className="text-xs text-mint" onClick={() => goTo('fixtures')}>All matches →</button>} />
            <div className="divide-y divide-line/60">
              {recent.map((f) => (
                <button key={f.id} onClick={() => openMatch(f.id)} className="w-full flex items-center gap-3 py-2.5 text-sm text-left row-hover rounded">
                  <CompBadge fx={f} />
                  <span className="flex-1 truncate">{oppLabel(f)}</span>
                  <span className="text-xs text-muted hidden sm:inline">{involvementLine(f)}</span>
                  <ResultPill fx={f} />
                  <span className="w-10 text-right"><RatingBadge value={f.report?.rating ?? null} /></span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* training plan */}
        {!c.retired && (
          <section className="panel p-5">
            <SectionTitle kicker="Your plan" title="Training" />
            <div className="text-xs text-muted mb-2">Focus — focused attributes grow ~1.75× faster each month</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {FOCUSES.filter((f) => gkFocus || f.id !== 'Goalkeeping').map((f) => (
                <button key={f.id} title={f.desc} onClick={() => act((x) => setTraining(x, f.id, x.intensity))} className={`chip ${c.focus === f.id ? 'chip-on' : ''}`}>{f.id === 'key' ? `${POSITION_MAP[p.position].short} craft` : f.label}</button>
              ))}
            </div>
            <div className="text-xs text-muted mb-2">Intensity</div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(INTENSITY) as Intensity[]).map((k) => (
                <button key={k} onClick={() => act((x) => setTraining(x, x.focus, k))} className={`chip text-left ${c.intensity === k ? 'chip-on' : ''}`}>
                  <div>{INTENSITY[k].label}</div>
                  <div className="text-[10px] text-muted font-normal mt-0.5 leading-snug">{INTENSITY[k].desc}</div>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-muted mt-3">Injury risk per 90 minutes: <span className="stat-num text-cream">{(injuryRisk(p, 90, INTENSITY[c.intensity].injury) * 100).toFixed(1)}%</span></div>
          </section>
        )}
      </div>

      <div className="space-y-5">
        {/* condition */}
        <section className="panel p-5">
          <SectionTitle kicker="Condition" title="How you're doing" right={role ? <RoleBadge role={role} /> : undefined} />
          {injured && <div className="mb-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm">🚑 {p.injury!.name} — back around {fmtDay(p.injury!.untilDay, c.year)}</div>}
          <div className="space-y-3">
            <Meter label="Fitness" value={p.fitness} />
            <Meter label="Morale" value={p.morale} />
            <Meter label="Manager trust" value={p.trust} />
            <Meter label="Form (avg rating)" value={p.form} max={10} tone={p.form >= 7 ? 'good' : p.form >= 6.4 ? 'warn' : 'bad'} />
            <Meter label="Reputation" value={p.reputation} tone="lime" />
          </div>
          {p.boosts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.boosts.map((b) => <span key={b.uid} className="pill border-[color:var(--epic)]/50">⚡ {b.name} · {b.matchesLeft}</span>)}
            </div>
          )}
          {p.staff.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.staff.map((id) => <span key={id} className="pill">☻ {CARD_MAP[id]?.name}</span>)}</div>}
        </section>

        {/* packs CTA */}
        {c.packs.length > 0 && (
          <button onClick={() => goTo('cards')} className="w-full panel p-4 flex items-center gap-4 text-left border-lime/40 hover:border-lime transition">
            <div className="text-3xl">🎁</div>
            <div className="flex-1"><div className="font-display text-xl font-bold">{c.packs.length} pack{c.packs.length > 1 ? 's' : ''} to open</div><div className="text-xs text-muted">Skills, boosts, traits, staff — your main way to grow.</div></div>
            <span className="text-lime">→</span>
          </button>
        )}

        {/* season */}
        {s && st && (
          <section className="panel p-5">
            <SectionTitle kicker={s.leagueName} title="Season so far" right={<button className="text-xs text-mint" onClick={() => goTo('table')}>Table →</button>} />
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat label="Apps" value={st.apps} sub={`${st.starts} starts`} />
              <Stat label={p.position === 'GK' ? 'Clean sh.' : 'Goals'} value={p.position === 'GK' ? st.cleanSheets : st.goals} sub={`${st.assists} assists`} />
              <Stat label="Avg rtg" value={avg} sub={`${st.motm} MOTM`} />
            </div>
            <div className="text-xs text-muted mb-2">{s.clubName} are {s.roundsPlayed ? ordinal(pos) : '—'} after {s.roundsPlayed} of {s.rounds.length} matchdays</div>
            <MiniTable />
          </section>
        )}
      </div>
    </div>
  );
}

function MiniTable() {
  const { career } = useGame();
  const s = career!.season!;
  const rows = sortedTable(s.table);
  const idx = rows.findIndex((r) => r.clubId === s.clubId);
  const from = Math.max(0, Math.min(rows.length - 5, idx - 2));
  return (
    <div className="text-sm">
      {rows.slice(from, from + 5).map((r, i) => (
        <div key={r.clubId} className={`flex items-center gap-2 py-1 px-2 rounded ${r.clubId === s.clubId ? 'bg-lime/10 text-lime' : ''}`}>
          <span className="stat-num w-5 text-muted">{from + i + 1}</span>
          <span className="flex-1 truncate">{teamName(r.clubId)}</span>
          <span className="stat-num text-xs text-muted w-8 text-right">{r.p}</span>
          <span className="stat-num w-8 text-right">{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

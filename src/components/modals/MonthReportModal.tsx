import type { MonthReport, SkillKey } from '../../game/types';
import { useGame } from '../../game/store';
import { SKILL_MAP } from '../../data/skills';
import { PACKS } from '../../data/cards';
import { ordinal } from '../../engines/awards';
import { seasonLabel } from '../../engines/month';
import { MONTHS_LONG, calYear, fmtMoney } from '../../engines/util';
import { CompBadge, Modal, RatingBadge, ResultPill, Stat } from '../ui';
import { findFixture, involvementLine, oppLabel } from '../format';

export default function MonthReportModal({ reports }: { reports: MonthReport[] }) {
  const { career, closeReports, openMatch } = useGame();
  if (!career) return null;
  const first = reports[0];
  const last = reports[reports.length - 1];
  const fixtures = reports.flatMap((r) => r.fixtures).map((id) => findFixture(career, id)).filter((f) => !!f);
  const mine = fixtures.filter((f) => f.report && f.report.minutes > 0);
  const rated = mine.filter((f) => f.report!.rating !== null);
  const avg = rated.length ? (rated.reduce((s, f) => s + f.report!.rating!, 0) / rated.length).toFixed(2) : '—';
  const goals = mine.reduce((s, f) => s + f.report!.goals, 0);
  const assists = mine.reduce((s, f) => s + f.report!.assists, 0);
  const deltas: Partial<Record<SkillKey, number>> = {};
  for (const r of reports) for (const [k, v] of Object.entries(r.skillDeltas)) deltas[k as SkillKey] = (deltas[k as SkillKey] ?? 0) + (v as number);
  const topDeltas = Object.entries(deltas).filter(([, v]) => Math.abs(v as number) >= 0.1).sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number)).slice(0, 8);
  const packs = reports.flatMap((r) => r.packs);
  const news = reports.flatMap((r) => r.news);
  const income = reports.reduce((s, r) => s + r.income - r.costs, 0);
  const title = reports.length === 1 ? `${MONTHS_LONG[first.month]} ${calYear(first.year, first.month)}` : `${MONTHS_LONG[first.month]} – ${MONTHS_LONG[last.month]}`;
  const season = last.seasonEnd;

  return (
    <Modal onClose={closeReports} wide>
      <div className="p-5 border-b border-line flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow">{reports.length > 1 ? `${reports.length} months simulated` : 'Month review'}</div>
          <h2 className="font-display text-4xl font-extrabold mt-1">{title}</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[.16em] text-muted font-bold">Overall</div>
          <div className="stat-num text-3xl">{first.ovrBefore}{last.ovrAfter !== first.ovrBefore && <span className={last.ovrAfter > first.ovrBefore ? 'text-mint' : 'text-danger'}> → {last.ovrAfter}</span>}</div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Played" value={`${mine.length}/${fixtures.length}`} />
          <Stat label="Goals" value={goals} />
          <Stat label="Assists" value={assists} />
          <Stat label="Avg rating" value={avg} />
        </div>

        {fixtures.length > 0 && (
          <div>
            <div className="eyebrow mb-2">Matches · tap for details</div>
            <div className="divide-y divide-line/60 rounded-lg border border-line">
              {fixtures.map((f) => (
                <button key={f.id} onClick={() => openMatch(f.id)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left row-hover">
                  <CompBadge fx={f} />
                  <span className="flex-1 truncate">{oppLabel(f)}</span>
                  <span className="text-xs text-muted hidden sm:inline">{involvementLine(f)}</span>
                  {f.report?.motm && <span>⭐</span>}
                  <ResultPill fx={f} />
                  <span className="w-10 text-right"><RatingBadge value={f.report?.rating ?? null} /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div>
            <div className="eyebrow mb-2">News</div>
            <ul className="space-y-1 text-sm">{news.map((n, i) => <li key={i} className="rounded bg-white/[.03] px-3 py-1.5">{n}</li>)}</ul>
          </div>
        )}

        {season && (
          <div className="rounded-xl border border-lime/40 bg-lime/[.04] p-4">
            <div className="eyebrow mb-2">Season {seasonLabel(season.year)} complete</div>
            <div className="text-sm">{season.clubs} · {season.leaguePos ? `${ordinal(season.leaguePos)} in ${season.leagueName}` : ''}</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              <Stat label="Apps" value={season.apps} /><Stat label="Goals" value={season.goals} /><Stat label="Assists" value={season.assists} />
              <Stat label="Avg" value={season.avgRating.toFixed(2)} /><Stat label="MOTM" value={season.motm} /><Stat label="Caps" value={season.caps} />
            </div>
            {(season.honors.length > 0 || season.awards.length > 0) && <div className="text-sm mt-3">{[...season.honors.map((h) => `🏆 ${h}`), ...season.awards.map((a) => `⭐ ${a}`)].join(' · ')}</div>}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <div className="eyebrow mb-2">Development</div>
            {topDeltas.length === 0 ? <p className="text-sm text-muted">No visible change.</p> : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {topDeltas.map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted">{SKILL_MAP[k as SkillKey].label}</span><span className={`stat-num ${(v as number) > 0 ? 'text-mint' : 'text-danger'}`}>{(v as number) > 0 ? '+' : ''}{(v as number).toFixed(1)}</span></div>)}
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow mb-2">Rewards</div>
            <div className="flex flex-wrap gap-1.5">{packs.map((pk) => <span key={pk.uid} className={`pill pack-${pk.tier} !border-0 !text-[10px]`}>{PACKS[pk.tier].name} · {pk.reason}</span>)}</div>
            <div className="text-xs text-muted mt-2">Net income {fmtMoney(income)}</div>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5"><button className="btn-primary w-full py-3" onClick={closeReports}>Continue</button></div>
    </Modal>
  );
}

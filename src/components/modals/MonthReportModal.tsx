import { useEffect } from 'react';
import type { MonthReport, SkillKey } from '../../game/types';
import { useGame } from '../../game/store';
import { SKILL_MAP } from '../../data/skills';
import { PACKS } from '../../data/cards';
import { ordinal } from '../../engines/awards';
import { seasonLabel } from '../../engines/month';
import { MONTHS_LONG, calYear, fmtMoney } from '../../engines/util';
import { CompBadge, Modal, RatingBadge, ResultPill, Stat } from '../ui';
import { findFixture, involvementLine, oppLabel } from '../format';
import { fx } from '../fx';

const STAMP_ORDER: [string, string][] = [
  ['ballon1', "Ballon d'Or!"], ['natwin1', 'International champions!'], ['contwin1', 'Kings of the continent!'], ['promotop1', 'Up to the top flight!'],
  ['title1', 'Champions!'], ['boot1', 'Top scorer!'], ['topflight1', 'Top-flight debut!'], ['promo1', 'Promoted!'], ['climb1', 'Moving up!'],
  ['trophy1', 'Silverware!'], ['award1', 'Award winner!'], ['wc1', 'World Cup!'], ['cap1', 'International debut!'], ['hattrick1', 'First hat-trick!'],
  ['season20', '20-goal season!'], ['potm1', 'Player of the Month!'], ['goal1', 'First pro goal!'], ['debut', 'Pro debut!'],
];

export default function MonthReportModal({ reports }: { reports: MonthReport[] }) {
  const { career, closeReports, openMatch } = useGame();
  const first = reports[0];
  const last = reports[reports.length - 1];
  const fixtures = career ? reports.flatMap((r) => r.fixtures).map((id) => findFixture(career, id)).filter((f) => !!f) : [];
  const mine = fixtures.filter((f) => f.report && f.report.minutes > 0);
  const goals = mine.reduce((s, f) => s + f.report!.goals, 0);
  const news = reports.flatMap((r) => r.news);
  const allCoins = reports.flatMap((r) => r.coins ?? []);
  const bigOne = STAMP_ORDER.find(([id]) => allCoins.some((e) => e.milestone === id));
  const firstEverBig = bigOne && allCoins.some((e) => e.milestone === bigOne[0] && e.firstEver);

  // react to what happened: goals first, then the biggest milestone
  useEffect(() => {
    if (!career) return;
    const timers: number[] = [];
    let delay = 350;
    if (goals > 0) {
      timers.push(window.setTimeout(() => fx({ type: 'goal', text: goals >= 3 ? 'Hat-trick!' : goals === 2 ? 'Brace!' : 'Goal!', sub: `${career.player.name.split(' ').slice(-1)[0]} · ${goals} this ${reports.length > 1 ? 'run' : 'month'}` }), delay));
      delay += 2300;
    }
    if (bigOne) timers.push(window.setTimeout(() => fx({ type: 'stamp', text: firstEverBig ? `${bigOne[1]} · first ever` : bigOne[1], tone: firstEverBig ? 'red' : 'sun' }), delay));
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!career) return null;
  const rated = mine.filter((f) => f.report!.rating !== null);
  const avg = rated.length ? (rated.reduce((s, f) => s + f.report!.rating!, 0) / rated.length).toFixed(2) : '—';
  const assists = mine.reduce((s, f) => s + f.report!.assists, 0);
  const deltas: Partial<Record<SkillKey, number>> = {};
  for (const r of reports) for (const [k, v] of Object.entries(r.skillDeltas)) deltas[k as SkillKey] = (deltas[k as SkillKey] ?? 0) + (v as number);
  const topDeltas = Object.entries(deltas).filter(([, v]) => Math.abs(v as number) >= 0.1).sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number)).slice(0, 8);
  const packs = reports.flatMap((r) => r.packs);
  const coins = reports.flatMap((r) => r.coins ?? []);
  const coinTotal = coins.reduce((s, e) => s + e.amount, 0);
  const income = reports.reduce((s, r) => s + r.income - r.costs, 0);
  const title = reports.length === 1 ? `${MONTHS_LONG[first.month]} ${calYear(first.year, first.month)}` : `${MONTHS_LONG[first.month]} – ${MONTHS_LONG[last.month]}`;
  const season = last.seasonEnd;
  const cardsPlayed = reports.flatMap((r) => r.cardsPlayed ?? []);
  const trustReps = reports.map((r) => r.trust).filter((x): x is NonNullable<typeof x> => !!x);
  const trust = trustReps.length ? (() => {
    const merged: Record<string, number> = {};
    for (const t of trustReps) for (const it of t.items) merged[it.label] = (merged[it.label] ?? 0) + it.delta;
    return { start: trustReps[0].start, end: trustReps[trustReps.length - 1].end, items: Object.entries(merged).map(([label, delta]) => ({ label, delta })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)) };
  })() : null;
  const lucks = reports.map((r) => r.luck).filter((x): x is number => typeof x === 'number');
  const luck = lucks.length ? lucks.reduce((a, b) => a + b, 0) / lucks.length : null;

  return (
    <Modal onClose={closeReports} wide>
      <div className="p-5 border-b-[3px] border-ink bg-sun flex items-end justify-between gap-3">
        <div>
          <span className="tag">{reports.length > 1 ? `${reports.length} months` : 'Month review'}</span>
          <h2 className="font-display text-3xl sm:text-4xl uppercase mt-2 leading-none">{title}</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[.14em] font-black">Overall</div>
          <div className="stat-num text-3xl">{first.ovrBefore}{last.ovrAfter !== first.ovrBefore && <span className={last.ovrAfter > first.ovrBefore ? 'text-[#178a4c]' : 'text-red'}> → {last.ovrAfter}</span>}</div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Played" value={`${mine.length}/${fixtures.length}`} />
          <Stat label="Goals" value={goals} tone={goals ? 'red' : undefined} />
          <Stat label="Assists" value={assists} />
          <Stat label="Avg rtg" value={avg} />
        </div>

        {fixtures.length > 0 && (
          <div>
            <div className="eyebrow mb-2">Your matches · tap for details</div>
            <div className="space-y-1.5">
              {fixtures.map((f) => (
                <button key={f.id} onClick={() => openMatch(f.id)} className="w-full sticker-flat flex items-center gap-3 px-3 py-2 text-sm text-left row-hover">
                  <CompBadge fx={f} />
                  <span className="flex-1 truncate font-bold">{oppLabel(f)}</span>
                  <span className="text-xs text-muted font-semibold hidden sm:inline">{involvementLine(f)}</span>
                  {f.report?.motm && <span className="tag tag-sun !text-[8px]">MOTM</span>}
                  <ResultPill fx={f} />
                  <span className="w-10 text-right"><RatingBadge value={f.report?.rating ?? null} /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {season && (
          <div className="sticker !bg-sun p-4 -rotate-[.4deg]">
            <span className="tag">Season {seasonLabel(season.year)} complete</span>
            <div className="text-sm font-bold mt-2">{season.clubs}{season.leaguePos ? ` · ${ordinal(season.leaguePos)} in ${season.leagueName}` : ''}{season.scorerRank ? ` · ${ordinal(season.scorerRank)} in the scoring charts` : ''}</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              <Stat label="Apps" value={season.apps} /><Stat label="Goals" value={season.goals} /><Stat label="Assists" value={season.assists} />
              <Stat label="Avg" value={season.avgRating.toFixed(2)} /><Stat label="MOTM" value={season.motm} /><Stat label="Caps" value={season.caps} />
            </div>
            {(season.honors.length > 0 || season.awards.length > 0) && <div className="flex flex-wrap gap-1.5 mt-3">{season.honors.map((h) => <span key={h} className="tag">🏆 {h}</span>)}{season.awards.map((a) => <span key={a} className="tag tag-white">★ {a}</span>)}</div>}
          </div>
        )}

        {(cardsPlayed.length > 0 || luck !== null) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="eyebrow mb-2">Cards played</div>
              {cardsPlayed.length === 0 ? <p className="text-sm text-muted font-semibold">None this time.</p> : (
                <ul className="space-y-1.5">{cardsPlayed.map((cp, i) => <li key={i} className="sticker-flat px-3 py-1.5 text-sm"><span className="font-extrabold">{cp.name}</span><span className="block text-[11px] text-muted font-semibold">{cp.msg}</span></li>)}</ul>
              )}
            </div>
            {luck !== null && (
              <div>
                {trust && (
                  <div className="mb-3">
                    <div className="eyebrow mb-2">Manager trust</div>
                    <div className="sticker-flat px-3 py-2 text-sm">
                      <div className="font-bold">{Math.round(trust.start)} → {Math.round(trust.end)} <span className={trust.end - trust.start >= 0 ? 'text-[#178a4c]' : 'text-red'}>({trust.end - trust.start >= 0 ? '+' : ''}{(trust.end - trust.start).toFixed(1)})</span></div>
                      {trust.items.length > 0 && <div className="text-[11px] text-muted font-semibold mt-0.5">{trust.items.map((x) => `${x.label} ${x.delta >= 0 ? '+' : ''}${x.delta.toFixed(1)}`).join(' · ')}</div>}
                    </div>
                  </div>
                )}
                <div className="eyebrow mb-2">Luck</div>
                <div className={`sticker-flat px-3 py-2 text-sm font-bold ${luck > 0.4 ? '!bg-[#3fcf7f]' : luck < -0.4 ? '!bg-[#ffb3b8]' : ''}`}>
                  {luck > 0.4 ? '🍀 Lucky month: everything clicked.' : luck < -0.4 ? '🌧 Rough month: nothing went your way.' : luck > 0.1 ? 'Slightly kind month.' : luck < -0.1 ? 'Slightly unlucky month.' : 'An ordinary month.'}
                </div>
              </div>
            )}
          </div>
        )}

        {news.length > 0 && (
          <div>
            <div className="eyebrow mb-2">News</div>
            <ul className="space-y-1.5 text-sm">{news.map((n, i) => <li key={i} className="sticker-flat px-3 py-1.5 font-semibold">{n}</li>)}</ul>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <div className="eyebrow mb-2">Development · training + cards</div>
            {topDeltas.length === 0 ? <p className="text-sm text-muted font-semibold">No visible change.</p> : (
              <div className="space-y-1 text-sm">
                {topDeltas.map(([k, v]) => <div key={k} className="flex justify-between font-semibold"><span>{SKILL_MAP[k as SkillKey].label}</span><span className={`stat-num ${(v as number) > 0 ? 'text-[#178a4c]' : 'text-red'}`}>{(v as number) > 0 ? '+' : ''}{(v as number).toFixed(1)}</span></div>)}
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow mb-2">Packs earned</div>
            <div className="flex flex-wrap gap-1.5">{packs.length ? packs.map((pk) => <span key={pk.uid} className={`pill pack-${pk.tier} !text-[10px]`}>{PACKS[pk.tier].name.split(' ')[0]} · {pk.reason}</span>) : <span className="text-sm text-muted font-semibold">None</span>}</div>
            <div className="text-xs text-muted font-bold mt-2">Net income {fmtMoney(income)}</div>
          </div>
          <div>
            <div className="eyebrow mb-2">Legacy coins</div>
            {coins.length === 0 ? <p className="text-sm text-muted font-semibold">None this time.</p> : (
              <div className="sticker-flat p-2 space-y-1">
                {[...coins].sort((a, b) => Number(!!b.milestone) - Number(!!a.milestone)).slice(0, 8).map((e, i) => <div key={i} className="flex justify-between text-xs font-bold gap-2"><span className="truncate">{e.milestone ? '★ ' : ''}{e.label}{e.firstEver && <span className="tag !text-[7px] ml-1 !py-0">first ever</span>}</span><span className="stat-num">+{e.amount}</span></div>)}
                {coins.length > 8 && <div className="text-[10px] text-muted font-bold">+{coins.length - 8} more</div>}
                <div className="flex justify-between border-t-2 border-ink pt-1 text-sm font-black"><span className="flex items-center gap-1"><span className="coin">c</span>Total</span><span className="stat-num">+{coinTotal}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5"><button className="btn-red w-full !py-3" onClick={closeReports}>Continue</button></div>
    </Modal>
  );
}

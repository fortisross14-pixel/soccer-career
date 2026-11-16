import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../game/store';
import type { TabId } from '../Game';
import { FOCUSES, balanceEffects, balanceLabel } from '../../data/training';
import { POSITION_MAP } from '../../data/positions';
import { CARD_MAP, RARITY_ORDER } from '../../data/cards';
import { setPlan } from '../../engines/career';
import { currentRole, injuryRisk, squadLevels, LINE_LABEL } from '../../engines/match';
import { cardBlocker, playCard, playsPerMonth } from '../../engines/cards';
import { scorerTable, sortedTable, tablePosition } from '../../engines/calendar';
import { teamName, youthBand } from '../../engines/teams';
import { isWindow } from '../../engines/month';
import { ordinal } from '../../engines/awards';
import { ballonRace } from '../../engines/stars';
import { leagueRepFor } from '../../engines/world';
import { getCountry } from '../../data/countries';
import { playerOverall } from '../../engines/overall';
import { clamp } from '../../engines/util';
import { MONTHS_LONG, fmtDay } from '../../engines/util';
import { CompBadge, GameCard, Meter, RatingBadge, ResultPill, RoleBadge, SectionTitle, Stat, EmptyState } from '../ui';
import { involvementLine, oppLabel } from '../format';
import { burstFrom } from '../fx';
import { OffersList } from './Contract';

export default function Hub({ goTo }: { goTo: (t: TabId) => void }) {
  const { career, openMatch } = useGame();
  if (!career) return null;
  const c = career;
  const p = c.player;
  const s = c.season;
  const start = c.month * 30;
  const upcoming = s ? s.fixtures.filter((f) => !f.played && f.day >= start && f.day < start + 30) : [];
  const recent = s ? s.fixtures.filter((f) => f.played).slice(-5).reverse() : [];
  const st = s?.stats;
  const avg = st && st.rated ? (st.ratingSum / st.rated).toFixed(2) : '—';
  const role = p.contract ? currentRole(c) : null;
  const injured = p.injury && p.injury.year === c.year && p.injury.untilDay > start;

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
      <div className="space-y-6 min-w-0">
        {!c.retired && <PlanPanel />}

        <section className="panel p-5">
          <SectionTitle title={`${MONTHS_LONG[c.month]} fixtures`} kicker={upcoming.length ? `${upcoming.length} match${upcoming.length > 1 ? 'es' : ''}` : undefined} right={isWindow(c.month) && !c.retired ? <button className="tag !bg-sky hover:rotate-0" onClick={() => goTo('contract')}>Window open · {c.offers.length} offers</button> : undefined} />
          {c.notices.length > 0 && (
            <ul className="space-y-2 mb-4">
              {c.notices.map((n, i) => <li key={i} className={`sticker-flat text-sm font-semibold px-3 py-2 ${i % 2 ? 'rotate-[.3deg]' : '-rotate-[.3deg]'}`}>{n}</li>)}
            </ul>
          )}
          {c.academy && !c.retired && (
            <div className="sticker-flat !bg-sun px-3 py-2 mb-3 text-sm font-bold">🎓 Academy player, age {p.age}. You leave when a club signs you, you are promoted, or you turn 20 ({Math.max(0, 20 - p.age)} yr left).</div>
          )}
          {!p.contract && !c.academy && !c.retired ? (
            <div>
              <div className="text-sm font-semibold text-muted mb-3">{p.age < 17 ? 'Pick your academy. Better academies coach better, but you will play less if you are not good enough.' : 'Pick a club to start your season. Minutes drive your growth, form and market value.'}</div>
              <OffersList />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState>No competitive fixtures this month. Training, recovery and cards carry on.</EmptyState>
          ) : (
            <div className="space-y-2">
              {upcoming.map((f) => (
                <div key={f.id} className="sticker-flat flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="stat-num text-xs w-14 shrink-0">{fmtDay(f.day, c.year).split(' ').slice(0, 2).join(' ')}</span>
                  <CompBadge fx={f} />
                  <span className="flex-1 truncate font-bold">{oppLabel(f)}</span>
                  <span className="text-xs text-muted font-semibold hidden sm:inline">{f.stage}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {recent.length > 0 && (
          <section className="panel p-5">
            <SectionTitle title="Your recent games" right={<button className="text-xs font-extrabold underline" onClick={() => goTo('fixtures')}>All matches →</button>} />
            <div className="space-y-2">
              {recent.map((f) => (
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
          </section>
        )}
      </div>

      <div className="space-y-6">
        <SquadPanel />

        <section className="panel p-5">
          <SectionTitle title="Condition" right={role ? <RoleBadge role={role} /> : undefined} />
          {injured && <div className="mb-3 sticker-flat !bg-red text-white px-3 py-2 text-sm font-bold">🚑 {p.injury!.name}. Back around {fmtDay(p.injury!.untilDay, c.year)}</div>}
          <div className="space-y-3">
            <Meter label="Fitness" value={p.fitness} />
            <Meter label="Morale" value={p.morale} />
            <Meter label="Manager trust" value={p.trust} />
            <Meter label="Form" value={p.form} max={10} tone={p.form >= 7 ? 'good' : p.form >= 6.4 ? 'warn' : 'bad'} />
            <Meter label="Reputation" value={p.reputation} tone="sun" />
          </div>
          {p.boosts.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{p.boosts.map((b) => <span key={b.uid} className="tag !bg-grape">⚡ {b.name} · {b.matchesLeft}</span>)}</div>}
          {p.staff.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.staff.map((id) => <span key={id} className="tag tag-white">☻ {CARD_MAP[id]?.name}</span>)}</div>}
        </section>

        {c.packs.length > 0 && (
          <button onClick={() => goTo('cards')} className="w-full panel !bg-sun p-4 flex items-center gap-4 text-left hover:-rotate-1 transition">
            <div className={`pack pack-${c.packs[0].tier} !w-12 !p-1 shrink-0`} />
            <div className="flex-1"><div className="font-display text-xl uppercase leading-none">{c.packs.length} pack{c.packs.length > 1 ? 's' : ''} to open</div><div className="text-xs font-semibold mt-1">Skills, boosts, traits and staff. Tear them open.</div></div>
            <span className="font-display text-2xl">→</span>
          </button>
        )}

        {s && st && (
          <section className="panel p-5">
            <SectionTitle title="Season so far" kicker={s.leagueName} right={<button className="text-xs font-extrabold underline" onClick={() => goTo('table')}>Table →</button>} />
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat label="Apps" value={st.apps} sub={`${st.starts} starts`} />
              <Stat label={p.position === 'GK' ? 'Clean sh.' : 'Goals'} value={p.position === 'GK' ? st.cleanSheets : st.goals} sub={`${st.assists} assists`} tone="sun" />
              <Stat label="Avg rtg" value={avg} sub={`${st.motm} MOTM`} />
            </div>
            {s.stats.leagueGoals > 0 && (() => { const r = scorerTable(s, p.name).myRank; return <div className={`sticker-flat px-3 py-2 mb-3 text-sm font-bold ${r === 1 ? '!bg-sun' : ''}`}>{r === 1 ? '👟 You lead the Golden Boot race' : `👟 ${ordinal(r)} in the scoring charts`} · {s.stats.leagueGoals} league goals</div>; })()}
            {!s.youth && c.month >= 3 && (() => {
              const rep = leagueRepFor(getCountry(s.country).leagueRep, s.division);
              const lf = clamp((rep / 90) ** 2, 0.2, 1.1) * ([1, 0.45, 0.2][s.division - 1] ?? 0.2);
              const race = ballonRace(c, { ovr: playerOverall(p), goals: st.goals - st.intlGoals, assists: st.assists - st.intlAssists, leagueF: lf, eligible: true, clubName: s.clubName });
              const r = race.findIndex((x) => x.me) + 1;
              return r <= 30 ? <div className={`sticker-flat px-3 py-2 mb-3 text-sm font-bold ${r <= 3 ? '!bg-sun' : ''}`}>🏅 {ordinal(r)} in the Ballon d'Or race</div> : null;
            })()}
            <MiniTable />
          </section>
        )}
      </div>
    </div>
  );
}

function PlanPanel() {
  const { career, act } = useGame();
  const c = career!;
  const p = c.player;
  const [bal, setBal] = useState(c.plan.balance);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => setBal(c.plan.balance), [c.plan.balance]);
  const onBal = (v: number) => {
    setBal(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => act((x) => setPlan(x, x.focus, v)), 250);
  };
  const e = balanceEffects(bal);
  const risk = injuryRisk(p, 90, e.injury * (1 - c.mods.injuryCut)) * 100;
  const plays = playsPerMonth(c);
  const quick = [...c.cards].sort((a, b) => RARITY_ORDER.indexOf(CARD_MAP[b.defId].rarity) - RARITY_ORDER.indexOf(CARD_MAP[a.defId].rarity)).slice(0, 4);

  return (
    <section className="panel p-5">
      <SectionTitle title={`${MONTHS_LONG[c.month]} plan`} kicker={balanceLabel(bal)} right={<span className="stat-num text-xs font-bold sticker-flat px-2 py-1 shrink-0">Cards {c.cardsThisMonth}/{plays}</span>} />

      <div className="flex justify-between text-sm font-extrabold mb-1">
        <span>Training ground<span className="block text-[11px] text-muted font-semibold">grow attributes</span></span>
        <span className="text-right">Match day<span className="block text-[11px] text-muted font-semibold">stats, form, scouts</span></span>
      </div>
      <input id="balance" type="range" min={0} max={100} step={5} value={bal} onChange={(ev) => onBal(+ev.target.value)} className="scarf-range" aria-label="Balance between training and match day" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        <Effect label="Growth" value={`×${(e.growth * 0.7).toFixed(1)}–${(e.growth * 1.3).toFixed(1)}`} good={e.growth >= 1} />
        <Effect label="Match rating" value={`${sign(e.rating - 0.2)}…${sign(e.rating + 0.2)}`} good={e.rating >= 0} />
        <Effect label="Scout buzz" value={`×${e.scout.toFixed(2)}`} good={e.scout >= 1} />
        <Effect label="Injury /90" value={`${risk.toFixed(1)}%`} good={risk < 1.3} />
      </div>

      <p className="text-[11px] text-muted font-semibold mt-2">Ranges include luck: most months land in the middle, but a hot streak or a flat month can happen whatever you choose.</p>

      <div className="mt-5">
        <div className="text-xs font-extrabold uppercase tracking-wider mb-2">Training focus</div>
        <div className="flex flex-wrap gap-2">
          {FOCUSES.filter((f) => p.position === 'GK' || f.id !== 'Goalkeeping').map((f) => (
            <button key={f.id} title={f.desc} onClick={() => act((x) => setPlan(x, f.id, bal))} className={`chip ${c.focus === f.id ? 'chip-on' : ''}`}>{f.id === 'key' ? `${POSITION_MAP[p.position].short} craft` : f.label}</button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap justify-between items-end gap-2 mb-2">
          <div className="text-xs font-extrabold uppercase tracking-wider">Play a card · {Math.max(0, plays - c.cardsThisMonth)} left this month</div>
          {msg && <span className="text-[11px] font-bold">{msg}</span>}
        </div>
        {quick.length === 0 ? <p className="text-sm text-muted font-semibold">No cards in hand. Open packs in the Cards tab.</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quick.map((inst, i) => {
              const def = CARD_MAP[inst.defId];
              const block = cardBlocker(c, def);
              return (
                <div key={inst.uid} className={block ? 'opacity-50' : ''} title={block ?? 'Play this card'}>
                  <GameCard def={def} compact tilt={(['a', 'b', 'c', 'b'] as const)[i]} onClick={() => {
                    if (block) { setMsg(block); return; }
                    const el = document.activeElement;
                    const r = act((x) => playCard(x, inst.uid));
                    setMsg(r.msg);
                    if (r.ok) burstFrom(el, 26);
                  }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const sign = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;

function Effect({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`sticker-flat px-2.5 py-1.5 transition-colors ${good ? '' : '!bg-[#ffe3e5]'}`}>
      <div className="text-[9px] uppercase tracking-[.12em] font-black text-muted">{label}</div>
      <div className="stat-num text-lg">{value}</div>
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
      <div className="text-xs text-muted font-bold mb-2">{s.clubName}: {s.roundsPlayed ? ordinal(tablePosition(s)) : '—'} after {s.roundsPlayed} of {s.rounds.length}</div>
      {rows.slice(from, from + 5).map((r, i) => (
        <div key={r.clubId} className={`flex items-center gap-2 py-1 px-2 rounded-md ${r.clubId === s.clubId ? 'bg-sun border-2 border-ink font-extrabold' : ''}`}>
          <span className="stat-num w-5 text-muted">{from + i + 1}</span>
          <span className="flex-1 truncate">{teamName(r.clubId)}</span>
          <span className="stat-num w-8 text-right">{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

function SquadPanel() {
  const { career } = useGame();
  const c = career!;
  const lv = squadLevels(c);
  if (!lv) return null;
  const diff = lv.meShown - lv.lineShown;
  const verdict = diff >= 5 ? ['First choice. You play even in training-focused months.', '!bg-[#3fcf7f]']
    : diff >= -1 ? ['In the mix. Form, trust and match-day focus decide who starts.', '!bg-sun']
    : diff >= -6 ? ['Rotation. Expect bench time unless you are in form.', '!bg-[#ffa53f]']
    : diff >= -12 ? ['Fringe. Mostly bench, some cup games.', '!bg-[#ffb3b8]']
    : ['Out of your depth here. Consider a move where you would play.', '!bg-[#ffb3b8]'];
  const teen = !lv.youth && c.player.age < 21;
  return (
    <section className="panel p-5">
      <SectionTitle title="Squad level" kicker={lv.youth ? 'Academy · same-age players' : 'First team'} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Team avg" value={lv.teamShown} />
        <Stat label={LINE_LABEL[lv.line]} value={lv.lineShown} sub="your rivals" />
        <Stat label={teen ? 'You (match)' : 'You'} value={lv.meShown} sub={`${diff >= 0 ? '+' : ''}${diff} vs line`} tone={diff >= -1 ? 'sun' : undefined} />
      </div>
      <div className={`sticker-flat mt-3 px-3 py-2 text-sm font-bold ${verdict[1]}`}>{verdict[0]}</div>
      {teen && <p className="text-[11px] text-muted font-semibold mt-2">Among adults your match level is a little below your OVR until you are 21 (physical maturity).</p>}
      {lv.youth && (() => {
        const b = youthBand(c.player.age);
        const pos = c.player.age === b.min ? 'one of the youngest' : c.player.age === b.max || (b.label === 'U20' && c.player.age === 19) ? 'one of the oldest' : 'in the middle';
        return <p className="text-[11px] text-muted font-semibold mt-2">{b.label} group (ages {b.min}–{b.max}): at {c.player.age} you are {pos}. Older groups are stronger, and teammates average about {b.peerAge} years old, so you have the edge when you are one of the oldest in your group.</p>;
      })()}
    </section>
  );
}

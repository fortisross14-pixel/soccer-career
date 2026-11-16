import { useState } from 'react';
import { useGame } from '../game/store';
import { CLUB_MAP } from '../data/clubs';
import { POSITION_MAP } from '../data/positions';
import { playerOverall, potentialOverall } from '../engines/overall';
import { canPlay, seasonLabel } from '../engines/month';
import { MONTHS_LONG, calYear, fmtMoney } from '../engines/util';
import Hub from './tabs/Hub';
import Fixtures from './tabs/Fixtures';
import Table from './tabs/Table';
import Cards from './tabs/Cards';
import PlayerTab from './tabs/Player';
import Contract from './tabs/Contract';
import CareerTab from './tabs/CareerTab';
import WorldTab from './tabs/WorldTab';
import MonthReportModal from './modals/MonthReportModal';
import MatchModal from './modals/MatchModal';
import DecisionModal from './modals/DecisionModal';
import PackReveal from './modals/PackReveal';
import CareerOverModal from './modals/CareerOverModal';
import { Coin } from './ui';

const TABS = [
  { id: 'hub', label: 'Hub' },
  { id: 'fixtures', label: 'Matches' },
  { id: 'table', label: 'Table' },
  { id: 'world', label: 'World' },
  { id: 'cards', label: 'Cards' },
  { id: 'player', label: 'Player' },
  { id: 'contract', label: 'Contract' },
  { id: 'career', label: 'Career' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

export default function Game() {
  const { career, exit, play, reports, matchId, reveal, meta } = useGame();
  const [tab, setTab] = useState<TabId>('hub');
  const [finaleSeen, setFinaleSeen] = useState(false);
  if (!career) return null;
  const c = career;
  const p = c.player;
  const ovr = playerOverall(p);
  const pot = potentialOverall(p);
  const club = p.contract ? CLUB_MAP[p.contract.clubId] : null;
  const blocker = canPlay(c);
  const monthHasMatches = c.season?.fixtures.some((f) => !f.played && Math.floor(f.day / 30) === c.month);

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 bg-bone border-b-[3px] border-ink">
        <div className="scarf !h-2.5 !border-b-2" />
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3 sm:gap-4">
          <button onClick={exit} className="w-10 h-10 shrink-0 rounded-lg bg-red text-white border-2 border-ink shadow-[2px_2px_0_#121212] grid place-items-center font-display text-lg" title="Main menu" aria-label="Main menu">XI</button>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg sm:text-2xl uppercase leading-none truncate">{p.name}</div>
            <div className="text-[11px] sm:text-xs text-muted font-bold truncate mt-1">{POSITION_MAP[p.position].short} · {c.academy ? `${CLUB_MAP[c.academy.clubId].name} academy` : club?.name ?? (p.age < 17 ? 'No academy' : 'Free agent')} · Age {p.age} · {MONTHS_LONG[c.month]} {calYear(c.year, c.month)}</div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <HudNum label="OVR" value={ovr} tone="sun" />
            <HudNum label="POT" value={pot} />
            <span className="hidden sm:contents"><HudNum label="Form" value={p.form.toFixed(1)} /></span>
            <span className="hidden sm:contents"><HudNum label="Fit" value={Math.round(p.fitness)} tone={p.fitness < 65 ? 'red' : undefined} /></span>
            <span className="hidden md:contents"><HudNum label="Bank" value={fmtMoney(p.money)} /></span>
            <span className="hidden md:contents"><HudNum label="Coins" value={<span className="flex items-center gap-1"><Coin />{meta.coins}</span>} /></span>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-3 sm:px-4 pb-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`chip whitespace-nowrap ${tab === t.id ? 'chip-on' : ''}`}>
              {t.label}
              {t.id === 'cards' && c.packs.length > 0 && <span className="ml-1.5 text-[10px] bg-red text-white rounded px-1.5 font-black border border-ink">{c.packs.length}</span>}
              {t.id === 'contract' && c.offers.length > 0 && <span className="ml-1.5 text-[10px] bg-sky text-white rounded px-1.5 font-black border border-ink">{c.offers.length}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 animate-fade-up" key={tab}>
        {tab === 'hub' && <Hub goTo={setTab} />}
        {tab === 'fixtures' && <Fixtures />}
        {tab === 'table' && <Table />}
        {tab === 'world' && <WorldTab />}
        {tab === 'cards' && <Cards />}
        {tab === 'player' && <PlayerTab />}
        {tab === 'contract' && <Contract />}
        {tab === 'career' && <CareerTab />}
      </main>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-ink text-white border-t-[3px] border-ink">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[.16em] text-sun font-black">{c.retired ? 'Full time' : `Season ${seasonLabel(c.year)}`}</div>
            <div className="text-sm font-bold truncate">
              {c.retired ? `${c.legacy?.tier} · ${c.legacy?.score} legacy pts · ${c.coinsEarned} coins earned` : blocker ?? (monthHasMatches ? `${MONTHS_LONG[c.month]}: matches to play` : `${MONTHS_LONG[c.month]}: no fixtures, training and recovery`)}
            </div>
          </div>
          {c.retired ? (
            <><button className="btn-white hidden sm:inline-flex" onClick={() => setFinaleSeen(false)}>Career summary</button><button className="btn-sun" onClick={exit}>Main menu</button></>
          ) : (
            <>
              <button className="btn-white hidden sm:inline-flex" disabled={!!blocker} onClick={() => play(true)} title="Play months until something needs your attention">{c.academy ? 'Sim season ⏩' : 'Sim to event ⏩'}</button>
              <button className="btn-red !px-5 !py-3" disabled={!!blocker} onClick={() => play(false)}>Play {MONTHS_LONG[c.month]} →</button>
            </>
          )}
        </div>
      </div>

      {c.decisions.length > 0 && !reports && <DecisionModal />}
      {reports && <MonthReportModal reports={reports} />}
      {matchId && <MatchModal id={matchId} />}
      {reveal && <PackReveal cards={reveal} />}
      {c.retired && !finaleSeen && !reports && <CareerOverModal onClose={() => setFinaleSeen(true)} />}
    </div>
  );
}

function HudNum({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'sun' | 'red' }) {
  return (
    <div className={`text-center leading-none border-2 border-ink rounded-lg px-2 py-1 min-w-[44px] ${tone === 'sun' ? 'bg-sun' : tone === 'red' ? 'bg-red text-white' : 'bg-white'}`}>
      <div className="text-[8px] uppercase tracking-[.14em] font-black opacity-70">{label}</div>
      <div className="stat-num text-base sm:text-lg mt-0.5">{value}</div>
    </div>
  );
}

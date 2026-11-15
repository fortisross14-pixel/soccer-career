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
import MonthReportModal from './modals/MonthReportModal';
import MatchModal from './modals/MatchModal';
import DecisionModal from './modals/DecisionModal';
import PackReveal from './modals/PackReveal';

const TABS = [
  { id: 'hub', label: 'Hub', icon: '⌂' },
  { id: 'fixtures', label: 'Matches', icon: '▦' },
  { id: 'table', label: 'Table', icon: '≡' },
  { id: 'cards', label: 'Cards', icon: '◆' },
  { id: 'player', label: 'Player', icon: '◉' },
  { id: 'contract', label: 'Contract', icon: '✎' },
  { id: 'career', label: 'Career', icon: '★' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

export default function Game() {
  const { career, exit, play, reports, matchId, reveal } = useGame();
  const [tab, setTab] = useState<TabId>('hub');
  if (!career) return null;
  const c = career;
  const p = c.player;
  const ovr = playerOverall(p);
  const pot = potentialOverall(p);
  const club = p.contract ? CLUB_MAP[p.contract.clubId] : null;
  const blocker = canPlay(c);
  const monthHasMatches = c.season?.fixtures.some((f) => !f.played && Math.floor(f.day / 30) === c.month) || (c.season?.rounds[c.season.roundsPlayed]?.day ?? 999) < (c.month + 1) * 30;
  const packCount = c.packs.length;
  const offerCount = c.offers.length;

  return (
    <div className="min-h-screen pb-28">
      {/* ---------- HUD ---------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-night/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 sm:gap-5">
          <button onClick={exit} className="w-9 h-9 shrink-0 rounded-md bg-lime text-night grid place-items-center font-display text-lg font-black" title="Main menu">XI</button>
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl sm:text-2xl font-bold leading-none truncate">{p.name}</div>
            <div className="text-[11px] sm:text-xs text-muted truncate mt-1">{POSITION_MAP[p.position].short} · {club?.name ?? 'Free agent'} · Age {p.age} · {MONTHS_LONG[c.month]} {calYear(c.year, c.month)}</div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <HudNum label="OVR" value={ovr} accent />
            <HudNum label="POT" value={pot} />
            <div className="hidden sm:block"><HudNum label="Form" value={p.form.toFixed(1)} /></div>
            <div className="hidden sm:block"><HudNum label="Fit" value={Math.round(p.fitness)} warn={p.fitness < 65} /></div>
            <div className="hidden md:block"><HudNum label="Bank" value={fmtMoney(p.money)} /></div>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`relative px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab === t.id ? 'border-lime text-cream' : 'border-transparent text-muted hover:text-cream'}`}>
              <span className="mr-1.5 opacity-70">{t.icon}</span>{t.label}
              {t.id === 'cards' && packCount > 0 && <span className="ml-1.5 text-[10px] bg-lime text-night rounded-full px-1.5 font-black">{packCount}</span>}
              {t.id === 'contract' && offerCount > 0 && <span className="ml-1.5 text-[10px] bg-orange text-night rounded-full px-1.5 font-black">{offerCount}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 animate-fade-up" key={tab}>
        {tab === 'hub' && <Hub goTo={setTab} />}
        {tab === 'fixtures' && <Fixtures />}
        {tab === 'table' && <Table />}
        {tab === 'cards' && <Cards />}
        {tab === 'player' && <PlayerTab />}
        {tab === 'contract' && <Contract />}
        {tab === 'career' && <CareerTab />}
      </main>

      {/* ---------- advance dock ---------- */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-night/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[.16em] text-muted font-bold">{c.retired ? 'Career over' : `Season ${seasonLabel(c.year)}`}</div>
            <div className="text-sm font-semibold truncate">
              {c.retired ? `${c.legacy?.tier} · ${c.legacy?.score} legacy pts` : blocker ?? (monthHasMatches ? `${MONTHS_LONG[c.month]}: matches to play` : `${MONTHS_LONG[c.month]}: no fixtures — training & recovery`)}
            </div>
          </div>
          {c.retired ? (
            <button className="btn-primary" onClick={exit}>Main menu</button>
          ) : (
            <>
              <button className="btn-ghost hidden sm:block" disabled={!!blocker} onClick={() => play(true)} title="Play months until something needs your attention">Sim to next event ⏩</button>
              <button className="btn-primary px-5 py-3" disabled={!!blocker} onClick={() => play(false)}>PLAY {MONTHS_LONG[c.month].toUpperCase()} →</button>
            </>
          )}
        </div>
      </div>

      {c.decisions.length > 0 && !reports && <DecisionModal />}
      {reports && <MonthReportModal reports={reports} />}
      {matchId && <MatchModal id={matchId} />}
      {reveal && <PackReveal cards={reveal} />}
    </div>
  );
}

function HudNum({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="text-center leading-none">
      <div className="text-[9px] uppercase tracking-[.16em] text-muted font-bold">{label}</div>
      <div className={`stat-num text-lg sm:text-xl mt-1 ${accent ? 'text-lime' : warn ? 'text-orange' : ''}`}>{value}</div>
    </div>
  );
}

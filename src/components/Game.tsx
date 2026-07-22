import { useState } from 'react';
import { useGame } from '../game/store';
import { playerOverall } from '../engines/overall';
import { POSITION_MAP } from '../data/positions';
import { fmtMoney } from '../engines/util';
import { TRAINING } from './tabs/Actions';
import Summary from './tabs/Summary';
import Skills from './tabs/Skills';
import Actions from './tabs/Actions';
import Career from './tabs/Career';
import Honors from './tabs/Honors';
import Timeline from './tabs/Timeline';
import YearSummary from './YearSummary';

const TABS = ['Summary', 'Skills', 'Actions', 'Career', 'Honors', 'Timeline'] as const;

export default function Game() {
  const { player, exit, advance, summary, clearSummary } = useGame();
  const [tab, setTab] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);

  if (!player) return null;
  const ovr = playerOverall(player);
  const pos = POSITION_MAP[player.position];

  const doAdvance = () => {
    const keys = focusId ? TRAINING.find((t) => t.id === focusId)?.keys ?? null : null;
    advance(keys);
    setFocusId(null);
  };

  return (
    <div className="max-w-6xl mx-auto pb-28">
      {/* header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
        <button className="flex items-center gap-3" onClick={exit}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pitch-500 to-pitch-700 grid place-items-center">
            <span className="text-xl">⚽</span>
          </div>
          <span className="font-display text-2xl tracking-tighter hidden sm:block">
            THE <span className="text-pitch-500">ELEVENTH</span>
          </span>
        </button>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-pitch-500 animate-pulse" />
            <span className="stat-num">{player.age}</span><span className="text-zinc-500">yo</span>
          </div>
          <div className="hidden sm:block text-zinc-300">{player.name} <span className="text-pitch-500">· {pos.short}</span></div>
          <div className="stat-num text-pitch-400">{fmtMoney(player.money)}</div>
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
            <span className="text-zinc-500 text-xs">OVR</span><span className="stat-num text-pitch-400">{ovr}</span>
          </div>
        </div>
      </header>

      {/* tabs */}
      <nav className="px-6 pt-3 border-b border-zinc-800 pitch-stripes">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === i ? 'border-pitch-500 text-pitch-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >{t}</button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {tab === 0 && <Summary player={player} />}
        {tab === 1 && <Skills player={player} />}
        {tab === 2 && <Actions player={player} focusId={focusId} setFocusId={setFocusId} />}
        {tab === 3 && <Career player={player} />}
        {tab === 4 && <Honors player={player} />}
        {tab === 5 && <Timeline player={player} />}
      </main>

      {/* advance bar */}
      {!player.retired && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="text-sm text-zinc-500 hidden sm:block">
              {focusId ? <>Training: <span className="text-pitch-400">{TRAINING.find((t) => t.id === focusId)?.label}</span></>
                : 'No training focus set — pick one in Actions.'}
            </div>
            <button className="btn-primary px-8 py-3 flex-1 sm:flex-none" onClick={doAdvance}>
              ▶ Advance year
            </button>
          </div>
        </div>
      )}
      {player.retired && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <span className="text-zinc-400 text-sm">This career has ended.</span>
            <button className="btn-ghost px-6 py-2.5" onClick={exit}>Back to menu</button>
          </div>
        </div>
      )}

      {summary && <YearSummary summary={summary} player={player} onClose={clearSummary} />}
    </div>
  );
}

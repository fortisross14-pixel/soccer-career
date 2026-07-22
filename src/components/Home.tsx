import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { allSlots, deleteSlot, loadHof, type HofEntry } from '../game/save';
import { COUNTRIES } from '../data/countries';
import { POSITIONS } from '../data/positions';
import type { PositionKey } from '../game/types';
import { Modal } from './ui';

const SAMPLE_NAMES = ['Lucas Mendes', 'Diego Fontana', 'Kai Andersen', 'Yuki Tanaka', 'Mateo Rossi', 'Omar Haddad'];

export default function Home() {
  const { startNew, load } = useGame();
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState<'legacy' | 'goals' | 'games' | 'trophies'>('legacy');
  const [refresh, setRefresh] = useState(0);

  const slots = useMemo(() => allSlots(), [refresh, creating]);
  const hof = useMemo(() => {
    const list = loadHof();
    const key = sortBy === 'legacy' ? 'legacyScore' : sortBy;
    return [...list].sort((a, b) => (b[key as keyof HofEntry] as number) - (a[key as keyof HofEntry] as number));
  }, [sortBy, refresh]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
      <header className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pitch-500 to-pitch-700 grid place-items-center shadow-lg shadow-pitch-900/40">
          <span className="text-3xl">⚽</span>
        </div>
        <div>
          <h1 className="font-display text-5xl tracking-tighter leading-none">
            THE <span className="text-pitch-500">ELEVENTH</span>
          </h1>
          <p className="text-zinc-500 text-sm tracking-wide">a football life, one season at a time</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Save slots */}
        <section className="card p-7">
          <div className="eyebrow mb-4">Save slots</div>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-900/70 rounded-2xl px-5 py-3.5">
                {s ? (
                  <>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {s.name}
                        <span className="text-zinc-500 text-sm">· {s.age}yo</span>
                        {s.retired && <span className="pill border-zinc-700 text-zinc-400">Retired</span>}
                      </div>
                      <div className="text-xs text-zinc-500">{s.clubName} · {s.country} · OVR {s.overall}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary text-xs px-4 py-2" onClick={() => load(s.slot)}>
                        {s.retired ? 'View' : 'Continue'}
                      </button>
                      <button
                        className="btn-ghost text-xs px-3 py-2"
                        onClick={() => { if (confirm('Delete this save?')) { deleteSlot(s.slot); setRefresh((r) => r + 1); } }}
                      >Delete</button>
                    </div>
                  </>
                ) : (
                  <span className="text-zinc-600 text-sm">Empty slot {i + 1}</span>
                )}
              </div>
            ))}
          </div>
          <button className="btn-primary w-full mt-6 py-3.5" onClick={() => setCreating(true)}>
            + New career
          </button>
        </section>

        {/* Hall of fame */}
        <section className="card p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow flex items-center gap-2">🏆 Hall of fame</div>
            <select
              className="bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-1.5"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="legacy">Legacy</option>
              <option value="goals">Goals</option>
              <option value="games">Games</option>
              <option value="trophies">Trophies</option>
            </select>
          </div>
          <div className="max-h-[420px] overflow-auto -mr-2 pr-2">
            {hof.length === 0 ? (
              <p className="text-zinc-600 text-sm py-6">No retired players yet. Finish a career to enter the hall of fame.</p>
            ) : (
              <div className="space-y-1.5">
                {hof.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-900/70">
                    <div className="flex items-center gap-3">
                      <span className="stat-num text-zinc-600 w-5 text-right">{i + 1}</span>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-zinc-500">{p.position} · {p.country}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-pitch-400 font-medium">{p.legacyTier}</div>
                      <div className="text-zinc-500">{p.goals}g · {p.games} apps · {p.trophies}🏆</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {creating && (
        <CreateCareer
          onClose={() => setCreating(false)}
          onStart={(n, c, p) => { startNew(n, c, p); setCreating(false); }}
        />
      )}
    </div>
  );
}

function CreateCareer({ onClose, onStart }: { onClose: () => void; onStart: (n: string, c: string, p: PositionKey) => void }) {
  const [name, setName] = useState(SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]);
  const [country, setCountry] = useState(COUNTRIES[0].name);
  const [pos, setPos] = useState<PositionKey>('ST');

  return (
    <Modal onClose={onClose}>
      <h2 className="font-display text-2xl mb-1">Create your player</h2>
      <p className="text-zinc-500 text-sm mb-6">You'll start at 15 in the academy. Everything after is up to you.</p>

      <label className="text-xs text-zinc-400">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 mt-1 mb-4 focus:border-pitch-600 outline-none"
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-zinc-400">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 mt-1 outline-none focus:border-pitch-600">
            {COUNTRIES.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Position</label>
          <select value={pos} onChange={(e) => setPos(e.target.value as PositionKey)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 mt-1 outline-none focus:border-pitch-600">
            {POSITIONS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary flex-1 py-3.5" onClick={() => onStart(name.trim() || 'New Talent', country, pos)}>
          Start career
        </button>
        <button className="btn-ghost px-6 py-3.5" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

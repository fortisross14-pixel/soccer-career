import { useState } from 'react';
import type { PositionKey } from '../game/types';
import { useGame } from '../game/store';
import { allSlots, deleteSlot, loadHof } from '../game/save';
import { COUNTRIES } from '../data/countries';
import { POSITIONS } from '../data/positions';
import { seasonLabel } from '../engines/month';

export default function Home() {
  const { newCareer, load } = useGame();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Spain');
  const [position, setPosition] = useState<PositionKey>('ST');
  const [slots, setSlots] = useState(allSlots());
  const [error, setError] = useState<string | null>(null);
  const hof = loadHof();

  const start = () => {
    if (!newCareer(name || 'Alex Rivera', country, position)) setError('All three save slots are full. Delete a career first.');
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-lime text-night grid place-items-center font-display text-2xl font-black">XI</div>
            <div className="eyebrow">Football career simulator</div>
          </div>
          <h1 className="font-display text-6xl sm:text-8xl font-extrabold leading-[.9] mt-5">THE ELEVENTH</h1>
          <p className="text-muted mt-4 max-w-xl">Turn pro at 17 and live your career one month at a time. Play every match, open card packs to build your skills, take on transfer windows and contract talks, and chase a legacy.</p>
        </header>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
          <section className="panel p-5 sm:p-6">
            <div className="eyebrow mb-4">New career</div>
            <label className="block text-xs text-muted mb-1">Player name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" maxLength={28} className="w-full bg-night border border-line rounded-md px-3 py-2.5 mb-4 outline-none focus:border-mint" />
            <label className="block text-xs text-muted mb-1">Nationality</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-night border border-line rounded-md px-3 py-2.5 mb-4">
              {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name} — {c.leagueName}</option>)}
            </select>
            <label className="block text-xs text-muted mb-2">Position</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {POSITIONS.map((p) => (
                <button key={p.key} onClick={() => setPosition(p.key)} className={`chip text-left py-2 ${position === p.key ? 'chip-on' : ''}`}>
                  <div className="font-display text-lg leading-none">{p.short}</div>
                  <div className="text-[10px] text-muted mt-1 leading-tight">{p.name}</div>
                </button>
              ))}
            </div>
            <button className="btn-primary w-full py-3 text-base" onClick={start}>KICK OFF CAREER →</button>
            {error && <p className="text-danger text-xs mt-3">{error}</p>}
          </section>

          <section className="space-y-5">
            <div className="panel p-5">
              <div className="eyebrow mb-3">Saved careers</div>
              <div className="space-y-2">
                {slots.map((m, i) => m ? (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-line p-3">
                    <div className="stat-num text-2xl w-10 text-center text-lime">{m.overall}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-xs text-muted truncate">{m.position} · {m.clubName} · age {m.age} · {seasonLabel(m.year)}{m.retired ? ' · retired' : ''}</div>
                    </div>
                    <button className="btn-primary text-xs px-3" onClick={() => load(i + 1)}>{m.retired ? 'View' : 'Play'}</button>
                    <button className="btn-ghost text-xs px-2" title="Delete" onClick={() => { if (confirm(`Delete ${m.name}'s career?`)) { deleteSlot(i + 1); setSlots(allSlots()); setError(null); } }}>✕</button>
                  </div>
                ) : (
                  <div key={i} className="rounded-lg border border-dashed border-line p-3 text-xs text-muted">Empty slot {i + 1}</div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <div className="eyebrow mb-3">Hall of fame</div>
              {hof.length === 0 ? <p className="text-sm text-muted">Retired careers are inducted here.</p> : (
                <div className="space-y-1.5">
                  {hof.slice(0, 8).map((h, i) => (
                    <div key={h.id} className="flex items-center gap-3 text-sm">
                      <span className="stat-num text-muted w-5">{i + 1}</span>
                      <span className="flex-1 truncate">{h.name} <span className="text-muted text-xs">· {h.position}</span></span>
                      <span className="text-xs text-muted">{h.goals}G · {h.trophies}🏆{h.ballons ? ` · ${h.ballons}🏅` : ''}</span>
                      <span className="pill text-lime border-lime/30">{h.legacyTier}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

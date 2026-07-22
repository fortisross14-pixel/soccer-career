import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { allSlots, deleteSlot, loadHof, type HofEntry } from '../game/save';
import { COUNTRIES } from '../data/countries';
import { POSITIONS } from '../data/positions';
import type { Player, PositionKey } from '../game/types';
import { Modal } from './ui';

const SAMPLE_NAMES = ['Lucas Mendes', 'Diego Fontana', 'Kai Andersen', 'Yuki Tanaka', 'Mateo Rossi', 'Omar Haddad'];

export default function Home() {
  const { startNew, load } = useGame();
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState<'legacy' | 'goals' | 'games' | 'trophies'>('legacy');
  const [refresh, setRefresh] = useState(0);
  const [selectedLegend, setSelectedLegend] = useState<HofEntry | null>(null);

  const slots = useMemo(() => allSlots(), [refresh, creating]);
  const hof = useMemo(() => {
    const list = loadHof();
    const key = sortBy === 'legacy' ? 'legacyScore' : sortBy;
    return [...list].sort((a, b) => (b[key as keyof HofEntry] as number) - (a[key as keyof HofEntry] as number));
  }, [sortBy, refresh]);

  return (
    <div className="home-game-shell">
      <header className="home-game-hero">
        <div className="home-crest"><span>XI</span></div>
        <div>
          <span className="home-edition">CAREER SIMULATOR · 2026 EDITION</span>
          <h1>THE <em>ELEVENTH</em></h1>
          <p>From academy hopeful to football immortality.</p>
        </div>
      </header>

      <div className="home-sections">
        {/* Save slots */}
        <section className="career-selection-panel">
          <div className="panel-heading"><div><span>CAREER MODE</span><h2>Choose your journey</h2></div><b>01</b></div>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <div key={i} className={`save-career-card ${s ? 'occupied' : 'empty'}`}>
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
          <button disabled={slots.every(Boolean)} className="btn-primary w-full mt-6 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed" onClick={() => setCreating(true)}>
            {slots.every(Boolean) ? 'Delete a save to start a new career' : '+ New career'}
          </button>
        </section>

        {/* Hall of fame */}
        <section className="hall-panel">
          <div className="panel-heading"><div><span>LEGACY ARCHIVE</span><h2>Hall of Fame</h2></div><b>02</b></div>
          <div className="flex items-center justify-end mb-4">
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
                  <button key={p.id ?? i} onClick={() => setSelectedLegend(p)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-900/70 text-left transition">
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedLegend && <HofCareerModal entry={selectedLegend} onClose={() => setSelectedLegend(null)} />}

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
      <p className="text-zinc-500 text-sm mb-6">You'll enter the academy at 10. Your choices will shape the player who emerges.</p>

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


function HofCareerModal({ entry, onClose }: { entry: HofEntry; onClose: () => void }) {
  const [section, setSection] = useState<'overview' | 'club' | 'national'>('overview');
  const player = entry.player;
  return (
    <Modal onClose={onClose}>
      <div className="max-h-[82vh] overflow-y-auto pr-1">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="eyebrow">Hall of Fame career archive</div>
            <h2 className="font-display text-4xl mt-2">{entry.name}</h2>
            <p className="text-zinc-500 text-sm">{entry.country} · {entry.position} · {entry.legacyTier}</p>
          </div>
          <div className="text-right"><div className="stat-num text-3xl text-pitch-400">{entry.legacyScore}</div><div className="text-[10px] uppercase tracking-widest text-zinc-600">Legacy</div></div>
        </div>
        <div className="flex gap-2 mb-5">
          {(['overview','club','national'] as const).map((key) => <button key={key} onClick={() => setSection(key)} className={section === key ? 'btn-primary px-4 py-2 text-xs' : 'btn-ghost px-4 py-2 text-xs'}>{key === 'club' ? 'Club career' : key === 'national' ? 'National team' : 'Overview'}</button>)}
        </div>
        {section === 'overview' && <LegendOverview entry={entry} player={player} />}
        {section === 'club' && <LegendClubCareer entry={entry} player={player} />}
        {section === 'national' && <LegendNational entry={entry} player={player} />}
      </div>
    </Modal>
  );
}

function LegendOverview({ entry, player }: { entry: HofEntry; player?: Player }) {
  const stats = [['Games', entry.games], ['Goals', entry.goals], ['Assists', entry.assists], ['Trophies', entry.trophies], ["Ballons d'Or", entry.ballons], ['Peak OVR', player?.peakOverall ?? '—']];
  return <div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{stats.map(([label,value]) => <div key={String(label)} className="bg-zinc-900/70 rounded-2xl p-4"><div className="stat-num text-2xl">{value}</div><div className="text-xs text-zinc-500">{label}</div></div>)}</div>
    {player ? <>
      <div className="mt-5 rounded-2xl border border-zinc-800 p-5"><div className="eyebrow mb-3">Career profile</div><p className="text-sm text-zinc-400 leading-relaxed">Started as a {player.prospectStars ?? '—'}-star prospect, peaked at {player.peakOverall ?? '—'} overall and retired at {player.age}. Career decision score: {player.careerDecisionScore ?? 0}. Injury-affected seasons: {player.injurySeasons ?? 0}.</p></div>
      <div className="mt-4 rounded-2xl border border-zinc-800 p-5"><div className="eyebrow mb-3">Honors</div><div className="space-y-2 text-sm">{[...player.honors.club, ...player.honors.national, ...player.honors.individual].map((honor) => <div key={honor.label} className="flex justify-between"><span className="text-zinc-300">{honor.label}</span><span className="stat-num text-pitch-400">×{honor.count}</span></div>)}</div></div>
    </> : <p className="mt-5 text-sm text-zinc-500">This legacy entry was created before detailed Hall of Fame archives were introduced.</p>}
  </div>;
}

function LegendClubCareer({ player }: { entry: HofEntry; player?: Player }) {
  if (!player) return <p className="text-sm text-zinc-500">Detailed season history is unavailable for this older entry.</p>;
  return <div className="space-y-2">{player.history.map((season) => <div key={`${season.season}-${season.clubId}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="flex justify-between gap-3"><div><div className="font-medium">Age {season.age} · {season.clubName}</div><div className="text-xs text-zinc-500">{season.competition} · {season.role}</div></div><div className="stat-num text-pitch-400">OVR {season.overall}</div></div><div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs"><Mini label="Apps" value={season.games}/><Mini label="Goals" value={season.goals}/><Mini label="Assists" value={season.assists}/><Mini label="Rating" value={season.rating || '—'}/></div>{season.narrative?.length ? <p className="text-xs text-zinc-500 mt-3">{season.narrative[0]}</p> : null}</div>)}</div>;
}

function LegendNational({ entry, player }: { entry: HofEntry; player?: Player }) {
  if (!player) return <p className="text-sm text-zinc-500">Detailed national-team history is unavailable for this older entry.</p>;
  const matches = player.national.matches ?? [];
  return <div><div className="grid grid-cols-3 gap-3 mb-5"><Mini label="Caps" value={player.national.caps}/><Mini label="Goals" value={player.national.goals}/><Mini label="Assists" value={player.national.assists ?? 0}/></div><div className="space-y-2">{matches.length ? matches.map((match, index) => <div key={`${match.season}-${index}`} className="rounded-xl border border-zinc-800 p-3 flex items-center justify-between gap-3"><div><div className="font-medium">{entry.country} {match.result} {match.opponent}</div><div className="text-xs text-zinc-500">{match.competition} · {match.stage} · {match.minutes} min</div></div><div className="text-right text-xs"><div>{match.goals}G · {match.assists}A</div><div className="text-pitch-400">{match.rating ?? '—'}</div></div></div>) : <p className="text-sm text-zinc-500">No senior international appearances.</p>}</div></div>;
}

function Mini({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-zinc-900 p-3"><div className="stat-num text-lg">{value}</div><div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div></div>; }

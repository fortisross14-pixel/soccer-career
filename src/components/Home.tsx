import { useState } from 'react';
import type { PositionKey } from '../game/types';
import { useGame } from '../game/store';
import { allSlots, deleteSlot, loadHof } from '../game/save';
import { buyUpgrade, openCrate, toggleEquip, upgradeCost } from '../game/meta';
import { COUNTRIES } from '../data/countries';
import { POSITIONS } from '../data/positions';
import { CRATES, RELICS, RELIC_MAP, RELIC_SLOTS, UPGRADES } from '../data/legacy';
import { MILESTONES } from '../engines/coins';
import { seasonLabel } from '../engines/month';
import { Coin } from './ui';
import { fx, burstFrom } from './fx';

type Tab = 'play' | 'shop' | 'crates' | 'milestones' | 'hof';
const TABS: { id: Tab; label: string }[] = [
  { id: 'play', label: 'Play' }, { id: 'shop', label: 'Legacy shop' }, { id: 'crates', label: 'Crates' }, { id: 'milestones', label: 'Milestones' }, { id: 'hof', label: 'Hall of fame' },
];
const RARITY_BG: Record<string, string> = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legendary: 'var(--legendary)' };

export default function Home() {
  const { meta } = useGame();
  const [tab, setTab] = useState<Tab>('play');
  return (
    <div className="min-h-screen">
      <div className="scarf" />
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="tag tag-sun mb-3">Football career roguelike</div>
            <h1 className="h-outline text-5xl sm:text-7xl leading-[.9]">The Eleventh</h1>
            <p className="on-grass font-semibold mt-3 max-w-lg">Turn pro at 17, play your career month by month, and earn legacy coins from every milestone to make your next run stronger.</p>
          </div>
          <div className="sticker !bg-sun px-4 py-3 rotate-[-2deg]">
            <div className="text-[10px] uppercase tracking-[.14em] font-black">Legacy coins</div>
            <div className="stat-num text-3xl flex items-center gap-2"><Coin />{meta.coins.toLocaleString('en-US')}</div>
            <div className="text-[10px] font-bold">{meta.lifetime.toLocaleString('en-US')} earned · {meta.careers} careers</div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-3">
          {TABS.map((t) => <button key={t.id} className={`chip whitespace-nowrap text-sm ${tab === t.id ? 'chip-on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </nav>

        <div key={tab} className="animate-fade-up">
          {tab === 'play' && <PlayTab goShop={() => setTab('shop')} goCrates={() => setTab('crates')} />}
          {tab === 'shop' && <ShopTab />}
          {tab === 'crates' && <CratesTab />}
          {tab === 'milestones' && <MilestonesTab />}
          {tab === 'hof' && <HofTab />}
        </div>
      </div>
    </div>
  );
}

function PlayTab({ goShop, goCrates }: { goShop: () => void; goCrates: () => void }) {
  const { newCareer, load, meta } = useGame();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Spain');
  const [position, setPosition] = useState<PositionKey>('ST');
  const [slots, setSlots] = useState(allSlots());
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const owned = UPGRADES.filter((u) => (meta.upgrades[u.id] ?? 0) > 0);

  const start = () => {
    if (!newCareer(name || 'Alex Rivera', country, position)) setError('All three save slots are full. Delete a career first.');
  };

  return (
    <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6">
      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-3xl uppercase leading-none mb-5">New career</h2>
        <label htmlFor="pname" className="block text-xs font-extrabold uppercase tracking-wider mb-1">Player name</label>
        <input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" maxLength={28} className="w-full bg-white border-2 border-ink rounded-lg px-3 py-2.5 mb-4 font-semibold outline-none focus:shadow-[3px_3px_0_#121212]" />
        <label htmlFor="pcountry" className="block text-xs font-extrabold uppercase tracking-wider mb-1">Nationality</label>
        <select id="pcountry" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-white border-2 border-ink rounded-lg px-3 py-2.5 mb-4 font-semibold">
          {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name} · {c.leagueName}</option>)}
        </select>
        <div className="text-xs font-extrabold uppercase tracking-wider mb-2">Position</div>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {POSITIONS.map((p) => (
            <button key={p.key} onClick={() => setPosition(p.key)} className={`chip !p-2 text-left ${position === p.key ? 'chip-on' : ''}`}>
              <div className="font-display text-lg leading-none">{p.short}</div>
              <div className="text-[9px] text-muted font-bold mt-1 leading-tight hidden sm:block">{p.name}</div>
            </button>
          ))}
        </div>

        <div className="sticker-flat p-3 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider">Relics for this run · {meta.equipped.length}/{RELIC_SLOTS}</span>
            <button className="text-xs font-extrabold underline" onClick={goCrates}>Manage</button>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: RELIC_SLOTS }, (_, i) => {
              const r = meta.equipped[i] ? RELIC_MAP[meta.equipped[i]] : null;
              return (
                <div key={i} className={`flex-1 rounded-lg border-2 ${r ? 'border-ink' : 'border-dashed border-ink/40'} p-2 text-center min-h-[64px]`} style={r ? { background: RARITY_BG[r.rarity] } : undefined}>
                  {r ? <><div className="text-xl">{r.icon}</div><div className="text-[10px] font-extrabold leading-tight">{r.name}</div></> : <div className="text-[10px] text-muted font-bold pt-4">Empty</div>}
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-muted font-semibold mt-2">
            {owned.length ? <>Active upgrades: {owned.map((u) => `${u.name} ${meta.upgrades[u.id]}`).join(' · ')}</> : <>No legacy upgrades yet. <button className="underline font-bold" onClick={goShop}>Visit the shop</button></>}
          </div>
        </div>

        <button className="btn-red w-full !py-3.5 !text-lg" onClick={start}>Kick off career →</button>
        {error && <p className="text-red text-xs font-bold mt-3">{error}</p>}
      </section>

      <section className="panel p-5 h-fit">
        <h2 className="font-display text-2xl uppercase leading-none mb-4">Saved careers</h2>
        <div className="space-y-2.5">
          {slots.map((m, i) => m ? (
            <div key={i} className="sticker flex items-center gap-3 p-3">
              <div className="stat-num text-2xl w-11 h-11 grid place-items-center bg-sun border-2 border-ink rounded-lg">{m.overall}</div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold truncate">{m.name}</div>
                <div className="text-xs text-muted font-semibold truncate">{m.position} · {m.clubName} · {m.age} · {seasonLabel(m.year)}{m.retired ? ' · retired' : ''}</div>
              </div>
              {confirmDel === i ? (
                <>
                  <button className="btn-red btn-sm" onClick={() => { deleteSlot(i + 1); setSlots(allSlots()); setConfirmDel(null); setError(null); }}>Delete</button>
                  <button className="btn-white btn-sm" onClick={() => setConfirmDel(null)}>Keep</button>
                </>
              ) : (
                <>
                  <button className="btn-sun btn-sm" onClick={() => load(i + 1)}>{m.retired ? 'View' : 'Play'}</button>
                  <button className="btn-white btn-sm" aria-label={`Delete ${m.name}`} onClick={() => setConfirmDel(i)}>✕</button>
                </>
              )}
            </div>
          ) : (
            <div key={i} className="rounded-lg border-2 border-dashed border-ink/40 p-3 text-xs text-muted font-bold">Empty slot {i + 1}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ShopTab() {
  const { meta, metaAct } = useGame();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">Legacy shop</h2>
          <p className="text-sm text-muted font-semibold mt-2">Permanent upgrades. They apply to every career you start from now on.</p>
        </div>
        {msg && <span className="tag">{msg}</span>}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {UPGRADES.map((u, i) => {
          const lvl = meta.upgrades[u.id] ?? 0;
          const cost = upgradeCost(meta, u.id);
          const maxed = cost === null;
          return (
            <div key={u.id} className={`sticker p-4 flex flex-col ${i % 3 === 0 ? 'rotate-[-.6deg]' : i % 3 === 1 ? 'rotate-[.4deg]' : ''} ${maxed ? '!bg-sun' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-3xl leading-none">{u.icon}</div>
                <div className="flex gap-1">{u.costs.map((_, k) => <span key={k} className={`w-3 h-3 rounded-sm border-2 border-ink ${k < lvl ? 'bg-red' : 'bg-white'}`} />)}</div>
              </div>
              <div className="font-display text-lg uppercase mt-2 leading-none">{u.name}</div>
              <div className="text-xs font-semibold text-muted mt-2 min-h-[32px]">{maxed ? u.levels[u.levels.length - 1] : u.levels[lvl]}</div>
              {lvl > 0 && !maxed && <div className="text-[10px] font-bold mt-1">Now: {u.levels[lvl - 1]}</div>}
              <button
                className="btn-red btn-sm mt-3 self-start"
                disabled={maxed || meta.coins < (cost ?? 0)}
                onClick={(e) => {
                  const el = e.currentTarget;
                  const err = metaAct((m) => buyUpgrade(m, u.id));
                  setMsg(err ?? `${u.name} upgraded!`);
                  if (!err) burstFrom(el, 30);
                }}
              >
                {maxed ? 'Maxed' : <><span className="coin">c</span> {cost}</>}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CratesTab() {
  const { meta, metaAct } = useGame();
  const [opening, setOpening] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const counts = meta.relics.reduce<Record<string, number>>((acc, id) => { acc[id] = (acc[id] ?? 0) + 1; return acc; }, {});

  const open = (crateId: string) => {
    setMsg(null);
    setFound(null);
    let relic: string | null = null;
    const err = metaAct((m) => { const r = openCrate(m, crateId); if (typeof r === 'string') return r; relic = r.relic; return r.meta; });
    if (err) { setMsg(err); return; }
    setOpening(crateId);
    setTimeout(() => {
      setOpening(null);
      setFound(relic);
      const r = relic ? RELIC_MAP[relic] : null;
      if (r) fx({ type: 'stamp', text: r.rarity === 'legendary' ? 'LEGENDARY!' : r.name, tone: r.rarity === 'legendary' ? 'sun' : 'red' });
    }, 900);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-3xl uppercase leading-none">Crates</h2>
        <p className="text-sm text-muted font-semibold mt-2 mb-5">Each crate holds one relic: a one-run boost you equip before kicking off a career.</p>
        <div className="grid grid-cols-2 gap-4">
          {CRATES.map((cr) => (
            <div key={cr.id} className="flex flex-col gap-3">
              <button className={`pack ${cr.id === 'premium' ? 'pack-gold' : 'pack-bronze'} ${opening === cr.id ? 'pack-shake' : ''}`} disabled={!!opening} onClick={() => open(cr.id)}>
                <span className="text-[10px] font-black uppercase tracking-[.14em] relative">1 relic</span>
                <span className="font-display text-2xl uppercase leading-none relative">{cr.name}</span>
                <span className="text-[10px] font-bold relative">{Math.round((cr.odds.epic + cr.odds.legendary) * 100)}% epic or better</span>
              </button>
              <button className="btn-red btn-sm" disabled={meta.coins < cr.cost || !!opening} onClick={() => open(cr.id)}><span className="coin">c</span> {cr.cost}</button>
            </div>
          ))}
        </div>
        {msg && <p className="text-red text-xs font-bold mt-3">{msg}</p>}
        {found && (
          <div className="sticker mt-5 p-4 flex items-center gap-4 card-slap" style={{ background: RARITY_BG[RELIC_MAP[found].rarity] }}>
            <div className="text-4xl">{RELIC_MAP[found].icon}</div>
            <div><div className="text-[10px] font-black uppercase tracking-[.14em]">{RELIC_MAP[found].rarity} relic</div><div className="font-display text-xl uppercase leading-none">{RELIC_MAP[found].name}</div><div className="text-xs font-semibold mt-1">{RELIC_MAP[found].desc}</div></div>
          </div>
        )}
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-2xl uppercase leading-none">Your relics</h2>
        <p className="text-sm text-muted font-semibold mt-2 mb-4">Tap to equip up to {RELIC_SLOTS}. Equipped relics are used up when your next career starts.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {RELICS.map((r) => {
            const n = counts[r.id] ?? 0;
            const eq = meta.equipped.includes(r.id);
            return (
              <button key={r.id} disabled={n === 0} onClick={() => metaAct((m) => toggleEquip(m, r.id))} className={`sticker p-3 text-left relative transition ${n === 0 ? 'opacity-35 grayscale' : 'gcard-hover'} ${eq ? '!shadow-[5px_5px_0_#e0262f] -rotate-1' : ''}`} style={n ? { background: RARITY_BG[r.rarity] } : undefined}>
                {eq && <span className="tag absolute -top-2 -right-2">Equipped</span>}
                <div className="flex justify-between"><span className="text-2xl">{r.icon}</span><span className="stat-num text-sm">×{n}</span></div>
                <div className="font-display text-sm uppercase leading-tight mt-1">{r.name}</div>
                <div className="text-[10px] font-semibold leading-snug mt-1">{r.desc}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MilestonesTab() {
  const { meta } = useGame();
  const groups = ['Firsts', 'Volume', 'Glory'] as const;
  const done = MILESTONES.filter((m) => meta.milestones[m.id]).length;
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">Milestones</h2>
          <p className="text-sm text-muted font-semibold mt-2">Every career can earn each milestone once. Goals, assists, clean sheets, MOTMs, trophies and awards also pay coins every time.</p>
        </div>
        <span className="tag tag-sun !text-sm">{done} / {MILESTONES.length} unlocked</span>
      </div>
      {groups.map((g) => (
        <div key={g} className="mb-6 last:mb-0">
          <div className="eyebrow mb-2">{g}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {MILESTONES.filter((m) => m.group === g).map((m) => {
              const n = meta.milestones[m.id] ?? 0;
              return (
                <div key={m.id} className={`sticker-flat px-3 py-2 flex items-center gap-3 ${n ? '!bg-sun' : 'opacity-70'}`}>
                  <span className="text-lg w-6 text-center">{n ? '★' : '☆'}</span>
                  <span className="flex-1 text-sm font-bold leading-tight">{m.label}</span>
                  <span className="stat-num text-xs flex items-center gap-1"><span className="coin">c</span>{m.coins}</span>
                  {n > 1 && <span className="stat-num text-[10px] text-muted">×{n}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function HofTab() {
  const hof = loadHof();
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="font-display text-3xl uppercase leading-none mb-5">Hall of fame</h2>
      {hof.length === 0 ? <p className="text-sm text-muted font-semibold">Retire a player to induct them here.</p> : (
        <div className="space-y-2">
          {hof.map((h, i) => (
            <div key={h.id} className={`sticker flex items-center gap-3 px-3 py-2.5 ${i === 0 ? '!bg-sun' : ''}`}>
              <span className="stat-num text-lg w-6">{i + 1}</span>
              <div className="flex-1 min-w-0"><div className="font-extrabold truncate">{h.name}</div><div className="text-xs text-muted font-semibold truncate">{h.position} · {h.country} · peak {h.peakOvr}</div></div>
              <span className="text-xs font-bold hidden sm:inline">{h.apps} apps · {h.goals} G · {h.trophies} trophies{h.ballons ? ` · ${h.ballons} Ballon` : ''}</span>
              <span className="tag">{h.legacyTier}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

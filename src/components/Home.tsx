import { useEffect, useState } from 'react';
import { installState, onInstallChange, promptInstall } from '../game/install';
import type { PositionKey } from '../game/types';
import { useGame } from '../game/store';
import { allSlots, backupMeta, deleteSlot, exportSlot, firstFreeSlot, importToSlot, legacySaveCount, loadHof, restoreBackup, slotOccupied } from '../game/save';
import { buyUpgrade, openCrate, toggleEquip, upgradeCost } from '../game/meta';
import { COUNTRIES } from '../data/countries';
import { POSITIONS } from '../data/positions';
import { CRATES, TRINKETS, TRINKET_MAP, TRINKET_COLOR, TRINKET_RARITIES, UPGRADES, trinketSlots } from '../data/legacy';
import { MILESTONES } from '../engines/coins';
import { CARD_UNLOCKS } from '../engines/career';
import { seasonLabel } from '../engines/month';
import { Coin } from './ui';
import { fx, burstFrom } from './fx';

type Tab = 'play' | 'shop' | 'crates' | 'milestones' | 'hof';
const TABS: { id: Tab; label: string }[] = [
  { id: 'play', label: 'Play' }, { id: 'shop', label: 'Legacy shop' }, { id: 'crates', label: 'Trinkets' }, { id: 'milestones', label: 'Milestones' }, { id: 'hof', label: 'Hall of fame' },
];

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
            <p className="on-grass font-semibold mt-3 max-w-lg">Join an academy at 11, turn pro, play your career quarter by quarter, and earn legacy coins from every milestone to make your next run stronger.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
          <InstallButton />
          <div className="sticker !bg-sun px-4 py-3 rotate-[-2deg]">
            <div className="text-[10px] uppercase tracking-[.14em] font-black">Legacy coins</div>
            <div className="stat-num text-3xl flex items-center gap-2"><Coin />{meta.coins.toLocaleString('en-US')}</div>
            <div className="text-[10px] font-bold">{meta.lifetime.toLocaleString('en-US')} earned · {meta.careers} careers</div>
          </div>
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

/** install as an app: the real prompt where the browser offers one, otherwise the steps */
function InstallButton() {
  const [state, setState] = useState(installState());
  const [help, setHelp] = useState(false);
  useEffect(() => onInstallChange(() => setState(installState())), []);
  if (state === 'standalone') return null;
  const android = /android/i.test(navigator.userAgent);
  return (
    <div className="relative">
      <button className="btn-white btn-sm" onClick={async () => { if (state === 'ready') { await promptInstall(); setState(installState()); } else setHelp(!help); }}>📲 Install app</button>
      {help && (
        <div className="sticker absolute right-0 top-full mt-2 z-40 w-[min(300px,80vw)] p-3 text-xs font-semibold text-left">
          {state === 'ios' ? <>In Safari, tap <b>Share</b> (the square with an arrow), then <b>Add to Home Screen</b>.</>
            : android ? <>In Chrome, open the <b>⋮</b> menu and tap <b>Add to Home screen</b> (or <b>Install app</b>), then <b>Install</b>.</>
            : <>In Chrome or Edge, open the <b>⋮</b> menu, then <b>Cast, save and share → Install page as app</b> (Edge: <b>Apps → Install this site as an app</b>).</>}
          <div className="text-[10px] text-muted mt-1.5">Your saves stay the same: the app and this page share them.</div>
        </div>
      )}
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
  const tSlots = trinketSlots(meta.upgrades);

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
            <span className="text-xs font-extrabold uppercase tracking-wider">Trinkets this run · {meta.equipped.length}/{tSlots}</span>
            <button className="text-xs font-extrabold underline" onClick={goCrates}>{meta.trinkets.length ? 'Change' : 'Get trinkets'}</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, i) => {
              const r = meta.equipped[i] ? TRINKET_MAP[meta.equipped[i]] : null;
              const locked = i >= tSlots;
              return (
                <div key={i} className={`rounded-lg border-2 ${r ? 'border-ink' : 'border-dashed border-ink/40'} p-2 text-center min-h-[68px] ${locked ? 'opacity-50' : ''}`} style={r ? { background: TRINKET_COLOR[r.rarity] } : undefined}>
                  {r ? <><div className="text-xl">{r.icon}</div><div className="text-[10px] font-extrabold leading-tight">{r.name}</div></> : <div className="text-[10px] text-muted font-bold pt-4">{locked ? '🔒 Locked' : 'Empty'}</div>}
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-muted font-semibold mt-2">
            {owned.length ? <>Upgrades: {owned.map((u) => `${u.name} ${meta.upgrades[u.id]}`).join(' · ')}</> : <>No legacy upgrades yet. <button className="underline font-bold" onClick={goShop}>Visit the shop</button></>}
          </div>
        </div>

        <div className="sticker-flat p-3 mb-5">
          <div className="text-xs font-extrabold uppercase tracking-wider mb-2">Card quality · {meta.completed ?? 0} careers completed</div>
          <div className="grid grid-cols-4 gap-1.5">
            {CARD_UNLOCKS.map((u) => {
              const on = (meta.completed ?? 0) >= u.careers;
              return (
                <div key={u.tier} className={`rounded-md border-2 border-ink px-1.5 py-1 text-center ${on ? '' : 'opacity-40'}`} style={{ background: on ? `var(--${u.tier})` : '#fff' }}>
                  <div className="text-[10px] font-black uppercase">{u.tier}</div>
                  <div className="text-[9px] font-bold">{on ? 'unlocked' : `after ${u.careers}`}</div>
                </div>
              );
            })}
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
                  <button className="btn-white btn-sm" title="Download this save as a file" aria-label={`Download ${m.name}`} onClick={() => download(i + 1, m.name)}>⬇</button>
                  <button className="btn-white btn-sm" aria-label={`Delete ${m.name}`} onClick={() => setConfirmDel(i)}>✕</button>
                </>
              )}
            </div>
          ) : slotOccupied(i + 1) ? (
            <div key={i} className="rounded-lg border-2 border-red p-3 text-xs font-bold flex items-center gap-2">
              <span className="flex-1">Slot {i + 1}: this save could not be read.</span>
              <button className="btn-white btn-sm" onClick={() => download(i + 1, `slot-${i + 1}`)}>⬇ File</button>
              {backupMeta(i + 1) && <button className="btn-sun btn-sm" onClick={() => { restoreBackup(i + 1); setSlots(allSlots()); }}>Restore backup</button>}
              {confirmDel === i ? <button className="btn-red btn-sm" onClick={() => { deleteSlot(i + 1); setSlots(allSlots()); setConfirmDel(null); }}>Delete it</button> : <button className="btn-white btn-sm" onClick={() => setConfirmDel(i)}>Clear slot</button>}
            </div>
          ) : (
            <EmptySlot key={i} n={i + 1} onRestore={() => setSlots(allSlots())} />
          ))}
          <label className="btn-white btn-sm inline-block cursor-pointer">
            ⬆ Import save file
            <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              const free = firstFreeSlot();
              if (!free) { setError('All slots are full. Delete one first.'); return; }
              const err = importToSlot(free, await f.text());
              setError(err);
              setSlots(allSlots());
            }} />
          </label>
          {error && <p className="text-red text-xs font-bold">{error}</p>}
          {legacySaveCount() > 0 && <p className="text-[11px] text-muted font-semibold">Saves from the original version of the game ({legacySaveCount()}) can't be continued in this version. Start a new career.</p>}
        </div>
      </section>
    </div>
  );
}

function download(slot: number, name: string) {
  const raw = exportSlot(slot);
  if (!raw) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  a.download = `xi-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function EmptySlot({ n, onRestore }: { n: number; onRestore: () => void }) {
  const b = backupMeta(n);
  return (
    <div className="rounded-lg border-2 border-dashed border-ink/40 p-3 text-xs text-muted font-bold flex items-center gap-2">
      <span className="flex-1">Empty slot {n}{b ? <> · backup: {b.name}, {b.age}, {b.clubName}</> : null}</span>
      {b && <button className="btn-white btn-sm" onClick={() => { restoreBackup(n); onRestore(); }}>Restore</button>}
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
  const [found, setFound] = useState<{ id: string; dup: boolean; refund: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const slots = trinketSlots(meta.upgrades);

  const open = (crateId: string) => {
    setMsg(null);
    setFound(null);
    let res: { id: string; dup: boolean; refund: number } | null = null;
    const err = metaAct((m) => { const r = openCrate(m, crateId); if (typeof r === 'string') return r; res = { id: r.trinket, dup: r.duplicate, refund: r.refund }; return r.meta; });
    if (err) { setMsg(err); return; }
    setOpening(crateId);
    setTimeout(() => {
      setOpening(null);
      setFound(res);
      const t = res ? TRINKET_MAP[(res as { id: string }).id] : null;
      if (t && !(res as { dup: boolean }).dup) fx({ type: 'stamp', text: t.rarity === 'legendary' || t.rarity === 'epic' ? `${t.rarity}!` : t.name, tone: t.rarity === 'legendary' ? 'sun' : 'red' });
    }, 900);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.35fr] gap-6">
      <section className="panel p-5 sm:p-6 h-fit">
        <h2 className="font-display text-3xl uppercase leading-none">Crates</h2>
        <p className="text-sm text-muted font-semibold mt-2 mb-5">Each crate holds one trinket. Trinkets are yours forever: slot them into every career you start.</p>
        <div className="grid grid-cols-3 gap-3">
          {CRATES.map((cr) => (
            <div key={cr.id} className="flex flex-col gap-2">
              <button className={`pack ${cr.id === 'legend' ? 'pack-elite' : cr.id === 'premium' ? 'pack-gold' : 'pack-bronze'} ${opening === cr.id ? 'pack-shake' : ''}`} disabled={!!opening} onClick={() => open(cr.id)}>
                <span className="text-[9px] font-black uppercase tracking-[.12em] relative">1 trinket</span>
                <span className="font-display text-lg sm:text-xl uppercase leading-none relative">{cr.name}</span>
                <span className="text-[9px] font-bold relative leading-tight">{Math.round((cr.odds.epic + cr.odds.legendary) * 100)}% epic+</span>
              </button>
              <button className="btn-red btn-sm" disabled={meta.coins < cr.cost || !!opening} onClick={() => open(cr.id)}><span className="coin">c</span> {cr.cost}</button>
            </div>
          ))}
        </div>
        {msg && <p className="text-red text-xs font-bold mt-3">{msg}</p>}
        {found && (() => { const t = TRINKET_MAP[found.id]; return (
          <div className="sticker mt-5 p-4 flex items-center gap-4 card-slap" style={{ background: TRINKET_COLOR[t.rarity] }}>
            <div className="text-4xl">{t.icon}</div>
            <div><div className="text-[10px] font-black uppercase tracking-[.14em]">{t.rarity} trinket{found.dup ? ` · duplicate, +${found.refund} coins back` : ' · new!'}</div><div className="font-display text-xl uppercase leading-none">{t.name}</div><div className="text-xs font-semibold mt-1">{t.desc}</div></div>
          </div>
        ); })()}
        <div className="mt-5 text-[11px] font-bold text-muted space-y-0.5">
          {CRATES.map((cr) => <div key={cr.id}>{cr.name}: {TRINKET_RARITIES.filter((r) => cr.odds[r] > 0).map((r) => `${Math.round(cr.odds[r] * 100)}% ${r}`).join(' · ')}</div>)}
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="flex justify-between items-end gap-2">
          <h2 className="font-display text-2xl uppercase leading-none">Your trinkets · {meta.trinkets.length}/{TRINKETS.length}</h2>
          <span className="tag tag-sun">{meta.equipped.length}/{slots} slotted</span>
        </div>
        <p className="text-sm text-muted font-semibold mt-2 mb-4">Tap a trinket to slot it for your next career. {slots < 3 ? 'Unlock more slots in the Legacy shop.' : ''}</p>
        {TRINKET_RARITIES.map((rar) => (
          <div key={rar} className="mb-4 last:mb-0">
            <div className="eyebrow mb-2" style={{ color: 'var(--ink)' }}><span className="inline-block w-2.5 h-2.5 rounded-sm border border-ink mr-1.5" style={{ background: TRINKET_COLOR[rar] }} />{rar}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TRINKETS.filter((t) => t.rarity === rar).map((t) => {
                const own = meta.trinkets.includes(t.id);
                const eq = meta.equipped.includes(t.id);
                return (
                  <button key={t.id} disabled={!own} onClick={() => metaAct((m) => toggleEquip(m, t.id))} className={`sticker p-3 text-left relative transition ${own ? 'gcard-hover' : 'opacity-35 grayscale'} ${eq ? '!shadow-[5px_5px_0_#e0262f] -rotate-1' : ''}`} style={own ? { background: TRINKET_COLOR[t.rarity] } : undefined}>
                    {eq && <span className="tag absolute -top-2 -right-2">Slotted</span>}
                    <div className="text-2xl">{own ? t.icon : '?'}</div>
                    <div className="font-display text-sm uppercase leading-tight mt-1">{own ? t.name : '???'}</div>
                    <div className="text-[10px] font-semibold leading-snug mt-1">{own ? t.desc : 'Not found yet'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
              {h.grade && <span className="font-display text-xl w-9 h-9 grid place-items-center rounded-lg border-2 border-ink bg-red text-white">{h.grade}</span>}
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

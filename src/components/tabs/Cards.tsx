import { useState } from 'react';
import { useGame } from '../../game/store';
import type { CardDef, CardKind, PackTier } from '../../game/types';
import { CARD_MAP, MAX_BOOSTS, MAX_HAND, MAX_STAFF, MAX_TRAITS, PACKS, RARITY_ORDER } from '../../data/cards';
import { TRAIT_MAP } from '../../data/traits';
import { buyPack, cardBlocker, openPack, packPrice, releaseStaff, sellCard, playCard, SELL_VALUE } from '../../engines/cards';
import { fmtMoney } from '../../engines/util';
import { EmptyState, GameCard, Modal, SectionTitle } from '../ui';

const FILTERS: { id: CardKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'skill', label: 'Training' }, { id: 'boost', label: 'Boosts' }, { id: 'recovery', label: 'Recovery' },
  { id: 'potential', label: 'Potential' }, { id: 'trait', label: 'Traits' }, { id: 'staff', label: 'Staff' },
];

export default function Cards() {
  const { career, act, setReveal } = useGame();
  const [filter, setFilter] = useState<CardKind | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!career) return null;
  const c = career;
  const p = c.player;
  const hand = c.cards
    .map((x) => ({ inst: x, def: CARD_MAP[x.defId] }))
    .filter((x) => filter === 'all' || x.def.kind === filter)
    .sort((a, b) => RARITY_ORDER.indexOf(b.def.rarity) - RARITY_ORDER.indexOf(a.def.rarity));
  const sel = selected ? c.cards.find((x) => x.uid === selected) : null;
  const selDef = sel ? CARD_MAP[sel.defId] : null;

  const open = (uid: string) => {
    const res = act((x) => openPack(x, uid));
    if (res.error) setMsg(res.error);
    else { setMsg(null); setReveal(res.cards); }
  };

  return (
    <div className="space-y-5">
      {msg && <div className="text-sm rounded-md bg-orange/10 border border-orange/40 px-3 py-2">{msg}</div>}

      <section className="panel p-5">
        <SectionTitle kicker="Unopened" title={`Packs (${c.packs.length})`} right={c.packs.length > 1 ? <button className="btn-ghost text-xs" onClick={() => open(c.packs[0].uid)}>Open next</button> : undefined} />
        {c.packs.length === 0 ? <EmptyState>Earn packs every month, for Man of the Match displays, big months, awards and trophies, or buy them below.</EmptyState> : (
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3">
            {c.packs.map((pk) => (
              <button key={pk.uid} onClick={() => open(pk.uid)} className={`pack pack-${pk.tier} text-left`}>
                <div className="text-[10px] uppercase tracking-[.14em] font-black opacity-80">{PACKS[pk.tier].size} cards</div>
                <div>
                  <div className="font-display text-xl font-extrabold leading-none">{PACKS[pk.tier].name.split(' ')[0].toUpperCase()}</div>
                  <div className="text-[10px] mt-1 opacity-80 leading-tight line-clamp-2">{pk.reason}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <SectionTitle kicker={`${c.cards.length} / ${MAX_HAND}`} title="Your hand" />
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTERS.map((f) => <button key={f.id} className={`chip ${filter === f.id ? 'chip-on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        </div>
        {hand.length === 0 ? <EmptyState>No cards here. Open some packs.</EmptyState> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {hand.map(({ inst, def }) => (
              <GameCard key={inst.uid} def={def} compact isNew={inst.isNew} onClick={() => { setSelected(inst.uid); setMsg(null); act((x) => { const k = x.cards.find((y) => y.uid === inst.uid); if (k) k.isNew = false; }); }} />
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="panel p-5">
          <SectionTitle kicker={`${p.boosts.length} / ${MAX_BOOSTS}`} title="Active boosts" />
          {p.boosts.length === 0 ? <EmptyState>Boost cards add temporary attributes for the next few matches you play.</EmptyState> : p.boosts.map((b) => (
            <div key={b.uid} className="flex justify-between text-sm py-1.5 border-b border-line/50 last:border-0"><span>⚡ {b.name}</span><span className="text-muted">{b.matchesLeft} match{b.matchesLeft > 1 ? 'es' : ''} left</span></div>
          ))}
        </section>
        <section className="panel p-5">
          <SectionTitle kicker={`${p.staff.length} / ${MAX_STAFF}`} title="Personal staff" />
          {p.staff.length === 0 ? <EmptyState>Staff cards give lasting perks for a monthly fee.</EmptyState> : p.staff.map((id) => (
            <div key={id} className="flex items-center justify-between text-sm py-1.5 border-b border-line/50 last:border-0">
              <span>☻ {CARD_MAP[id].name}<span className="block text-[11px] text-muted">{CARD_MAP[id].desc} · {fmtMoney(CARD_MAP[id].monthlyCost ?? 0)}/mo</span></span>
              <button className="btn-ghost text-[11px]" onClick={() => act((x) => releaseStaff(x, id))}>Release</button>
            </div>
          ))}
        </section>
        <section className="panel p-5">
          <SectionTitle kicker={`${p.traits.length} / ${MAX_TRAITS}`} title="Traits" />
          {p.traits.length === 0 ? <EmptyState>Trait cards are rare, permanent playstyles.</EmptyState> : p.traits.map((t) => (
            <div key={t} className="text-sm py-1.5 border-b border-line/50 last:border-0">◆ {TRAIT_MAP[t]?.name}<span className="block text-[11px] text-muted">{TRAIT_MAP[t]?.desc}</span></div>
          ))}
        </section>
      </div>

      <section className="panel p-5">
        <SectionTitle kicker={`Bank ${fmtMoney(p.money)}`} title="Pack store" />
        <p className="text-xs text-muted mb-3">Prices rise 35% with every pack you buy this season, then reset in July.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(PACKS) as PackTier[]).map((t) => {
            const price = packPrice(c, t);
            return (
              <div key={t} className="rounded-xl border border-line p-3 flex flex-col gap-2">
                <div className={`pack pack-${t} !aspect-[4/3]`}>
                  <div className="text-[10px] uppercase tracking-[.14em] font-black opacity-80">{PACKS[t].size} cards</div>
                  <div className="font-display text-xl font-extrabold">{PACKS[t].name.toUpperCase()}</div>
                </div>
                <div className="text-[11px] text-muted">Guaranteed {PACKS[t].guarantee}+ · {Math.round(PACKS[t].odds.legendary * 100)}% legendary</div>
                <button className="btn-primary text-xs" disabled={p.money < price} onClick={() => { const e = act((x) => buyPack(x, t)); setMsg(e); }}>Buy {fmtMoney(price)}</button>
              </div>
            );
          })}
        </div>
      </section>

      {sel && selDef && <CardModal def={selDef} onClose={() => setSelected(null)} onUse={() => { const r = act((x) => playCard(x, sel.uid)); setMsg(r.msg); if (r.ok) setSelected(null); }} onSell={() => { const v = act((x) => sellCard(x, sel.uid)); setMsg(`Sold for ${fmtMoney(v)}.`); setSelected(null); }} blocker={cardBlocker(c, selDef)} />}
    </div>
  );
}

function CardModal({ def, onClose, onUse, onSell, blocker }: { def: CardDef; onClose: () => void; onUse: () => void; onSell: () => void; blocker: string | null }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-5 grid sm:grid-cols-[200px_1fr] gap-5 items-start">
        <div className="h-[270px]"><GameCard def={def} /></div>
        <div>
          <div className="eyebrow mb-2">{def.kind}</div>
          <h3 className="font-display text-3xl font-bold">{def.name}</h3>
          <p className="text-sm text-muted mt-2">{def.desc}</p>
          {def.kind === 'skill' && <p className="text-[11px] text-muted mt-3">Skill cards can't push an attribute past its ceiling. After 30 they are 25% weaker, and once you pass your prime they're 50% weaker.</p>}
          {def.kind === 'staff' && <p className="text-[11px] text-muted mt-3">Costs {fmtMoney(def.monthlyCost ?? 0)} every month while employed.</p>}
          {blocker && <p className="text-sm text-orange mt-3">{blocker}</p>}
          <div className="flex gap-2 mt-5">
            <button className="btn-primary flex-1" disabled={!!blocker} onClick={onUse}>{def.kind === 'staff' ? 'Hire' : 'Play card'}</button>
            <button className="btn-ghost" onClick={onSell}>Sell {fmtMoney(SELL_VALUE[def.rarity])}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

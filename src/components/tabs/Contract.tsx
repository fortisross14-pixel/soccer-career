import { useState } from 'react';
import { useGame } from '../../game/store';
import type { Offer } from '../../game/types';
import { CLUB_MAP } from '../../data/clubs';
import { acceptOffer, pushOffer, rejectOffer, type PushAsk } from '../../engines/market';
import { canRequestLoan, canSeekMinutes, requestLoan, requestMinutes, requestTransfer } from '../../engines/career';
import { currentRole, roleRank } from '../../engines/match';
import { continentalName } from '../../engines/calendar';
import { isWindow } from '../../engines/month';
import { displayOverall } from '../../engines/overall';
import { fmtMoney } from '../../engines/util';
import { clubLeague, divOf, tierLabel } from '../../engines/world';
import { RoleBadge, SectionTitle, Stat, EmptyState } from '../ui';

export default function Contract() {
  const { career, act } = useGame();
  const [msg, setMsg] = useState<string | null>(null);
  if (!career) return null;
  const c = career;
  const p = c.player;
  const ct = p.contract;
  const club = ct ? CLUB_MAP[ct.clubId] : null;
  const role = ct ? currentRole(c) : null;
  const loanBlock = canRequestLoan(c);
  const window = isWindow(c.month);

  return (
    <div className="space-y-5">
      {c.academy && (
        <section className="panel p-5 !bg-sun">
          <SectionTitle kicker="Academy" title={`${CLUB_MAP[c.academy.clubId].name} academy`} />
          <p className="text-sm font-semibold">You are {p.age}. You stay here until a club signs you, you are promoted to the first team, or you turn 20 and must leave. Offers arrive in the July–August and January windows (pro clubs from 16; bigger academies scout you before that). You can also ask your agent for a move where you would play more.</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Stat label="Coaching level" value={CLUB_MAP[c.academy.clubId].rating} />
            <Stat label="Your OVR" value={displayOverall(p)} />
            <Stat label="Must leave in" value={`${Math.max(0, 20 - p.age)} yr`} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button className="btn-white btn-sm" disabled={!!canSeekMinutes(c)} title={canSeekMinutes(c) ?? ''} onClick={() => setMsg(act((x) => requestMinutes(x)))}>Find me more minutes</button>
            <span className="text-[11px] font-semibold">{canSeekMinutes(c) ?? 'Your agent looks for academies or clubs where you would be a regular.'}</span>
          </div>
          {msg && <div className="mt-3 text-sm sticker-flat px-3 py-2 font-semibold">{msg}</div>}
        </section>
      )}
      {!c.academy && (
      <section className="panel p-5">
        <SectionTitle kicker="Current deal" title={club ? club.name : 'Free agent'} right={ct?.parentClubId ? <span className="pill border-ink text-sky">On loan from {CLUB_MAP[ct.parentClubId].name}</span> : undefined} />
        {ct && club ? (
          <>
            <div className="text-sm text-muted mb-4">{clubLeague(c, club.id)} ({tierLabel(divOf(c, club.id))}) · club rating <span className="stat-num text-ink">{club.rating}</span> · your OVR <span className="stat-num text-ink">{displayOverall(p)}</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Wage" value={fmtMoney(ct.wage)} sub="per year" />
              <Stat label="Contract" value={`${ct.yearsLeft} yr`} sub={`ends June ${c.year + ct.yearsLeft}`} />
              <Stat label="Promised role" value={<RoleBadge role={ct.promisedRole} />} />
              <Stat label="Actual role" value={role ? <RoleBadge role={role} /> : '—'} sub={`trust ${Math.round(p.trust)}`} />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn-white btn-sm" disabled={p.transferListed} onClick={() => setMsg(act((x) => requestTransfer(x)))}>{p.transferListed ? 'On the transfer list' : 'Request a transfer'}</button>
              <button className="btn-white btn-sm" disabled={!!canSeekMinutes(c)} title={canSeekMinutes(c) ?? ''} onClick={() => setMsg(act((x) => requestMinutes(x)))}>Find me more minutes</button>
              <button className="btn-white btn-sm" disabled={!!loanBlock} title={loanBlock ?? ''} onClick={() => setMsg(act((x) => requestLoan(x)))}>Ask for a loan</button>
            </div>
            <p className="text-[11px] text-muted mt-2">{loanBlock && window ? `Loan: ${loanBlock}` : 'Transfer requests hurt manager trust but bring more offers. Loans give young fringe players starter minutes.'}</p>
          </>
        ) : <p className="text-sm text-muted">You have no club. Choose one of the offers below.</p>}
        {msg && <div className="mt-3 text-sm rounded-md bg-sun border border-ink px-3 py-2">{msg}</div>}
      </section>
      )}

      <section className="panel p-5">
        <SectionTitle kicker={window ? 'Transfer window open' : 'Transfer window closed'} title="Offers" />
        {!window && c.offers.length === 0 && <p className="text-sm text-muted mb-2">Windows are open in <b>July–August</b> (summer) and <b>January</b> (winter). Your form, rating and reputation decide who calls.</p>}
        <OffersList onMsg={setMsg} />
      </section>
    </div>
  );
}

export function OffersList({ onMsg }: { onMsg?: (m: string) => void }) {
  const { career, act } = useGame();
  const [local, setLocal] = useState<Record<string, string>>({});
  if (!career) return null;
  const c = career;
  if (c.offers.length === 0) return <EmptyState>No offers right now.</EmptyState>;
  const cur = c.player.contract;
  const curClub = cur ? CLUB_MAP[cur.clubId] : null;

  const push = (o: Offer, ask: PushAsk) => {
    const m = act((x) => pushOffer(x, o.uid, ask));
    setLocal((s) => ({ ...s, [o.uid]: m }));
  };

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {c.offers.map((o) => {
        const club = CLUB_MAP[o.clubId];
        const cont = divOf(c, club.id) === 1 && club.division === 1 && club.continental !== 'none' ? continentalName(club.country, club.continental) : null;
        const kindLabel = o.kind === 'renewal' ? 'Contract extension' : o.kind === 'loan' ? 'Loan offer' : o.kind === 'academy' ? 'Academy place' : o.kind === 'promotion' ? 'First-team promotion' : o.kind === 'first' || c.academy ? 'First pro contract' : 'Transfer offer';
        const better = curClub ? club.rating - curClub.rating : 0;
        return (
          <div key={o.uid} className={`rounded-xl border p-4 flex flex-col ${o.kind === 'renewal' ? 'border-ink bg-[#e6f8ee]' : 'border-ink bg-white'}`}>
            <div className="flex justify-between text-[10px] uppercase tracking-[.14em] font-bold text-muted"><span>{kindLabel}</span>{o.note && <span className="text-[#c65d00] normal-case tracking-normal">{o.note}</span>}</div>
            <div className="flex items-start justify-between mt-2 gap-2">
              <div className="min-w-0">
                <div className="font-display text-lg uppercase leading-[1.05] break-words">{club.name}</div>
                <div className="text-xs text-muted truncate">{clubLeague(c, club.id)} · {club.country}</div>
              </div>
              <div className="text-right">
                <div className="stat-num text-2xl text-ink">{club.rating}</div>
                {curClub && o.kind !== 'renewal' && <div className={`text-[10px] stat-num ${better >= 0 ? 'text-[#178a4c]' : 'text-red'}`}>{better >= 0 ? '+' : ''}{better}</div>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 my-3">
              <RoleBadge role={o.role} />
              {cont && <span className="pill text-sky border-ink">{cont}</span>}
              <span className="pill text-muted">{club.tier}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              {o.kind === 'academy' ? <div><div className="stat-num text-lg">Youth place</div><div className="text-[11px] text-muted">Coaching level {club.rating} · until age 20</div></div> : <div><div className="stat-num text-lg">{fmtMoney(o.wage)}<span className="text-xs text-muted">/yr</span></div><div className="text-[11px] text-muted">{o.kind === 'loan' ? 'Parent club pays your wage' : `${o.years}-year deal`}</div></div>}
              {cur && o.kind !== 'loan' && <div className="text-right text-[11px] text-muted">now {fmtMoney(cur.wage)}<br />{o.wage >= cur.wage ? <span className="text-[#178a4c]">+{Math.round((o.wage / cur.wage - 1) * 100)}%</span> : <span className="text-red">{Math.round((o.wage / cur.wage - 1) * 100)}%</span>}</div>}
            </div>
            {roleRank(o.role) <= 1 && <div className="text-[11px] text-[#c65d00] mb-2">Few minutes expected. Development will be slower.</div>}
            {local[o.uid] && <div className="text-[11px] text-ink bg-white rounded px-2 py-1.5 mb-2">{local[o.uid]}</div>}
            <div className="mt-auto space-y-2">
              {!o.final && o.kind !== 'loan' && (
                <div className="grid grid-cols-3 gap-1.5">
                  <button className="btn-white btn-sm text-[11px] px-1" onClick={() => push(o, 'wage')}>+ Wage</button>
                  <button className="btn-white btn-sm text-[11px] px-1" disabled={o.role === 'star'} onClick={() => push(o, 'role')}>+ Role</button>
                  <button className="btn-white btn-sm text-[11px] px-1" disabled={o.years >= 5} onClick={() => push(o, 'years')}>+ Years</button>
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn-red flex-1" onClick={() => { const m = act((x) => acceptOffer(x, o.uid)); onMsg?.(m); }}>Sign</button>
                {o.kind !== 'first' && !(o.kind === 'academy' && !c.academy) && <button className="btn-white btn-sm" onClick={() => act((x) => rejectOffer(x, o.uid))}>Reject</button>}
              </div>
              {!o.final && o.kind !== 'loan' && <div className="text-[10px] text-muted text-center">Negotiating can improve terms, but clubs may refuse or walk away.</div>}
              {o.final && <div className="text-[10px] text-[#c65d00] text-center">Final offer</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

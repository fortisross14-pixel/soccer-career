import { useState } from 'react';
import type { Player, AgentType } from '../../game/types';
import { useGame } from '../../game/store';
import { getCountry } from '../../data/countries';
import { CLUB_MAP, youthClub } from '../../data/clubs';
import { playerOverall } from '../../engines/overall';
import { fmtMoney } from '../../engines/util';
import { RoleBadge } from '../ui';

export default function Actions({ player }: { player: Player }) {
  const { sign, search, sponsor, renegotiate, retire, transferRequest, loanRequest, targetedSearch, setAgent } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const [targetCountry,setTargetCountry]=useState('Spain');
  const [contractPriority,setContractPriority]=useState<'wage'|'role'|'security'>('wage');
  const ovr = playerOverall(player);
  const canIntl = player.age >= 18;
  const currentClub = player.contract ? CLUB_MAP[player.contract.clubId] : player.age < 16 ? youthClub(player.country, player.academyClubId) : null;
  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2600); };
  const sourceLabel = (source?: Player['offers'][number]['source']) => source === 'international-scout' ? 'Agent search · International' : source === 'domestic-scout' ? 'Agent search · Domestic' : source === 'transfer-request' ? 'Transfer request' : 'Unsolicited interest';

  return (
    <div className="space-y-6 animate-fade-up">
      <section className="card overflow-hidden">
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-7 border-b lg:border-b-0 lg:border-r border-zinc-800">
            <div className="eyebrow mb-2">Current situation</div>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <h2 className="font-display text-3xl">{currentClub?.name ?? 'Free agent'}</h2>
                <div className="text-zinc-500 mt-1">{currentClub ? `${getCountry(currentClub.country).leagueName} · ${currentClub.country}` : 'No active club agreement'}</div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <RoleBadge role={player.role} />
                  {currentClub?.continental !== 'none' && <span className="pill border-sky-500/30 bg-sky-500/10 text-sky-300">{currentClub.continental === 'CL' ? 'Champions League' : 'Europa League'}</span>}
                  {player.age < 16 && <span className="pill border-amber-500/30 bg-amber-500/10 text-amber-200">Academy · {player.academyFocus ?? 'Balanced'} focus</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">Contract value</div>
                <div className="stat-num text-3xl text-pitch-400 mt-1">{player.contract ? fmtMoney(player.contract.wage) : player.age < 16 ? 'Academy' : '—'}</div>
                <div className="text-xs text-zinc-500">{player.contract ? `${player.contract.yearsLeft} year${player.contract.yearsLeft === 1 ? '' : 's'} remaining` : player.age < 16 ? 'No professional salary' : 'Available immediately'}</div>
              </div>
            </div>
          </div>
          <div className="p-7 bg-zinc-900/35">
            <div className="eyebrow mb-4">Leverage & relationships</div>
            <div className="space-y-4">
              <StatusBar label="Manager trust" value={player.managerTrust ?? 55} />
              <StatusBar label="Morale" value={player.morale ?? 70} />
              <StatusBar label="Fitness" value={player.fitness ?? 80} />
            </div>
            <p className="text-xs text-zinc-500 mt-5">Strong form, trust and reputation improve your negotiating position. Transfer demands can damage the manager relationship.</p>
          </div>
        </div>
      </section>


      <section className="card p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div><div className="eyebrow mb-2">Representation</div><h3 className="font-display text-2xl mb-3">Choose your agent</h3><select value={player.agentType ?? 'family'} onChange={e=>setAgent(e.target.value as AgentType)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"><option value="family">Family representative · loyal, limited network</option><option value="local">Local specialist · stronger domestic deals</option><option value="international">International super-agent · broader market</option><option value="commercial">Commercial specialist · sponsorship focused</option></select></div>
          <div><div className="eyebrow mb-2">Targeted market search</div><h3 className="font-display text-2xl mb-3">Ask for a specific country</h3><div className="flex gap-2"><select value={targetCountry} onChange={e=>setTargetCountry(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">{['Spain','England','Germany','Italy','France','Portugal','Netherlands','Japan','Brazil','Argentina'].map(c=><option key={c}>{c}</option>)}</select><button className="btn-primary px-5" onClick={()=>showToast(`Agent found ${targetedSearch(targetCountry)} targeted options.`)}>Search</button></div></div>
        </div>
      </section>

      <section className="card p-6">
        <div className="eyebrow mb-4">Contract & career actions</div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          <ActionBtn title="Scout domestic clubs" sub={player.searchedDomesticThisYear ? 'Already used this season' : 'Ask your agent for local opportunities'} disabled={player.searchedDomesticThisYear} onClick={() => { search('domestic'); showToast('Domestic clubs scouted.'); }} />
          <ActionBtn title="Scout international clubs" sub={!canIntl ? 'Available from age 18' : player.searchedInternationalThisYear ? 'Already used this season' : 'Ask your agent to explore foreign leagues'} disabled={!canIntl || player.searchedInternationalThisYear} onClick={() => { search('international'); showToast('International clubs scouted.'); }} />
          <ActionBtn title="Request a loan" sub={player.age < 16 ? 'Available from age 16' : player.loanRequestedThisYear ? 'Already requested this season' : 'Seek a one-year move for playing time'} disabled={player.age < 16 || player.loanRequestedThisYear} onClick={() => { const count=loanRequest(); showToast(`Loan request generated ${count} options.`); }} />
          <ActionBtn title="Request a transfer" sub={player.age < 17 ? 'Available from age 17' : player.transferRequestedThisYear ? 'Already requested this season' : 'Creates interest, but manager trust falls'} disabled={player.age < 17 || player.transferRequestedThisYear} onClick={() => { const count = transferRequest(); showToast(`Transfer request submitted: ${count} responses.`); }} />
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><div className="font-medium text-sm">Renegotiate contract</div><select value={contractPriority} onChange={e=>setContractPriority(e.target.value as typeof contractPriority)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs mt-2"><option value="wage">Prioritize salary</option><option value="role">Prioritize squad role</option><option value="security">Prioritize contract length</option></select><button disabled={!player.contract || player.renegotiatedThisYear} className="btn-primary w-full mt-2 py-2 text-xs disabled:opacity-40" onClick={()=>{const result=renegotiate(contractPriority);showToast(result.msg)}}>Open talks</button></div>
          <ActionBtn title="Sign a sponsorship" sub={player.age < 18 ? 'Available from age 18' : player.sponsoredThisYear ? 'Already signed this season' : 'One commercial agreement per season'} disabled={player.age < 18 || player.sponsoredThisYear} onClick={() => { const amount = sponsor(); showToast(amount ? `Sponsorship signed: +${fmtMoney(amount)}` : 'Already sponsored this season.'); }} />
          <ActionBtn title="Retire" danger sub={player.age < 30 ? 'Retiring early permanently ends the career' : 'Hang up the boots'} disabled={player.retired} onClick={() => { if (confirm(`Retire at ${player.age}?`)) { retire(); showToast('You have retired.'); } }} />
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4"><div><div className="eyebrow">Available agreements</div><div className="text-sm text-zinc-500 mt-1">Compare role, club level and pathway before committing.</div></div><span className="text-xs text-zinc-500">OVR {ovr} · REP {Math.round(player.reputation)}</span></div>
        {player.offers.length === 0 ? <p className="text-zinc-500 text-sm py-5">No offers on the table. Scout clubs or advance the year to attract interest.</p> : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {player.offers.map((offer, index) => {
              const country = getCountry(offer.country);
              return <div key={`${offer.clubId}-${offer.source}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-pitch-700 transition-colors">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">{player.age < 16 ? 'Academy invitation' : sourceLabel(offer.source)}</div>
                <div className="flex justify-between items-start"><div><div className="font-medium">{offer.clubName}</div><div className="text-xs text-zinc-500">{country.leagueName} · {offer.country}</div></div><span className="stat-num text-pitch-400 text-lg">{offer.clubRating}</span></div>
                <div className="flex flex-wrap gap-1.5 my-3">{player.age < 16 ? <span className="pill border-pitch-500/30 bg-pitch-500/10 text-pitch-300">Focus: {offer.academyFocus ?? 'Balanced'}</span> : <RoleBadge role={offer.role} />}{offer.continental !== 'none' && <span className="pill border-sky-500/30 bg-sky-500/10 text-sky-300">{offer.continental === 'CL' ? 'Champions' : 'Europa'}</span>}<span className="pill border-zinc-700 text-zinc-400">{offer.tier}</span></div>
                <div className="flex justify-between items-center text-sm"><div><div className="stat-num text-zinc-100">{player.age < 16 ? 'Academy place' : <>{fmtMoney(offer.wage)}<span className="text-xs text-zinc-500">/yr</span></>}</div><div className="text-[11px] text-zinc-500">{player.age < 16 ? 'Development pathway · no professional contract' : `${offer.years}-year deal`}</div></div><button className="btn-primary text-xs px-4 py-2" onClick={() => { sign(index); showToast(`Signed for ${offer.clubName}.`); }}>Sign</button></div>
              </div>;
            })}
          </div>
        )}
      </section>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-pitch-600 text-white px-5 py-2.5 rounded-full text-sm shadow-lg animate-pop-in z-50">{toast}</div>}
    </div>
  );
}

function StatusBar({ label, value }: { label: string; value: number }) {
  return <div><div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-400">{label}</span><span className="stat-num text-zinc-200">{Math.round(value)}</span></div><div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-pitch-700 to-pitch-400 rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}

function ActionBtn({ title, sub, onClick, disabled, danger }: { title: string; sub: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={`text-left rounded-xl border px-4 py-4 transition-colors ${disabled ? 'border-zinc-900 bg-zinc-950/40 opacity-45 cursor-not-allowed' : danger ? 'border-red-900/60 bg-red-950/20 hover:border-red-700' : 'border-zinc-800 bg-zinc-900/60 hover:border-pitch-700'}`}><div className={`font-medium text-sm ${danger ? 'text-red-300' : 'text-zinc-100'}`}>{title}</div><div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{sub}</div></button>;
}

import { useState } from 'react';
import type { Player, SkillKey } from '../../game/types';
import { useGame } from '../../game/store';

import { getCountry } from '../../data/countries';
import { playerOverall } from '../../engines/overall';
import { fmtMoney } from '../../engines/util';
import { RoleBadge } from '../ui';

export interface TrainingOption { id: string; label: string; keys: SkillKey[] }

export const TRAINING: TrainingOption[] = [
  { id: 'fin', label: 'Finishing & Shooting', keys: ['finishing', 'longShots'] },
  { id: 'air', label: 'Aerial & Heading', keys: ['heading', 'jumping'] },
  { id: 'vis', label: 'Vision & Long Passing', keys: ['longPass', 'decisions'] },
  { id: 'tmp', label: 'Short Passing & Tempo', keys: ['shortPass', 'workRate'] },
  { id: 'dri', label: 'Dribbling & Flair', keys: ['dribbling', 'pace'] },
  { id: 'def', label: 'Defending & Tackling', keys: ['tackling', 'strength'] },
  { id: 'ath', label: 'Athleticism', keys: ['pace', 'stamina', 'strength'] },
  { id: 'set', label: 'Set Pieces & Crossing', keys: ['setPieces', 'crossing'] },
  { id: 'ldr', label: 'Leadership & Game IQ', keys: ['leadership', 'decisions', 'workRate'] },
  { id: 'gk', label: 'Goalkeeping', keys: ['reflexes', 'handling'] },
];

export default function Actions({
  player, focusId, setFocusId,
}: { player: Player; focusId: string | null; setFocusId: (id: string | null) => void }) {
  const { sign, search, sponsor, renegotiate, retire } = useGame();
  const [toast, setToast] = useState<string | null>(null);
  const ovr = playerOverall(player);
  const canIntl = player.age >= 18;

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  return (
    <div className="grid lg:grid-cols-2 gap-6 animate-fade-up">
      {/* Training */}
      <section className="card p-6">
        <div className="eyebrow mb-1">Training focus</div>
        <p className="text-zinc-500 text-sm mb-4">Pick one focus for the coming year — those attributes grow faster.</p>
        <div className="grid grid-cols-2 gap-2.5">
          {TRAINING.map((t) => {
            const active = focusId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFocusId(active ? null : t.id)}
                className={`text-left px-4 py-3 rounded-2xl border text-sm transition-colors ${
                  active ? 'border-pitch-500 bg-pitch-950 text-pitch-200'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="font-medium">{t.label}</div>
                <div className="text-[11px] text-zinc-500">{t.keys.join(' · ')}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Career actions */}
      <section className="card p-6">
        <div className="eyebrow mb-4">Career</div>
        <div className="space-y-2.5">
          <ActionBtn
            title="Scout domestic clubs"
            sub={player.searchedThisYear ? 'Already scouted this year' : 'Find offers at home'}
            disabled={player.searchedThisYear}
            onClick={() => { search('domestic'); showToast('Domestic clubs scouted.'); }}
          />
          <ActionBtn
            title="Scout international clubs"
            sub={!canIntl ? 'Available from age 18' : player.searchedThisYear ? 'Already scouted this year' : 'Find offers abroad'}
            disabled={!canIntl || player.searchedThisYear}
            onClick={() => { search('international'); showToast('International clubs scouted.'); }}
          />
          <ActionBtn
            title="Sign a sponsorship"
            sub={player.age < 18 ? 'Available from age 18' : 'Cash in on your profile'}
            disabled={player.age < 18}
            onClick={() => { const amt = sponsor(); showToast(`Sponsorship signed: +${fmtMoney(amt)}`); }}
          />
          <ActionBtn
            title="Renegotiate contract"
            sub={player.contract ? `Current: ${fmtMoney(player.contract.wage)}/yr` : 'You have no club'}
            disabled={!player.contract}
            onClick={() => { const r = renegotiate(); showToast(r.msg); }}
          />
          <ActionBtn
            title="Retire"
            danger
            sub={player.age < 30 ? 'Retiring early ends your career' : 'Hang up the boots'}
            disabled={player.retired}
            onClick={() => { if (confirm(`Retire at ${player.age}?`)) { retire(); showToast('You have retired.'); } }}
          />
        </div>
      </section>

      {/* Transfer offers */}
      <section className="card p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow">Transfer offers</div>
          <span className="text-xs text-zinc-500">Your level: OVR {ovr} · rep {Math.round(player.reputation)}</span>
        </div>
        {player.offers.length === 0 ? (
          <p className="text-zinc-500 text-sm">No offers on the table. Scout clubs above, or advance the year to attract interest.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {player.offers.map((o, i) => {
              const country = getCountry(o.country);
              return (
                <div key={o.clubId} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-pitch-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{o.clubName}</div>
                      <div className="text-xs text-zinc-500">{country.leagueName} · {o.country}</div>
                    </div>
                    <span className="stat-num text-pitch-400 text-lg">{o.clubRating}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 my-3">
                    <RoleBadge role={o.role} />
                    {o.continental !== 'none' && (
                      <span className="pill border-sky-500/30 bg-sky-500/10 text-sky-300">{o.continental === 'CL' ? 'Champions' : 'Europa'}</span>
                    )}
                    <span className="pill border-zinc-700 text-zinc-400">{o.tier}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <div className="stat-num text-zinc-100">{fmtMoney(o.wage)}<span className="text-xs text-zinc-500">/yr</span></div>
                      <div className="text-[11px] text-zinc-500">{o.years}-year deal</div>
                    </div>
                    <button className="btn-primary text-xs px-4 py-2" onClick={() => { sign(i); showToast(`Signed for ${o.clubName}.`); }}>Sign</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-pitch-600 text-white px-5 py-2.5 rounded-full text-sm shadow-lg animate-pop-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ title, sub, onClick, disabled, danger }: {
  title: string; sub: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-5 py-3.5 rounded-2xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? 'border-red-900/60 bg-red-950/20 hover:bg-red-950/40 text-red-300'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      <div className="font-medium">{title}</div>
      <div className="text-xs text-zinc-500">{sub}</div>
    </button>
  );
}

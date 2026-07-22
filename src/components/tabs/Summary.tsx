import type { Player } from '../../game/types';
import { playerOverall } from '../../engines/overall';
import { currentClub } from '../../game/engine';
import { POSITION_MAP } from '../../data/positions';
import { getCountry } from '../../data/countries';
import { TRAIT_MAP } from '../../data/traits';
import { fmtMoney } from '../../engines/util';
import { OverallBadge, RoleBadge, Stat } from '../ui';

export default function Summary({ player }: { player: Player }) {
  const ovr = playerOverall(player);
  const club = currentClub(player);
  const pos = POSITION_MAP[player.position];
  const country = getCountry(player.country);
  const last = player.history[player.history.length - 1];

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-fade-up">
      {/* status card */}
      <div className="lg:col-span-5 card p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="eyebrow">Current status</div>
            <div className="font-display text-3xl tracking-tight mt-1">{player.name}</div>
            <div className="text-zinc-400 text-sm">{pos.name} · {player.country}</div>
            <div className="mt-3 text-amber-300 tracking-[.15em]">{'★'.repeat(player.prospectStars ?? 3)}<span className="text-zinc-700">{'☆'.repeat(5 - (player.prospectStars ?? 3))}</span><span className="ml-2 text-[10px] tracking-normal uppercase text-zinc-500">Original prospect rating</span></div>
          </div>
          <div className="text-right">
            <OverallBadge value={ovr} />
            <div className="text-[11px] text-zinc-500 -mt-1">OVERALL</div>
          </div>
        </div>

        {player.traits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {player.traits.map((id) => (
              <span key={id} className="pill border-pitch-500/40 bg-pitch-950 text-pitch-300">★ {TRAIT_MAP[id]?.name}</span>
            ))}
          </div>
        )}

        <div className="space-y-2.5 text-sm mt-5">
          <Row label={player.age < 16 ? 'Academy' : 'Club'} value={club.name} />
          {player.age < 16 && <Row label="Academy focus" value={player.academyFocus ?? club.academyFocus ?? 'Balanced'} />}
          {player.rivalName && <Row label="Career rival" value={`${player.rivalName} · OVR ${player.rivalOverall ?? '—'}`} />}
          <Row label="Competition" value={club.tier === 'Youth' ? 'Youth League' : `${country.leagueName}${club.division === 2 ? ' 2' : ''}`} />
          <Row label="Squad role" value={<RoleBadge role={player.role} />} />
          <Row label="Market value" value={player.marketValue > 0 ? fmtMoney(player.marketValue) : '—'} />
          <Row label="Reputation" value={`${Math.round(player.reputation)}/100`} />
          <Row label="Morale / fitness" value={`${Math.round(player.morale ?? 70)} / ${Math.round(player.fitness ?? 80)}`} />
          <Row label="Manager trust" value={`${Math.round(player.managerTrust ?? 55)}/100`} />
          <Row label="Next season in Europe" value={(player.clubContinental ?? club.continental) === 'CL' ? 'Champions' : (player.clubContinental ?? club.continental) === 'EL' ? 'Europa' : 'None'} />
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800 text-sm flex justify-between">
          <span className="text-zinc-400">National team</span>
          <span className="text-pitch-300">{player.national.status}</span>
        </div>
      </div>

      {/* last season */}
      <div className="lg:col-span-7 card p-6">
        <div className="eyebrow mb-4">Last season</div>
        {last ? (
          <>
            {last.age < 16 ? <div className="rounded-2xl border border-pitch-500/20 bg-pitch-950/30 p-5 text-sm text-zinc-300">Academy season: development only. Matches, goals and assists begin counting after your first professional contract at age 16 or later.</div> : <><div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Games" value={last.games} sub={last.clubName} />
              <Stat label="Goals" value={last.goals} accent />
              <Stat label="Assists" value={last.assists} accent />
              <Stat label="Avg rating" value={last.rating.toFixed(1)} accent />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <Stat label="League finish" value={last.leagueFinish ? `${ordinal(last.leagueFinish)}` : '—'} sub={last.leagueName} />
              <Stat label="Caps" value={last.capsThisYear} sub={`${last.intlGoals} intl goals`} />
              <Stat label="Career goals" value={player.totals.goals} />
              <Stat label="Career apps" value={player.totals.games} />
            </div>
            </>}
            {(last.clubHonors.length > 0 || last.individualHonors.length > 0 || last.nationalHonors.length > 0) && (
              <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-wrap gap-2">
                {[...last.clubHonors, ...last.individualHonors, ...last.nationalHonors].map((h, i) => (
                  <span key={i} className="pill border-amber-400/30 bg-amber-400/10 text-amber-300">🏆 {h}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-zinc-500 text-sm">No seasons played yet. Hit <span className="text-pitch-400">Advance year</span> to begin your journey.</p>
        )}
      </div>

      {player.characters && player.characters.length > 0 && <div className="lg:col-span-12 card p-6"><div className="eyebrow mb-4">Dressing-room relationships</div><div className="grid md:grid-cols-3 gap-3">{player.characters.map(c=><div key={c.name} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"><div className="text-[10px] uppercase tracking-wide text-zinc-500">{c.role}</div><div className="font-medium mt-1">{c.name}</div><div className="flex justify-between text-sm mt-3"><span className="text-zinc-500">Relationship</span><span className="stat-num text-pitch-400">{c.relationship}</span></div><div className="text-xs text-zinc-600 mt-1">OVR {c.overall} · {c.clubName}</div></div>)}</div></div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center bg-zinc-900/60 rounded-xl px-4 py-2.5">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

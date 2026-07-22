import type { Player } from '../../game/types';
import { fmtMoney } from '../../engines/util';
import { roleLabel } from '../ui';
import { ordinal } from './Summary';

export default function Career({ player }: { player: Player }) {
  const rows = [...player.history].reverse();
  return (
    <div className="card p-6 animate-fade-up">
      <div className="eyebrow mb-4">Career history</div>
      <div className="overflow-auto max-h-[440px] -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
              <th className="text-left py-2 font-medium">Age</th>
              <th className="text-left font-medium">Club</th>
              <th className="text-left font-medium">Role</th>
              <th className="text-center font-medium">Apps</th>
              <th className="text-center font-medium">G</th>
              <th className="text-center font-medium">A</th>
              <th className="text-center font-medium">Rating</th>
              <th className="text-center font-medium">Finish</th>
              <th className="text-center font-medium">NT</th><th className="text-left font-medium">Role metrics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {rows.map((h, i) => (
              <tr key={i} className="hover:bg-zinc-900/50">
                <td className="py-2 text-zinc-400">{h.age}</td>
                <td className="font-medium">{h.clubName}</td>
                <td className="text-zinc-500 text-xs">{roleLabel(h.role)}</td>
                <td className="text-center stat-num">{h.games}</td>
                <td className="text-center stat-num">{h.goals}</td>
                <td className="text-center stat-num">{h.assists}</td>
                <td className="text-center stat-num text-pitch-400">{h.rating.toFixed(1)}</td>
                <td className="text-center text-zinc-400">{h.leagueFinish ? ordinal(h.leagueFinish) : '—'}</td>
                <td className="text-center text-zinc-500 text-xs">{h.capsThisYear ? `${h.capsThisYear} (${h.intlGoals}g)` : '—'}</td><td className="text-zinc-500 text-[11px] min-w-[220px]">{h.positionStats ? Object.entries(h.positionStats).slice(0,3).map(([k,v])=>`${pretty(k)} ${v}`).join(' · ') : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="text-center text-zinc-600 py-8">No seasons played yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <Tot label="Apps" value={player.totals.games} />
        <Tot label="Goals" value={player.totals.goals} />
        <Tot label="Assists" value={player.totals.assists} />
        <Tot label="Caps" value={`${player.totals.caps} (${player.totals.intlGoals}g)`} />
        <Tot label="Earnings" value={fmtMoney(player.money)} accent />
      </div>
    </div>
  );
}

function pretty(k:string){return k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}

function Tot({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`stat-num text-xl ${accent ? 'text-pitch-400' : ''}`}>{value}</div>
    </div>
  );
}

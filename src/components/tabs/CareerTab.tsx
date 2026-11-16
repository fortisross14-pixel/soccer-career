import { useGame } from '../../game/store';
import type { Honor } from '../../game/types';
import { seasonLabel } from '../../engines/month';
import { ordinal } from '../../engines/awards';
import { MONTHS } from '../../engines/util';
import { EmptyState, SectionTitle, Stat } from '../ui';

export default function CareerTab() {
  const { career } = useGame();
  if (!career) return null;
  const c = career;
  const t = c.totals;
  return (
    <div className="space-y-5">
      {c.retired && c.legacy && (
        <section className="panel p-6 border-ink">
          <div className="eyebrow">Legacy</div>
          <div className="font-display text-5xl uppercase mt-2 text-ink">{c.legacy.tier.toUpperCase()}</div>
          <p className="text-muted mt-1">{c.legacy.blurb}</p>
          <div className="stat-num text-xl mt-3">{c.legacy.score} pts</div>
        </section>
      )}
      <section className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label="Club apps" value={t.apps} />
        <Stat label="Goals" value={t.goals} />
        <Stat label="Assists" value={t.assists} />
        <Stat label="MOTM" value={t.motm} />
        <Stat label="Caps" value={t.caps} sub={c.national.debutAge ? `debut at ${c.national.debutAge}` : 'uncapped'} />
        <Stat label="Intl goals" value={t.intlGoals} />
      </section>

      <section className="panel p-5">
        <SectionTitle kicker="Season by season" title="History" />
        {c.history.length === 0 ? <EmptyState>Your first season is under way.</EmptyState> : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-[10px] uppercase tracking-wider text-muted text-left">
                <th className="px-2 py-2">Season</th><th>Age</th><th>Club</th><th className="text-center">OVR</th><th className="text-center">Apps</th><th className="text-center">G</th><th className="text-center">A</th><th className="text-center">Avg</th><th className="text-center">Pos</th><th>Honours</th>
              </tr></thead>
              <tbody>
                {[...c.history].reverse().map((h) => (
                  <tr key={h.year} className="border-t border-ink/15 align-top">
                    <td className="px-2 py-2 stat-num">{seasonLabel(h.year)}</td>
                    <td className="stat-num">{h.age}</td>
                    <td className="max-w-[180px]">{h.clubs}</td>
                    <td className="text-center stat-num">{h.ovrStart}<span className="text-muted">→</span>{h.ovrEnd}</td>
                    <td className="text-center stat-num">{h.apps}</td>
                    <td className="text-center stat-num">{h.goals}</td>
                    <td className="text-center stat-num">{h.assists}</td>
                    <td className="text-center stat-num">{h.avgRating.toFixed(2)}</td>
                    <td className="text-center stat-num">{h.leaguePos ? ordinal(h.leaguePos) : '—'}<span className="block text-[9px] text-muted font-sans font-bold">{h.leagueName}</span></td>
                    <td className="text-xs text-muted">{[...h.honors.map((x) => `🏆 ${x}`), ...h.awards.map((x) => `⭐ ${x}`)].join(' · ')}{h.caps ? ` · 🌍 ${h.caps} caps` : ''}{h.ballonRank && h.ballonRank <= 10 ? ` · 🏅 ${ordinal(h.ballonRank)} in Ballon d'Or` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel p-5">
        <SectionTitle title="International" kicker={c.player.country} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Stat label="Caps" value={t.caps} />
          <Stat label="Goals" value={t.intlGoals} />
          <Stat label="Debut" value={c.national.debutAge ? `age ${c.national.debutAge}` : '—'} />
          <Stat label="Status" value={<span className="text-sm">{c.national.status}</span>} />
        </div>
        {c.history.some((h) => h.caps || h.natResult) ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead><tr className="text-[10px] uppercase tracking-wider text-muted font-black text-left"><th className="py-1">Season</th><th className="text-center">Caps</th><th className="text-center">Goals</th><th>Tournament</th></tr></thead>
              <tbody>
                {[...c.history].reverse().filter((h) => h.caps || h.natResult).map((h) => (
                  <tr key={h.year} className="border-t border-ink/10"><td className="py-1 stat-num">{seasonLabel(h.year)}</td><td className="text-center stat-num">{h.caps}</td><td className="text-center stat-num">{h.intlGoals}</td><td className="font-semibold">{h.natResult ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted font-semibold">No international football yet. Call-ups come with form and a high enough overall.</p>}
      </section>

      <div className="grid md:grid-cols-3 gap-5">
        <HonorList title="Club trophies" list={c.honors.club} icon="🏆" />
        <HonorList title="Individual" list={c.honors.individual} icon="⭐" />
        <HonorList title="International" list={c.honors.national} icon="🌍" />
      </div>

      <section className="panel p-5">
        <SectionTitle kicker="Timeline" title="Career log" />
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-2">
          {c.log.slice(0, 120).map((e, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="stat-num text-[11px] text-muted w-20 shrink-0 pt-0.5">{MONTHS[e.month]} {e.month >= 6 ? e.year + 1 : e.year}</span>
              <span>{e.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HonorList({ title, list, icon }: { title: string; list: Honor[]; icon: string }) {
  return (
    <section className="panel p-5">
      <SectionTitle title={title} />
      {list.length === 0 ? <p className="text-sm text-muted">None yet.</p> : (
        <div className="space-y-1.5">{list.map((h) => <div key={h.label} className="flex justify-between text-sm"><span>{icon} {h.label}</span><span className="stat-num">×{h.count}</span></div>)}</div>
      )}
    </section>
  );
}

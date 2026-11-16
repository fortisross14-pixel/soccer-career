import { useEffect } from 'react';
import { useGame } from '../../game/store';
import { MILESTONES, MILESTONE_MAP } from '../../engines/coins';
import { seasonLabel } from '../../engines/month';
import { tierLabel } from '../../engines/world';
import { ordinal, playerGrade } from '../../engines/awards';
import { Modal, Stat } from '../ui';
import { fx } from '../fx';

export default function CareerOverModal({ onClose }: { onClose: () => void }) {
  const { career, exit } = useGame();
  const c = career;
  useEffect(() => {
    const t = window.setTimeout(() => fx({ type: 'stamp', text: c?.legacy?.tier ?? 'Full time', tone: 'sun' }), 300);
    return () => clearTimeout(t);
  }, [c?.legacy?.tier]);
  if (!c) return null;
  const t = c.totals;
  const grade = playerGrade(c);
  const clubs = [...new Set(c.history.flatMap((h) => h.clubs.split(' → ')))];
  const best = [...c.history].sort((a, b) => b.goals + b.assists * 0.7 - (a.goals + a.assists * 0.7))[0];
  const trophies = [...c.honors.club, ...c.honors.national].reduce((s, h) => s + h.count, 0);
  const awards = c.honors.individual.reduce((s, h) => s + h.count, 0);
  const broke = MILESTONES.filter((m) => c.milestones.includes(m.id));
  const firsts = broke.filter((m) => c.firstEver.includes(m.id));
  const others = broke.filter((m) => !c.firstEver.includes(m.id));

  return (
    <Modal wide>
      <div className="p-6 bg-sun border-b-[3px] border-ink relative">
        <div className="absolute right-5 top-5 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-[3px] border-ink bg-red text-white grid place-items-center shadow-[5px_5px_0_#121212] rotate-3 card-slap" style={{ ['--rot' as string]: '4deg' }}>
          <div className="text-center leading-none"><div className="font-display text-5xl sm:text-6xl">{grade.letter}</div><div className="text-[8px] font-black uppercase tracking-[.14em] mt-1">tier</div></div>
        </div>
        <span className="tag">Full time · retired at {c.player.age}</span>
        <h2 className="font-display text-4xl sm:text-5xl uppercase leading-[.9] mt-3 pr-24">{c.player.name}</h2>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="tag !text-sm">{grade.title}</span>
          <span className="tag tag-white !text-sm">{c.legacy?.tier}</span>
          <span className="font-bold text-sm">{c.legacy?.blurb}</span>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <Stat label="Apps" value={t.apps} />
          <Stat label="Goals" value={t.goals} tone="red" />
          <Stat label="Assists" value={t.assists} />
          <Stat label="Caps" value={t.caps} />
          <Stat label="Trophies" value={trophies} />
          <Stat label="Awards" value={awards} />
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          <Stat label="Peak overall" value={c.peakOvr} />
          <Stat label="Highest level" value={c.bestDiv <= 3 ? tierLabel(c.bestDiv) : '—'} />
          <Stat label="Legacy coins earned" value={<span className="flex items-center gap-1"><span className="coin">c</span>{c.coinsEarned}</span>} tone="sun" />
        </div>
        {best && (
          <div className="sticker p-3 text-sm font-semibold">
            <span className="tag tag-sun mr-2">Best season</span>
            {seasonLabel(best.year)} · {best.clubs} · {best.goals} goals, {best.assists} assists, {best.avgRating.toFixed(2)} avg{best.scorerRank ? ` · ${ordinal(best.scorerRank)} in scoring` : ''}
          </div>
        )}
        <div className="text-xs font-bold text-muted">Clubs: {clubs.join(' · ')}</div>

        <div>
          <div className="flex items-end justify-between mb-2">
            <div className="eyebrow">Milestones broken · {broke.length}/{MILESTONES.length}</div>
            {firsts.length > 0 && <span className="tag">{firsts.length} for the first time ever</span>}
          </div>
          {firsts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2 mb-3">
              {firsts.map((m, i) => (
                <div key={m.id} className="sticker !bg-red text-white px-3 py-2 flex items-center gap-2 card-slap" style={{ animationDelay: `${0.25 + i * 0.08}s`, ['--rot' as string]: `${i % 2 ? 1 : -1}deg` }}>
                  <span className="text-lg">★</span><span className="flex-1 text-sm font-extrabold">{m.label}</span><span className="tag tag-sun !text-[8px]">first ever</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {others.map((m) => <span key={m.id} className="pill">★ {MILESTONE_MAP[m.id].label}</span>)}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Season by season</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead><tr className="text-[10px] uppercase tracking-wider text-muted text-left font-black"><th className="py-1">Season</th><th>Club</th><th>League</th><th className="text-center">Apps</th><th className="text-center">G</th><th className="text-center">A</th><th className="text-center">Avg</th></tr></thead>
              <tbody>
                {c.history.map((h) => (
                  <tr key={h.year} className="border-t border-ink/10">
                    <td className="py-1 stat-num">{seasonLabel(h.year)}</td><td className="font-semibold">{h.clubs}</td><td className="text-muted font-semibold">{h.leagueName}{h.leaguePos ? ` (${ordinal(h.leaguePos)})` : ''}</td>
                    <td className="text-center stat-num">{h.apps}</td><td className="text-center stat-num">{h.goals}</td><td className="text-center stat-num">{h.assists}</td><td className="text-center stat-num">{h.avgRating.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <button className="btn-white" onClick={onClose}>Browse career</button>
        <button className="btn-red" onClick={exit}>Spend coins →</button>
      </div>
    </Modal>
  );
}

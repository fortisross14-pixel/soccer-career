import type { Player, SkillKey } from '../game/types';
import type { YearSummary as YS } from '../game/engine';
import { SKILL_MAP } from '../data/skills';
import { Modal } from './ui';
import { computeLegacy } from '../engines/legacy';

export default function YearSummary({ summary, player, onClose }: { summary: YS; player: Player; onClose: () => void }) {
  const r = summary.seasonRecord;
  const deltas = Object.entries(summary.skillDeltas)
    .filter(([, v]) => Math.abs(v as number) >= 1)
    .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
    .slice(0, 6);
  const ovrChange = summary.overallAfter - summary.overallBefore;
  const honors = [...r.clubHonors, ...r.individualHonors, ...r.nationalHonors];

  if (summary.retired) {
    const legacy = computeLegacy(player);
    return (
      <Modal onClose={onClose} wide>
        <div className="text-center">
          <div className="eyebrow">Career complete</div>
          <div className="font-display text-4xl mt-2 mb-1">{player.name}</div>
          <div className="text-zinc-400 mb-6">Retired at {player.age}</div>
          <div className="inline-block rounded-2xl border border-amber-400/30 bg-amber-400/10 px-8 py-5 mb-6">
            <div className="text-amber-300 font-display text-3xl">{legacy.tier}</div>
            <div className="text-zinc-400 text-sm mt-1">{legacy.blurb}</div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-6 text-center">
            <Fact label="Apps" value={player.totals.games} />
            <Fact label="Goals" value={player.totals.goals} />
            <Fact label="Assists" value={player.totals.assists} />
            <Fact label="Legacy" value={legacy.score} />
          </div>
          <button className="btn-primary w-full py-3.5" onClick={onClose}>Enter the Hall of Fame</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-display text-2xl">Season recap</div>
        <div className="text-zinc-500 text-sm">Age {r.age} · {r.clubName}</div>
      </div>
      <div className="text-sm text-zinc-400 mb-5">{summary.event}</div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Fact label="Apps" value={r.games} />
        <Fact label="Goals" value={r.goals} accent />
        <Fact label="Assists" value={r.assists} accent />
        <Fact label="Rating" value={r.rating.toFixed(1)} accent />
      </div>

      <div className="flex items-center gap-3 mb-5 bg-zinc-900/60 rounded-2xl px-4 py-3">
        <span className="text-sm text-zinc-400">Overall</span>
        <span className="stat-num text-xl">{summary.overallBefore}</span>
        <span className="text-zinc-600">→</span>
        <span className="stat-num text-xl text-pitch-400">{summary.overallAfter}</span>
        {ovrChange !== 0 && (
          <span className={`text-sm ${ovrChange > 0 ? 'text-pitch-400' : 'text-red-400'}`}>
            ({ovrChange > 0 ? '+' : ''}{ovrChange})
          </span>
        )}
      </div>

      {honors.length > 0 && (
        <div className="mb-5">
          <div className="eyebrow mb-2">Honors this season</div>
          <div className="flex flex-wrap gap-2">
            {honors.map((h, i) => (
              <span key={i} className="pill border-amber-400/30 bg-amber-400/10 text-amber-300">🏆 {h}</span>
            ))}
          </div>
        </div>
      )}

      {deltas.length > 0 && (
        <div className="mb-6">
          <div className="eyebrow mb-2">Biggest attribute changes</div>
          <div className="grid grid-cols-2 gap-2">
            {deltas.map(([k, v]) => (
              <div key={k} className="flex justify-between bg-zinc-900/60 rounded-xl px-3 py-2 text-sm">
                <span className="text-zinc-300">{SKILL_MAP[k as SkillKey].label}</span>
                <span className={(v as number) > 0 ? 'text-pitch-400' : 'text-red-400'}>
                  {(v as number) > 0 ? '+' : ''}{v as number}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.logs.length > 0 && (
        <div className="mb-6 space-y-1.5">
          {summary.logs.map((l, i) => <div key={i} className="text-sm text-zinc-300">{l}</div>)}
        </div>
      )}

      <button className="btn-primary w-full py-3.5" onClick={onClose}>Continue</button>
    </Modal>
  );
}

function Fact({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-zinc-900/60 rounded-2xl px-3 py-3 text-center">
      <div className={`stat-num text-2xl ${accent ? 'text-pitch-400' : ''}`}>{value}</div>
      <div className="text-[11px] text-zinc-500">{label}</div>
    </div>
  );
}

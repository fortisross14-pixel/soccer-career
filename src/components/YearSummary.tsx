import type { Player, SkillKey } from '../game/types';
import type { YearSummary as YS } from '../game/engine';
import { SKILL_MAP } from '../data/skills';
import { Modal } from './ui';
import { computeLegacy } from '../engines/legacy';

export default function YearSummary({ summary, player, onClose }: { summary: YS; player: Player; onClose: () => void }) {
  const r = summary.seasonRecord;
  const deltas = Object.entries(summary.skillDeltas).filter(([, v]) => Math.abs(v as number) >= 1).sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number)).slice(0, 6);
  const ovrChange = summary.overallAfter - summary.overallBefore;
  const honors = [...r.clubHonors, ...r.individualHonors, ...r.nationalHonors];

  if (summary.retired) {
    const legacy = computeLegacy(player);
    return (
      <Modal onClose={onClose} wide>
        <div className="career-finale">
          <div className="eyebrow">Final whistle</div>
          <div className="font-display text-5xl mt-2">{player.name}</div>
          <div className="prospect-stars mt-3">{'★'.repeat(player.prospectStars ?? 3)}<span>{5 - (player.prospectStars ?? 3) > 0 ? '☆'.repeat(5 - (player.prospectStars ?? 3)) : ''}</span></div>
          <p className="story-lead mt-5">{summary.careerVerdict}</p>
          <div className="legacy-banner mt-6">
            <div><span>Legacy</span><strong>{legacy.tier}</strong></div>
            <div className="legacy-score">{legacy.score}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
            <Fact label="Peak OVR" value={player.peakOverall ?? summary.overallAfter} accent />
            <Fact label="Apps" value={player.totals.games} />
            <Fact label="Goals" value={player.totals.goals} />
            <Fact label="Assists" value={player.totals.assists} />
            <Fact label="Injury years" value={player.injurySeasons ?? 0} />
          </div>
          <button className="btn-primary w-full py-4" onClick={onClose}>Enter the Hall of Fame</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="season-cover">
        <div>
          <div className="eyebrow">Season {r.season + 1} complete</div>
          <div className="font-display text-4xl mt-1">Age {r.age}: {r.clubName}</div>
          <div className="text-zinc-400 mt-1">{summary.event}</div>
        </div>
        <div className="season-grade">{r.rating >= 7.8 ? 'A+' : r.rating >= 7.3 ? 'A' : r.rating >= 6.8 ? 'B' : r.rating >= 6.3 ? 'C' : 'D'}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <Fact label="Apps" value={r.games} />
        <Fact label="Goals" value={r.goals} accent />
        <Fact label="Assists" value={r.assists} accent />
        <Fact label="Rating" value={r.rating.toFixed(1)} accent />
      </div>

      <section className="story-panel mb-5">
        <div className="eyebrow mb-3">The story of the year</div>
        <div className="space-y-3">
          {summary.narrative.map((line, i) => <p key={i} className={i === 0 ? 'story-lead' : 'story-line'}>{line}</p>)}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <section className="summary-module">
          <div className="eyebrow mb-3">Development</div>
          <div className="ovr-track"><span>OVR</span><strong>{summary.overallBefore}</strong><i>→</i><strong className="text-pitch-300">{summary.overallAfter}</strong><em>{ovrChange >= 0 ? '+' : ''}{ovrChange}</em></div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {deltas.map(([k, v]) => <div key={k} className="attribute-delta"><span>{SKILL_MAP[k as SkillKey].label}</span><strong className={(v as number) > 0 ? 'text-pitch-300' : 'text-red-400'}>{(v as number) > 0 ? '+' : ''}{v as number}</strong></div>)}
          </div>
        </section>
        <section className="summary-module">
          <div className="eyebrow mb-3">Around the football world</div>
          <div className="space-y-3">
            {summary.worldHeadlines.length ? summary.worldHeadlines.map((h, i) => <div className="headline" key={i}><span>●</span>{h}</div>) : <div className="text-zinc-500 text-sm">A relatively quiet year beyond your club.</div>}
          </div>
        </section>
      </div>

      {honors.length > 0 && <div className="honor-ribbon mb-5">{honors.map((h, i) => <span key={i}>🏆 {h}</span>)}</div>}
      <button className="btn-primary w-full py-4" onClick={onClose}>Begin the next chapter</button>
    </Modal>
  );
}

function Fact({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return <div className="fact-tile"><div className={`stat-num text-2xl ${accent ? 'text-pitch-300' : ''}`}>{value}</div><div>{label}</div></div>;
}

import type { Honor, Player } from '../../game/types';
import { TRAIT_MAP } from '../../data/traits';

export default function Honors({ player }: { player: Player }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-fade-up">
      <Panel title="Individual awards" icon="⭐" list={player.honors.individual} empty="No individual awards yet." highlight />
      <Panel title="Club honors" icon="🏆" list={player.honors.club} empty="No club silverware yet." />
      <Panel title="National team" icon="🌍" list={player.honors.national} empty="No international honors yet." />
      <div className="card p-6">
        <div className="eyebrow mb-4">Signature traits</div>
        {player.traits.length === 0
          ? <p className="text-zinc-500 text-sm">No signature traits unlocked.</p>
          : <div className="space-y-2">{player.traits.map((id) => <TraitRow key={id} id={id} />)}</div>}
      </div>
    </div>
  );
}

function TraitRow({ id }: { id: string }) {
  const t = TRAIT_MAP[id];
  if (!t) return null;
  return (
    <div className="rounded-2xl border border-pitch-800/50 bg-pitch-950/40 px-4 py-3">
      <div className="text-pitch-300 font-medium">★ {t.name}</div>
      <div className="text-xs text-zinc-400">{t.desc}</div>
    </div>
  );
}

function Panel({ title, icon, list, empty, highlight }: {
  title: string; icon: string; list: Honor[]; empty: string; highlight?: boolean;
}) {
  const total = list.reduce((s, h) => s + h.count, 0);
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="eyebrow">{icon} {title}</div>
        {total > 0 && <span className="stat-num text-zinc-500">{total}</span>}
      </div>
      {list.length === 0 ? (
        <p className="text-zinc-500 text-sm">{empty}</p>
      ) : (
        <div className="space-y-2">
          {list.sort((a, b) => b.count - a.count).map((h, i) => (
            <div key={i} className={`flex justify-between items-center rounded-xl px-4 py-2.5 ${
              highlight ? 'bg-amber-400/5 border border-amber-400/20' : 'bg-zinc-900/60'
            }`}>
              <span className={highlight ? 'text-amber-200' : ''}>{h.label}</span>
              {h.count > 1 && <span className="pill border-zinc-700 text-zinc-400">×{h.count}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

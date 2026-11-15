import { useState } from 'react';
import { useGame } from '../../game/store';
import { applyDecision } from '../../engines/decisions';
import { Modal } from '../ui';

export default function DecisionModal() {
  const { career, act } = useGame();
  const [outcome, setOutcome] = useState<string[] | null>(null);
  if (!career) return null;
  const d = career.decisions[0];
  if (!d) return null;
  return (
    <Modal>
      <div className="p-6 border-b border-line">
        <div className="eyebrow">Decision</div>
        <h2 className="font-display text-4xl font-extrabold mt-2 leading-none">{d.title}</h2>
        <p className="text-muted mt-3">{d.body}</p>
      </div>
      <div className="p-4 space-y-2">
        {d.choices.map((ch) => (
          <button key={ch.id} onClick={() => setOutcome(act((c) => applyDecision(c, c.decisions[0], ch.id)))} className="w-full text-left rounded-xl border border-line bg-white/[.02] p-4 hover:border-lime transition">
            <div className="font-semibold">{ch.label}</div>
            <div className="text-xs text-muted mt-1">{ch.desc}</div>
          </button>
        ))}
        {outcome && outcome.length > 0 && <div className="text-sm text-mint">{outcome.join(' · ')}</div>}
      </div>
    </Modal>
  );
}

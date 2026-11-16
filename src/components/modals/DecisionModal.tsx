import { useGame } from '../../game/store';
import { applyDecision } from '../../engines/decisions';
import { Modal } from '../ui';

export default function DecisionModal() {
  const { career, act } = useGame();
  if (!career) return null;
  const d = career.decisions[0];
  if (!d) return null;
  return (
    <Modal>
      <div className="p-6 border-b-[3px] border-ink bg-sun">
        <span className="tag">Decision</span>
        <h2 className="font-display text-4xl uppercase mt-3 leading-[.95]">{d.title}</h2>
        <p className="font-semibold mt-3">{d.body}</p>
      </div>
      <div className="p-4 space-y-3">
        {d.choices.map((ch, i) => (
          <button key={ch.id} onClick={() => act((c) => applyDecision(c, c.decisions[0], ch.id))} className={`w-full text-left sticker p-4 transition hover:-translate-y-0.5 hover:!bg-sun ${i % 2 ? 'rotate-[.4deg]' : '-rotate-[.4deg]'}`}>
            <div className="font-display uppercase text-base leading-tight">{ch.label}</div>
            <div className="text-xs font-semibold text-muted mt-1">{ch.desc}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

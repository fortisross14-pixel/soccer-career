import type { EventLogEntry, Player } from '../../game/types';

const ICONS: Record<EventLogEntry['kind'], string> = {
  event: '🗓️', transfer: '📄', trophy: '🏆', award: '⭐',
  national: '🌍', milestone: '✨', injury: '🩹', system: '•',
};

export default function Timeline({ player }: { player: Player }) {
  return (
    <div className="card p-6 animate-fade-up">
      <div className="eyebrow mb-4">Career timeline</div>
      <div className="relative pl-6 max-h-[520px] overflow-auto">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-zinc-800" />
        <div className="space-y-3">
          {player.log.map((e, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-zinc-950" />
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] text-zinc-600 stat-num w-8">{e.age}yo</span>
                <span className="text-sm text-zinc-300">
                  <span className="mr-1.5">{ICONS[e.kind]}</span>{e.text}
                </span>
              </div>
            </div>
          ))}
          {player.log.length === 0 && <p className="text-zinc-600 text-sm">Your story starts here.</p>}
        </div>
      </div>
    </div>
  );
}

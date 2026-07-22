import type { ReactNode } from 'react';
import type { SquadRole } from '../game/types';

export function OverallBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const color =
    value >= 88 ? 'text-amber-300' :
    value >= 80 ? 'text-pitch-400' :
    value >= 70 ? 'text-emerald-300' :
    value >= 60 ? 'text-zinc-200' : 'text-zinc-400';
  const cls = size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-2xl' : 'text-4xl';
  return <span className={`stat-num ${cls} ${color}`}>{value}</span>;
}

export function SkillBar({ value, delta }: { value: number; delta?: number }) {
  const pct = Math.min(100, (value / 99) * 100);
  const hue =
    value >= 85 ? 'from-amber-400 to-amber-200' :
    value >= 70 ? 'from-pitch-500 to-pitch-400' :
    value >= 55 ? 'from-emerald-600 to-emerald-500' : 'from-zinc-600 to-zinc-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-300">{/* label supplied by caller */}</span>
        <span className="stat-num">
          {value}
          {delta !== undefined && delta !== 0 && (
            <span className={`ml-1 text-[11px] ${delta > 0 ? 'text-pitch-400' : 'text-red-400'}`}>
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${hue}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`stat-num text-3xl ${accent ? 'text-pitch-400' : ''}`}>{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const ROLE_META: Record<SquadRole, { label: string; cls: string }> = {
  star: { label: 'Star Player', cls: 'border-amber-400/40 text-amber-300 bg-amber-400/10' },
  starter: { label: 'Regular Starter', cls: 'border-pitch-500/40 text-pitch-300 bg-pitch-500/10' },
  rotation: { label: 'Rotation', cls: 'border-emerald-600/40 text-emerald-300 bg-emerald-600/10' },
  fringe: { label: 'Fringe Player', cls: 'border-zinc-600 text-zinc-300 bg-zinc-700/20' },
  reserve: { label: 'Reserve', cls: 'border-zinc-700 text-zinc-400 bg-zinc-800/30' },
  youth: { label: 'Academy', cls: 'border-sky-500/40 text-sky-300 bg-sky-500/10' },
};

export function RoleBadge({ role }: { role: SquadRole }) {
  const m = ROLE_META[role];
  return <span className={`pill ${m.cls}`}>{m.label}</span>;
}

export function roleLabel(role: SquadRole) { return ROLE_META[role].label; }

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`card p-7 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[88vh] overflow-auto animate-pop-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

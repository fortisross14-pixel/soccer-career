import type { ReactNode } from 'react';
import type { CardDef, Fixture, SquadRole } from '../game/types';
import { ROLE_LABEL } from '../engines/match';

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className={`panel w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'} max-h-[92vh] overflow-y-auto animate-pop-in rounded-b-none sm:rounded-[10px]`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: 'good' | 'warn' | 'bad' | 'lime' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const auto = tone ?? (pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad');
  const color = auto === 'lime' ? 'var(--lime)' : auto === 'good' ? 'var(--mint)' : auto === 'warn' ? 'var(--orange)' : 'var(--red)';
  return <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} /></div>;
}

export function Meter({ label, value, max = 100, suffix, tone }: { label: string; value: number; max?: number; suffix?: string; tone?: 'good' | 'warn' | 'bad' | 'lime' }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-muted">{label}</span><span className="stat-num">{max <= 10 ? value.toFixed(1) : Math.round(value)}{suffix}</span></div>
      <Bar value={value} max={max} tone={tone} />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white/[.02] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[.14em] text-muted font-bold">{label}</div>
      <div className="stat-num text-xl mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function RoleBadge({ role }: { role: SquadRole }) {
  const cls: Record<SquadRole, string> = {
    star: 'border-[color:var(--legendary)] text-[color:var(--legendary)]',
    starter: 'border-mint/60 text-mint',
    rotation: 'border-sky/60 text-sky',
    fringe: 'border-orange/60 text-orange',
    reserve: 'border-danger/60 text-danger',
  };
  return <span className={`pill ${cls[role]}`}>{ROLE_LABEL[role]}</span>;
}

export function RatingBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted text-xs">—</span>;
  const cls = value >= 8 ? 'rating-hi' : value >= 7 ? 'rating-good' : value >= 6.2 ? 'rating-mid' : 'rating-low';
  return <span className={`rating ${cls}`}>{value.toFixed(1)}</span>;
}

export function ResultPill({ fx }: { fx: Fixture }) {
  if (!fx.played) return <span className="pill text-muted">vs</span>;
  const us = fx.usGoals ?? 0;
  const them = fx.oppGoals ?? 0;
  const r = us > them || fx.penalties?.startsWith('W') ? 'W' : us < them || fx.penalties?.startsWith('L') ? 'L' : 'D';
  return <span className={`stat-num text-xs rounded px-1.5 py-0.5 result-${r}`}>{r} {us}-{them}{fx.penalties ? 'p' : ''}</span>;
}

const COMP_COLOR: Record<Fixture['comp'], string> = {
  league: 'text-mint border-mint/30', cup: 'text-orange border-orange/30', continental: 'text-sky border-sky/30', national: 'text-lime border-lime/30',
};
export function CompBadge({ fx }: { fx: Fixture }) {
  const short = fx.comp === 'league' ? 'LGE' : fx.comp === 'cup' ? 'CUP' : fx.comp === 'continental' ? 'CONT' : 'INTL';
  return <span className={`pill ${COMP_COLOR[fx.comp]}`} title={fx.compName}>{short}</span>;
}

const KIND_ICON: Record<CardDef['kind'], string> = { skill: '▲', boost: '⚡', recovery: '✚', potential: '✦', trait: '◆', staff: '☻' };
const KIND_LABEL: Record<CardDef['kind'], string> = { skill: 'Training', boost: 'Match boost', recovery: 'Recovery', potential: 'Potential', trait: 'Trait', staff: 'Staff' };

export function GameCard({ def, compact, isNew, onClick, footer }: { def: CardDef; compact?: boolean; isNew?: boolean; onClick?: () => void; footer?: ReactNode }) {
  return (
    <div className={`game-card ${onClick ? 'cursor-pointer' : ''} h-full`} data-r={def.rarity} onClick={onClick}>
      <div className="game-card-inner">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[.16em] font-extrabold rarity-text">{def.rarity}</span>
          {isNew && <span className="text-[9px] font-black bg-lime text-night rounded px-1">NEW</span>}
        </div>
        <div className={`${compact ? 'text-2xl my-1.5' : 'text-4xl my-3'} rarity-text`}>{KIND_ICON[def.kind]}</div>
        <div className={`font-display font-bold leading-tight ${compact ? 'text-lg' : 'text-2xl'}`}>{def.name}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">{KIND_LABEL[def.kind]}{def.monthlyCost ? ` · $${def.monthlyCost / 1000}K/mo` : ''}</div>
        <div className={`text-muted mt-2 leading-snug ${compact ? 'text-[11px]' : 'text-xs'}`}>{def.desc}</div>
        {footer && <div className="mt-auto pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-sm text-muted py-6 text-center">{children}</div>;
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>{kicker && <div className="eyebrow mb-1">{kicker}</div>}<h3 className="font-display text-2xl font-bold">{title}</h3></div>
      {right}
    </div>
  );
}

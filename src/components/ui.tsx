import type { ReactNode } from 'react';
import type { CardDef, Fixture, SquadRole } from '../game/types';
import { ROLE_LABEL } from '../engines/match';

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className={`panel w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'} max-h-[92vh] overflow-y-auto animate-slap rounded-b-none sm:rounded-[14px]`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: 'good' | 'warn' | 'bad' | 'sun' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const auto = tone ?? (pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad');
  const color = auto === 'sun' ? 'var(--sun)' : auto === 'good' ? '#3fcf7f' : auto === 'warn' ? '#ffa53f' : 'var(--red)';
  return <div className="h-3 rounded border-2 border-ink bg-white overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color, borderRight: pct > 0 && pct < 100 ? '2px solid var(--ink)' : undefined }} /></div>;
}

export function Meter({ label, value, max = 100, tone }: { label: string; value: number; max?: number; tone?: 'good' | 'warn' | 'bad' | 'sun' }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 font-bold"><span>{label}</span><span className="stat-num">{max <= 10 ? value.toFixed(1) : Math.round(value)}</span></div>
      <Bar value={value} max={max} tone={tone} />
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'sun' | 'red' }) {
  return (
    <div className={`sticker px-3 py-2 ${tone === 'sun' ? '!bg-sun' : tone === 'red' ? '!bg-red text-white' : ''}`}>
      <div className={`text-[10px] uppercase tracking-[.12em] font-extrabold ${tone === 'red' ? 'text-white/80' : 'text-muted'}`}>{label}</div>
      <div className="stat-num text-xl leading-tight">{value}</div>
      {sub && <div className={`text-[11px] font-semibold ${tone === 'red' ? 'text-white/80' : 'text-muted'}`}>{sub}</div>}
    </div>
  );
}

export function RoleBadge({ role }: { role: SquadRole }) {
  const cls: Record<SquadRole, string> = {
    star: 'tag-sun', starter: '!bg-[#3fcf7f] !text-ink', rotation: '!bg-sky !text-white', fringe: '!bg-[#ffa53f] !text-ink', reserve: '',
  };
  return <span className={`tag ${cls[role]}`}>{ROLE_LABEL[role]}</span>;
}

export function RatingBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted text-xs font-bold">—</span>;
  const cls = value >= 8 ? 'rating-hi' : value >= 7 ? 'rating-good' : value >= 6.2 ? 'rating-mid' : 'rating-low';
  return <span className={`rating ${cls}`}>{value.toFixed(1)}</span>;
}

export function ResultPill({ fx }: { fx: Fixture }) {
  if (!fx.played) return <span className="res res-D">vs</span>;
  const us = fx.usGoals ?? 0;
  const them = fx.oppGoals ?? 0;
  const r = us > them || fx.penalties?.startsWith('W') ? 'W' : us < them || fx.penalties?.startsWith('L') ? 'L' : 'D';
  return <span className={`res res-${r}`}>{r} {us}-{them}{fx.penalties ? 'p' : ''}</span>;
}

const COMP: Record<Fixture['comp'], [string, string]> = {
  league: ['LGE', 'bg-[#3fcf7f]'], cup: ['CUP', 'bg-[#ffa53f]'], continental: ['EUR', 'bg-sky text-white'], national: ['NAT', 'bg-sun'],
};
export function CompBadge({ fx }: { fx: Fixture }) {
  const [label, cls] = COMP[fx.comp];
  return <span className={`stat-num text-[10px] border-2 border-ink rounded px-1.5 py-0.5 shrink-0 ${cls}`} title={fx.compName}>{label}</span>;
}

const KIND_ICON: Record<CardDef['kind'], string> = { skill: '▲', boost: '⚡', recovery: '✚', potential: '✦', trait: '◆', staff: '☻' };
const KIND_LABEL: Record<CardDef['kind'], string> = { skill: 'Training', boost: 'Match boost', recovery: 'Recovery', potential: 'Potential', trait: 'Trait', staff: 'Staff' };

export function GameCard({ def, compact, isNew, onClick, tilt, footer }: { def: CardDef; compact?: boolean; isNew?: boolean; onClick?: () => void; tilt?: 'a' | 'b' | 'c'; footer?: ReactNode }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`gcard text-left w-full ${tilt ? `gcard-tilt-${tilt}` : ''} ${onClick ? 'gcard-hover' : ''}`} data-r={def.rarity} onClick={onClick}>
      <div className="gcard-band">
        <span className="text-[9px] uppercase tracking-[.16em] font-black">{def.rarity}</span>
        {isNew && <span className="text-[9px] font-black bg-ink text-sun rounded px-1">NEW</span>}
      </div>
      <div className="relative flex-1 flex flex-col p-2.5">
        <div className="absolute right-0 top-0 w-16 h-16 halftone opacity-60 pointer-events-none" />
        <div className={`${compact ? 'text-2xl' : 'text-4xl'} leading-none relative`}>{KIND_ICON[def.kind]}</div>
        <div className={`font-display uppercase leading-[1.05] mt-2 ${compact ? 'text-[13px]' : 'text-xl'}`}>{def.name}</div>
        <div className="text-[9px] uppercase tracking-wider font-extrabold text-muted mt-1">{KIND_LABEL[def.kind]}{def.monthlyCost ? ` · $${def.monthlyCost / 1000}K/mo` : ''}</div>
        <div className={`text-muted font-semibold mt-1.5 leading-snug ${compact ? 'text-[10.5px]' : 'text-xs'}`}>{def.desc}</div>
        {footer && <div className="mt-auto pt-2">{footer}</div>}
      </div>
    </Tag>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-sm text-muted font-semibold py-6 text-center">{children}</div>;
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="font-display text-2xl uppercase leading-none">{title}</h3>
        {kicker && <div className="mt-1.5"><span className="tag">{kicker}</span></div>}
      </div>
      {right}
    </div>
  );
}

export function Coin() {
  return <span className="coin" aria-hidden="true">c</span>;
}

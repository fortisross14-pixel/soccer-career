import type { Player, SkillKey } from '../../game/types';
import { SKILLS, CATEGORY_ORDER } from '../../data/skills';
import { POSITION_MAP } from '../../data/positions';
import { getCountry } from '../../data/countries';
import { playerOverall } from '../../engines/overall';
import { OverallBadge } from '../ui';

export default function Skills({ player }: { player: Player }) {
  const ovr = playerOverall(player);
  const pos = POSITION_MAP[player.position];
  const country = getCountry(player.country);
  const prev = player.history.length > 0
    ? player.history[player.history.length - 1]
    : null;

  // reconstruct rough deltas: we only stored overall history, so compute
  // change vs a shadow using the last season's stored skills is not kept;
  // instead show current values (deltas surface in the year-summary modal).
  const keySet = new Set(pos.keySkills);
  const hideGk = player.position !== 'GK';

  const compareLeague = ovr - country.leagueRep;
  const compareNation = ovr - country.nationalStrength;

  return (
    <div className="card p-7 animate-fade-up">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="eyebrow">Attributes</div>
          <div className="text-zinc-500 text-sm mt-1">Highlighted = key skills for a {pos.name}</div>
        </div>
        <div className="text-right">
          <OverallBadge value={ovr} size="lg" />
          <div className="text-[11px] text-zinc-500">OVERALL</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-7">
        <Compare label={`vs ${country.leagueName}`} value={compareLeague} />
        <Compare label={`vs ${player.country} NT`} value={compareNation} />
        <Compare label="Potential" value={Math.round(48 + player.potentialCeiling * 51) - ovr} suffix="ceiling" raw={Math.round(48 + player.potentialCeiling * 51)} />
      </div>

      <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
        {CATEGORY_ORDER.filter((c) => !(hideGk && c === 'Goalkeeping')).map((cat) => {
          const skills = SKILLS.filter((s) => s.category === cat && !(hideGk && s.category === 'Goalkeeping'));
          if (skills.length === 0) return null;
          return (
            <div key={cat}>
              <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-3">{cat}</div>
              <div className="space-y-3">
                {skills.map((s) => (
                  <LabeledSkill key={s.key} label={s.label} value={player.skills[s.key]} highlight={keySet.has(s.key as SkillKey)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {prev && <p className="text-[11px] text-zinc-600 mt-6">Year-over-year changes appear in the season recap after each Advance year.</p>}
    </div>
  );
}

function LabeledSkill({ label, value, highlight }: { label: string; value: number; highlight: boolean }) {
  const pct = Math.min(100, (value / 99) * 100);
  const hue =
    value >= 85 ? 'from-amber-400 to-amber-200' :
    value >= 70 ? 'from-pitch-500 to-pitch-400' :
    value >= 55 ? 'from-emerald-600 to-emerald-500' : 'from-zinc-600 to-zinc-500';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={highlight ? 'text-pitch-300 font-medium' : 'text-zinc-300'}>{label}</span>
        <span className="stat-num">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${hue}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Compare({ label, value, suffix, raw }: { label: string; value: number; suffix?: string; raw?: number }) {
  const pos = value >= 0;
  return (
    <div className="bg-zinc-900/60 rounded-2xl px-4 py-3 text-center">
      <div className="stat-num text-2xl text-pitch-400">
        {raw !== undefined ? raw : `${pos ? '+' : ''}${value}`}
      </div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{label}{suffix ? ` ${suffix}` : ''}</div>
    </div>
  );
}

import { useGame } from '../../game/store';
import { CATEGORY_ORDER, SKILLS } from '../../data/skills';
import { POSITION_MAP } from '../../data/positions';
import { TRAIT_MAP } from '../../data/traits';
import { playerOverall, potentialOverall, skillCap } from '../../engines/overall';
import { SectionTitle, Stat } from '../ui';

const STAT_LABELS: Record<string, string> = {
  shots: 'Shots', onTarget: 'On target', keyPasses: 'Key passes', passes: 'Passes', dribbles: 'Dribbles', tackles: 'Tackles',
  interceptions: 'Interceptions', aerials: 'Aerials won', saves: 'Saves', conceded: 'Conceded',
};

export default function PlayerTab() {
  const { career } = useGame();
  if (!career) return null;
  const c = career;
  const p = c.player;
  const pos = POSITION_MAP[p.position];
  const ovr = playerOverall(p);
  const pot = potentialOverall(p);
  const lastDeltas = c.lastReport?.skillDeltas ?? {};
  const played = (c.season?.fixtures ?? []).filter((f) => f.report && f.report.minutes > 0);
  const agg: Record<string, number> = {};
  for (const f of played) for (const [k, v] of Object.entries(f.report!.stats)) if (k !== 'passAcc' && k !== 'motm') agg[k] = (agg[k] ?? 0) + v;
  const phase = p.age < p.peakStart ? 'Developing' : p.age <= p.peakEnd ? 'Prime' : 'Declining';

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
      <section className="panel p-5">
        <SectionTitle kicker={pos.name} title="Attributes" right={<span className="text-xs text-muted">bar marker = your ceiling</span>} />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {CATEGORY_ORDER.filter((cat) => cat !== 'Goalkeeping' || p.position === 'GK').map((cat) => (
            <div key={cat}>
              <div className="text-[10px] uppercase tracking-[.16em] text-muted font-bold mb-2">{cat}</div>
              <div className="space-y-2">
                {SKILLS.filter((s) => s.category === cat).map((s) => {
                  const v = p.skills[s.key];
                  const cap = skillCap(p, s.key);
                  const isKey = pos.keySkills.includes(s.key);
                  const weighted = (pos.weights[s.key] ?? 0) > 0;
                  const d = lastDeltas[s.key] ?? 0;
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={isKey ? 'text-ink font-semibold' : weighted ? 'text-ink' : 'text-muted'}>{s.label}{isKey ? ' ★' : ''}</span>
                        <span className="stat-num">{Math.floor(v)}{Math.abs(d) >= 0.05 && <span className={`ml-1 text-[10px] ${d > 0 ? 'text-[#178a4c]' : 'text-red'}`}>{d > 0 ? '+' : ''}{d.toFixed(1)}</span>}<span className="text-muted text-[10px]"> /{cap}</span></span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-white">
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${v}%`, background: v >= cap - 0.5 ? 'var(--legendary)' : isKey ? 'var(--lime)' : 'var(--mint)' }} />
                        <div className="absolute -top-0.5 w-0.5 h-2.5 bg-cream/70" style={{ left: `${cap}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-5">★ key attributes for your position. Only weighted attributes (white) affect your overall. Gold bars are at their ceiling, so use Potential cards to raise it.</p>
      </section>

      <div className="space-y-5">
        <section className="panel p-5">
          <SectionTitle kicker={`${'★'.repeat(p.stars)}${'☆'.repeat(5 - p.stars)} prospect`} title="Profile" />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Overall" value={<span className="text-ink">{ovr}</span>} />
            <Stat label="Potential" value={pot} />
            <Stat label="Peak" value={c.peakOvr} />
          </div>
          <div className="text-sm text-muted mt-4 space-y-1">
            <div>Career phase: <span className="text-ink">{phase}</span> (prime roughly {p.peakStart}–{p.peakEnd})</div>
            <div>Nationality: <span className="text-ink">{p.country}</span> · International: <span className="text-ink">{c.national.status}</span></div>
            {p.traits.length > 0 && <div>Traits: <span className="text-ink">{p.traits.map((t) => TRAIT_MAP[t]?.name).join(', ')}</span></div>}
          </div>
        </section>
        <section className="panel p-5">
          <SectionTitle kicker="This season" title="Match stats" />
          {played.length === 0 ? <p className="text-sm text-muted">No appearances yet.</p> : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(agg).map(([k, v]) => <Stat key={k} label={STAT_LABELS[k] ?? k} value={v} sub={`${(v / played.length).toFixed(1)} per game`} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

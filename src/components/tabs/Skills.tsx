import type { Player, SeasonObjective, SkillKey, TrainingIntensity, TacticalRole } from '../../game/types';
import { SKILLS, CATEGORY_ORDER } from '../../data/skills';
import { POSITION_MAP } from '../../data/positions';
import { getCountry } from '../../data/countries';
import { TRAINING, SEASON_OBJECTIVES } from '../../data/development';
import { playerOverall } from '../../engines/overall';
import { useGame } from '../../game/store';
import { OverallBadge } from '../ui';

export default function Skills({ player, focusId, setFocusId }: { player: Player; focusId: string | null; setFocusId: (id: string | null) => void }) {
  const { setPlan, setTacticalRole } = useGame();
  const ovr = playerOverall(player);
  const pos = POSITION_MAP[player.position];
  const country = getCountry(player.country);
  const keySet = new Set(pos.keySkills);
  const hideGk = player.position !== 'GK';
  const objective = player.seasonObjective ?? 'develop';
  const intensity = player.trainingIntensity ?? 'balanced';
  const selectedObjective = SEASON_OBJECTIVES.find((item) => item.value === objective);

  return (
    <div className="space-y-6 animate-fade-up">
      <section className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="card p-6">
          <div className="eyebrow mb-1">Season focus</div>
          <h2 className="text-2xl font-display mb-2">Define what success means</h2>
          <p className="text-zinc-500 text-sm mb-5">Your objective changes the way the season is evaluated and influences morale, fitness, visibility and development.</p>
          <select value={objective} onChange={(e) => setPlan(e.target.value as SeasonObjective, intensity)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            {SEASON_OBJECTIVES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">{selectedObjective?.desc}</div>
          <div className="mt-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Training intensity</div>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'balanced', 'intense'] as TrainingIntensity[]).map((value) => (
                <button key={value} onClick={() => setPlan(objective, value)} className={`rounded-xl border px-3 py-3 text-sm capitalize ${intensity === value ? 'border-pitch-500 bg-pitch-950 text-pitch-200' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'}`}>{value}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5 text-center text-xs">
            <Meter label="Morale" value={player.morale ?? 70} />
            <Meter label="Fitness" value={player.fitness ?? 80} />
            <Meter label="Manager" value={player.managerTrust ?? 55} />
          </div>
        </div>

        <div className="card p-6">
          <div className="eyebrow mb-1">Training focus</div>
          <h2 className="text-2xl font-display mb-2">Choose your development lane</h2>
          <p className="text-zinc-500 text-sm mb-5">The selected group receives additional growth. Academy specialization can amplify matching attributes before your professional debut.</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {TRAINING.filter((item) => player.position === 'GK' || item.id !== 'gk').map((item) => {
              const active = focusId === item.id;
              return <button key={item.id} onClick={() => setFocusId(active ? null : item.id)} className={`text-left px-4 py-3 rounded-xl border text-sm ${active ? 'border-pitch-500 bg-pitch-950 text-pitch-200' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'}`}>
                <div className="font-medium">{item.label}</div><div className="text-[11px] text-zinc-500 mt-1">{item.keys.join(' · ')}</div>
              </button>;
            })}
          </div>
          {player.age < 16 && <div className="mt-4 text-xs text-amber-200/80 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3">Academy years produce faster growth. Current academy emphasis: <strong>{player.academyFocus ?? 'Balanced'}</strong>.</div>}
        </div>
      </section>


      <section className="card p-6">
        <div className="eyebrow mb-1">Tactical identity</div>
        <h2 className="text-2xl font-display mb-2">Choose how you want to play</h2>
        <p className="text-zinc-500 text-sm mb-4">A natural role improves seasonal form. An unsuitable role creates a small performance penalty.</p>
        <select value={player.tacticalRole ?? ''} onChange={(e)=>setTacticalRole(e.target.value as TacticalRole)} className="w-full md:w-96 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          {TACTICAL_OPTIONS[player.position].map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </section>

      <section className="card p-7">
        <div className="flex justify-between items-start mb-6">
          <div><div className="eyebrow">Attributes</div><div className="text-zinc-500 text-sm mt-1">Highlighted attributes are key skills for a {pos.name}.</div></div>
          <div className="text-right"><OverallBadge value={ovr} size="lg" /><div className="text-[11px] text-zinc-500">OVERALL</div></div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-7">
          <Compare label={`vs ${country.leagueName}`} value={ovr - country.leagueRep} />
          <Compare label={`vs ${player.country} NT`} value={ovr - country.nationalStrength} />
          <Compare label="Potential ceiling" value={0} raw={Math.round(48 + player.potentialCeiling * 51)} />
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
          {CATEGORY_ORDER.filter((category) => !(hideGk && category === 'Goalkeeping')).map((category) => {
            const skills = SKILLS.filter((skill) => skill.category === category && !(hideGk && skill.category === 'Goalkeeping'));
            if (!skills.length) return null;
            return <div key={category}><div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-3">{category}</div><div className="space-y-3">{skills.map((skill) => <LabeledSkill key={skill.key} label={skill.label} value={player.skills[skill.key]} highlight={keySet.has(skill.key as SkillKey)} />)}</div></div>;
          })}
        </div>
        {player.history.length > 0 && <p className="text-[11px] text-zinc-600 mt-6">Year-over-year changes appear in the season recap after each Advance year.</p>}
      </section>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return <div className="bg-zinc-900/70 rounded-xl p-2"><div className="stat-num text-pitch-400 text-lg">{Math.round(value)}</div><div className="text-zinc-500">{label}</div></div>;
}

function LabeledSkill({ label, value, highlight }: { label: string; value: number; highlight: boolean }) {
  const pct = Math.min(100, (value / 99) * 100);
  const hue = value >= 85 ? 'from-amber-400 to-amber-200' : value >= 70 ? 'from-pitch-500 to-pitch-400' : value >= 55 ? 'from-emerald-600 to-emerald-500' : 'from-zinc-600 to-zinc-500';
  return <div><div className="flex justify-between text-sm mb-1"><span className={highlight ? 'text-pitch-300 font-medium' : 'text-zinc-300'}>{label}</span><span className="stat-num">{value}</span></div><div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${hue}`} style={{ width: `${pct}%` }} /></div></div>;
}

function Compare({ label, value, raw }: { label: string; value: number; raw?: number }) {
  const positive = value >= 0;
  return <div className="bg-zinc-900/60 rounded-2xl px-4 py-3 text-center"><div className="stat-num text-2xl text-pitch-400">{raw ?? `${positive ? '+' : ''}${value}`}</div><div className="text-[11px] text-zinc-500 mt-0.5">{label}</div></div>;
}

const TACTICAL_OPTIONS: Record<Player['position'], {value:TacticalRole;label:string}[]> = {
 ST:[{value:'poacher',label:'Poacher'},{value:'target-forward',label:'Target forward'},{value:'complete-forward',label:'Complete forward'},{value:'false-nine',label:'False nine'},{value:'pressing-forward',label:'Pressing forward'}],
 W:[{value:'winger',label:'Winger'},{value:'inside-forward',label:'Inside forward'},{value:'pressing-forward',label:'Pressing forward'}],
 AM:[{value:'advanced-playmaker',label:'Advanced playmaker'},{value:'false-nine',label:'False nine'}],
 B2B:[{value:'box-to-box',label:'Box-to-box'},{value:'ball-winner',label:'Ball winner'}],
 CM:[{value:'deep-playmaker',label:'Deep-lying playmaker'},{value:'advanced-playmaker',label:'Advanced playmaker'},{value:'box-to-box',label:'Box-to-box'}],
 CB:[{value:'stopper',label:'Stopper'},{value:'ball-playing-defender',label:'Ball-playing defender'}],
 FB:[{value:'overlapping-fullback',label:'Overlapping fullback'},{value:'defensive-fullback',label:'Defensive fullback'}],
 GK:[{value:'shot-stopper',label:'Shot stopper'},{value:'sweeper-keeper',label:'Sweeper keeper'}],
};

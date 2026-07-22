import type { Player } from '../../game/types';
import { worldCupThisYear, continentalNationsThisYear } from '../../data/tournaments';

export default function NationalTeam({ player }: { player: Player }) {
  const matches = [...(player.national.matches ?? [])].reverse();
  const yearsToWorldCup = (4 - (player.season % 4)) % 4;
  const nextLabel = worldCupThisYear(player.season) ? 'World Cup season now' : `${yearsToWorldCup} season${yearsToWorldCup === 1 ? '' : 's'} until the next World Cup`;
  const nextCompetition = continentalNationsThisYear(player.season) ? 'Continental championship season' : nextLabel;
  return <div className="space-y-5 animate-fade-up">
    <section className="card p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><div className="eyebrow">{player.country} national team</div><h2 className="font-display text-3xl mt-1">International career</h2><p className="text-zinc-400 text-sm mt-2">{nextCompetition}</p></div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Caps" value={player.national.caps}/><Stat label="Goals" value={player.national.goals}/><Stat label="Assists" value={player.national.assists ?? 0}/><Stat label="Status" value={player.national.status}/><Stat label="Debut" value={player.national.debutAge ?? '—'}/>
        </div>
      </div>
    </section>

    <section className="card p-6">
      <div className="eyebrow mb-4">Position depth chart</div>
      <p className="text-sm text-zinc-500 mb-4">Selection is based on quality, form and the national coach's pecking order. This is the competition for your position.</p>
      <div className="grid md:grid-cols-4 gap-3">
        {depthChart(player).map((row,i)=><div key={row.name} className={`rounded-xl border p-4 ${row.user?'border-pitch-500 bg-pitch-950/30':'border-zinc-800 bg-zinc-900/50'}`}><div className="text-[10px] uppercase tracking-wide text-zinc-500">#{i+1} · {row.status}</div><div className="font-medium mt-1">{row.name}</div><div className="flex justify-between mt-3 text-sm"><span className="text-zinc-500">OVR</span><span className="stat-num text-pitch-400">{row.overall}</span></div><div className="flex justify-between text-sm"><span className="text-zinc-500">Form</span><span>{row.form}</span></div></div>)}
      </div>
    </section>

    <section className="card p-6">
      <div className="eyebrow mb-4">Match history</div>
      <div className="overflow-auto max-h-[620px]">
        <table className="w-full text-sm min-w-[900px]"><thead><tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-800"><th className="text-left py-3">Age</th><th className="text-left">Competition</th><th className="text-left">Stage</th><th className="text-left">Opponent</th><th>Result</th><th>Role</th><th>Min</th><th>G</th><th>A</th><th>Rating</th></tr></thead>
        <tbody className="divide-y divide-zinc-800/70">{matches.map((m,i)=><tr key={`${m.season}-${i}`} className="hover:bg-zinc-900/50"><td className="py-3 text-zinc-500">{m.age}</td><td className="font-medium">{m.competition}</td><td className="text-zinc-400">{m.stage}</td><td>{m.opponent}</td><td className={`text-center font-bold ${m.result==='W'?'text-pitch-400':m.result==='L'?'text-red-400':'text-amber-300'}`}>{m.result} {m.teamGoals}-{m.opponentGoals}</td><td className="text-center text-zinc-400">{m.minutes===0?'Unused':m.started?'Started':'Sub'}</td><td className="text-center stat-num">{m.minutes}</td><td className="text-center stat-num">{m.goals}</td><td className="text-center stat-num">{m.assists}</td><td className="text-center stat-num text-pitch-400">{m.rating?.toFixed(1) ?? '—'}</td></tr>)}</tbody></table>
        {matches.length===0&&<p className="text-zinc-500 text-sm py-10 text-center">No senior international matches yet. Tournament and qualification schedules will appear here once selected.</p>}
      </div>
    </section>
  </div>;
}
function Stat({label,value}:{label:string;value:React.ReactNode}){return <div className="bg-zinc-900/70 rounded-xl px-3 py-2 min-w-[78px]"><div className="stat-num text-pitch-400 text-lg">{value}</div><div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div></div>}

function depthChart(player:Player){ const user=Math.round(player.history.at(-1)?.overall ?? 50); const forms=['Excellent','Good','Average']; return [{name:player.name,overall:user,form:player.history.at(-1)?.rating&&player.history.at(-1)!.rating>7.3?'Excellent':'Good',status:player.national.status,user:true},{name:`${player.country} veteran`,overall:Math.max(60,user+3),form:forms[1],status:'Established starter',user:false},{name:`${player.country} contender`,overall:Math.max(58,user-1),form:forms[0],status:'Direct rival',user:false},{name:`${player.country} prospect`,overall:Math.max(54,user-5),form:forms[2],status:'Emerging option',user:false}].sort((a,b)=>b.overall-a.overall);}

import type { Player } from '../../game/types';
import { playerOverall } from '../../engines/overall';
import { POSITION_MAP } from '../../data/positions';

export default function Rival({ player }: { player: Player }) {
  const yours = playerOverall(player);
  const rt = player.rivalTotals ?? { games: 0, goals: 0, assists: 0, trophies: 0 };
  const rows = [...(player.rivalHistory ?? [])].reverse();
  const latestYou = player.history[player.history.length - 1];
  const latestRival = player.rivalHistory?.[player.rivalHistory.length - 1];
  const compare = [
    ['Overall', yours, player.rivalOverall ?? 0], ['Career games', player.totals.games, rt.games],
    ['Career goals', player.totals.goals, rt.goals], ['Career assists', player.totals.assists, rt.assists],
    ['Trophies', [...player.honors.club, ...player.honors.national].reduce((n,h)=>n+h.count,0), rt.trophies],
    ['Latest rating', latestYou?.rating?.toFixed(1) ?? '—', latestRival?.rating?.toFixed(1) ?? '—'],
  ];
  return <div className="space-y-5 animate-fade-up">
    <section className="rival-hero">
      <div className="rival-person"><span className="avatar">{player.name.slice(0,1)}</span><div><small>You</small><h2>{player.name}</h2><p>{POSITION_MAP[player.position].name} · {player.country}</p></div></div>
      <div className="versus">VS</div>
      <div className="rival-person rival-person-right"><div><small>Career rival</small><h2>{player.rivalName}</h2><p>{POSITION_MAP[player.rivalPosition ?? player.position].name} · {player.rivalCountry}</p></div><span className="avatar rival-avatar">{player.rivalName?.slice(0,1)}</span></div>
    </section>
    <section className="comparison-grid">{compare.map(([label,a,b]) => {
      const an=Number(a), bn=Number(b); const left=Number.isFinite(an)&&Number.isFinite(bn)&&an>bn; const right=Number.isFinite(an)&&Number.isFinite(bn)&&bn>an;
      return <div className="comparison-row" key={String(label)}><strong className={left?'winner':''}>{a}</strong><span>{label}</span><strong className={right?'winner':''}>{b}</strong></div>
    })}</section>
    <section className="editorial-card"><div className="section-kicker">Season by season</div><div className="overflow-x-auto"><table className="rival-table"><thead><tr><th>Age</th><th>Club</th><th>OVR</th><th>Apps</th><th>G</th><th>A</th><th>Rating</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.season}-${r.age}`}><td>{r.age}</td><td>{r.clubName}</td><td>{r.overall}</td><td>{r.games}</td><td>{r.goals}</td><td>{r.assists}</td><td>{r.rating}</td></tr>)}</tbody></table></div></section>
  </div>;
}

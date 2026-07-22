import { useMemo, useState } from 'react';
import type { Player } from '../../game/types';
import { currentClub } from '../../game/engine';
import { leagueCareerRecords, leagueSeasonRecords, nationalRecords, type RecordEntry, type RecordMetric } from '../../data/records';

const METRICS: {id:RecordMetric;label:string}[]=[{id:'goals',label:'Goals'},{id:'assists',label:'Assists'},{id:'games',label:'Games'},{id:'rating',label:'Rating'}];
export default function Records({player}:{player:Player}){
 const [scope,setScope]=useState<'club'|'league'|'national'>('league'); const [period,setPeriod]=useState<'career'|'season'>('career'); const [metric,setMetric]=useState<RecordMetric>('goals');
 const club=currentClub(player);
 const rows=useMemo(()=>{
   if(scope==='national') return nationalRecords(player.country, metric==='rating'?'games':metric as 'games'|'goals'|'assists');
   if(scope==='league') return period==='career'?leagueCareerRecords(club.country,metric):leagueSeasonRecords(club.country,metric);
   const base=period==='career'?leagueCareerRecords(club.country,metric):leagueSeasonRecords(club.country,metric);
   return base.map((r,i)=>({name:i<3?`${club.name} legend ${i+1}`:r.name,value:Math.max(metric==='rating'?6.8:1, +(r.value*(0.72-i*0.012)).toFixed(metric==='rating'?2:0))}));
 },[scope,period,metric,club.country,club.name,player.country]);
 const playerValue=scope==='national'?(metric==='games'?player.national.caps:metric==='goals'?player.national.goals:(player.national.assists ?? 0)):period==='career'?(metric==='games'?player.totals.games:metric==='goals'?player.totals.goals:metric==='assists'?player.totals.assists:Math.max(0,...player.history.map(h=>h.rating))):(metric==='games'?Math.max(0,...player.history.map(h=>h.games)):metric==='goals'?Math.max(0,...player.history.map(h=>h.goals)):metric==='assists'?Math.max(0,...player.history.map(h=>h.assists)):Math.max(0,...player.history.map(h=>h.rating)));
 const ranked=[...rows,{name:player.name,value:playerValue,note:'You'}].sort((a,b)=>b.value-a.value).slice(0,10);
 return <div className="space-y-5 animate-fade-up"><section className="card p-6"><div className="eyebrow">Record room</div><h2 className="font-display text-3xl mt-1">Chase football history</h2><p className="text-zinc-400 text-sm mt-2">Your live rank is inserted into each table. Single-season records use your best completed professional season.</p>
 <div className="flex flex-wrap gap-2 mt-5">{(['club','league','national'] as const).map(x=><button key={x} onClick={()=>setScope(x)} className={scope===x?'btn-primary px-4 py-2':'btn-ghost px-4 py-2'}>{x==='club'?club.name:x==='league'?`${club.country} league`:player.country}</button>)}</div>
 {scope!=='national'&&<div className="flex gap-2 mt-3">{(['career','season'] as const).map(x=><button key={x} onClick={()=>setPeriod(x)} className={`pill ${period===x?'border-pitch-500 text-pitch-300':'border-zinc-700 text-zinc-400'}`}>{x==='career'?'All-time career':'Single season'}</button>)}</div>}
 </section><section className="card p-6"><div className="flex flex-wrap gap-2 mb-5">{METRICS.filter(m=>scope!=='national'||m.id!=='rating').map(m=><button key={m.id} onClick={()=>setMetric(m.id)} className={`px-4 py-2 rounded-full text-sm ${metric===m.id?'bg-pitch-500 text-zinc-950 font-bold':'bg-zinc-900 text-zinc-400'}`}>{m.label}</button>)}</div><RecordTable rows={ranked} playerName={player.name} metric={metric}/></section></div>
}
function RecordTable({rows,playerName,metric}:{rows:RecordEntry[];playerName:string;metric:RecordMetric}){return <div className="space-y-2">{rows.map((r,i)=><div key={`${r.name}-${i}`} className={`grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-xl px-4 py-3 border ${r.name===playerName?'border-pitch-500 bg-pitch-950/50':'border-zinc-800 bg-zinc-900/50'}`}><div className="stat-num text-zinc-500">#{i+1}</div><div><div className={r.name===playerName?'font-bold text-pitch-300':'font-medium'}>{r.name}</div>{r.note&&<div className="text-[10px] uppercase tracking-wide text-pitch-500">{r.note}</div>}</div><div className="stat-num text-xl">{metric==='rating'?r.value.toFixed(2):Math.round(r.value)}</div></div>)}</div>}

import type { Player, SeasonEvent, SeasonEventChoice } from '../game/types';
import { clamp, randInt } from './util';

const info = (id:string,title:string,body:string,category:SeasonEvent['category'], effects:SeasonEventChoice['effects']={}):SeasonEvent => ({id,title,body,category,choices:[{id:'accept',label:'Continue',description:'Accept what happened and move forward.',effects}]});

export function generateSeasonEvents(p: Player): SeasonEvent[] {
  const count = randInt(1,5);
  const pool: SeasonEvent[] = [];
  if (p.age >= 18) pool.push(info('family-news','A new chapter off the pitch','You welcome a child into your family. The year brings joy, responsibility and a different perspective.','life',{morale:8,development:-0.05}));
  pool.push(info('illness','Interrupted preparation','A minor illness costs you valuable preparation time.','life',{fitness:-8,development:-0.06}));
  pool.push(info('long-injury','Long-term injury','A serious injury rules you out for a substantial part of the season.','injury',{fitness:-28,performance:-0.28,development:-0.2,injuryRisk:0.2}));
  pool.push({id:'coach-role',title:'The manager challenges your role',body:'The coach wants you to play in a less familiar role during an important run of matches.',category:'career',choices:[
    {id:'accept',label:'Accept the role',description:'Sacrifice comfort to help the team.',effects:{managerTrust:10,performance:-0.04,decisionScore:2}},
    {id:'pushback',label:'Defend your position',description:'Insist that your best role gives the team more.',effects:{managerTrust:-9,morale:5,performance:0.03,decisionScore:-1}},
    {id:'compromise',label:'Ask for a compromise',description:'Agree selectively while protecting your main position.',effects:{managerTrust:3,performance:0.01,decisionScore:1}},
  ]});
  pool.push({id:'big-match',title:'A defining match',body:'Late in a major match, the ball falls to you with the result in the balance.',category:'match',choices:[
    {id:'risk',label:'Take the decisive action',description:'Attempt the difficult shot or final pass.',effects:{performance:0.09,reputation:2,fitness:-3,decisionScore:2}},
    {id:'safe',label:'Keep possession',description:'Choose control over individual glory.',effects:{managerTrust:5,performance:0.02,decisionScore:1}},
    {id:'team',label:'Create for a teammate',description:'Use awareness and trust the supporting run.',effects:{performance:0.06,morale:3,decisionScore:2}},
  ]});
  pool.push({id:'play-hurt',title:'Play through the pain?',body:'A cup tie is approaching, but the medical team says you are not fully fit.',category:'injury',choices:[
    {id:'play',label:'Play anyway',description:'Help the team, accepting a major physical risk.',effects:{managerTrust:9,performance:0.04,fitness:-14,injuryRisk:0.16,decisionScore:-1}},
    {id:'rest',label:'Protect your body',description:'Miss the match and prioritize the rest of the season.',effects:{fitness:10,managerTrust:-4,development:0.03,decisionScore:2}},
    {id:'bench',label:'Offer limited minutes',description:'Make yourself available only if needed.',effects:{managerTrust:3,fitness:-4,injuryRisk:0.04,decisionScore:1}},
  ]});
  pool.push({id:'media',title:'The spotlight intensifies',body:'A journalist asks whether you have outgrown your current club.',category:'career',choices:[
    {id:'loyal',label:'Commit to the club',description:'Publicly back the project.',effects:{managerTrust:8,morale:3,reputation:1,decisionScore:1}},
    {id:'ambitious',label:'Leave the door open',description:'Make your ambition clear without demanding a move.',effects:{managerTrust:-4,reputation:3,decisionScore:1}},
    {id:'refuse',label:'Avoid the question',description:'Keep your future private.',effects:{reputation:-1,decisionScore:0}},
  ]});
  return pool.sort(()=>Math.random()-.5).slice(0,count);
}

export function applySeasonEventChoice(p:Player, event:SeasonEvent, choiceId:string):Player {
  const next:Player=JSON.parse(JSON.stringify(p));
  const c=event.choices.find(x=>x.id===choiceId) ?? event.choices[0];
  const e=c.effects;
  next.morale=clamp((next.morale??70)+(e.morale??0),0,100);
  next.fitness=clamp((next.fitness??80)+(e.fitness??0),0,100);
  next.managerTrust=clamp((next.managerTrust??55)+(e.managerTrust??0),0,100);
  next.reputation=clamp(next.reputation+(e.reputation??0),0,100);
  next.eventPerformanceModifier=(next.eventPerformanceModifier??0)+(e.performance??0);
  next.eventDevelopmentModifier=(next.eventDevelopmentModifier??0)+(e.development??0);
  next.eventInjuryModifier=(next.eventInjuryModifier??0)+(e.injuryRisk??0);
  next.careerDecisionScore=(next.careerDecisionScore??0)+(e.decisionScore??0);
  next.log.unshift({season:next.season,age:next.age,kind:event.category==='injury'?'injury':'event',text:`${event.title}: ${c.label}.`});
  return next;
}

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Player, PositionKey, SkillKey, SeasonObjective, TrainingIntensity, SeasonEvent, TacticalRole, AgentType } from './types';
import {
  advanceYear, finalizeRetirement, signOffer, searchForClubs,
  signSponsorship, requestContract, requestTransfer, setSeasonPlan, type YearSummary,
} from './engine';
import { createPlayer } from '../engines/newgame';
import { marketValue } from '../engines/transfers';
import { playerOverall } from '../engines/overall';
import { careerVerdict } from '../engines/narrative';
import { saveToSlot, loadSlot, firstFreeSlot, addToHof } from './save';
import { generateSeasonEvents, applySeasonEventChoice } from '../engines/events';

type Screen = 'home' | 'game';

interface Ctx {
  screen: Screen;
  player: Player | null;
  slot: number | null;
  summary: YearSummary | null;
  pendingEvents: SeasonEvent[];
  currentEvent: SeasonEvent | null;
  setScreen: (s: Screen) => void;
  startNew: (name: string, country: string, position: PositionKey, overwriteSlot?: number) => boolean;
  load: (slot: number) => void;
  exit: () => void;
  advance: (focus: SkillKey[] | null) => void;
  clearSummary: () => void;
  sign: (i: number) => void;
  search: (scope: 'domestic' | 'international') => void;
  sponsor: () => number;
  renegotiate: (priority?: 'wage' | 'role' | 'security') => { ok: boolean; msg: string };
  retire: () => void;
  setPlan: (objective: SeasonObjective, intensity: TrainingIntensity) => void;
  transferRequest: () => number;
  loanRequest: () => number;
  targetedSearch: (country: string) => number;
  resolveEvent: (choiceId: string) => void;
  setTacticalRole: (role: TacticalRole) => void;
  setAgent: (agent: AgentType) => void;
}

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [player, setPlayer] = useState<Player | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [summary, setSummary] = useState<YearSummary | null>(null);
  const [pendingEvents, setPendingEvents] = useState<SeasonEvent[]>([]);
  const [eventPlayer, setEventPlayer] = useState<Player | null>(null);
  const [pendingFocus, setPendingFocus] = useState<SkillKey[] | null>(null);

  const persist = (p: Player, s: number | null) => {
    const target = s ?? firstFreeSlot();
    if (!target) return;
    saveToSlot(target, p);
    setSlot(target);
  };

  const startNew = (name: string, country: string, position: PositionKey, overwriteSlot?: number): boolean => {
    const target = overwriteSlot ?? firstFreeSlot();
    if (!target) return false;
    const p = createPlayer(name, country, position);
    p.marketValue = marketValue(playerOverall(p), p.age, p.reputation);
    saveToSlot(target, p);
    setPlayer(p);
    setSlot(target);
    setScreen('game');
    return true;
  };

  const load = (s: number) => {
    const p = loadSlot(s);
    if (!p) return;
    setPlayer(p);
    setSlot(s);
    setScreen('game');
  };

  const exit = () => {
    if (player && slot) saveToSlot(slot, player);
    setPlayer(null);
    setSlot(null);
    setSummary(null);
    setScreen('home');
  };

  const finishAdvance = (base: Player, focus: SkillKey[] | null) => {
    const { player: next, summary: sum } = advanceYear(base, focus);
    if (sum.retired) addToHof(next);
    persist(next, slot); setPlayer(next); setSummary(sum); setPendingEvents([]); setEventPlayer(null); setPendingFocus(null);
  };

  const advance = (focus: SkillKey[] | null) => {
    if (!player || player.retired || pendingEvents.length) return;
    const events = generateSeasonEvents(player);
    setPendingFocus(focus); setEventPlayer(player); setPendingEvents(events);
    if (!events.length) finishAdvance(player, focus);
  };

  const resolveEvent = (choiceId: string) => {
    if (!eventPlayer || !pendingEvents.length) return;
    const nextPlayer = applySeasonEventChoice(eventPlayer, pendingEvents[0], choiceId);
    const remaining = pendingEvents.slice(1);
    setEventPlayer(nextPlayer); setPendingEvents(remaining);
    if (!remaining.length) finishAdvance(nextPlayer, pendingFocus);
  };

  const clearSummary = () => setSummary(null);

  const sign = (i: number) => {
    if (!player) return;
    const next = signOffer(player, i);
    persist(next, slot);
    setPlayer(next);
  };

  const search = (scope: 'domestic' | 'international') => {
    if (!player) return;
    const next = searchForClubs(player, scope);
    persist(next, slot);
    setPlayer(next);
  };

  const sponsor = (): number => {
    if (!player) return 0;
    const { player: next, amount } = signSponsorship(player);
    persist(next, slot);
    setPlayer(next);
    return amount;
  };

  const renegotiate = (priority: 'wage' | 'role' | 'security' = 'wage') => {
    if (!player) return { ok: false, msg: 'No player.' };
    const { player: next, ok, msg } = requestContract(player, priority);
    persist(next, slot);
    setPlayer(next);
    return { ok, msg };
  };


  const setPlan = (objective: SeasonObjective, intensity: TrainingIntensity) => {
    if (!player) return;
    const next = setSeasonPlan(player, objective, intensity);
    persist(next, slot);
    setPlayer(next);
  };

  const loanRequest = (): number => {
    if (!player || player.age < 16 || player.loanRequestedThisYear) return 0;
    const next = clonePlayer(player);
    const offers = searchForClubs(next, 'domestic').offers.slice(0,3).map(o => ({...o, years:1, loan:true, source:'loan-request' as const, wage:Math.round(o.wage*0.45)}));
    next.offers = [...next.offers.filter(o=>!o.loan), ...offers]; next.loanRequestedThisYear = true;
    persist(next, slot); setPlayer(next); return offers.length;
  };

  const targetedSearch = (country: string): number => {
    if (!player || player.age < 18) return 0;
    const next = searchForClubs(player, 'international');
    const offers = next.offers.filter(o=>o.country===country).map(o=>({...o,source:'targeted-search' as const}));
    const merged = offers.length ? offers : next.offers.slice(0,2).map(o=>({...o,source:'targeted-search' as const}));
    const updated = clonePlayer(player); updated.offers=[...player.offers,...merged].filter((o,i,a)=>a.findIndex(x=>x.clubId===o.clubId)===i);
    updated.searchedInternationalThisYear=true; persist(updated,slot); setPlayer(updated); return merged.length;
  };

  const setTacticalRole = (role: TacticalRole) => { if (!player) return; const next=clonePlayer(player); next.tacticalRole=role; persist(next,slot); setPlayer(next); };
  const setAgent = (agent: AgentType) => { if (!player) return; const next=clonePlayer(player); next.agentType=agent; persist(next,slot); setPlayer(next); };

  const transferRequest = (): number => {
    if (!player) return 0;
    const { player: next, count } = requestTransfer(player);
    persist(next, slot);
    setPlayer(next);
    return count;
  };

  const retire = () => {
    if (!player) return;
    const next: Player = JSON.parse(JSON.stringify(player));
    const before = playerOverall(next);
    finalizeRetirement(next);
    addToHof(next);
    persist(next, slot);
    setPlayer(next);
    const last = next.history[next.history.length - 1] ?? {
      age: next.age, season: next.season, clubName: 'Career complete', clubId: '', role: next.role,
      competition: 'Retirement', games: 0, goals: 0, assists: 0, rating: 0, leagueFinish: null,
      leagueName: '', overall: before, capsThisYear: 0, intlGoals: 0,
      clubHonors: [], individualHonors: [], nationalHonors: [],
    };
    setSummary({
      seasonRecord: last, event: 'The final whistle has blown.', logs: [], overallBefore: before,
      overallAfter: before, skillDeltas: {}, retired: true, narrative: [], worldHeadlines: [],
      careerVerdict: careerVerdict(next),
    });
  };

  const clonePlayer = (p: Player): Player => JSON.parse(JSON.stringify(p));

  return (
    <GameContext.Provider
      value={{
        screen, player, slot, summary, pendingEvents, currentEvent: pendingEvents[0] ?? null, setScreen,
        startNew, load, exit, advance, clearSummary,
        sign, search, sponsor, renegotiate, retire, setPlan, transferRequest, loanRequest, targetedSearch, resolveEvent, setTacticalRole, setAgent,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): Ctx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

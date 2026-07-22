import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Player, PositionKey, SkillKey } from './types';
import {
  advanceYear, finalizeRetirement, signOffer, searchForClubs,
  signSponsorship, requestContract, type YearSummary,
} from './engine';
import { createPlayer } from '../engines/newgame';
import { marketValue } from '../engines/transfers';
import { playerOverall } from '../engines/overall';
import { saveToSlot, loadSlot, firstFreeSlot, addToHof } from './save';

type Screen = 'home' | 'game';

interface Ctx {
  screen: Screen;
  player: Player | null;
  slot: number | null;
  summary: YearSummary | null;
  setScreen: (s: Screen) => void;
  startNew: (name: string, country: string, position: PositionKey) => void;
  load: (slot: number) => void;
  exit: () => void;
  advance: (focus: SkillKey[] | null) => void;
  clearSummary: () => void;
  sign: (i: number) => void;
  search: (scope: 'domestic' | 'international') => void;
  sponsor: () => number;
  renegotiate: () => { ok: boolean; msg: string };
  retire: () => void;
}

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [player, setPlayer] = useState<Player | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [summary, setSummary] = useState<YearSummary | null>(null);

  const persist = (p: Player, s: number | null) => {
    const target = s ?? firstFreeSlot();
    saveToSlot(target, p);
    setSlot(target);
  };

  const startNew = (name: string, country: string, position: PositionKey) => {
    const p = createPlayer(name, country, position);
    p.marketValue = marketValue(playerOverall(p), p.age, p.reputation);
    const target = firstFreeSlot();
    saveToSlot(target, p);
    setPlayer(p);
    setSlot(target);
    setScreen('game');
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

  const advance = (focus: SkillKey[] | null) => {
    if (!player || player.retired) return;
    const { player: next, summary: sum } = advanceYear(player, focus);
    if (sum.retired) addToHof(next);
    persist(next, slot);
    setPlayer(next);
    setSummary(sum);
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

  const renegotiate = () => {
    if (!player) return { ok: false, msg: 'No player.' };
    const { player: next, ok, msg } = requestContract(player);
    persist(next, slot);
    setPlayer(next);
    return { ok, msg };
  };

  const retire = () => {
    if (!player) return;
    const next: Player = JSON.parse(JSON.stringify(player));
    finalizeRetirement(next);
    addToHof(next);
    persist(next, slot);
    setPlayer(next);
  };

  return (
    <GameContext.Provider
      value={{
        screen, player, slot, summary, setScreen,
        startNew, load, exit, advance, clearSummary,
        sign, search, sponsor, renegotiate, retire,
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

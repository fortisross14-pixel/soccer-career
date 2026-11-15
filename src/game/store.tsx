import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { CardInstance, Career, MonthReport, PositionKey } from './types';
import { createCareer } from '../engines/career';
import { playMonth as enginePlayMonth, canPlay, finalizeRetirement, isWindow } from '../engines/month';
import { rngState, seedRng } from '../engines/util';
import { addToHof, firstFreeSlot, loadSlot, saveToSlot } from './save';

interface Ctx {
  career: Career | null;
  slot: number | null;
  newCareer: (name: string, country: string, position: PositionKey) => boolean;
  load: (slot: number) => void;
  exit: () => void;
  /** run an engine mutation on a copy of the career, then persist it */
  act: <T>(fn: (c: Career) => T) => T;
  play: (toEvent: boolean) => void;
  reports: MonthReport[] | null;
  closeReports: () => void;
  matchId: string | null;
  openMatch: (id: string | null) => void;
  reveal: CardInstance[] | null;
  setReveal: (cards: CardInstance[] | null) => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [career, setCareer] = useState<Career | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [reports, setReports] = useState<MonthReport[] | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<CardInstance[] | null>(null);
  const ref = useRef<Career | null>(null);
  const slotRef = useRef<number | null>(null);

  const commit = (c: Career) => {
    if (c.retired && !c.legacy) { finalizeRetirement(c); addToHof(c); }
    ref.current = c;
    setCareer(c);
    if (slotRef.current) saveToSlot(slotRef.current, c);
  };

  const act = useCallback(<T,>(fn: (c: Career) => T): T => {
    if (!ref.current) throw new Error('No career');
    const c = structuredClone(ref.current);
    seedRng(c.rng);
    const out = fn(c);
    c.rng = rngState();
    commit(c);
    return out;
  }, []);

  const newCareer = (name: string, country: string, position: PositionKey) => {
    const free = firstFreeSlot();
    if (!free) return false;
    const c = createCareer(name, country, position);
    slotRef.current = free;
    setSlot(free);
    commit(c);
    return true;
  };

  const load = (n: number) => {
    const c = loadSlot(n);
    if (!c) return;
    slotRef.current = n;
    setSlot(n);
    ref.current = c;
    setCareer(c);
  };

  const exit = () => { ref.current = null; slotRef.current = null; setCareer(null); setSlot(null); setReports(null); setMatchId(null); };

  const play = (toEvent: boolean) => {
    const out = act((c) => {
      const list: MonthReport[] = [];
      const packsAtStart = c.packs.length;
      for (let i = 0; i < (toEvent ? 12 : 1); i++) {
        if (canPlay(c)) break;
        const r = enginePlayMonth(c);
        list.push(r);
        if (c.retired || c.decisions.length || r.seasonEnd || isWindow(c.month) || (packsAtStart < 6 && c.packs.length >= 6)) break;
      }
      return list;
    });
    if (out.length) setReports(out);
  };

  return (
    <GameCtx.Provider value={{ career, slot, newCareer, load, exit, act, play, reports, closeReports: () => setReports(null), matchId, openMatch: setMatchId, reveal, setReveal }}>
      {children}
    </GameCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): Ctx {
  const v = useContext(GameCtx);
  if (!v) throw new Error('useGame outside provider');
  return v;
}

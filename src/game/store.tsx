import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { CardInstance, Career, MonthReport, PositionKey } from './types';
import { createCareer } from '../engines/career';
import { playMonth as enginePlayMonth, canPlay, finalizeRetirement, isWindow } from '../engines/month';
import { rngState, seedRng } from '../engines/util';
import { addToHof, firstFreeSlot, loadSlot, saveToSlot } from './save';
import { completeCareer, creditCoins, loadMeta, saveMeta, startRun, type Meta } from './meta';
import { fx } from '../components/fx';

interface Ctx {
  career: Career | null;
  slot: number | null;
  meta: Meta;
  metaAct: (fn: (m: Meta) => Meta | string) => string | null;
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
  const [meta, setMetaState] = useState<Meta>(() => loadMeta());
  const [reports, setReports] = useState<MonthReport[] | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<CardInstance[] | null>(null);
  const ref = useRef<Career | null>(null);
  const slotRef = useRef<number | null>(null);
  const metaRef = useRef<Meta>(meta);

  const setMeta = (m: Meta) => { metaRef.current = m; setMetaState(m); saveMeta(m); };

  const commit = (c: Career, quietCoins = false) => {
    if (c.retired && !c.legacy) { finalizeRetirement(c); addToHof(c); setMeta(completeCareer(metaRef.current)); }
    if (c.pendingCoins.length) {
      const events = c.pendingCoins;
      for (const e of events) {
        if (e.milestone && !metaRef.current.milestones[e.milestone] && !c.firstEver.includes(e.milestone)) {
          e.firstEver = true;
          c.firstEver.push(e.milestone);
        }
      }
      c.pendingCoins = [];
      setMeta(creditCoins(metaRef.current, events));
      if (!quietCoins) fx({ type: 'coins', events });
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metaAct = (fn: (m: Meta) => Meta | string): string | null => {
    const out = fn(metaRef.current);
    if (typeof out === 'string') return out;
    setMeta(out);
    return null;
  };

  const newCareer = (name: string, country: string, position: PositionKey) => {
    const free = firstFreeSlot();
    if (!free) return false;
    const run = startRun(metaRef.current);
    setMeta(run.meta);
    const c = createCareer(name, country, position, run.setup);
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
    if (!ref.current) return;
    const c = structuredClone(ref.current);
    seedRng(c.rng);
    const list: MonthReport[] = [];
    const packsAtStart = c.packs.length;
    for (let i = 0; i < (toEvent ? 12 : 1); i++) {
      if (canPlay(c)) break;
      const r = enginePlayMonth(c);
      list.push(r);
      if (c.retired || c.decisions.length || r.seasonEnd || (isWindow(c.month) && (!c.academy || c.offers.length > 0)) || (!c.academy && packsAtStart < 6 && c.packs.length >= 6)) break;
    }
    c.rng = rngState();
    // coins earned while playing are shown inside the month report instead of as toasts
    commit(c, true);
    if (list.length) setReports(list);
  };

  return (
    <GameCtx.Provider value={{ career, slot, meta, metaAct, newCareer, load, exit, act, play, reports, closeReports: () => setReports(null), matchId, openMatch: setMatchId, reveal, setReveal }}>
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

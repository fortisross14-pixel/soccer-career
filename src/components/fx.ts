import type { CoinEvent } from '../game/types';

// Tiny event bus for celebrations, so engine-backed actions can
// trigger screen reactions without threading callbacks everywhere.
export type FxEvent =
  | { type: 'coins'; events: CoinEvent[] }
  | { type: 'goal'; text: string; sub?: string }
  | { type: 'burst'; x: number; y: number; n?: number }
  | { type: 'tape'; n?: number }
  | { type: 'stamp'; text: string; tone?: 'red' | 'sun' | 'white' };

type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();

export function onFx(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }
export function fx(e: FxEvent) { listeners.forEach((l) => l(e)); }

export function burstFrom(el: Element | null, n = 24) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  fx({ type: 'burst', x: r.left + r.width / 2, y: r.top + r.height / 2, n });
}

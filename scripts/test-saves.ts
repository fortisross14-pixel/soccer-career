// Save compatibility test: every fixture in tests/save-fixtures was written by
// an older release of the game. Each one must load with the current code and
// keep playing for two seasons without throwing.
// Run with `npm run test:saves`. Add fixtures for a release with
// `tsx scripts/make-fixtures.ts tests/save-fixtures <label>` (run on that release).
import * as fs from 'node:fs';
import * as path from 'node:path';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
} as Storage;

const { loadSlot, saveToSlot, slotMeta } = await import('../src/game/save');
const { playMonth, canPlay } = await import('../src/engines/month');
const { acceptOffer } = await import('../src/engines/market');
const { openPack, playCard } = await import('../src/engines/cards');
const { applyDecision } = await import('../src/engines/decisions');
const { seedRng, rngState } = await import('../src/engines/util');
const { selectorsSmoke } = await import('./save-smoke');

const dir = path.resolve('tests/save-fixtures');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
let failed = 0;
for (const f of files) {
  store.clear();
  store.set('xi2_save_1', fs.readFileSync(path.join(dir, f), 'utf8'));
  try {
    const c = loadSlot(1);
    if (!c) throw new Error('loadSlot returned null (save would be hidden)');
    if (!slotMeta(1)) throw new Error('slotMeta returned null');
    selectorsSmoke(c);
    seedRng(c.rng);
    for (let m = 0; m < 24 && !c.retired; m++) {
      for (const pk of [...c.packs]) openPack(c, pk.uid);
      for (const card of [...c.cards].slice(0, 2)) playCard(c, card.uid);
      for (const d of [...c.decisions]) applyDecision(c, d, d.choices[0].id);
      const o = c.offers.find((x) => x.kind !== 'renewal') ?? c.offers[0];
      if (o && (m % 7 === 0 || (!c.academy && !c.player.contract))) acceptOffer(c, o.uid);
      if (canPlay(c)) { c.decisions = []; c.offers = []; }
      if (canPlay(c)) throw new Error(`stuck: ${canPlay(c)}`);
      playMonth(c);
      selectorsSmoke(c);
    }
    c.rng = rngState();
    if (!saveToSlot(1, c) || !loadSlot(1)) throw new Error('re-save failed');
  } catch (e) {
    failed++;
    console.log(`FAIL ${f}: ${(e as Error).stack?.split('\n').slice(0, 3).join(' | ')}`);
  }
}
console.log(`${files.length - failed}/${files.length} saves load and play`);
process.exit(failed ? 1 : 0);

// Generates save-game fixtures with whatever engine version is checked out.
// Written against loose types on purpose so it also runs on old releases.
// Usage: npm run fixtures -- <label>   (writes to tests/save-fixtures)
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as career from '../src/engines/career';
import * as month from '../src/engines/month';
import * as market from '../src/engines/market';
import * as cards from '../src/engines/cards';
import * as decisions from '../src/engines/decisions';
import * as util from '../src/engines/util';

/* eslint-disable @typescript-eslint/no-explicit-any */
const args = process.argv.slice(2);
const [outDir, label] = args.length > 1 ? args : ['tests/save-fixtures', args[0] ?? 'dev'];
fs.mkdirSync(outDir, { recursive: true });
const SNAP_AT = [14, 90];
const POS = ['ST', 'CM', 'CB', 'GK'];

for (let run = 0; run < POS.length; run++) {
  const seed = 1000 + run * 7919;
  const anyCareer = career as any;
  const c: any = anyCareer.NO_SETUP !== undefined
    ? anyCareer.createCareer('Fixture Player', ['Spain','England','Brazil','Netherlands'][run], POS[run], anyCareer.NO_SETUP, seed)
    : anyCareer.createCareer('Fixture Player', ['Spain','England','Brazil','Netherlands'][run], POS[run], seed);
  util.seedRng(c.rng);
  let months = 0;
  const snaps = new Set(SNAP_AT);
  while (months < 400 && !c.retired) {
    try {
      for (const pk of [...(c.packs ?? [])]) cards.openPack(c, pk.uid);
      for (const card of [...(c.cards ?? [])].slice(0, 2)) cards.playCard(c, card.uid);
      for (const d of [...(c.decisions ?? [])]) decisions.applyDecision(c, d, d.choices[0].id);
      c.decisions = [];
      const o = (c.offers ?? []).find((x: any) => x.kind !== 'renewal') ?? c.offers?.[0];
      if (o && (months % 13 === 0 || (!c.academy && !c.player.contract))) market.acceptOffer(c, o.uid);
      if (month.canPlay(c)) { c.decisions = []; c.offers = []; }
      if (month.canPlay(c)) break;
      month.playMonth(c);
    } catch (e) { console.error(label, 'stopped:', (e as Error).message); break; }
    months++;
    if (snaps.has(months) || c.retired) {
      c.rng = util.rngState();
      fs.writeFileSync(path.join(outDir, `${label}-${POS[run]}-m${months}${c.retired ? '-retired' : ''}.json`), JSON.stringify(c));
    }
  }
}

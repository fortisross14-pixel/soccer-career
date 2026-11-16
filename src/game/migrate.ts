import type { Career } from './types';
import { createCareer, NO_SETUP } from '../engines/career';
import { playMonth, canPlay } from '../engines/month';
import { acceptOffer } from '../engines/market';
import { rngState, seedRng } from '../engines/util';

/*
 * Save compatibility. Saves from older releases are brought up to date by
 * comparing them with a freshly generated career ("template") and filling in
 * every field the old save doesn't have yet:
 *  - missing numbers / strings / booleans / arrays get the template's value
 *    (arrays start empty),
 *  - nested objects are filled recursively when the save has them,
 *  - array items (fixtures, table rows, races...) are filled using the
 *    template's first item as the shape.
 * Missing whole objects are not invented (an old save without `academy` must
 * not suddenly be in an academy); those get explicit defaults in loadSlot.
 * `npm run test:saves` checks saves from every past release against this.
 */

let template: Career | null = null;

function buildTemplate(): Career {
  const prev = rngState();
  const c = createCareer('Template', 'Spain', 'CM', NO_SETUP, 12345);
  if (c.offers[0]) acceptOffer(c, c.offers[0].uid);
  for (let m = 0; m < 14 && !canPlay(c); m++) { c.decisions = []; c.offers = []; playMonth(c); }
  c.decisions = []; c.offers = [];
  seedRng(prev);
  return c;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

// keyed maps (by club, skill...) whose keys are data, not schema
const MAPS = new Set(['div', 'skillDeltas', 'weights', 'boosts', 'skills']);

function fill(target: Obj, tpl: Obj, depth: number, path = '') {
  if (depth > 8) return;
  for (const [k, tv] of Object.entries(tpl)) {
    if (MAPS.has(k) && path + k !== 'player.skills') { if (target[k] === undefined) target[k] = Array.isArray(tv) ? [] : isObj(tv) ? {} : tv; continue; }
    const v = target[k];
    if (v === undefined) {
      if (Array.isArray(tv)) target[k] = [];
      else if (tv !== null && !isObj(tv)) target[k] = tv;
      continue;
    }
    if (isObj(v) && isObj(tv)) fill(v, tv, depth + 1, `${path}${k}.`);
    else if (Array.isArray(v) && Array.isArray(tv)) {
      const shape = tv.find(isObj);
      if (shape) for (const item of v) if (isObj(item)) fill(item, shape, depth + 1, `${path}${k}[].`);
    }
  }
}

/** fill fields that didn't exist when this save was written */
export function upgradeSave(c: Career): Career {
  template ??= buildTemplate();
  fill(c as unknown as Obj, template as unknown as Obj, 0);
  return c;
}

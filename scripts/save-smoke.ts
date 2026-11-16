// Calls the engine helpers the UI reads on every screen, so a save that
// would crash a tab fails the save-compatibility test instead.
import type { Career } from '../src/game/types';
import { displayOverall, potentialOverall, potRoom } from '../src/engines/overall';
import { currentRole, squadLevels } from '../src/engines/match';
import { allTime } from '../src/engines/stars';
import { playerGrade } from '../src/engines/awards';
import { canRequestLoan, canSeekMinutes } from '../src/engines/career';
import { canPlay } from '../src/engines/month';
import { raceRows } from '../src/engines/races';
import { scorerTable, sortedTable, tablePosition } from '../src/engines/calendar';

export function selectorsSmoke(c: Career) {
  displayOverall(c.player); potentialOverall(c.player); potRoom(c.player);
  squadLevels(c); canPlay(c); canRequestLoan(c); canSeekMinutes(c); playerGrade(c);
  if (c.player.contract || c.academy) currentRole(c);
  for (const k of ['ballons', 'titles', 'goals'] as const) allTime(c, k);
  const s = c.season;
  if (s) {
    sortedTable(s.table); tablePosition(s); scorerTable(s, c.player.name);
    for (const r of s.races ?? []) raceRows(c, s, r);
  }
}

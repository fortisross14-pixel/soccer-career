import type { Career } from '../game/types';

// ------------------------------------------------------------
// Legacy coins: a meta currency earned from milestones. It is
// separate from career money and carries over between careers,
// where it buys permanent upgrades and relic crates.
// ------------------------------------------------------------

export interface MilestoneDef { id: string; label: string; coins: number; group: 'Firsts' | 'Volume' | 'Glory' }

export const MILESTONES: MilestoneDef[] = [
  { id: 'start', label: 'Start a career', coins: 20, group: 'Firsts' },
  { id: 'contract', label: 'Sign a pro contract', coins: 25, group: 'Firsts' },
  { id: 'debut', label: 'Make your pro debut', coins: 20, group: 'Firsts' },
  { id: 'start11', label: 'First starting XI', coins: 15, group: 'Firsts' },
  { id: 'goal1', label: 'First pro goal', coins: 25, group: 'Firsts' },
  { id: 'assist1', label: 'First assist', coins: 15, group: 'Firsts' },
  { id: 'clean1', label: 'First clean sheet', coins: 20, group: 'Firsts' },
  { id: 'motm1', label: 'First Man of the Match', coins: 25, group: 'Firsts' },
  { id: 'hattrick1', label: 'First hat-trick', coins: 50, group: 'Firsts' },
  { id: 'cont1', label: 'First continental match', coins: 35, group: 'Firsts' },
  { id: 'contgoal1', label: 'First continental goal', coins: 35, group: 'Firsts' },
  { id: 'cap1', label: 'International debut', coins: 50, group: 'Firsts' },
  { id: 'intlgoal1', label: 'First international goal', coins: 50, group: 'Firsts' },
  { id: 'abroad', label: 'Move abroad', coins: 35, group: 'Firsts' },
  { id: 'elite', label: 'Sign for an elite club', coins: 60, group: 'Firsts' },
  { id: 'apps50', label: '50 club appearances', coins: 30, group: 'Volume' },
  { id: 'apps150', label: '150 club appearances', coins: 55, group: 'Volume' },
  { id: 'apps300', label: '300 club appearances', coins: 95, group: 'Volume' },
  { id: 'apps500', label: '500 club appearances', coins: 180, group: 'Volume' },
  { id: 'goals10', label: '10 career goals', coins: 25, group: 'Volume' },
  { id: 'goals50', label: '50 career goals', coins: 70, group: 'Volume' },
  { id: 'goals100', label: '100 career goals', coins: 150, group: 'Volume' },
  { id: 'goals250', label: '250 career goals', coins: 300, group: 'Volume' },
  { id: 'caps50', label: '50 international caps', coins: 120, group: 'Volume' },
  { id: 'ovr75', label: 'Reach 75 overall', coins: 35, group: 'Volume' },
  { id: 'ovr85', label: 'Reach 85 overall', coins: 110, group: 'Volume' },
  { id: 'ovr90', label: 'Reach 90 overall', coins: 210, group: 'Volume' },
  { id: 'regular1', label: 'Regular starter (20+ league starts)', coins: 30, group: 'Firsts' },
  { id: 'season20', label: '20-goal season', coins: 60, group: 'Volume' },
  { id: 'climb1', label: 'Move up a division', coins: 60, group: 'Glory' },
  { id: 'topflight1', label: 'Play in a top flight', coins: 90, group: 'Glory' },
  { id: 'boot1', label: 'League top scorer', coins: 100, group: 'Glory' },
  { id: 'promotop1', label: 'Win promotion to the top flight', coins: 120, group: 'Glory' },
  { id: 'potm1', label: 'Player of the Month', coins: 30, group: 'Glory' },
  { id: 'trophy1', label: 'Win a trophy', coins: 60, group: 'Glory' },
  { id: 'promo1', label: 'Win promotion', coins: 50, group: 'Glory' },
  { id: 'title1', label: 'Win a league title', coins: 90, group: 'Glory' },
  { id: 'award1', label: 'Win an individual award', coins: 60, group: 'Glory' },
  { id: 'contwin1', label: 'Win a continental trophy', coins: 180, group: 'Glory' },
  { id: 'wc1', label: 'Play at a World Cup', coins: 70, group: 'Glory' },
  { id: 'natwin1', label: 'Win an international tournament', coins: 240, group: 'Glory' },
  { id: 'ballon1', label: "Win the Ballon d'Or", coins: 300, group: 'Glory' },
];
export const MILESTONE_MAP: Record<string, MilestoneDef> = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));

/** repeatable rewards */
export const PER_EVENT = { goal: 2, assist: 1, motm: 5, cleanSheet: 2, trophy: 35, award: 25, potm: 10, hattrick: 15 };

function credit(c: Career, label: string, amount: number, milestone?: string) {
  const v = Math.round(amount * (c.mods?.coinMult ?? 1));
  if (v <= 0) return;
  c.coinsEarned += v;
  c.pendingCoins.push({ label, amount: v, milestone });
}

/** award a once-per-career milestone */
export function milestone(c: Career, id: string) {
  if (c.milestones.includes(id)) return;
  const m = MILESTONE_MAP[id];
  if (!m) return;
  c.milestones.push(id);
  credit(c, m.label, m.coins, m.id);
}

export function earn(c: Career, label: string, amount: number) {
  credit(c, label, amount);
}

/** threshold milestones checked after each month */
export function volumeMilestones(c: Career, ovr: number) {
  const t = c.totals;
  for (const [n, id] of [[50, 'apps50'], [150, 'apps150'], [300, 'apps300'], [500, 'apps500']] as const) if (t.apps >= n) milestone(c, id);
  for (const [n, id] of [[10, 'goals10'], [50, 'goals50'], [100, 'goals100'], [250, 'goals250']] as const) if (t.goals >= n) milestone(c, id);
  if (t.caps >= 50) milestone(c, 'caps50');
  for (const [n, id] of [[75, 'ovr75'], [85, 'ovr85'], [90, 'ovr90']] as const) if (ovr >= n) milestone(c, id);
}

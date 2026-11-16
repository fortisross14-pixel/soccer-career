import type { Fixture } from '../game/types';

// Aggregated stat lines from match reports, used by the stats screen
// (this season, by month) and stored on each season summary (by year).

export type StatLine = Record<string, number>;

export interface StatDef { id: string; label: string; kind: 'count' | 'avg' | 'pct'; per90?: boolean }

export const STAT_DEFS: StatDef[] = [
  { id: 'apps', label: 'Matches', kind: 'count' },
  { id: 'starts', label: 'Starts', kind: 'count' },
  { id: 'minutes', label: 'Minutes', kind: 'count' },
  { id: 'goals', label: 'Goals', kind: 'count', per90: true },
  { id: 'assists', label: 'Assists', kind: 'count', per90: true },
  { id: 'ga', label: 'Goals + assists', kind: 'count', per90: true },
  { id: 'rating', label: 'Avg rating', kind: 'avg' },
  { id: 'motm', label: 'Man of the Match', kind: 'count' },
  { id: 'shots', label: 'Shots', kind: 'count', per90: true },
  { id: 'onTarget', label: 'Shots on target', kind: 'count', per90: true },
  { id: 'keyPasses', label: 'Key passes', kind: 'count', per90: true },
  { id: 'passes', label: 'Passes', kind: 'count', per90: true },
  { id: 'passAcc', label: 'Pass accuracy', kind: 'pct' },
  { id: 'dribbles', label: 'Dribbles', kind: 'count', per90: true },
  { id: 'tackles', label: 'Tackles', kind: 'count', per90: true },
  { id: 'interceptions', label: 'Interceptions', kind: 'count', per90: true },
  { id: 'aerials', label: 'Aerials won', kind: 'count', per90: true },
  { id: 'saves', label: 'Saves', kind: 'count', per90: true },
  { id: 'conceded', label: 'Goals conceded', kind: 'count', per90: true },
  { id: 'cleanSheets', label: 'Clean sheets', kind: 'count' },
];
export const STAT_MAP: Record<string, StatDef> = Object.fromEntries(STAT_DEFS.map((d) => [d.id, d]));

/** sum a set of fixtures into a stat line (only matches you played) */
export function aggregate(fixtures: Fixture[]): StatLine {
  const out: StatLine = { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, motm: 0, ratingSum: 0, rated: 0, passAccSum: 0, passAccN: 0, cleanSheets: 0 };
  for (const f of fixtures) {
    const r = f.report;
    if (!r || r.minutes <= 0) continue;
    out.apps++;
    if (r.involvement === 'started') out.starts++;
    out.minutes += r.minutes;
    out.goals += r.goals;
    out.assists += r.assists;
    if (r.motm) out.motm++;
    if (r.rating !== null) { out.ratingSum += r.rating; out.rated++; }
    if (r.minutes >= 60 && (f.oppGoals ?? 0) === 0) out.cleanSheets++;
    for (const [k, v] of Object.entries(r.stats)) {
      if (k === 'motm') continue;
      if (k === 'passAcc') { out.passAccSum += v; out.passAccN++; continue; }
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

export function statValue(line: StatLine | undefined, id: string, per90 = false): number | null {
  if (!line) return null;
  if (id === 'rating') return line.rated ? Math.round((line.ratingSum / line.rated) * 100) / 100 : null;
  if (id === 'passAcc') return line.passAccN ? Math.round(line.passAccSum / line.passAccN) : null;
  const raw = id === 'ga' ? (line.goals ?? 0) + (line.assists ?? 0) : line[id] ?? 0;
  if (per90 && STAT_MAP[id]?.per90) return line.minutes ? Math.round((raw / line.minutes) * 90 * 100) / 100 : 0;
  return raw;
}

export function addLines(a: StatLine, b: StatLine): StatLine {
  const out: StatLine = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
  return out;
}

import { CLUB_MAP } from '../data/clubs';
import { getCountry } from '../data/countries';
import { clamp } from './util';

/** maturity multiplier used by overall ratings for teenagers */
export function maturity(age: number): number {
  return clamp(0.8 + (age - 14) * 0.028, 0.62, 1);
}

/** youth team ids look like "acad:<clubId>:<age>" */
export function academyId(clubId: string, age: number): string {
  return `acad:${clubId}:${age}`;
}

function parseAcad(id: string): { clubId: string; age: number } | null {
  if (!id.startsWith('acad:')) return null;
  const [, clubId, age] = id.split(':');
  return { clubId, age: Number(age) };
}

export function youthLabel(age: number): string {
  return age <= 13 ? 'U14' : age <= 15 ? 'U16' : age <= 17 ? 'U18' : 'U21';
}

/** strength of a club's youth side for players of a given age, on the senior scale */
export function academyRating(clubId: string, age: number): number {
  const parent = CLUB_MAP[clubId]?.rating ?? 60;
  return Math.round((parent - 12) * maturity(age));
}

/** Teams are clubs (by id), national sides ("nat:Spain") or youth sides ("acad:…"). */
export function teamName(id: string): string {
  if (id.startsWith('nat:')) return id.slice(4);
  const a = parseAcad(id);
  if (a) return `${CLUB_MAP[a.clubId]?.name ?? 'Academy'} ${youthLabel(a.age)}`;
  return CLUB_MAP[id]?.name ?? 'Unknown';
}

export function teamRating(id: string): number {
  if (id.startsWith('nat:')) return getCountry(id.slice(4)).nationalStrength;
  const a = parseAcad(id);
  if (a) return academyRating(a.clubId, a.age);
  return CLUB_MAP[id]?.rating ?? 65;
}

export function teamCountry(id: string): string | undefined {
  if (id.startsWith('nat:')) return id.slice(4);
  const a = parseAcad(id);
  return CLUB_MAP[a ? a.clubId : id]?.country;
}

export function teamShort(id: string): string {
  const n = teamName(id);
  const words = n.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(' ').filter((w) => w.length > 2 && !['FC', 'AS', 'CF', 'SC', 'Club'].includes(w));
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[2]?.[0] ?? words[1][1] ?? '')).toUpperCase();
  return n.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}

export type Line = 'GK' | 'DEF' | 'MID' | 'FWD';

/** each club is a little stronger or weaker in each line (-2..+2), fixed per club */
export function lineOffset(clubId: string, line: Line): number {
  let h = 2166136261;
  for (const ch of `${clubId}:${line}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (Math.abs(h) % 5) - 2;
}

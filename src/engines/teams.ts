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

export function parseAcad(id: string): { clubId: string; age: number } | null {
  if (!id.startsWith('acad:')) return null;
  const [, clubId, age] = id.split(':');
  return { clubId, age: Number(age) };
}

/** the club behind a team id, for its badge (youth sides use their club's) */
export function crestClubId(id: string): string | null {
  if (id.startsWith('nat:')) return null;
  if (CLUB_MAP[id]) return id;
  const a = parseAcad(id);
  return a && CLUB_MAP[a.clubId] ? a.clubId : null;
}

/** academy age groups: U14 (11-14), U17 (15-17), U20 (18-19) */
export function youthBand(age: number): { label: string; min: number; max: number; peerAge: number } {
  if (age <= 14) return { label: 'U14', min: 11, max: 14, peerAge: 12.5 };
  if (age <= 17) return { label: 'U17', min: 15, max: 17, peerAge: 16 };
  return { label: 'U20', min: 18, max: 20, peerAge: 19 };
}

export function youthLabel(age: number): string {
  return youthBand(age).label;
}

/** how developed a typical prospect is at an age, as a share of their potential (measured in the sim) */
const DEV: Record<number, number> = { 11: 0.62, 12: 0.7, 13: 0.77, 14: 0.82, 15: 0.86, 16: 0.9, 17: 0.92, 18: 0.95, 19: 0.96, 20: 0.97 };
export function devFrac(age: number): number {
  if (age >= 21) return 1;
  if (age <= 11) return DEV[11];
  const lo = Math.floor(age);
  const f = age - lo;
  return DEV[lo] + ((DEV[lo + 1] ?? 1) - DEV[lo]) * f;
}

/**
 * Average level of a club's youth side, on the same scale as your OVR.
 * Older groups are stronger (U14 < U17 < U20). Teammates are the typical
 * age of the group, so the youngest in a group face more developed players
 * and the oldest have the edge.
 */
export function academyRating(clubId: string, age: number): number {
  const parent = CLUB_MAP[clubId]?.rating ?? 60;
  return Math.round((parent - 9) * devFrac(youthBand(age).peerAge));
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

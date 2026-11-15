import { CLUB_MAP } from '../data/clubs';
import { getCountry } from '../data/countries';

/** Teams are clubs (by id) or national sides ("nat:Spain"). */
export function teamName(id: string): string {
  if (id.startsWith('nat:')) return id.slice(4);
  return CLUB_MAP[id]?.name ?? 'Unknown';
}

export function teamRating(id: string): number {
  if (id.startsWith('nat:')) return getCountry(id.slice(4)).nationalStrength;
  return CLUB_MAP[id]?.rating ?? 65;
}

export function teamShort(id: string): string {
  const n = teamName(id);
  const words = n.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(' ').filter((w) => w.length > 2 && !['FC', 'AS', 'CF', 'SC', 'Club'].includes(w));
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[2]?.[0] ?? words[1][1] ?? '')).toUpperCase();
  return n.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}

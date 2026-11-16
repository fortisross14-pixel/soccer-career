import type { CountryDef } from '../game/types';

export const COUNTRIES: CountryDef[] = [
  { name: 'England', confederation: 'UEFA', leagueRep: 93, leagueName: 'Premier League', nationalStrength: 87, lower: ['Championship', 'League One'] },
  { name: 'Spain', confederation: 'UEFA', leagueRep: 90, leagueName: 'La Liga', nationalStrength: 88, lower: ['Segunda División', 'Primera Federación'] },
  { name: 'Italy', confederation: 'UEFA', leagueRep: 87, leagueName: 'Serie A', nationalStrength: 84, lower: ['Serie B', 'Serie C'] },
  { name: 'Germany', confederation: 'UEFA', leagueRep: 88, leagueName: 'Bundesliga', nationalStrength: 85, lower: ['2. Bundesliga', '3. Liga'] },
  { name: 'France', confederation: 'UEFA', leagueRep: 84, leagueName: 'Ligue 1', nationalStrength: 89, lower: ['Ligue 2', 'National'] },
  { name: 'Netherlands', confederation: 'UEFA', leagueRep: 79, leagueName: 'Eredivisie', nationalStrength: 83, lower: ['Eerste Divisie'] },
  { name: 'Portugal', confederation: 'UEFA', leagueRep: 80, leagueName: 'Primeira Liga', nationalStrength: 84, lower: ['Liga Portugal 2'] },
  { name: 'Brazil', confederation: 'CONMEBOL', leagueRep: 78, leagueName: 'Brasileirão', nationalStrength: 88, lower: ['Série B'] },
  { name: 'Argentina', confederation: 'CONMEBOL', leagueRep: 76, leagueName: 'Liga Profesional', nationalStrength: 89, lower: ['Primera Nacional'] },
  { name: 'USA', confederation: 'CONCACAF', leagueRep: 72, leagueName: 'MLS', nationalStrength: 74, lower: ['USL Championship'] },
  { name: 'Mexico', confederation: 'CONCACAF', leagueRep: 74, leagueName: 'Liga MX', nationalStrength: 76, lower: ['Liga de Expansión'] },
  { name: 'Ecuador', confederation: 'CONMEBOL', leagueRep: 64, leagueName: 'LigaPro', nationalStrength: 75, lower: ['Serie B'] },
  { name: 'Greece', confederation: 'UEFA', leagueRep: 70, leagueName: 'Super League', nationalStrength: 72, lower: ['Super League 2'] },
  { name: 'Japan', confederation: 'AFC', leagueRep: 71, leagueName: 'J1 League', nationalStrength: 76, lower: ['J2 League'] },
];

export const COUNTRY_MAP: Record<string, CountryDef> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c]),
);

export function getCountry(name: string): CountryDef {
  return (
    COUNTRY_MAP[name] || {
      name, confederation: 'UEFA', leagueRep: 68,
      leagueName: `${name} League`, nationalStrength: 70, lower: [`${name} League 2`],
    }
  );
}

/** league name for a division (1 = top flight) */
export function leagueNameFor(country: string, div: number): string {
  const c = getCountry(country);
  return div <= 1 ? c.leagueName : c.lower[div - 2] ?? `${c.leagueName} ${div}`;
}

export const THREE_TIER = new Set(['England', 'Spain', 'Italy', 'Germany', 'France']);
export const maxDivision = (country: string): 2 | 3 => (THREE_TIER.has(country) ? 3 : 2);

import type { CountryDef } from '../game/types';

export const COUNTRIES: CountryDef[] = [
  { name: 'England', confederation: 'UEFA', leagueRep: 93, leagueName: 'Premier League', nationalStrength: 87 },
  { name: 'Spain', confederation: 'UEFA', leagueRep: 90, leagueName: 'La Liga', nationalStrength: 88 },
  { name: 'Italy', confederation: 'UEFA', leagueRep: 87, leagueName: 'Serie A', nationalStrength: 84 },
  { name: 'Germany', confederation: 'UEFA', leagueRep: 88, leagueName: 'Bundesliga', nationalStrength: 85 },
  { name: 'France', confederation: 'UEFA', leagueRep: 84, leagueName: 'Ligue 1', nationalStrength: 89 },
  { name: 'Netherlands', confederation: 'UEFA', leagueRep: 79, leagueName: 'Eredivisie', nationalStrength: 83 },
  { name: 'Portugal', confederation: 'UEFA', leagueRep: 80, leagueName: 'Primeira Liga', nationalStrength: 84 },
  { name: 'Brazil', confederation: 'CONMEBOL', leagueRep: 78, leagueName: 'Brasileirão', nationalStrength: 88 },
  { name: 'Argentina', confederation: 'CONMEBOL', leagueRep: 76, leagueName: 'Liga Profesional', nationalStrength: 89 },
  { name: 'USA', confederation: 'CONCACAF', leagueRep: 72, leagueName: 'MLS', nationalStrength: 74 },
  { name: 'Mexico', confederation: 'CONCACAF', leagueRep: 74, leagueName: 'Liga MX', nationalStrength: 76 },
  { name: 'Japan', confederation: 'AFC', leagueRep: 71, leagueName: 'J1 League', nationalStrength: 76 },
];

export const COUNTRY_MAP: Record<string, CountryDef> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c]),
);

export function getCountry(name: string): CountryDef {
  return (
    COUNTRY_MAP[name] || {
      name, confederation: 'UEFA', leagueRep: 68,
      leagueName: `${name} League`, nationalStrength: 70,
    }
  );
}

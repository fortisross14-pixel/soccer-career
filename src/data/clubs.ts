import type { ClubDef, ClubTier, ContinentalSpot } from '../game/types';

// Compact authoring format -> expanded ClubDef list.
// [name, rating, continental]  (tier & prestige derived from rating)
type Row = [string, number, ContinentalSpot];

function tierFor(rating: number): ClubTier {
  if (rating >= 85) return 'Elite';
  if (rating >= 78) return 'Strong';
  if (rating >= 71) return 'Mid';
  return 'Small';
}

const D1: Record<string, Row[]> = {
  England: [
    ['Manchester Sky', 90, 'CL'], ['Merseyside Reds', 89, 'CL'], ['North London Guns', 87, 'CL'],
    ['Manchester Reds', 84, 'CL'], ['West London Blues', 83, 'EL'], ['North London Spurs', 82, 'EL'],
    ['Tyneside United', 80, 'EL'], ['Midlands Villa', 78, 'none'], ['Seaside Gulls', 74, 'none'],
    ['South London Palace', 72, 'none'], ['East London Irons', 73, 'none'], ['Cottage FC', 70, 'none'],
  ],
  Spain: [
    ['Madrid Whites', 91, 'CL'], ['Catalan Blaugrana', 89, 'CL'], ['Madrid Reds', 84, 'CL'],
    ['Basque Blue-Whites', 81, 'CL'], ['Andalusia FC', 79, 'EL'], ['Basque Lions', 78, 'EL'],
    ['Levante Bats', 75, 'none'], ['Yellow Submarine', 77, 'EL'], ['Green Coast FC', 72, 'none'],
    ['Capital Metropolitans', 71, 'none'],
  ],
  Italy: [
    ['Milan Blacks', 87, 'CL'], ['Turin Old Lady', 85, 'CL'], ['Milan Reds', 84, 'CL'],
    ['Naples Blues', 86, 'CL'], ['Rome Wolves', 80, 'EL'], ['Rome Eagles', 79, 'EL'],
    ['Bergamo Goddess', 82, 'CL'], ['Florence Lilies', 75, 'none'], ['Turin Bulls', 72, 'none'],
    ['Bologna Reds', 74, 'none'],
  ],
  Germany: [
    ['Bavaria Reds', 90, 'CL'], ['Ruhr Yellows', 85, 'CL'], ['Leipzig Bulls', 83, 'CL'],
    ['Leverkusen Works', 84, 'CL'], ['Frankfurt Eagles', 78, 'EL'], ['Rhine Foals', 74, 'none'],
    ['Black Forest FC', 76, 'EL'], ['Bremen Greens', 72, 'none'], ['Rhine Reds', 71, 'none'],
  ],
  France: [
    ['Paris Capital', 91, 'CL'], ['Riviera Monegasques', 82, 'CL'], ['Port City Whites', 80, 'CL'],
    ['Rhône Lyons', 79, 'EL'], ['Northern Lille', 78, 'EL'], ['Brittany Rovers', 75, 'none'],
    ['Riviera Eagles', 74, 'none'], ['Coastal Lens', 76, 'EL'], ['Alsace FC', 70, 'none'],
  ],
  Netherlands: [
    ['Amsterdam Sons', 83, 'CL'], ['Eindhoven Bulbs', 82, 'CL'], ['Rotterdam Legion', 80, 'CL'],
    ['Alkmaar Cheese', 75, 'EL'], ['Twente Tukkers', 73, 'none'], ['Utrecht Domtoren', 71, 'none'],
  ],
  Portugal: [
    ['Lisbon Eagles', 84, 'CL'], ['Porto Dragons', 83, 'CL'], ['Lisbon Lions', 82, 'CL'],
    ['Braga Warriors', 77, 'EL'], ['Guimarães Castle', 72, 'none'], ['Coastal Marítimo', 70, 'none'],
  ],
  Brazil: [
    ['Rio Crimson', 84, 'CL'], ['São Paulo Greens', 83, 'CL'], ['Coastal Saints', 79, 'CL'],
    ['Tricolor Paulista', 80, 'CL'], ['Mineiro Roosters', 81, 'CL'], ['Porto Alegre Immortals', 78, 'EL'],
    ['Rio Guild', 74, 'none'], ['Bahia Blues', 72, 'none'],
  ],
  Argentina: [
    ['La Boca Blues', 84, 'CL'], ['Núñez Millionaires', 85, 'CL'], ['Avellaneda Kings', 78, 'CL'],
    ['Avellaneda Reds', 77, 'CL'], ['Rosario Lepers', 75, 'EL'], ['Rosario Scoundrels', 74, 'none'],
    ['La Plata Wolves', 73, 'none'], ['Liniers Cyclone', 76, 'EL'],
  ],
  USA: [
    ['Miami Pinks', 81, 'CL'], ['LA Black-Golds', 79, 'CL'], ['New York Bulls', 76, 'CL'],
    ['Atlanta Stripes', 75, 'EL'], ['Seattle Emeralds', 74, 'none'], ['Cincinnati Orange', 73, 'none'],
    ['Columbus Yellows', 72, 'none'], ['Portland Timbers', 71, 'none'],
  ],
  Mexico: [
    ['Guadalajara Goats', 79, 'CL'], ['America Eagles', 80, 'CL'], ['Monterrey Steel', 78, 'CL'],
    ['UNAM Pumas', 74, 'EL'], ['Tigres Northern', 77, 'CL'], ['Toluca Devils', 73, 'none'],
  ],
  Japan: [
    ['Yokohama Marinos', 76, 'CL'], ['Kawasaki Frontale', 77, 'CL'], ['Urawa Diamonds', 75, 'CL'],
    ['Kobe Sailors', 74, 'EL'], ['Gamba Blues', 72, 'none'], ['Kashima Antlers', 73, 'none'],
  ],
};

// A modest second division per country (generated) for loans / early career.
function secondDivision(country: string): ClubDef[] {
  const names = ['County', 'Athletic', 'Rovers', 'City B', 'Union', 'Sporting'];
  return names.map((n, i) => {
    const rating = 60 + ((i * 7 + country.length * 3) % 9);
    return mkClub(country, `${country.slice(0, 3).toUpperCase()} ${n}`, rating, 'none', 2);
  });
}

let seq = 0;
function mkClub(country: string, name: string, rating: number, continental: ContinentalSpot, division: 1 | 2): ClubDef {
  seq += 1;
  const prestige = Math.round(Math.min(100, rating + (continental === 'CL' ? 8 : continental === 'EL' ? 3 : 0)));
  return {
    id: `c${seq}`,
    name,
    country,
    rating,
    tier: division === 2 ? 'Small' : tierFor(rating),
    prestige,
    wageFactor: +(0.5 + (rating - 60) / 40).toFixed(2),
    continental,
    division,
  };
}

export const CLUBS: ClubDef[] = [];
for (const [country, rows] of Object.entries(D1)) {
  rows.forEach(([name, rating, cont]) => CLUBS.push(mkClub(country, name, rating, cont, 1)));
  secondDivision(country).forEach((c) => CLUBS.push(c));
}

export const CLUB_MAP: Record<string, ClubDef> = Object.fromEntries(CLUBS.map((c) => [c.id, c]));

export function clubsInCountry(country: string, division?: 1 | 2): ClubDef[] {
  return CLUBS.filter((c) => c.country === country && (division ? c.division === division : true));
}

export function allD1(): ClubDef[] {
  return CLUBS.filter((c) => c.division === 1);
}

// Youth/academy club used before a player turns pro.
export function youthClub(country: string): ClubDef {
  return {
    id: `youth-${country}`,
    name: `${country} Youth Academy`,
    country,
    rating: 55,
    tier: 'Youth',
    prestige: 45,
    wageFactor: 0.2,
    continental: 'none',
    division: 2,
  };
}

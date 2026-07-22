import type { ClubDef, ClubTier, ContinentalSpot, SkillCategory } from '../game/types';

// Compact authoring format -> expanded ClubDef list.
// [name, rating, continental]  (tier & prestige derived from rating)
type Row = [string, number, ContinentalSpot];

function tierFor(rating: number): ClubTier {
  if (rating >= 85) return 'Elite';
  if (rating >= 78) return 'Strong';
  if (rating >= 71) return 'Mid';
  return 'Small';
}

const ACADEMY_FOCUS_BY_NAME: Record<string, SkillCategory> = {
  'FC Barcelona': 'Playmaking', 'Real Madrid': 'Mental', 'Atlético Madrid': 'Physical',
  'Manchester City': 'Playmaking', 'Liverpool': 'Physical', 'Arsenal': 'Attacking',
  'Manchester United': 'Mental', 'Chelsea': 'Defending', 'Bayern Munich': 'Physical',
  'Borussia Dortmund': 'Attacking', 'Ajax': 'Playmaking', 'PSV Eindhoven': 'Attacking',
  'Benfica': 'Technical' as SkillCategory, 'Sporting CP': 'Physical', 'FC Porto': 'Mental',
  'Inter Milan': 'Defending', 'Juventus': 'Mental', 'AC Milan': 'Attacking',
  'Paris Saint-Germain': 'Attacking', 'AS Monaco': 'Physical', 'Lyon': 'Playmaking',
  'River Plate': 'Playmaking', 'Boca Juniors': 'Mental', 'Flamengo': 'Attacking',
  'Palmeiras': 'Physical', 'Santos': 'Attacking', 'Kawasaki Frontale': 'Playmaking',
  'Vissel Kobe': 'Mental', 'Urawa Diamonds': 'Physical', 'Yokohama Marinos': 'Attacking',
};

function academyFocusFor(name: string, rating: number): SkillCategory {
  const explicit = ACADEMY_FOCUS_BY_NAME[name];
  if (explicit && explicit !== ('Technical' as SkillCategory)) return explicit;
  const cycle: SkillCategory[] = ['Attacking', 'Playmaking', 'Defending', 'Physical', 'Mental'];
  return cycle[(name.length + rating) % cycle.length];
}

const D1: Record<string, Row[]> = {
  England: [
    ['Manchester City', 90, 'CL'], ['Liverpool', 89, 'CL'], ['Arsenal', 87, 'CL'],
    ['Manchester United', 84, 'CL'], ['Chelsea', 83, 'EL'], ['Tottenham Hotspur', 82, 'EL'],
    ['Newcastle United', 80, 'EL'], ['Aston Villa', 78, 'none'], ['Brighton & Hove Albion', 74, 'none'],
    ['Crystal Palace', 72, 'none'], ['West Ham United', 73, 'none'], ['Fulham', 70, 'none'],
  ],
  Spain: [
    ['Real Madrid', 91, 'CL'], ['FC Barcelona', 89, 'CL'], ['Atlético Madrid', 84, 'CL'],
    ['Real Sociedad', 81, 'CL'], ['Sevilla', 79, 'EL'], ['Athletic Club', 78, 'EL'],
    ['Valencia', 75, 'none'], ['Villarreal', 77, 'EL'], ['Real Betis', 72, 'none'],
    ['Getafe', 71, 'none'],
  ],
  Italy: [
    ['Inter Milan', 87, 'CL'], ['Juventus', 85, 'CL'], ['AC Milan', 84, 'CL'],
    ['Napoli', 86, 'CL'], ['Roma', 80, 'EL'], ['Lazio', 79, 'EL'],
    ['Atalanta', 82, 'CL'], ['Fiorentina', 75, 'none'], ['Torino', 72, 'none'],
    ['Bologna', 74, 'none'],
  ],
  Germany: [
    ['Bayern Munich', 90, 'CL'], ['Borussia Dortmund', 85, 'CL'], ['RB Leipzig', 83, 'CL'],
    ['Bayer Leverkusen', 84, 'CL'], ['Eintracht Frankfurt', 78, 'EL'], ['Borussia Mönchengladbach', 74, 'none'],
    ['SC Freiburg', 76, 'EL'], ['Werder Bremen', 72, 'none'], ['1. FC Köln', 71, 'none'],
  ],
  France: [
    ['Paris Saint-Germain', 91, 'CL'], ['AS Monaco', 82, 'CL'], ['Marseille', 80, 'CL'],
    ['Lyon', 79, 'EL'], ['Lille', 78, 'EL'], ['Rennes', 75, 'none'],
    ['Nice', 74, 'none'], ['Lens', 76, 'EL'], ['Strasbourg', 70, 'none'],
  ],
  Netherlands: [
    ['Ajax', 83, 'CL'], ['PSV Eindhoven', 82, 'CL'], ['Feyenoord', 80, 'CL'],
    ['AZ Alkmaar', 75, 'EL'], ['FC Twente', 73, 'none'], ['FC Utrecht', 71, 'none'],
  ],
  Portugal: [
    ['Benfica', 84, 'CL'], ['FC Porto', 83, 'CL'], ['Sporting CP', 82, 'CL'],
    ['Braga', 77, 'EL'], ['Vitória de Guimarães', 72, 'none'], ['Marítimo', 70, 'none'],
  ],
  Brazil: [
    ['Flamengo', 84, 'CL'], ['Palmeiras', 83, 'CL'], ['Santos', 79, 'CL'],
    ['São Paulo', 80, 'CL'], ['Atlético Mineiro', 81, 'CL'], ['Grêmio', 78, 'EL'],
    ['Vasco da Gama', 74, 'none'], ['Bahia', 72, 'none'],
  ],
  Argentina: [
    ['Boca Juniors', 84, 'CL'], ['River Plate', 85, 'CL'], ['Racing Club', 78, 'CL'],
    ['Independiente', 77, 'CL'], ['Newell’s Old Boys', 75, 'EL'], ['Rosario Central', 74, 'none'],
    ['Gimnasia La Plata', 73, 'none'], ['San Lorenzo', 76, 'EL'],
  ],
  USA: [
    ['Inter Miami', 81, 'CL'], ['Los Angeles FC', 79, 'CL'], ['New York Red Bulls', 76, 'CL'],
    ['Atlanta United', 75, 'EL'], ['Seattle Sounders', 74, 'none'], ['FC Cincinnati', 73, 'none'],
    ['Columbus Crew', 72, 'none'], ['Portland Timbers', 71, 'none'],
  ],
  Mexico: [
    ['Guadalajara', 79, 'CL'], ['Club América', 80, 'CL'], ['Monterrey', 78, 'CL'],
    ['UNAM Pumas', 74, 'EL'], ['Tigres UANL', 77, 'CL'], ['Toluca', 73, 'none'],
  ],
  Japan: [
    ['Yokohama Marinos', 76, 'CL'], ['Kawasaki Frontale', 77, 'CL'], ['Urawa Diamonds', 75, 'CL'],
    ['Vissel Kobe', 74, 'EL'], ['Gamba Osaka', 72, 'none'], ['Kashima Antlers', 73, 'none'],
  ],
};

// Localized fictional clubs fill the lower divisions without placeholder country codes.
const LOCAL_SECOND_DIVISION: Record<string, string[]> = {
  England: ['Kingsbridge Town', 'Northcastle Rovers', 'Ashford Athletic', 'Redmont City', 'Westbury United', 'Bromley Vale'],
  Spain: ['CD Valdeoro', 'Atlético Montemar', 'Unión Deportiva Segovia', 'Real Puerto Norte', 'CF Sierra Blanca', 'Deportivo Alcázar'],
  Italy: ['AS Monteverde', 'US Castelrosso', 'Virtus Ravenna', 'Calcio San Luca', 'FC Valle d’Oro', 'AC Portofino'],
  Germany: ['SV Grünwald', 'FC Rheinstadt', 'VfB Falkenberg', 'SC Nordhafen', 'Eintracht Linden', 'TSV Rotheim'],
  France: ['AS Montreuil', 'Olympique Valence', 'Racing Saint-Clair', 'FC Côte Bleue', 'Stade Limoges', 'Union de Savoie'],
  Netherlands: ['VV Waterdam', 'FC Rijnstad', 'SC Noordwijk', 'SV Oranjeveld', 'De Graafhaven', 'Excelsior Marken'],
  Portugal: ['Académica do Minho', 'União de Setúbal', 'SC Vila Real', 'Atlético de Faro', 'Estrela do Douro', 'CD Beira-Mar Norte'],
  Brazil: ['Atlético do Vale', 'União Carioca', 'EC Santa Cruz', 'Ferroviário Paulista', 'Náutico do Sul', 'Real Brasília'],
  Argentina: ['Deportivo Belgrano', 'Atlético del Sur', 'Unión Mendoza', 'Central Córdoba Norte', 'Sportivo Rosario', 'Ferro Carril Oesteño'],
  USA: ['Austin Republic', 'Brooklyn Athletic', 'San Diego Union', 'Carolina FC', 'Detroit City Stars', 'Nevada United'],
  Mexico: ['Deportivo Oaxaca', 'Atlético Mérida', 'Unión de Sonora', 'Real Veracruz', 'Mineros del Bajío', 'Club Morelia Norte'],
  Japan: ['Tokyo Seiryu', 'Osaka Mirai', 'Nagoya Phoenix', 'Sapporo North Stars', 'Kyoto Yamato', 'Fukuoka Horizon'],
};

function secondDivision(country: string): ClubDef[] {
  const names = LOCAL_SECOND_DIVISION[country] ?? ['United', 'Athletic', 'Sporting', 'Rovers', 'City', 'Olympic'].map((suffix) => `${country} ${suffix}`);
  return names.map((name, i) => {
    const rating = 60 + ((i * 7 + country.length * 3) % 9);
    return mkClub(country, name, rating, 'none', 2);
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
    academyFocus: division === 1 ? academyFocusFor(name, rating) : undefined,
  };
}

export const CLUBS: ClubDef[] = [];
for (const [country, rows] of Object.entries(D1)) {
  // Keep this original creation order stable so existing save club IDs continue to resolve.
  rows.forEach(([name, rating, cont]) => CLUBS.push(mkClub(country, name, rating, cont, 1)));
  secondDivision(country).forEach((c) => CLUBS.push(c));
}

const EXPANSION_NAMES: Record<string, string[]> = {
  England: ['Nottingham Forest','Everton','Wolverhampton Wanderers','Leicester City','Southampton','Leeds United'],
  Spain: ['Celta Vigo','Osasuna','Mallorca','Girona','Rayo Vallecano','Real Valladolid','Deportivo La Coruña','UD Las Palmas'],
  Italy: ['Udinese','Genoa','Sampdoria','Parma','Cagliari','Hellas Verona','US Lecce','Palermo'],
  Germany: ['Mainz 05','FC Augsburg','VfL Wolfsburg','Union Berlin','Hertha Berlin','Hamburger SV','Hannover 96','1. FC Nürnberg','St. Pauli'],
  France: ['Nantes','Montpellier','Toulouse','Auxerre','Saint-Étienne','Bordeaux','Reims','Le Havre','Metz'],
  Netherlands: ['Heerenveen','Vitesse','Sparta Rotterdam','NEC Nijmegen','PEC Zwolle','Willem II','Go Ahead Eagles','FC Groningen','NAC Breda','RKC Waalwijk','Heracles Almelo','Fortuna Sittard'],
  Portugal: ['Boavista','Rio Ave','Estoril Praia','Gil Vicente','Famalicão','Casa Pia','Moreirense','Nacional','Farense','Arouca','Belenenses','Paços de Ferreira'],
  Brazil: ['Fluminense','Botafogo','Corinthians','Cruzeiro','Internacional','Fortaleza','Athletico Paranaense','Ceará','Sport Recife','Coritiba'],
  Argentina: ['Estudiantes','Vélez Sarsfield','Lanús','Talleres','Argentinos Juniors','Huracán','Banfield','Colón','Defensa y Justicia','Godoy Cruz'],
  USA: ['New York City FC','LA Galaxy','Orlando City','Philadelphia Union','Nashville SC','Minnesota United','Charlotte FC','Austin FC','Toronto FC','Sporting Kansas City'],
  Mexico: ['Cruz Azul','Pachuca','León','Santos Laguna','Atlas','Puebla','Necaxa','Querétaro','Mazatlán','Atlético San Luis','Tijuana','Juárez'],
  Japan: ['FC Tokyo','Cerezo Osaka','Sanfrecce Hiroshima','Nagoya Grampus','Kashiwa Reysol','Avispa Fukuoka','Shonan Bellmare','Albirex Niigata','Júbilo Iwata','Tokyo Verdy','Sagan Tosu','Machida Zelvia'],
};

// Expand every top flight to 18 clubs. Added teams are appended after the legacy database
// so old save IDs remain stable. Ratings are generated from league depth and list order.
for (const [country, names] of Object.entries(EXPANSION_NAMES)) {
  const existing = CLUBS.filter((club) => club.country === country && club.division === 1).length;
  names.slice(0, Math.max(0, 18 - existing)).forEach((name, index) => {
    const rating = Math.max(65, 72 - Math.floor(index / 3) + ((name.length + country.length) % 3));
    CLUBS.push(mkClub(country, name, rating, 'none', 1));
  });
}

export const CLUB_MAP: Record<string, ClubDef> = Object.fromEntries(CLUBS.map((c) => [c.id, c]));

export function clubsInCountry(country: string, division?: 1 | 2): ClubDef[] {
  return CLUBS.filter((c) => c.country === country && (division ? c.division === division : true));
}

export function allD1(): ClubDef[] {
  return CLUBS.filter((c) => c.division === 1);
}

// Youth/academy club used before a player turns pro.
export function youthClub(country: string, academyClubId?: string): ClubDef {
  const parent = academyClubId ? CLUB_MAP[academyClubId] : undefined;
  return {
    id: parent ? `academy-${parent.id}` : `youth-${country}`,
    name: parent ? `${parent.name} Academy` : `${country} Local Academy`,
    country,
    rating: parent ? Math.max(55, parent.rating - 18) : 55,
    tier: 'Youth',
    prestige: parent ? parent.prestige : 45,
    wageFactor: 0,
    continental: 'none',
    division: 2,
    academyFocus: parent?.academyFocus ?? 'Physical',
  };
}

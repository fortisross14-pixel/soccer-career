// Club colours and an original badge design for each club. These are
// stylised badges drawn by the game (shape + pattern + initials in the
// club's colours), not reproductions of real crests.

export type CrestPattern = 'plain' | 'stripes' | 'hoops' | 'halves' | 'sash' | 'chevron' | 'quarters' | 'band';
export type CrestShape = 'shield' | 'round' | 'classic' | 'diamond';
export interface ClubStyle { primary: string; secondary: string; accent?: string; pattern: CrestPattern; shape: CrestShape; initials?: string }

const S = (primary: string, secondary: string, pattern: CrestPattern, shape: CrestShape, accent?: string, initials?: string): ClubStyle => ({ primary, secondary, pattern, shape, accent, initials });

const RED = '#d8232a', NAVY = '#14234b', WHITE = '#f6f3ea', BLACK = '#161616', GOLD = '#f2c230', SKY = '#6cabdd', BLUE = '#1d4fa0', GREEN = '#1d8a4a', CLARET = '#7a1f3d', ORANGE = '#f07a1a', PURPLE = '#4b2a83';

export const CLUB_STYLES: Record<string, ClubStyle> = {
  // England
  'Manchester City': S(SKY, WHITE, 'plain', 'round', NAVY, 'MCFC'),
  'Liverpool': S(RED, WHITE, 'plain', 'shield', GOLD),
  'Arsenal': S(RED, WHITE, 'band', 'classic', GOLD),
  'Manchester United': S(RED, BLACK, 'plain', 'shield', GOLD),
  'Chelsea': S(BLUE, WHITE, 'plain', 'round', GOLD),
  'Tottenham Hotspur': S(WHITE, NAVY, 'plain', 'classic', NAVY),
  'Newcastle United': S(BLACK, WHITE, 'stripes', 'round', SKY),
  'Aston Villa': S(CLARET, SKY, 'halves', 'shield', GOLD),
  'Everton': S(BLUE, WHITE, 'plain', 'classic', WHITE),
  // Spain
  'Real Madrid': S(WHITE, PURPLE, 'sash', 'round', GOLD),
  'FC Barcelona': S('#a50044', '#004d98', 'stripes', 'classic', GOLD, 'FCB'),
  'Atlético Madrid': S(RED, WHITE, 'stripes', 'shield', NAVY),
  'Real Sociedad': S(BLUE, WHITE, 'stripes', 'round', GOLD),
  'Sevilla': S(WHITE, RED, 'band', 'shield', RED),
  'Athletic Club': S(RED, WHITE, 'stripes', 'shield', BLACK),
  'Villarreal': S(GOLD, BLUE, 'plain', 'round', BLUE),
  // Italy
  'Inter Milan': S(BLUE, BLACK, 'stripes', 'round', GOLD),
  'Juventus': S(BLACK, WHITE, 'stripes', 'diamond', GOLD),
  'AC Milan': S(RED, BLACK, 'stripes', 'classic', WHITE),
  'Napoli': S(SKY, WHITE, 'plain', 'round', BLUE),
  'Roma': S(CLARET, GOLD, 'halves', 'shield', ORANGE),
  'Lazio': S(SKY, WHITE, 'sash', 'shield', GOLD),
  'Atalanta': S(BLUE, BLACK, 'stripes', 'round', WHITE),
  'Sampdoria': S(BLUE, WHITE, 'band', 'shield', RED),
  // Germany
  'Bayern Munich': S(RED, BLUE, 'quarters', 'round', WHITE),
  'Borussia Dortmund': S(GOLD, BLACK, 'plain', 'round', BLACK, 'BVB'),
  'RB Leipzig': S(WHITE, RED, 'chevron', 'round', NAVY),
  'Bayer Leverkusen': S(RED, BLACK, 'sash', 'diamond', WHITE),
  'Eintracht Frankfurt': S(BLACK, RED, 'halves', 'classic', WHITE),
  'SC Freiburg': S(RED, BLACK, 'plain', 'classic', WHITE),
  'VfL Wolfsburg': S(GREEN, WHITE, 'plain', 'round', WHITE),
  // France
  'Paris Saint-Germain': S(NAVY, RED, 'band', 'round', WHITE, 'PSG'),
  'AS Monaco': S(RED, WHITE, 'halves', 'diamond', GOLD),
  'Marseille': S(WHITE, SKY, 'chevron', 'shield', GOLD, 'OM'),
  'Lyon': S(WHITE, BLUE, 'sash', 'round', RED, 'OL'),
  'Lille': S(RED, NAVY, 'plain', 'shield', WHITE, 'LOSC'),
  'Lens': S(GOLD, RED, 'halves', 'shield', BLACK),
  'Montpellier': S(NAVY, ORANGE, 'band', 'round', WHITE),
  'Toulouse': S(PURPLE, WHITE, 'plain', 'shield', WHITE, 'TFC'),
  // Netherlands, Portugal, Greece
  'Ajax': S(WHITE, RED, 'band', 'round', GOLD),
  'PSV Eindhoven': S(RED, WHITE, 'stripes', 'shield', BLACK, 'PSV'),
  'Feyenoord': S(RED, WHITE, 'halves', 'shield', BLACK),
  'Benfica': S(RED, WHITE, 'plain', 'round', GOLD, 'SLB'),
  'FC Porto': S(BLUE, WHITE, 'stripes', 'shield', GOLD),
  'Sporting CP': S(GREEN, WHITE, 'hoops', 'shield', GOLD, 'SCP'),
  'Braga': S(RED, WHITE, 'chevron', 'shield', GOLD),
  'Olympiacos': S(RED, WHITE, 'stripes', 'round', GOLD),
  'PAOK': S(BLACK, WHITE, 'stripes', 'shield', WHITE),
  'AEK Athens': S(GOLD, BLACK, 'plain', 'diamond', BLACK, 'AEK'),
  'Panathinaikos': S(GREEN, WHITE, 'plain', 'round', WHITE, 'PAO'),
  // South America
  'Flamengo': S(RED, BLACK, 'hoops', 'shield', WHITE),
  'Palmeiras': S(GREEN, WHITE, 'plain', 'round', WHITE),
  'Santos': S(WHITE, BLACK, 'stripes', 'shield', BLACK),
  'São Paulo': S(WHITE, RED, 'band', 'shield', BLACK, 'SPFC'),
  'Atlético Mineiro': S(BLACK, WHITE, 'stripes', 'round', GOLD, 'CAM'),
  'Grêmio': S(SKY, BLACK, 'stripes', 'round', WHITE),
  'Botafogo': S(BLACK, WHITE, 'stripes', 'shield', WHITE),
  'Corinthians': S(WHITE, BLACK, 'plain', 'round', RED, 'SCCP'),
  'Boca Juniors': S(NAVY, GOLD, 'band', 'diamond', GOLD, 'CABJ'),
  'River Plate': S(WHITE, RED, 'sash', 'shield', BLACK, 'CARP'),
  'Racing Club': S(SKY, WHITE, 'stripes', 'round', NAVY),
  'Independiente': S(RED, WHITE, 'plain', 'classic', WHITE, 'CAI'),
  'San Lorenzo': S(BLUE, RED, 'stripes', 'shield', WHITE, 'CASLA'),
  'Estudiantes': S(RED, WHITE, 'stripes', 'shield', BLACK, 'EDLP'),
  'Lanús': S(CLARET, WHITE, 'plain', 'round', WHITE),
  // North America, Japan
  'Inter Miami': S('#f4b6c7', BLACK, 'plain', 'round', BLACK, 'IMCF'),
  'Los Angeles FC': S(BLACK, GOLD, 'plain', 'shield', GOLD, 'LAFC'),
  'New York Red Bulls': S(WHITE, RED, 'chevron', 'round', NAVY, 'NYRB'),
  'Guadalajara': S(RED, WHITE, 'stripes', 'round', NAVY),
  'Club América': S(GOLD, NAVY, 'plain', 'round', NAVY),
  'Monterrey': S(NAVY, WHITE, 'stripes', 'shield', SKY),
  'Tigres UANL': S(GOLD, BLUE, 'plain', 'shield', BLUE),
  'Yokohama Marinos': S(BLUE, WHITE, 'band', 'round', RED),
  'Kawasaki Frontale': S(SKY, BLACK, 'stripes', 'shield', WHITE),
  'Cerezo Osaka': S('#e85d93', NAVY, 'plain', 'round', NAVY),
};

// a deterministic style for every other club
const PALETTE: [string, string][] = [
  [RED, WHITE], [BLUE, WHITE], [GREEN, WHITE], [NAVY, GOLD], [BLACK, WHITE], [CLARET, SKY], [GOLD, BLACK], [SKY, NAVY],
  [ORANGE, BLACK], [PURPLE, GOLD], [WHITE, RED], [WHITE, BLUE], [RED, BLACK], [GREEN, GOLD], [NAVY, RED], [WHITE, GREEN],
];
const PATTERNS: CrestPattern[] = ['plain', 'stripes', 'hoops', 'halves', 'sash', 'chevron', 'quarters', 'band'];
const SHAPES: CrestShape[] = ['shield', 'round', 'classic', 'diamond'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function clubStyle(name: string): ClubStyle {
  const known = CLUB_STYLES[name];
  if (known) return known;
  const h = hash(name);
  const [primary, secondary] = PALETTE[h % PALETTE.length];
  return { primary, secondary, pattern: PATTERNS[(h >>> 4) % PATTERNS.length], shape: SHAPES[(h >>> 8) % SHAPES.length] };
}

const SKIP = new Set(['fc', 'cf', 'sc', 'ac', 'as', 'cd', 'ud', 'sd', 'rc', 'de', 'la', 'le', 'the', 'club', 'and', '&', 'of', 'del', 'da', 'do']);
export function clubInitials(name: string): string {
  const st = CLUB_STYLES[name];
  if (st?.initials) return st.initials;
  const words = name.replace(/[^\p{L}\s&-]/gu, '').split(/[\s-]+/).filter(Boolean);
  const main = words.filter((w) => !SKIP.has(w.toLowerCase()));
  const pick = main.length ? main : words;
  if (pick.length === 1) return pick[0].slice(0, 3).toUpperCase();
  return pick.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

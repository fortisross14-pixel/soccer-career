import type { AwardYear, WorldStar } from '../engines/stars';
import type { Race } from '../engines/races';

// ============================================================
// Domain types. Static "documents" (clubs, skills, cards...) and
// the runtime Career state that the engines operate on.
// ============================================================

export type SkillKey =
  | 'finishing' | 'longShots' | 'heading' | 'shortPass' | 'longPass'
  | 'dribbling' | 'tackling' | 'setPieces' | 'pace' | 'strength'
  | 'stamina' | 'jumping' | 'decisions' | 'workRate' | 'leadership'
  | 'crossing' | 'reflexes' | 'handling';

export type SkillCategory = 'Attacking' | 'Playmaking' | 'Defending' | 'Physical' | 'Mental' | 'Goalkeeping';

export interface SkillDef {
  key: SkillKey;
  label: string;
  category: SkillCategory;
  ageCurve: 'physical' | 'technical' | 'mental';
}

export type PositionKey = 'ST' | 'W' | 'AM' | 'B2B' | 'CM' | 'CB' | 'FB' | 'GK';

export interface PositionDef {
  key: PositionKey;
  name: string;
  short: string;
  category: 'Attack' | 'Midfield' | 'Defense' | 'Goalkeeper';
  weights: Partial<Record<SkillKey, number>>;
  keySkills: SkillKey[];
  expGoals: number;
  expAssists: number;
}

export type Division = 1 | 2 | 3;
export type ClubTier = 'Elite' | 'Strong' | 'Mid' | 'Small' | 'Youth';
export type ContinentalSpot = 'CL' | 'EL' | 'none';

export interface ClubDef {
  id: string;
  name: string;
  country: string;
  rating: number;
  tier: ClubTier;
  prestige: number;
  wageFactor: number;
  continental: ContinentalSpot;
  division: Division;
  academyFocus?: SkillCategory;
}

export interface CountryDef {
  name: string;
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF';
  leagueRep: number;
  leagueName: string;
  nationalStrength: number;
  /** names of the divisions below the top flight */
  lower: string[];
}

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  rarity: number;
  boosts: Partial<Record<SkillKey, number>>;
  positions?: PositionDef['category'][];
}

// ---------------- Cards ----------------

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type CardKind = 'skill' | 'boost' | 'recovery' | 'potential' | 'trait' | 'staff';
export type PackTier = 'bronze' | 'silver' | 'gold' | 'elite';

export interface StaffPerks {
  growth?: number;     // +x growth multiplier
  injury?: number;     // -x injury risk multiplier
  recovery?: number;   // +x fitness per day
  reputation?: number; // +x reputation gain multiplier
  wage?: number;       // +x wage on new deals
  offers?: number;     // extra offers per window
}

export interface CardDef {
  id: string;
  name: string;
  kind: CardKind;
  rarity: Rarity;
  desc: string;
  skills?: Partial<Record<SkillKey, number>>;
  /** boost: number of matches it lasts */
  matches?: number;
  fitness?: number;
  morale?: number;
  trust?: number;
  reputation?: number;
  heal?: number;       // injury days removed
  potential?: number;  // ceiling delta (0..1 scale)
  traitId?: string;
  staff?: StaffPerks;
  monthlyCost?: number;
  positions?: PositionDef['category'][];
  maxAge?: number;
}

export interface CardInstance { uid: string; defId: string; isNew?: boolean }
export interface PackInstance { uid: string; tier: PackTier; reason: string }
export interface ActiveBoost { uid: string; defId: string; name: string; skills: Partial<Record<SkillKey, number>>; matchesLeft: number }

// ---------------- Matches ----------------

export type CompKind = 'league' | 'cup' | 'continental' | 'national';
export type Involvement = 'started' | 'sub' | 'bench' | 'dropped' | 'injured' | 'none';

export interface MatchEvent {
  minute: number;
  side: 'us' | 'them';
  type: 'goal' | 'sub-on' | 'sub-off' | 'yellow' | 'injury' | 'save' | 'chance';
  text: string;
  mine?: boolean;
}

export interface MatchReport {
  involvement: Involvement;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
  motm: boolean;
  stats: Record<string, number>;
  events: MatchEvent[];
  note?: string;
}

export interface Fixture {
  id: string;
  day: number;             // day of season, 0 = 1 July
  comp: CompKind;
  compName: string;
  stage: string;
  usId: string;            // our team id (club id or nat:Country)
  oppId: string;
  home: boolean;
  played: boolean;
  usGoals?: number;
  oppGoals?: number;
  penalties?: string;      // "W 4-3" / "L 2-4"
  report?: MatchReport;
}

export interface TableRow {
  clubId: string;
  p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number;
  form: ('W' | 'D' | 'L')[];
}

export interface SeasonStats {
  apps: number; starts: number; minutes: number; goals: number; assists: number;
  ratingSum: number; rated: number; motm: number; cleanSheets: number;
  leagueApps: number; leagueGoals: number; leagueAssists: number; leagueRatingSum: number; leagueRated: number;
  contGoals: number;
  intlCaps: number; intlGoals: number; intlAssists: number;
  cupGoals?: number; contRatingSum?: number; contRated?: number;
  tournGoals?: number; tournRatingSum?: number; tournRated?: number;
}

export interface ScorerRival { name: string; clubId: string; target: number; jitter: number; starId?: string }

export interface SeasonState {
  year: number;
  clubId: string;
  clubName: string;
  country: string;
  leagueName: string;
  division: Division;
  table: TableRow[];
  rounds: { day: number; pairs: [string, string][] }[];
  roundsPlayed: number;
  fixtures: Fixture[];
  cupAlive: boolean;
  contKey: ContinentalSpot;
  contName: string;
  contAlive: boolean;
  natTournament?: { name: string; alive: boolean; qualified: boolean };
  youth?: boolean;
  stats: SeasonStats;
  scorers: ScorerRival[];
  contScorers?: ScorerRival[];
  races?: Race[];
  honors: string[];
  awards: string[];
  ovrStart: number;
  clubsThisSeason: string[];
  ended: boolean;
}

// ---------------- Player & Career ----------------

export type SquadRole = 'star' | 'starter' | 'rotation' | 'fringe' | 'reserve';

export interface Contract {
  clubId: string;
  wage: number;          // annual
  yearsLeft: number;     // seasons remaining including the current one
  promisedRole: SquadRole;
  parentClubId?: string; // set when on loan
  parentWage?: number;
  parentYears?: number;
}

export interface Injury { name: string; untilDay: number; year: number }

export interface Player {
  name: string;
  country: string;
  position: PositionKey;
  age: number;
  skills: Record<SkillKey, number>;
  /** 0.4..1.0 talent ceiling — shown to the player as POT */
  potential: number;
  stars: 1 | 2 | 3 | 4 | 5;
  peakStart: number;
  peakEnd: number;
  traits: string[];
  form: number;
  fitness: number;
  morale: number;
  trust: number;
  reputation: number;
  money: number;
  contract: Contract | null;
  injury: Injury | null;
  boosts: ActiveBoost[];
  staff: string[];
  transferListed: boolean;
}

export interface Offer {
  uid: string;
  kind: 'transfer' | 'renewal' | 'loan' | 'first' | 'academy' | 'promotion';
  clubId: string;
  wage: number;
  years: number;
  role: SquadRole;
  pushes: number;
  final: boolean;
  note?: string;
}

export interface DecisionChoice {
  id: string;
  label: string;
  desc: string;
  effects: {
    trust?: number; morale?: number; fitness?: number; reputation?: number; form?: number;
    money?: number; skills?: Partial<Record<SkillKey, number>>; pack?: PackTier; card?: string;
    transferList?: boolean; retire?: boolean; heal?: number;
  };
}

export interface Decision {
  uid: string;
  id: string;
  title: string;
  body: string;
  choices: DecisionChoice[];
}

export interface CardPlay { name: string; msg: string; skills: Partial<Record<SkillKey, number>> }

export interface QuarterTally { matches: number; minutes: number; apps: number; ga: number; motm: number; cleanSheets: number }

export interface MonthReport {
  year: number;
  month: number;
  fixtures: string[];          // fixture ids played this month (ours)
  skillDeltas: Partial<Record<SkillKey, number>>;
  ovrBefore: number;
  ovrAfter: number;
  packs: PackInstance[];
  coins: CoinEvent[];
  cardsPlayed?: CardPlay[];
  trust?: { start: number; end: number; items: { label: string; delta: number }[] };
  luck?: number;
  news: string[];
  income: number;
  costs: number;
  seasonEnd?: SeasonSummary;
}

export interface SeasonSummary {
  year: number;
  age: number;
  clubs: string;
  leagueName: string;
  leaguePos: number | null;
  apps: number; starts: number; minutes: number; goals: number; assists: number;
  avgRating: number;
  motm: number;
  caps: number; intlGoals: number;
  honors: string[];
  awards: string[];
  ovrStart: number;
  ovrEnd: number;
  division?: number;
  scorerRank?: number;
  youth?: boolean;
  natResult?: string;
  ballonRank?: number | null;
  stats?: Record<string, number>;   // club matches stat line
  intlStats?: Record<string, number>;
}

export interface Honor { label: string; count: number }

export interface LogEntry { year: number; month: number; text: string; kind: 'transfer' | 'trophy' | 'award' | 'national' | 'injury' | 'milestone' | 'card' | 'info' }

export interface CoinEvent { label: string; amount: number; milestone?: string; firstEver?: boolean }

/** run modifiers granted by legacy upgrades and relics */
export interface CareerMods {
  injuryCut: number;
  handBonus: number;
  extraBoosts: number;
  extraPlays: number;
  luck: number;
  youthGrowth: number;
  repBonus: number;
  offerBonus: number;
  wageBonus: number;
  coinMult: number;
  noInjuryUntil: number; // season year
  ratingBonus: number;
  maxRarity: Rarity;     // best card rarity this profile has unlocked
}

export interface Career {
  version: 2;
  id: string;
  rng: number;
  player: Player;
  year: number;
  month: number;                // 0 = July ... 11 = June
  season: SeasonState | null;
  cards: CardInstance[];
  packs: PackInstance[];
  purchases: number;            // packs bought this season
  focus: string;                // training focus id
  plan: { balance: number };    // 0 = all training ground, 100 = all match day
  cardsThisMonth: number;
  monthCards?: CardPlay[];
  trustLog?: { label: string; delta: number }[];
  /** running totals for the current calendar quarter (Jul-Sep, Oct-Dec, Jan-Mar, Apr-Jun); packs are awarded at its end */
  qtr?: QuarterTally;
  lastTrust?: { start: number; end: number; items: { label: string; delta: number }[] };
  luck?: number;
  mods: CareerMods;
  relics: string[];
  milestones: string[];
  pendingCoins: CoinEvent[];
  coinsEarned: number;
  world: { div: Record<string, Division> };
  academy: { clubId: string } | null;
  stars: WorldStar[];
  retiredStars?: WorldStar[];
  awardsHistory: AwardYear[];   // youth academy, ages 11-19
  bestDiv: number;              // highest level reached (1 = top flight), 9 = none yet
  firstEver: string[];          // milestones unlocked for the first time on this profile
  offers: Offer[];
  decisions: Decision[];
  notices: string[];            // what's happening this month
  asked: { loan: boolean; transfer: boolean; minutes?: boolean };
  lastReport: MonthReport | null;
  history: SeasonSummary[];
  pastFixtures: Fixture[];      // last season only
  honors: { club: Honor[]; individual: Honor[]; national: Honor[] };
  totals: { apps: number; goals: number; assists: number; caps: number; intlGoals: number; motm: number };
  national: { debutAge: number | null; status: string };
  log: LogEntry[];
  peakOvr: number;
  qualified?: { clubId: string; key: ContinentalSpot };
  retired: boolean;
  legacy?: { score: number; tier: string; blurb: string };
}

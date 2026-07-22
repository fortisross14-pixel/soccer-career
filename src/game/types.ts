// ============================================================
// Core domain types. These describe the "documents" (data) and
// the runtime game state the engines operate on.
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
  /** physical skills decline earliest; mental skills hold longest. */
  ageCurve: 'physical' | 'technical' | 'mental';
}

export type PositionKey =
  | 'ST' | 'W' | 'AM' | 'B2B' | 'CM' | 'CB' | 'FB' | 'GK';

export interface PositionDef {
  key: PositionKey;
  name: string;
  short: string;
  category: 'Attack' | 'Midfield' | 'Defense' | 'Goalkeeper';
  weights: Partial<Record<SkillKey, number>>;
  keySkills: SkillKey[];
  /** expected goals & assists per 38-game season for a *league-average* player in this role */
  expGoals: number;
  expAssists: number;
}

export type ClubTier = 'Elite' | 'Strong' | 'Mid' | 'Small' | 'Youth';
export type ContinentalSpot = 'CL' | 'EL' | 'none';

export interface ClubDef {
  id: string;
  name: string;
  country: string;
  /** squad strength 55-92 */
  rating: number;
  tier: ClubTier;
  prestige: number; // 40-100, drives sponsorships & Ballon d'Or visibility
  /** relative wage budget multiplier */
  wageFactor: number;
  continental: ContinentalSpot;
  division: 1 | 2;
}

export interface CountryDef {
  name: string;
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF';
  /** league reputation 55-95: gates award thresholds & visibility */
  leagueRep: number;
  leagueName: string;
  /** national team strength 60-90 */
  nationalStrength: number;
}

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  rarity: number; // relative weight
  boosts: Partial<Record<SkillKey, number>>;
  /** only offered to matching position categories, empty = any */
  positions?: PositionDef['category'][];
}

export interface LifeEventDef {
  id: string;
  desc: string;
  minAge: number;
  maxAge: number;
  effects: Partial<Record<SkillKey, number>>;
  weight: number;
}

export type AwardScope = 'individual' | 'club' | 'national';

export interface AwardDef {
  id: string;
  name: string;
  scope: AwardScope;
  desc: string;
}

// ---------------- Runtime state ----------------

export type SquadRole = 'star' | 'starter' | 'rotation' | 'fringe' | 'reserve' | 'youth';

export interface Contract {
  clubId: string;
  wage: number; // annual, dollars
  yearsLeft: number;
}

export interface SeasonRecord {
  age: number;
  season: number;
  clubName: string;
  clubId: string;
  role: SquadRole;
  competition: string;
  games: number;
  goals: number;
  assists: number;
  rating: number;
  leagueFinish: number | null;
  leagueName: string;
  overall: number;
  // national
  capsThisYear: number;
  intlGoals: number;
  // honors earned this season (labels)
  clubHonors: string[];
  individualHonors: string[];
  nationalHonors: string[];
}

export interface Honor {
  label: string;
  count: number;
}

export interface Offer {
  clubId: string;
  clubName: string;
  clubRating: number;
  tier: ClubTier;
  country: string;
  role: SquadRole;
  wage: number;
  years: number;
  continental: ContinentalSpot;
  international: boolean;
}

export interface EventLogEntry {
  season: number;
  age: number;
  kind: 'event' | 'transfer' | 'trophy' | 'award' | 'national' | 'milestone' | 'injury' | 'system';
  text: string;
}

export interface NationalCareer {
  debutAge: number | null;
  caps: number;
  goals: number;
  status: string;
}

export interface Player {
  id: string;
  name: string;
  country: string;
  position: PositionKey;
  age: number;
  season: number; // calendar-ish counter, starts at a base year
  skills: Record<SkillKey, number>;
  /** hidden 0-1 talent ceiling driver */
  potentialCeiling: number; // final soft cap for overall (e.g. 62-99)
  peakStart: number;
  peakEnd: number;
  reputation: number; // 0-100, grows with performances
  marketValue: number; // dollars
  money: number; // career earnings
  traits: TraitDef['id'][];
  contract: Contract | null;
  role: SquadRole;
  national: NationalCareer;
  honors: {
    club: Honor[];
    national: Honor[];
    individual: Honor[];
  };
  totals: { games: number; goals: number; assists: number; caps: number; intlGoals: number };
  history: SeasonRecord[];
  log: EventLogEntry[];
  offers: Offer[];
  // per-year action flags
  trainedThisYear: boolean;
  searchedThisYear: boolean;
  retired: boolean;
  legacyScore?: number;
  legacyTier?: string;
}

export interface SaveMeta {
  slot: number;
  name: string;
  age: number;
  position: PositionKey;
  country: string;
  clubName: string;
  overall: number;
  retired: boolean;
}

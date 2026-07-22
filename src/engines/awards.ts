import type { ClubDef, Player } from '../game/types';
import { getCountry } from '../data/countries';
import { clamp, chance, noise } from './util';
import type { SeasonOutput } from './season';

export interface AwardsOutput {
  individualHonors: string[];
  logs: string[];
  reputationGain: number;
  wonBallon: boolean;
}

/**
 * Awards are decided by comparing the player's season against a simulated
 * "league leader line" derived from league reputation. Better leagues demand
 * more. A global campaign score gates the Ballon d'Or so it stays rare.
 */
export function decideAwards(p: Player, club: ClubDef, overall: number, s: SeasonOutput): AwardsOutput {
  const country = getCountry(club.country);
  const rep = country.leagueRep;
  const honors: string[] = [];
  const logs: string[] = [];
  const isStarter = s.role === 'star' || s.role === 'starter';
  const topFlight = club.division === 1 && club.tier !== 'Youth';

  if (topFlight && isStarter) {
    // Golden Boot — must beat the league's scoring line
    const bootLine = 15 + (rep - 70) / 3.2 + Math.round(noise() * 3); // ~15 weak league .. ~24 elite
    if (s.goals >= bootLine && (p.position === 'ST' || p.position === 'W' || p.position === 'AM')) {
      honors.push(`${country.leagueName} Golden Boot`);
      logs.push(`⭐ Won the ${country.leagueName} Golden Boot with ${s.goals} goals.`);
    }

    // Playmaker — assist line
    const assistLine = 11 + (rep - 70) / 5 + Math.round(noise() * 2);
    if (s.assists >= assistLine) {
      honors.push(`${country.leagueName} Playmaker`);
      logs.push(`⭐ Led the league with ${s.assists} assists.`);
    }

    // Golden Glove
    if (p.position === 'GK' && s.rating >= 7.2 && overall >= rep - 6) {
      if (chance(0.4)) { honors.push(`${country.leagueName} Golden Glove`); logs.push('⭐ Named the league\'s best goalkeeper.'); }
    }

    // Team of the Season — high rating + strong overall for the league
    if (s.rating >= 7.35 && overall >= rep - 8) {
      if (chance(0.5)) { honors.push('Team of the Season'); logs.push('⭐ Selected in the Team of the Season.'); }
    }

    // League MVP — elite season
    if (s.rating >= 7.7 && overall >= rep - 3 && s.clubHonors.length > 0) {
      if (chance(0.45)) { honors.push(`${country.leagueName} MVP`); logs.push('⭐ Voted League MVP.'); }
    }

    // Best Young Player
    if (p.age <= 21 && s.rating >= 7.1 && overall >= rep - 12 && isStarter) {
      if (chance(0.5)) { honors.push('Best Young Player'); logs.push('⭐ Named the league\'s Best Young Player.'); }
    }
  }

  // Continental top scorer
  if (s.contKey !== 'none' && s.contGoals >= 8 && chance(0.4)) {
    honors.push('Continental Top Scorer');
    logs.push(`⭐ Top scorer in continental play (${s.contGoals} goals).`);
  }

  // --- Ballon d'Or ---
  // campaign score blends overall, output, trophies, league prestige & rep.
  const trophyPoints = s.clubHonors.reduce((sum, h) =>
    sum + (h.includes('Title') ? 4 : h.includes('Winner') ? 6 : 2), 0);
  const outputPoints = (s.goals + s.assists) / 3;
  const campaign =
    (overall - 82) * 3 +
    trophyPoints +
    outputPoints +
    (rep - 78) * 0.5 +
    club.prestige * 0.05 +
    noise() * 4;
  let wonBallon = false;
  if (overall >= 90 && campaign >= 34 && topFlight && chance(0.28)) {
    honors.push("Ballon d'Or");
    logs.push("🏅 Won the Ballon d'Or — the best player in the world.");
    wonBallon = true;
  }

  // --- reputation ---
  let repGain = (overall - p.reputation) * 0.25; // drift toward overall
  repGain += s.clubHonors.length * 1.5;
  repGain += honors.length * 2.5;
  repGain += clamp((s.goals + s.assists - 10) * 0.15, -2, 6);
  if (wonBallon) repGain += 8;
  const reputationGain = repGain;

  return { individualHonors: honors, logs, reputationGain, wonBallon };
}

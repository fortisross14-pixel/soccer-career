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
 * Awards compare the player against a simulated elite field, not merely a
 * fixed minimum. Under-21 players can still win senior awards, but only after
 * a genuinely historic season; otherwise their route is Best Young Player.
 */
export function decideAwards(p: Player, club: ClubDef, overall: number, s: SeasonOutput): AwardsOutput {
  const country = getCountry(club.country);
  const rep = country.leagueRep;
  const honors: string[] = [];
  const logs: string[] = [];
  const isStarter = s.role === 'star' || s.role === 'starter';
  const topFlight = club.division === 1 && club.tier !== 'Youth';
  const under21 = p.age < 21;
  const eliteLeague = rep >= 86;

  // These represent the output of the best established specialist elsewhere
  // in the league. Elite competitions should almost always have a serious star.
  const simulatedTopScorer = Math.round(17 + Math.max(0, rep - 68) * 0.24 + noise() * 2.2);
  const simulatedTopCreator = Math.round(11 + Math.max(0, rep - 68) * 0.15 + noise() * 1.4);

  if (topFlight && isStarter) {
    const seniorGoalLine = simulatedTopScorer + (under21 ? (eliteLeague ? 5 : 3) : 0);
    const seniorAssistLine = simulatedTopCreator + (under21 ? (eliteLeague ? 4 : 3) : 0);
    const youngSeniorRating = under21 ? 7.65 : 0;

    if (
      s.goals >= seniorGoalLine &&
      (!under21 || s.rating >= youngSeniorRating) &&
      (p.position === 'ST' || p.position === 'W' || p.position === 'AM')
    ) {
      honors.push(`${country.leagueName} Golden Boot`);
      logs.push(`⭐ Won the ${country.leagueName} Golden Boot with ${s.goals} goals, outperforming the league's established stars.`);
    }

    if (s.assists >= seniorAssistLine && (!under21 || s.rating >= youngSeniorRating)) {
      honors.push(`${country.leagueName} Playmaker`);
      logs.push(`⭐ Led the league with ${s.assists} assists against an elite field of creators.`);
    }

    const gloveRating = under21 ? 7.7 : 7.25;
    const gloveOverall = under21 ? rep - 1 : rep - 6;
    if (p.position === 'GK' && s.rating >= gloveRating && overall >= gloveOverall) {
      if (chance(under21 ? 0.28 : 0.4)) {
        honors.push(`${country.leagueName} Golden Glove`);
        logs.push('⭐ Named the league\'s best goalkeeper.');
      }
    }

    const totsRating = under21 ? 7.75 : 7.35;
    const totsOverall = under21 ? rep - 2 : rep - 8;
    if (s.rating >= totsRating && overall >= totsOverall && (!under21 || s.games >= 32)) {
      if (chance(under21 ? 0.35 : 0.5)) {
        honors.push('Team of the Season');
        logs.push('⭐ Selected in the Team of the Season.');
      }
    }

    const mvpRating = under21 ? 8.05 : 7.7;
    const mvpOverall = under21 ? rep + 1 : rep - 3;
    const mvpOutput = under21 ? s.goals + s.assists >= 28 : true;
    if (s.rating >= mvpRating && overall >= mvpOverall && s.clubHonors.length > 0 && mvpOutput) {
      if (chance(under21 ? 0.22 : 0.45)) {
        honors.push(`${country.leagueName} MVP`);
        logs.push('⭐ Voted League MVP.');
      }
    }

    // This is the normal recognition lane for strong young seasons.
    if (p.age <= 21 && s.rating >= 7.15 && overall >= rep - 12 && s.games >= 24) {
      const outputFloor = p.position === 'GK' || p.position === 'CB' || p.position === 'FB'
        ? s.rating >= 7.25
        : s.goals + s.assists >= 12;
      if (outputFloor && chance(0.55)) {
        honors.push('Best Young Player');
        logs.push('⭐ Named the league\'s Best Young Player.');
      }
    }
  }

  const continentalGoalLine = under21 ? 11 : 8;
  if (s.contKey !== 'none' && s.contGoals >= continentalGoalLine && chance(under21 ? 0.25 : 0.4)) {
    honors.push('Continental Top Scorer');
    logs.push(`⭐ Top scorer in continental play (${s.contGoals} goals).`);
  }

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
  const ballonOverall = under21 ? 94 : 90;
  const ballonCampaign = under21 ? 48 : 34;
  const ballonChance = under21 ? 0.12 : 0.28;
  if (overall >= ballonOverall && campaign >= ballonCampaign && topFlight && chance(ballonChance)) {
    honors.push("Ballon d'Or");
    logs.push("🏅 Won the Ballon d'Or — the best player in the world.");
    wonBallon = true;
  }

  let repGain = (overall - p.reputation) * 0.25;
  repGain += s.clubHonors.length * 1.5;
  repGain += honors.length * 2.5;
  repGain += clamp((s.goals + s.assists - 10) * 0.15, -2, 6);
  if (wonBallon) repGain += 8;

  return { individualHonors: honors, logs, reputationGain: repGain, wonBallon };
}

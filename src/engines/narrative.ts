import type { Player, SeasonRecord } from '../game/types';
import type { SeasonOutput } from './season';

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export function seasonNarrative(p: Player, season: SeasonOutput, overallBefore: number, overallAfter: number, objectiveMet: boolean): string[] {
  const lines: string[] = [];
  const trust = p.managerTrust ?? 55;
  const morale = p.morale ?? 70;
  const intensity = p.trainingIntensity ?? 'balanced';

  if (p.age < 16) {
    lines.push(pick([
      'Academy coaches focused on technique, discipline and learning the game rather than results.',
      'Another formative academy year built the habits that may define the senior career.',
      'Progress came away from the spotlight as the foundations of a professional player took shape.',
    ]));
  }
  if (season.injured) lines.push(pick([
    'An injury limited development and interrupted the rhythm of the season.',
    'Time in the treatment room reduced both match exposure and training continuity.',
    'Physical setbacks prevented the year from reaching its full potential.',
  ]));
  else if (intensity === 'intense' && overallAfter > overallBefore) lines.push(pick([
    'Aggressive training accelerated development, although the physical load was considerable.',
    'Exceptional commitment on the training ground produced visible gains.',
    'The high-intensity program paid off this year, but it may be difficult to sustain forever.',
  ]));
  else if (intensity === 'light') lines.push('A lighter workload protected fitness but produced more modest technical growth.');

  if (trust >= 78 && season.rating >= 7) lines.push(pick([
    'A strong understanding with the coach created confidence, freedom and consistent opportunities.',
    'The manager’s trust was rewarded with one of the most convincing campaigns of the career.',
    'Good feeling with the coach translated into responsibility and exceptional results.',
  ]));
  else if (trust < 30) lines.push(pick([
    'A damaged relationship with the coach restricted opportunities and undermined the season.',
    'Tactical disagreements and low trust made every appearance harder to earn.',
    'The manager never appeared fully convinced, limiting continuity and influence.',
  ]));

  if (morale >= 82) lines.push('High morale helped the player perform with confidence in decisive moments.');
  else if (morale <= 35) lines.push('Low morale cast a shadow over performances and slowed progress.');

  if (season.clubHonors.length) lines.push(`The season will be remembered above all for winning ${season.clubHonors.join(' and ')}.`);
  if (season.rating >= 7.7) lines.push('This was a defining individual season, with performances consistently above the level of the squad.');
  else if (season.rating < 6.3 && season.games > 15) lines.push('Despite regular minutes, performances failed to meet expectations.');

  lines.push(objectiveMet ? 'The chosen season objective was achieved, validating the preseason plan.' : 'The preseason objective was missed, forcing a reassessment of the next step.');
  return lines.slice(0, 5);
}

export function worldHeadlines(p: Player, record: SeasonRecord): string[] {
  const lines: string[] = [];
  const rival = p.rivalName ?? 'a fellow academy graduate';
  const rivalOvr = Math.min(96, (p.rivalOverall ?? 45) + (p.age < 27 ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3) - 1));
  p.rivalOverall = rivalOvr;
  if (p.age >= 14) lines.push(`${rival} is now rated ${rivalOvr}, keeping the comparison between the two careers alive.`);
  if (record.leagueFinish === 1) lines.push(`${record.clubName} reshaped the domestic hierarchy with a title-winning campaign.`);
  else if (record.leagueFinish && record.leagueFinish >= 7) lines.push(`${record.clubName} enters the offseason under pressure after finishing ${record.leagueFinish}th.`);
  if (Math.random() < 0.35) lines.push(pick([
    'A wealthy ownership group has begun transforming one of the league’s traditional outsiders.',
    'A famous manager changed clubs, shifting expectations across the football world.',
    'A new generation of elite prospects is beginning to challenge established stars.',
    'Transfer spending reached a new high as major clubs competed for immediate success.',
  ]));
  return lines.slice(0, 2);
}

export function careerVerdict(p: Player): string {
  const stars = p.prospectStars ?? 3;
  const peak = p.peakOverall ?? 0;
  const trophies = [...p.honors.club, ...p.honors.national].reduce((n, h) => n + h.count, 0);
  const champions = p.honors.club.filter((h) => /Champions|Continental|League/i.test(h.label)).reduce((n, h) => n + h.count, 0);
  const worldCups = p.honors.national.filter((h) => /World Cup/i.test(h.label)).reduce((n, h) => n + h.count, 0);
  const injuries = p.injurySeasons ?? 0;
  const decisions = p.careerDecisionScore ?? 0;

  if (stars <= 2 && peak >= 84) return `Wise career decisions transformed this ${stars}-star prospect into an extraordinary success. A peak overall of ${peak} produced ${trophies} major trophies${champions ? `, including ${champions} elite club triumphs` : ''}${worldCups ? ` and ${worldCups} World Cup` : ''}.`;
  if (stars >= 4 && peak < 80 && injuries >= 5) return `This ${stars}-star talent never fulfilled the original promise. Repeated injuries and excessive physical strain truncated the career, limiting the player to a peak overall of ${peak}.`;
  if (stars >= 4 && peak >= 90) return `The exceptional promise was fulfilled. This ${stars}-star prospect became a generational footballer, peaking at ${peak} overall and collecting ${trophies} major trophies.`;
  if (decisions < -8) return `Natural ability carried the career a long way, but unstable decisions repeatedly interrupted momentum. The ${stars}-star prospect peaked at ${peak} overall with ${trophies} major trophies.`;
  if (injuries >= 6) return `A career of resilience: injuries repeatedly disrupted development, yet the ${stars}-star prospect still reached ${peak} overall and won ${trophies} major trophies.`;
  return `This ${stars}-star prospect built a ${trophies >= 8 ? 'remarkable' : trophies >= 3 ? 'successful' : 'hard-earned'} career, reaching a peak overall of ${peak} and winning ${trophies} major trophies through a mixture of talent, opportunity and career choices.`;
}

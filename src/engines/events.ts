import type { Player, SeasonEvent, SeasonEventChoice, SkillKey } from '../game/types';
import { clamp, randInt } from './util';

interface WeightedEvent extends SeasonEvent { weight: number; }

const info = (
  id: string,
  title: string,
  body: string,
  category: SeasonEvent['category'],
  effects: SeasonEventChoice['effects'] = {},
  label = 'Continue',
  weight = 1,
): WeightedEvent => ({ id, title, body, category, weight, choices: [{ id: 'accept', label, description: 'Accept what happened and move forward.', effects }] });

const youthEvents = (): WeightedEvent[] => [
  {
    id: 'youth-coach-foundation', weight: 5, title: 'The coach changes your development plan', category: 'career',
    body: 'Your academy coach believes the next year could define the type of player you become. Three very different plans are offered.',
    choices: [
      { id: 'complete', label: 'Build the complete player', description: 'Improve every attribute a little and avoid creating a major weakness.', effects: { development: 0.08, skillChanges: allSkills(1), personality: { professionalism: 3 } } },
      { id: 'athlete', label: 'Become an explosive athlete', description: 'Make major gains in pace and jumping, with only modest technical work.', effects: { development: 0.04, skillChanges: { pace: 6, jumping: 6, strength: 2 }, fitness: -3, personality: { courage: 2 } } },
      { id: 'dribbler', label: 'Master one-on-one play', description: 'Dribbling improves dramatically, but your finishing technique slips slightly.', effects: { skillChanges: { dribbling: 7, pace: 2, finishing: -1, longShots: -1 }, morale: 3, personality: { courage: 3 } } },
    ],
  },
  {
    id: 'youth-position-experiment', weight: 4, title: 'A new position in training', category: 'career',
    body: 'An academy coach wants to broaden your game by changing what you work on every day.',
    choices: [
      { id: 'technical', label: 'Embrace technical work', description: 'Passing and decisions improve quickly, although physical progress slows.', effects: { skillChanges: { shortPass: 5, longPass: 4, decisions: 4, strength: -1 }, development: 0.03, managerTrust: 5, personality: { professionalism: 2, teamFirst: 2 } } },
      { id: 'specialize', label: 'Protect your natural strengths', description: 'Your strongest attacking tools keep accelerating, but the coach is frustrated.', effects: { skillChanges: { finishing: 4, dribbling: 4, pace: 3 }, managerTrust: -5, development: 0.06, personality: { loyalty: -1, courage: 2 } } },
      { id: 'defensive', label: 'Learn the defensive side', description: 'You become more complete and trusted without adding much flair.', effects: { skillChanges: { tackling: 5, workRate: 4, stamina: 3 }, managerTrust: 7, personality: { teamFirst: 4, professionalism: 2 } } },
    ],
  },
  {
    id: 'youth-growth-spurt', weight: 3, title: 'A sudden growth spurt', category: 'life',
    body: 'Your body changes quickly over the summer. It will help some parts of your game and disrupt others.',
    choices: [
      { id: 'power', label: 'Train for power', description: 'Use the growth spurt to become stronger in duels and in the air.', effects: { skillChanges: { strength: 6, jumping: 5, heading: 3, dribbling: -1 }, fitness: -2 } },
      { id: 'mobility', label: 'Protect mobility', description: 'Focus on coordination and speed while your body adjusts.', effects: { skillChanges: { pace: 5, dribbling: 4, strength: 2 }, development: 0.02 } },
      { id: 'rest', label: 'Let your body settle', description: 'Lose some training time but protect fitness and long-term development.', effects: { fitness: 12, development: -0.03, injuryRisk: -0.05, personality: { professionalism: 2 } } },
    ],
  },
  {
    id: 'youth-tournament', weight: 4, title: 'Academy tournament opportunity', category: 'match',
    body: 'A major youth tournament could bring attention, but the staff disagrees about how you should approach it.',
    choices: [
      { id: 'express', label: 'Play without fear', description: 'Take risks and try to dominate matches individually.', effects: { performance: 0.12, reputation: 2, skillChanges: { dribbling: 3, finishing: 2 }, personality: { courage: 4, humility: -1 } } },
      { id: 'team', label: 'Play for the team', description: 'Prioritize combination play and tactical discipline.', effects: { performance: 0.07, managerTrust: 7, skillChanges: { shortPass: 4, decisions: 3 }, personality: { teamFirst: 4 } } },
      { id: 'learn', label: 'Treat it as education', description: 'Accept a smaller role and focus on absorbing everything around you.', effects: { development: 0.12, performance: -0.05, skillChanges: { decisions: 4, workRate: 3 }, personality: { humility: 4, professionalism: 3 } } },
    ],
  },
  {
    id: 'youth-friendship', weight: 3, title: 'A teammate needs your support', category: 'life',
    body: 'A close academy teammate is struggling and asks you to spend extra time helping them.',
    choices: [
      { id: 'help', label: 'Help every day', description: 'Your own training suffers slightly, but the relationship becomes important.', effects: { development: -0.03, morale: 5, relationshipRole: 'friend', relationship: 15, personality: { teamFirst: 5, loyalty: 3 } } },
      { id: 'balance', label: 'Set boundaries', description: 'Support them without sacrificing your own plan.', effects: { relationshipRole: 'friend', relationship: 6, personality: { professionalism: 3 } } },
      { id: 'self', label: 'Focus entirely on yourself', description: 'Your development accelerates, but others notice your choice.', effects: { development: 0.08, relationshipRole: 'friend', relationship: -10, personality: { teamFirst: -5, humility: -2 } } },
    ],
  },
  info('youth-school-pressure', 'School and football collide', 'Exams and academy commitments peak at the same time.', 'life', { development: -0.03, morale: -3, personality: { professionalism: 2 } }, 'Push through', 2),
];

const seniorEvents = (p: Player): WeightedEvent[] => [
  {
    id: 'coach-adjust-game', weight: 5, title: 'The coach asks you to change your game', category: 'career',
    body: 'The manager wants you to simplify your role. You would probably play more, but spend less time refining your individual strengths.',
    choices: [
      { id: 'ignore', label: 'Keep playing your way', description: 'Your skills improve faster, but your place in the team becomes less secure.', effects: { development: 0.12, performance: -0.07, managerTrust: -10, personality: { courage: 3, teamFirst: -3 } } },
      { id: 'listen', label: 'Follow the manager completely', description: 'Start more matches and produce more now, while sacrificing some development.', effects: { performance: 0.15, development: -0.09, managerTrust: 12, personality: { professionalism: 4, teamFirst: 3 } } },
      { id: 'adapt', label: 'Find a middle ground', description: 'Make tactical changes without abandoning your identity.', effects: { performance: 0.07, development: 0.03, managerTrust: 5, personality: { professionalism: 2 } } },
    ],
  },
  {
    id: 'big-match', weight: 5, title: 'A defining match', category: 'match',
    body: 'Late in a major match, the ball falls to you with the result in the balance.',
    choices: [
      { id: 'risk', label: 'Take the decisive action', description: 'Attempt the difficult shot or final pass.', effects: { performance: 0.10, reputation: 2, fitness: -3, decisionScore: 2, personality: { courage: 3 } } },
      { id: 'safe', label: 'Keep possession', description: 'Choose control over individual glory.', effects: { managerTrust: 5, performance: 0.03, decisionScore: 1, personality: { professionalism: 2 } } },
      { id: 'team', label: 'Create for a teammate', description: 'Use awareness and trust the supporting run.', effects: { performance: 0.07, morale: 3, decisionScore: 2, personality: { teamFirst: 3 } } },
    ],
  },
  {
    id: 'captain-conflict', weight: 3, title: 'The captain confronts you', category: 'career',
    body: 'The club captain criticizes your effort after a poor training session.',
    choices: [
      { id: 'accept', label: 'Accept the criticism', description: 'Train harder and rebuild trust inside the squad.', effects: { fitness: -3, development: 0.06, managerTrust: 4, relationshipRole: 'captain', relationship: 8, personality: { humility: 4, professionalism: 4 } } },
      { id: 'answer', label: 'Stand your ground', description: 'Protect your status but risk dividing the dressing room.', effects: { morale: 5, relationshipRole: 'captain', relationship: -12, personality: { courage: 4, humility: -3 } } },
      { id: 'private', label: 'Resolve it privately', description: 'A measured response improves the relationship without changing much else.', effects: { relationshipRole: 'captain', relationship: 5, managerTrust: 2, personality: { professionalism: 3 } } },
    ],
  },
  {
    id: 'mentor-extra-work', weight: 3, title: 'Your mentor offers extra sessions', category: 'career',
    body: 'A veteran offers to stay after training and work on one part of your game.',
    choices: [
      { id: 'technical', label: 'Work on technique', description: 'Improve close control and passing, at the cost of some recovery.', effects: { skillChanges: { dribbling: 3, shortPass: 3, decisions: 2 }, fitness: -5, relationshipRole: 'mentor', relationship: 8 } },
      { id: 'finishing', label: 'Work on finishing', description: 'Improve shooting and composure in decisive situations.', effects: { skillChanges: { finishing: 4, longShots: 3, decisions: 1 }, fitness: -5, relationshipRole: 'mentor', relationship: 8 } },
      { id: 'decline', label: 'Protect your recovery', description: 'Preserve fitness but miss a valuable learning opportunity.', effects: { fitness: 8, relationshipRole: 'mentor', relationship: -3, development: -0.02 } },
    ],
  },
  {
    id: 'media-future', weight: 3, title: 'Questions about your future', category: 'career',
    body: 'After a strong run of form, reporters ask whether you have outgrown the club.',
    choices: [
      { id: 'loyal', label: 'Declare your loyalty', description: 'Fans and teammates respond warmly.', effects: { morale: 4, managerTrust: 6, reputation: 1, personality: { loyalty: 5, mediaComfort: 2 } } },
      { id: 'ambitious', label: 'Say you want the highest level', description: 'Increase outside interest while creating tension at the club.', effects: { reputation: 3, managerTrust: -7, personality: { loyalty: -4, courage: 2, mediaComfort: 3 } } },
      { id: 'neutral', label: 'Avoid the question', description: 'Keep every option open without creating a major reaction.', effects: { managerTrust: 1, personality: { mediaComfort: -1 } } },
    ],
  },
  {
    id: 'commercial-offer', weight: p.age >= 18 ? 2 : 0, title: 'A demanding commercial offer', category: 'life',
    body: 'A sponsor offers significant money for a campaign during a critical training period.',
    choices: [
      { id: 'money', label: 'Accept the campaign', description: 'Earn money and exposure but lose preparation time.', effects: { money: 250000, reputation: 2, development: -0.06, fitness: -4, personality: { mediaComfort: 3 } } },
      { id: 'football', label: 'Reject it and train', description: 'Protect development and show the staff where your priorities lie.', effects: { development: 0.07, managerTrust: 4, personality: { professionalism: 4 } } },
      { id: 'negotiate', label: 'Reduce the commitment', description: 'Take a smaller payment while limiting the sporting cost.', effects: { money: 100000, reputation: 1, development: -0.01, personality: { professionalism: 2, mediaComfort: 1 } } },
    ],
  },
  info('family-news', 'A new chapter off the pitch', 'You welcome a child into your family. The year brings joy, responsibility and a different perspective.', 'life', { morale: 8, development: -0.03, personality: { humility: 3 } }, 'Continue', p.age >= 22 ? 0.8 : 0),
  info('minor-illness', 'Interrupted preparation', 'A short illness costs you part of preseason, but not the whole campaign.', 'life', { fitness: -6, development: -0.03 }, 'Recover', 2),
];

const longInjury = (): WeightedEvent => info(
  'long-injury', 'Long-term injury', 'A serious injury rules you out for a substantial part of the season.', 'injury',
  { fitness: -28, performance: -0.28, development: -0.20, injuryRisk: 0.10 }, 'Begin rehabilitation', 1,
);

function allSkills(value: number): Partial<Record<SkillKey, number>> {
  return {
    finishing: value, longShots: value, heading: value, shortPass: value, longPass: value,
    dribbling: value, tackling: value, setPieces: value, pace: value, strength: value,
    stamina: value, jumping: value, decisions: value, workRate: value, leadership: value,
    crossing: value, reflexes: value, handling: value,
  };
}

function weightedSelect(pool: WeightedEvent[], count: number): SeasonEvent[] {
  const remaining = pool.filter((event) => event.weight > 0);
  const selected: SeasonEvent[] = [];
  while (remaining.length && selected.length < count) {
    const total = remaining.reduce((sum, event) => sum + event.weight, 0);
    let roll = Math.random() * total;
    let index = 0;
    for (; index < remaining.length; index += 1) {
      roll -= remaining[index].weight;
      if (roll <= 0) break;
    }
    const [picked] = remaining.splice(Math.min(index, remaining.length - 1), 1);
    const { weight: _weight, ...event } = picked;
    selected.push(event);
  }
  return selected;
}

export function generateSeasonEvents(p: Player): SeasonEvent[] {
  const count = randInt(1, 5);
  const pool = p.age < 17 ? youthEvents() : seniorEvents(p);
  const selected = weightedSelect(pool, count);

  // Serious injuries are intentionally rare events, not a standard yearly draw.
  const injuryChance = p.age < 16 ? 0.01 : 0.035 + Math.max(0, 65 - (p.fitness ?? 80)) / 900;
  if (Math.random() < injuryChance && !selected.some((event) => event.category === 'injury')) {
    selected[randInt(0, selected.length - 1)] = longInjury();
  }
  return selected;
}

export function applySeasonEventChoice(p: Player, event: SeasonEvent, choiceId: string): Player {
  const choice = event.choices.find((item) => item.id === choiceId) ?? event.choices[0];
  const effects = choice.effects;
  const next: Player = JSON.parse(JSON.stringify(p));

  next.morale = clamp((next.morale ?? 70) + (effects.morale ?? 0), 0, 100);
  next.fitness = clamp((next.fitness ?? 80) + (effects.fitness ?? 0), 0, 100);
  next.managerTrust = clamp((next.managerTrust ?? 55) + (effects.managerTrust ?? 0), 0, 100);
  next.reputation = clamp(next.reputation + (effects.reputation ?? 0), 0, 100);
  next.money = Math.max(0, next.money + (effects.money ?? 0));
  next.eventPerformanceModifier = (next.eventPerformanceModifier ?? 0) + (effects.performance ?? 0);
  next.eventDevelopmentModifier = (next.eventDevelopmentModifier ?? 0) + (effects.development ?? 0);
  next.eventInjuryModifier = (next.eventInjuryModifier ?? 0) + (effects.injuryRisk ?? 0);
  next.careerDecisionScore = (next.careerDecisionScore ?? 0) + (effects.decisionScore ?? 0);

  if (effects.skillChanges) {
    for (const [key, delta] of Object.entries(effects.skillChanges)) {
      const skill = key as SkillKey;
      next.skills[skill] = clamp(next.skills[skill] + (delta ?? 0), 1, 99);
    }
  }
  if (effects.relationshipRole) {
    const character = next.characters?.find((item) => item.role === effects.relationshipRole);
    if (character) character.relationship = clamp(character.relationship + (effects.relationship ?? 0), 0, 100);
  }
  if (effects.personality) {
    next.personality ??= { professionalism: 50, loyalty: 50, humility: 50, teamFirst: 50, courage: 50, mediaComfort: 50 };
    for (const [key, delta] of Object.entries(effects.personality)) {
      const personalityKey = key as keyof NonNullable<Player['personality']>;
      next.personality[personalityKey] = clamp(next.personality[personalityKey] + (delta ?? 0), 0, 100);
    }
  }

  next.log.unshift({ season: next.season, age: next.age, kind: event.category === 'injury' ? 'injury' : 'event', text: `${event.title}: ${choice.label}.` });
  return next;
}

import type { Career, Decision, DecisionChoice, SkillKey } from '../game/types';
import { skillCap } from './overall';
import { CLUB_MAP } from '../data/clubs';
import { POSITION_MAP } from '../data/positions';
import { currentRole, roleRank } from './match';
import { addPack } from './cards';
import { clamp, chance, pick, uid, weightedPick } from './util';

interface Template {
  id: string;
  weight: number;
  when: (c: Career) => boolean;
  make: (c: Career) => { title: string; body: string; choices: DecisionChoice[] };
}

const club = (c: Career) => (c.player.contract ? CLUB_MAP[c.player.contract.clubId]?.name : 'the club') ?? 'the club';
const keySkill = (c: Career) => pick(POSITION_MAP[c.player.position].keySkills);

const TEMPLATES: Template[] = [
  {
    id: 'minutes', weight: 6,
    when: (c) => c.month >= 2 && c.month <= 10 && roleRank(currentRole(c)) <= 1 && !!c.player.contract,
    make: (c) => ({
      title: 'Stuck on the bench',
      body: `You've barely featured for ${club(c)}. Your agent says it's time to do something about it.`,
      choices: [
        { id: 'talk', label: 'Ask the manager what he needs', desc: 'Show you care. Trust +6.', effects: { trust: 6, morale: 2 } },
        { id: 'grind', label: 'Let your training do the talking', desc: 'Extra sessions: trust +10, fitness −12, +1 work rate.', effects: { trust: 10, fitness: -12, skills: { workRate: 1 } } },
        { id: 'leave', label: 'Tell your agent to find a way out', desc: 'Go on the transfer list. More offers next window, trust −12.', effects: { transferList: true, morale: 4 } },
      ],
    }),
  },
  {
    id: 'interview', weight: 5,
    when: (c) => c.player.form >= 7.1,
    make: () => ({
      title: 'The press wants you',
      body: 'After your recent form, a national paper asks for a big interview.',
      choices: [
        { id: 'humble', label: 'Credit the team', desc: 'Trust +4, reputation +1.', effects: { trust: 4, reputation: 1 } },
        { id: 'bold', label: '"I want to be the best in the world"', desc: 'Reputation +4, morale +4, trust −3.', effects: { reputation: 4, morale: 4, trust: -3 } },
        { id: 'skip', label: 'Decline politely', desc: 'Stay focused. Form +0.1.', effects: { form: 0.1 } },
      ],
    }),
  },
  {
    id: 'party', weight: 4,
    when: (c) => c.player.age >= 18 && c.player.age <= 30,
    make: () => ({
      title: 'Birthday party invite',
      body: 'A teammate is throwing a huge party two nights before a match.',
      choices: [
        { id: 'go', label: 'Go all night', desc: 'Morale +10, fitness −18, trust −6.', effects: { morale: 10, fitness: -18, trust: -6 } },
        { id: 'early', label: 'Show up, leave early', desc: 'Morale +4.', effects: { morale: 4 } },
        { id: 'rest', label: 'Stay home and rest', desc: 'Fitness +8, morale −2.', effects: { fitness: 8, morale: -2 } },
      ],
    }),
  },
  {
    id: 'extra', weight: 5,
    when: () => true,
    make: (c) => {
      const k = keySkill(c);
      return {
        title: 'Coach offers extra sessions',
        body: 'The assistant coach thinks one part of your game could take a jump with extra one-on-one work.',
        choices: [
          { id: 'yes', label: 'Every day after training', desc: `+2 ${k}, fitness −14.`, effects: { skills: { [k]: 2 }, fitness: -14, trust: 3 } },
          { id: 'some', label: 'Twice a week', desc: `+1 ${k}, fitness −5.`, effects: { skills: { [k]: 1 }, fitness: -5 } },
          { id: 'no', label: 'Protect your legs', desc: 'Fitness +6.', effects: { fitness: 6 } },
        ],
      };
    },
  },
  {
    id: 'sponsor', weight: 4,
    when: (c) => c.player.reputation >= 30,
    make: (c) => {
      const amt = Math.round((40_000 + c.player.reputation ** 2 * 900) / 1000) * 1000;
      return {
        title: 'A brand wants you',
        body: 'A sportswear brand offers a deal. It pays well, but the shoots eat into rest days.',
        choices: [
          { id: 'sign', label: 'Sign the big deal', desc: `+$${Math.round(amt / 1000)}K, fitness −6.`, effects: { money: amt, fitness: -6, reputation: 1 } },
          { id: 'charity', label: 'Do a charity campaign instead', desc: 'Reputation +3, morale +5.', effects: { reputation: 3, morale: 5 } },
          { id: 'no', label: 'Not now', desc: 'Nothing changes.', effects: {} },
        ],
      };
    },
  },
  {
    id: 'mentor', weight: 4,
    when: (c) => c.player.age <= 22,
    make: () => ({
      title: 'A veteran takes you under his wing',
      body: 'The club captain offers to mentor you through the season.',
      choices: [
        { id: 'learn', label: 'Absorb everything', desc: '+2 decisions, +1 leadership, trust +3.', effects: { skills: { decisions: 2, leadership: 1 }, trust: 3 } },
        { id: 'own', label: 'Thanks, but do it your way', desc: 'Morale +3.', effects: { morale: 3 } },
      ],
    }),
  },
  {
    id: 'rival', weight: 4,
    when: (c) => !!c.player.contract && c.month >= 1,
    make: () => ({
      title: 'A new signing in your position',
      body: 'The club just signed a player for your position. The dressing room is watching how you react.',
      choices: [
        { id: 'compete', label: 'Raise your level', desc: 'Trust +4, fitness −6, morale −2.', effects: { trust: 4, fitness: -6, morale: -2 } },
        { id: 'welcome', label: 'Welcome him warmly', desc: 'Morale +5, trust +2.', effects: { morale: 5, trust: 2 } },
        { id: 'complain', label: 'Complain to the board', desc: 'Trust −8, morale +2.', effects: { trust: -8, morale: 2 } },
      ],
    }),
  },
  {
    id: 'rehab', weight: 8,
    when: (c) => !!c.player.injury && c.player.injury.year === c.year && c.player.injury.untilDay - c.month * 30 > 12,
    make: (c) => ({
      title: 'Rehab plan',
      body: `The medical staff disagree on how to handle your ${c.player.injury!.name.toLowerCase()}.`,
      choices: [
        { id: 'fast', label: 'Aggressive rehab', desc: 'Back ~10 days sooner, but return at low fitness.', effects: { fitness: -25, form: -0.2, heal: 10 } },
        { id: 'careful', label: 'Follow the cautious plan', desc: 'Return fully fit. Morale −3.', effects: { fitness: 15, morale: -3 } },
      ],
    }),
  },
  {
    id: 'storm', weight: 3,
    when: (c) => c.player.reputation >= 45,
    make: () => ({
      title: 'Social media storm',
      body: 'An old post of yours resurfaces and fans are furious.',
      choices: [
        { id: 'sorry', label: 'Apologise immediately', desc: 'Reputation −1, trust +3.', effects: { reputation: -1, trust: 3 } },
        { id: 'ignore', label: 'Ignore it', desc: 'Reputation −3, morale −3.', effects: { reputation: -3, morale: -3 } },
        { id: 'fight', label: 'Fight back', desc: 'Reputation +1, morale −6, trust −4.', effects: { reputation: 1, morale: -6, trust: -4 } },
      ],
    }),
  },
  {
    id: 'tactic', weight: 4,
    when: (c) => !!c.player.contract,
    make: () => ({
      title: 'A new tactical role',
      body: 'The manager wants you to press harder and do more defensive work.',
      choices: [
        { id: 'yes', label: 'Buy in completely', desc: 'Trust +7, +1 work rate, +1 tackling.', effects: { trust: 7, skills: { workRate: 1, tackling: 1 } } },
        { id: 'no', label: 'Argue for your natural game', desc: 'Trust −5, morale +4.', effects: { trust: -5, morale: 4 } },
      ],
    }),
  },
  {
    id: 'camera', weight: 2,
    when: () => true,
    make: () => ({
      title: 'Documentary crew',
      body: 'A streaming platform wants to follow you for a month.',
      choices: [
        { id: 'yes', label: 'Let them in', desc: 'Get a Silver pack, reputation +2, morale −3.', effects: { pack: 'silver', reputation: 2, morale: -3 } },
        { id: 'no', label: 'Keep it private', desc: 'Morale +3.', effects: { morale: 3 } },
      ],
    }),
  },
  {
    id: 'charity', weight: 3,
    when: () => true,
    make: () => ({
      title: 'Charity match',
      body: 'Your old youth coach asks you to play in a charity match back home.',
      choices: [
        { id: 'play', label: 'Play', desc: 'Reputation +2, morale +6, fitness −8.', effects: { reputation: 2, morale: 6, fitness: -8 } },
        { id: 'donate', label: 'Donate instead', desc: '−$20K, reputation +1, morale +3.', effects: { money: -20_000, reputation: 1, morale: 3 } },
      ],
    }),
  },
  {
    id: 'derby', weight: 4,
    when: (c) => !!c.player.contract && c.month >= 2 && c.month <= 10,
    make: () => ({
      title: 'Derby week',
      body: 'The city is buzzing. Fans stop you in the street every day.',
      choices: [
        { id: 'embrace', label: 'Feed off the energy', desc: 'Form +0.3, fitness −5.', effects: { form: 0.3, fitness: -5 } },
        { id: 'calm', label: 'Stay calm and focused', desc: 'Trust +3.', effects: { trust: 3 } },
      ],
    }),
  },
  {
    id: 'scout', weight: 3,
    when: (c) => (c.month === 5 || c.month === 11) && c.player.form >= 6.9,
    make: () => ({
      title: 'Scouts in the stands',
      body: 'Your agent hears that bigger clubs are watching you before the window opens.',
      choices: [
        { id: 'flirt', label: 'Let it be known you\'re open', desc: 'More offers next window, trust −5.', effects: { transferList: true, trust: -5 } },
        { id: 'loyal', label: 'Publicly commit to the club', desc: 'Trust +8, morale +2.', effects: { trust: 8, morale: 2 } },
      ],
    }),
  },
];

export function rollDecision(c: Career): Decision | null {
  if (!c.player.contract || !chance(0.42)) return null;
  const pool = TEMPLATES.filter((t) => t.when(c));
  if (!pool.length) return null;
  const t = weightedPick(pool, (x) => x.weight);
  return { uid: uid('d'), id: t.id, ...t.make(c) };
}

export function retirementDecision(c: Career, forced: boolean): Decision {
  return {
    uid: uid('d'), id: 'retire',
    title: forced ? 'The final whistle' : 'Is this the end?',
    body: forced
      ? `At ${c.player.age}, your body has made the decision for you. It's time to hang up the boots.`
      : `You're ${c.player.age}. The legs are heavier and the season is over. Do you go again?`,
    choices: forced
      ? [{ id: 'retire', label: 'Retire', desc: 'End your career and see your legacy.', effects: { retire: true } }]
      : [
        { id: 'continue', label: 'One more season', desc: 'Keep playing.', effects: { morale: 4 } },
        { id: 'retire', label: 'Retire now', desc: 'End your career and see your legacy.', effects: { retire: true } },
      ],
  };
}

export function applyDecision(c: Career, d: Decision, choiceId: string): string[] {
  const ch = d.choices.find((x) => x.id === choiceId) ?? d.choices[0];
  const p = c.player;
  const e = ch.effects;
  const out: string[] = [];
  if (e.trust) p.trust = clamp(p.trust + e.trust, 0, 100);
  if (e.morale) p.morale = clamp(p.morale + e.morale, 0, 100);
  if (e.fitness) p.fitness = clamp(p.fitness + e.fitness, 5, 100);
  if (e.reputation) p.reputation = clamp(p.reputation + e.reputation, 0, 99);
  if (e.form) p.form = clamp(p.form + e.form, 4, 9.5);
  if (e.money) p.money += e.money;
  if (e.heal && p.injury) p.injury.untilDay -= e.heal;
  if (e.skills) for (const [k, v] of Object.entries(e.skills)) { const key = k as SkillKey; p.skills[key] = clamp(p.skills[key] + (v as number), 5, Math.max(p.skills[key], skillCap(p, key))); }
  if (e.pack) { addPack(c, e.pack, d.title); out.push(`Received a ${e.pack} pack`); }
  if (e.transferList) {
    if (d.id === 'minutes') p.trust = clamp(p.trust - 12, 0, 100);
    p.transferListed = true;
    out.push('You are now open to offers');
  }
  if (e.retire) c.retired = true;
  c.decisions = c.decisions.filter((x) => x.uid !== d.uid);
  c.log.unshift({ year: c.year, month: c.month, kind: 'info', text: `${d.title}: ${ch.label}` });
  return out;
}

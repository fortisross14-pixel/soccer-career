import type { CardDef, CardInstance, Career, PackTier, Rarity, SkillKey } from '../game/types';
import { CARD_DEFS, CARD_MAP, MAX_BOOSTS, MAX_HAND, MAX_STAFF, MAX_TRAITS, PACKS, RARITY_ORDER } from '../data/cards';
import { POSITION_MAP } from '../data/positions';
import { SKILL_MAP } from '../data/skills';
import { TRAIT_MAP } from '../data/traits';
import { addSkill, potentialOverall } from './overall';
import { adjTrust } from './trust';
import { clamp, rng, uid, weightedPick } from './util';

export function cardSkills(c: Career, def: CardDef): Partial<Record<SkillKey, number>> {
  const keys = POSITION_MAP[c.player.position].keySkills;
  if (def.id === 'sk-keyall') return Object.fromEntries(keys.map((k) => [k, 3]));
  if (def.id === 'bo-big') return Object.fromEntries(keys.map((k) => [k, 5]));
  if (def.id === 'bo-god') return Object.fromEntries(keys.map((k) => [k, 9]));
  return def.skills ?? {};
}

function cardWeight(c: Career, def: CardDef): number {
  const p = c.player;
  const cat = POSITION_MAP[p.position].category;
  if (def.positions && !def.positions.includes(cat)) return 0;
  if (def.maxAge && p.age > def.maxAge) return 0;
  switch (def.kind) {
    case 'skill': {
      const pos = POSITION_MAP[p.position];
      let w = 0;
      for (const k of Object.keys(def.skills ?? {}) as SkillKey[]) {
        if (SKILL_MAP[k].category === 'Goalkeeping' && p.position !== 'GK') return 0;
        w += (pos.weights[k] ?? 0) > 0 ? 2.2 + (pos.weights[k] ?? 0) * 10 : 0.7;
      }
      if (def.id === 'sk-keyall') w = 6;
      return w / Math.max(1, Object.keys(def.skills ?? {}).length * 0.7);
    }
    case 'boost': return 2.2;
    case 'recovery': return 2.4;
    case 'potential': return 1.6;
    case 'trait': return p.traits.includes(def.traitId!) ? 0 : 1.4;
    case 'staff': return p.staff.includes(def.id) ? 0.2 : 1;
  }
}

export function handLimit(c: Career) { return MAX_HAND + c.mods.handBonus; }
export function boostLimit(c: Career) { return MAX_BOOSTS + c.mods.extraBoosts; }
export function playsPerMonth(c: Career) { return 2 + c.mods.extraPlays; }
/** card plays that can be saved up: a quarter's worth */
export function playCap(c: Career) { return playsPerMonth(c) * 3; }
export function playsLeft(c: Career) { return Math.max(0, playCap(c) - c.cardsThisMonth); }

function rollRarity(tier: PackTier, luck: number): Rarity {
  const odds = PACKS[tier].odds;
  let r = rng() * (1 - Math.min(0.25, luck * 0.12));
  for (const rar of RARITY_ORDER) { r -= odds[rar]; if (r <= 0) return rar; }
  return 'common';
}

export function drawCard(c: Career, rarity: Rarity): CardDef {
  let idx = Math.min(RARITY_ORDER.indexOf(rarity), RARITY_ORDER.indexOf(c.mods.maxRarity ?? 'legendary'));
  while (idx >= 0) {
    const pool = CARD_DEFS.filter((d) => d.rarity === RARITY_ORDER[idx] && cardWeight(c, d) > 0);
    if (pool.length) return weightedPick(pool, (d) => cardWeight(c, d));
    idx--;
  }
  return CARD_MAP['re-ice'];
}

export function addPack(c: Career, tier: PackTier, reason: string) {
  const pk = { uid: uid('pk'), tier, reason };
  c.packs.push(pk);
  return pk;
}

export function openPack(c: Career, packUid: string): { cards: CardInstance[]; error?: string } {
  const idx = c.packs.findIndex((pk) => pk.uid === packUid);
  if (idx < 0) return { cards: [], error: 'Pack not found.' };
  const def = PACKS[c.packs[idx].tier];
  if (c.cards.length + def.size > handLimit(c)) return { cards: [], error: `Your hand is full (${handLimit(c)}). Use or sell some cards first.` };
  c.packs.splice(idx, 1);
  const out: CardInstance[] = [];
  const rarities = Array.from({ length: def.size }, () => rollRarity(def.tier, c.mods.luck));
  const g = RARITY_ORDER.indexOf(def.guarantee);
  if (!rarities.some((r) => RARITY_ORDER.indexOf(r) >= g)) rarities[0] = def.guarantee;
  rarities.sort((a, b) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b));
  for (const r of rarities) {
    const card = drawCard(c, r);
    const inst = { uid: uid('cd'), defId: card.id, isNew: true };
    c.cards.push(inst);
    out.push(inst);
  }
  return { cards: out };
}

export const SELL_VALUE: Record<Rarity, number> = { common: 3_000, rare: 12_000, epic: 45_000, legendary: 150_000 };

export function packPrice(c: Career, tier: PackTier): number {
  return Math.round(PACKS[tier].price * Math.pow(1.35, c.purchases));
}

export function buyPack(c: Career, tier: PackTier): string | null {
  const price = packPrice(c, tier);
  if (c.player.money < price) return 'Not enough money.';
  c.player.money -= price;
  c.purchases++;
  addPack(c, tier, 'Purchased');
  return null;
}

export function sellCard(c: Career, cardUid: string): number {
  const idx = c.cards.findIndex((x) => x.uid === cardUid);
  if (idx < 0) return 0;
  const def = CARD_MAP[c.cards[idx].defId];
  c.cards.splice(idx, 1);
  const v = SELL_VALUE[def.rarity];
  c.player.money += v;
  return v;
}

export function sellCards(c: Career, uids: string[]): number {
  let total = 0;
  for (const u of uids) total += sellCard(c, u);
  return total;
}

/** cards that can never be played in this career (too old, trait owned, POT maxed...) */
export function isDeadCard(c: Career, def: CardDef): boolean {
  const p = c.player;
  if (def.maxAge && p.age > def.maxAge) return true;
  if (def.kind === 'trait' && p.traits.includes(def.traitId!)) return true;
  if (def.kind === 'potential' && p.potential >= 1) return true;
  if (def.kind === 'staff' && p.staff.includes(def.id)) return true;
  return false;
}

export const MERGE_COST = 5;
export const MERGE_INTO: Partial<Record<PackTier, PackTier>> = { bronze: 'silver', silver: 'gold', gold: 'elite' };

/** trade 5 packs of one tier for 1 of the next tier up */
export function mergePacks(c: Career, tier: PackTier): string | null {
  const into = MERGE_INTO[tier];
  if (!into) return 'Elite packs are the top tier.';
  const same = c.packs.filter((x) => x.tier === tier);
  if (same.length < MERGE_COST) return `You need ${MERGE_COST} ${tier} packs.`;
  const used = new Set(same.slice(0, MERGE_COST).map((x) => x.uid));
  c.packs = c.packs.filter((x) => !used.has(x.uid));
  addPack(c, into, `Merged from ${MERGE_COST} ${tier}`);
  return null;
}

/** can this card be used right now? returns reason if not */
export function cardBlocker(c: Career, def: CardDef): string | null {
  const p = c.player;
  if (def.maxAge && p.age > def.maxAge) return `Only usable until age ${def.maxAge}.`;
  if (playsLeft(c) <= 0) return `No card plays left. Each month gives you ${playsPerMonth(c)} more.`;
  if (def.kind === 'boost' && p.boosts.length >= boostLimit(c)) return `All ${boostLimit(c)} boost slots are active.`;
  if (def.kind === 'staff' && p.staff.includes(def.id)) return 'Already on your staff.';
  if (def.kind === 'staff' && p.staff.length >= MAX_STAFF) return `Staff full (${MAX_STAFF}). Release someone first.`;
  if (def.kind === 'trait' && p.traits.includes(def.traitId!)) return 'You already have this trait.';
  if (def.kind === 'trait' && p.traits.length >= MAX_TRAITS) return `Maximum ${MAX_TRAITS} traits.`;
  if (def.kind === 'recovery' && def.heal && !def.fitness && !p.injury) return 'You are not injured.';
  if (def.kind === 'potential' && p.potential >= 1) return 'Potential already maxed.';
  return null;
}

export function playCard(c: Career, cardUid: string): { ok: boolean; msg: string } {
  const idx = c.cards.findIndex((x) => x.uid === cardUid);
  if (idx < 0) return { ok: false, msg: 'Card not found.' };
  const def = CARD_MAP[c.cards[idx].defId];
  const blocker = cardBlocker(c, def);
  if (blocker) return { ok: false, msg: blocker };
  const p = c.player;
  const parts: string[] = [];
  const before = { ...p.skills };

  switch (def.kind) {
    case 'skill': {
      let wasted = 0;
      for (const [k, v] of Object.entries(cardSkills(c, def)) as [SkillKey, number][]) {
        const ageF = p.age > p.peakEnd ? 0.5 : p.age >= 30 ? 0.75 : 1;
        const got = addSkill(p, k, v * ageF);
        wasted += v * ageF - got;
        if (got > 0.01) parts.push(`+${Math.round(got * 10) / 10} ${SKILL_MAP[k].label}`);
      }
      if (wasted > 0.05) parts.push(`${Math.round(wasted * 10) / 10} lost: your overall is at your POT. Raise Potential to keep growing`);
      break;
    }
    case 'boost': {
      p.boosts.push({ uid: uid('b'), defId: def.id, name: def.name, skills: cardSkills(c, def), matchesLeft: def.matches ?? 3 });
      parts.push(`${def.name} active for ${def.matches} matches`);
      break;
    }
    case 'recovery': {
      if (def.fitness) { p.fitness = clamp(p.fitness + def.fitness, 0, 100); parts.push(`+${def.fitness} fitness`); }
      if (def.morale) { p.morale = clamp(p.morale + def.morale, 0, 100); parts.push(`+${def.morale} morale`); }
      if (def.trust) { adjTrust(c, def.trust, def.name); parts.push(`+${def.trust} trust`); }
      if (def.reputation) { p.reputation = clamp(p.reputation + def.reputation, 0, 99); parts.push(`+${def.reputation} reputation`); }
      if (def.heal && p.injury) {
        p.injury.untilDay -= def.heal;
        if (p.injury.untilDay <= c.month * 30) { parts.push(`${p.injury.name} healed`); p.injury = null; }
        else parts.push(`injury shortened by ${def.heal} days`);
      }
      break;
    }
    case 'potential': {
      const before = potentialOverall(p);
      p.potential = clamp(p.potential + (def.potential ?? 0), 0.3, Math.max(1, p.potential));
      if (def.id === 'po-2') p.peakEnd += 1;
      parts.push(`POT ${before} → ${potentialOverall(p)}`);
      break;
    }
    case 'trait': {
      p.traits.push(def.traitId!);
      for (const [k, v] of Object.entries(def.skills ?? {}) as [SkillKey, number][]) addSkill(p, k, v);
      parts.push(`Trait unlocked: ${TRAIT_MAP[def.traitId!]?.name ?? def.name}`);
      break;
    }
    case 'staff': {
      p.staff.push(def.id);
      parts.push(`${def.name} joined your team`);
      break;
    }
  }
  c.cards.splice(idx, 1);
  c.cardsThisMonth++;
  const gained: Partial<Record<SkillKey, number>> = {};
  for (const k of Object.keys(p.skills) as SkillKey[]) { const d = p.skills[k] - before[k]; if (Math.abs(d) > 0.01) gained[k] = d; }
  (c.monthCards ??= []).push({ name: def.name, msg: parts.join(' · '), skills: gained });
  c.log.unshift({ year: c.year, month: c.month, kind: 'card', text: `Played ${def.name}: ${parts.join(', ')}` });
  return { ok: true, msg: parts.join(' · ') || 'Card used.' };
}

export function releaseStaff(c: Career, id: string) {
  c.player.staff = c.player.staff.filter((s) => s !== id);
}

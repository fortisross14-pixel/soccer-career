// Headless balance harness: auto-plays careers with a simple AI and prints
// distributions. Run with `npm run sim [count]`.
import { createCareer, NO_SETUP, type CareerSetup } from '../src/engines/career';
import { playMonth, finalizeRetirement } from '../src/engines/month';
import { acceptOffer } from '../src/engines/market';
import { openPack, playCard, cardBlocker, sellCard } from '../src/engines/cards';
import { applyDecision } from '../src/engines/decisions';
import { playerGrade } from '../src/engines/awards';
import { playerOverall, potentialOverall } from '../src/engines/overall';
import { roleRank } from '../src/engines/match';
import { seedRng } from '../src/engines/util';
import { CARD_MAP } from '../src/data/cards';
import { CLUB_MAP } from '../src/data/clubs';
import { POSITIONS } from '../src/data/positions';
import { COUNTRIES } from '../src/data/countries';
import type { Career } from '../src/game/types';

const N = Number(process.argv[2] ?? 200);
// progression stages: what a profile typically owns after N careers
const PROFILES: Record<string, CareerSetup> = {
  fresh: NO_SETUP,
  run2: { upgrades: {}, relics: ['socks'], cardTier: 'rare' },
  run6: { upgrades: { slots: 2, academy: 1, gifted: 2, scouting: 1, kit: 1 }, relics: ['diploma', 'socks', 'shinpads'], cardTier: 'epic' },
  run10: { upgrades: { slots: 2, academy: 2, gifted: 2, scouting: 1, kit: 2, body: 1, binder: 1, agent: 1 }, relics: ['gene', 'talent', 'diploma'], cardTier: 'legendary' },
  run15: { upgrades: { slots: 2, academy: 3, scouting: 2, gifted: 3, kit: 3, body: 2, binder: 2, luck: 2, agent: 1, fame: 1, longevity: 1 }, relics: ['feet', 'chosen', 'gene'], cardTier: 'legendary' },
};
const profArg = process.argv.find((a) => a.startsWith('--profile='))?.split('=')[1] ?? (process.argv.includes('--maxed') ? 'run15' : 'fresh');
const SETUP: CareerSetup = PROFILES[profArg] ?? NO_SETUP;

function manageCards(c: Career) {
  for (const pk of [...c.packs]) openPack(c, pk.uid);
  for (const card of [...c.cards]) {
    const def = CARD_MAP[card.defId];
    if (def.kind === 'recovery' && def.heal && !c.player.injury) continue;
    if (def.kind === 'recovery' && def.fitness && c.player.fitness > 75) continue;
    if (def.kind === 'boost' && c.player.boosts.length >= 2) continue;
    if (!cardBlocker(c, def)) playCard(c, card.uid);
  }
  while (c.cards.length > 15) sellCard(c, c.cards[0].uid);
}

function manageMarket(c: Career) {
  const p = c.player;
  if (!c.academy && !p.contract && c.offers.some((o) => o.kind === 'academy')) {
    const good = [...c.offers].filter((o) => roleRank(o.role) >= 2).sort((a, b) => CLUB_MAP[b.clubId].rating - CLUB_MAP[a.clubId].rating)[0] ?? c.offers[0];
    acceptOffer(c, good.uid); return;
  }
  if (c.academy) {
    const parentR = CLUB_MAP[c.academy.clubId].rating;
    const pro = c.offers.filter((o) => o.kind !== 'academy' && (roleRank(o.role) >= 2 || (o.kind === 'promotion' && p.age >= 18) || p.age >= 19)).sort((a, b) => CLUB_MAP[b.clubId].rating - CLUB_MAP[a.clubId].rating)[0];
    if (pro && p.age >= 17) { acceptOffer(c, pro.uid); return; }
    const acad = c.offers.find((o) => o.kind === 'academy' && CLUB_MAP[o.clubId].rating > parentR && roleRank(o.role) >= 2);
    if (acad) acceptOffer(c, acad.uid);
    return;
  }
  const cur = p.contract ? CLUB_MAP[p.contract.clubId].rating : 0;
  const ranked = [...c.offers].sort((a, b) => (roleRank(b.role) >= 2 ? 1 : 0) - (roleRank(a.role) >= 2 ? 1 : 0) || CLUB_MAP[b.clubId].rating - CLUB_MAP[a.clubId].rating);
  const best = ranked.find((o) => o.kind !== 'renewal' && roleRank(o.role) >= 2 && CLUB_MAP[o.clubId].rating >= cur + 3);
  if (best) { acceptOffer(c, best.uid); return; }
  const ren = c.offers.find((o) => o.kind === 'renewal');
  if (ren) { acceptOffer(c, ren.uid); return; }
  if (!p.contract && ranked.length) acceptOffer(c, ranked[0].uid);
}

function run(i: number) {
  const pos = POSITIONS[i % POSITIONS.length].key;
  const country = COUNTRIES[i % COUNTRIES.length].name;
  const c = createCareer(`Sim ${i}`, country, pos, SETUP, 1000 + i);
  seedRng(c.rng);
  let guard = 0;
  while (!c.retired && guard++ < 500) {
    manageCards(c);
    manageMarket(c);
    while (c.decisions.length) {
      const d = c.decisions[0];
      const retire = d.id === 'retire' && (playerOverall(c.player) < 72 || c.player.age >= 37);
      applyDecision(c, d, retire ? 'retire' : d.choices[0].id === 'leave' ? d.choices[1].id : d.choices[0].id);
    }
    if (c.retired) { finalizeRetirement(c); break; }
    if (!c.player.contract && !c.academy) { manageMarket(c); if (!c.player.contract && !c.academy) break; }
    playMonth(c);
  }
  return c;
}

const pct = (arr: number[], q: number) => [...arr].sort((a, b) => a - b)[Math.floor(q * (arr.length - 1))];
const dist = (arr: number[]) => ({ p10: pct(arr, 0.1), p25: pct(arr, 0.25), med: pct(arr, 0.5), p75: pct(arr, 0.75), p90: pct(arr, 0.9), max: Math.max(...arr) });

const t0 = Date.now();
const careers = Array.from({ length: N }, (_, i) => run(i));
console.log(`[${profArg}]`);
console.log(`${N} careers in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('peak OVR', dist(careers.map((c) => c.peakOvr)));
console.log('POT at end', dist(careers.map((c) => potentialOverall(c.player))));
console.log('retire age', dist(careers.map((c) => c.player.age)));
console.log('career apps', dist(careers.map((c) => c.totals.apps)));
const st = careers.filter((c) => c.player.position === 'ST');
console.log('ST career goals', dist(st.map((c) => c.totals.goals)));
console.log('ST best season goals', dist(st.map((c) => Math.max(0, ...c.history.map((h) => h.goals)))));
const am = careers.filter((c) => c.player.position === 'AM' || c.player.position === 'W');
console.log('AM/W best season assists', dist(am.map((c) => Math.max(0, ...c.history.map((h) => h.assists)))));
console.log('season apps (age 24-29)', dist(careers.flatMap((c) => c.history.filter((h) => h.age >= 24 && h.age <= 29).map((h) => h.apps))));
console.log('avg rating (age 24-29)', dist(careers.flatMap((c) => c.history.filter((h) => h.age >= 24 && h.age <= 29).map((h) => h.avgRating))));
console.log('caps', dist(careers.map((c) => c.totals.caps)), 'reached NT', Math.round(careers.filter((c) => c.totals.caps > 0).length / N * 100) + '%');
const count = (label: string) => careers.reduce((s, c) => s + [...c.honors.individual, ...c.honors.club, ...c.honors.national].filter((h) => h.label.includes(label)).reduce((x, h) => x + h.count, 0), 0);
console.log("Ballon d'Or", count("Ballon"), 'Golden Boot', count('Golden Boot'), 'League titles', count('Title'), 'World Cup', count('World Cup Winner'), 'Continental', count('Winner') - count('World Cup Winner'));
const tiers: Record<string, number> = {};
careers.forEach((c) => { const t = c.legacy?.tier ?? 'none'; tiers[t] = (tiers[t] ?? 0) + 1; });
console.log('legacy', tiers);
const grades: Record<string, number> = {};
careers.forEach((c) => { const g = playerGrade(c).letter; grades[g] = (grades[g] ?? 0) + 1; });
console.log('grades', JSON.stringify(grades));
console.log('legacy coins per career', dist(careers.map((c) => c.coinsEarned)), 'milestones', dist(careers.map((c) => c.milestones.length)));
console.log('reached top flight', Math.round(careers.filter((c) => c.bestDiv === 1).length / N * 100) + '%', 'best tier', dist(careers.map((c) => c.bestDiv)), 'golden boots any', careers.filter((c) => c.milestones.includes('boot1')).length);
const top5 = careers.filter((c) => ['England','Spain','Italy','Germany','France'].includes(c.player.country));
console.log('TOP-5 countries: reached top flight', Math.round(top5.filter((c) => c.bestDiv === 1).length / top5.length * 100) + '%', 'reached 2nd tier', Math.round(top5.filter((c) => c.bestDiv <= 2).length / top5.length * 100) + '%', 'best club', dist(top5.map((c) => Math.max(0, ...c.history.filter((h) => !h.youth).map((h) => Object.values(CLUB_MAP).find((x) => h.clubs.includes(x.name))?.rating ?? 0)))));
console.log('turned pro at age', dist(careers.map((c) => c.history.find((h) => !h.youth)?.age ?? 99)), 'promoted from own academy', Math.round(careers.filter((c) => c.log.some((l) => l.text.startsWith('Promoted from the academy'))).length / N * 100) + '%');
console.log('ballon top-10 finishes per career', (careers.reduce((s, c) => s + c.awardsHistory.filter((a) => (a.myBallonRank ?? 99) <= 10).length, 0) / N).toFixed(2), 'world ballon winners distinct', new Set(careers[0].awardsHistory.map((a) => a.ballon[0]?.name)).size, 'of', careers[0].awardsHistory.length);
{ const lab: Record<string, number> = {}; careers.forEach((c) => c.honors.individual.forEach((h) => { const k = h.label.replace(/^.*?(Golden Boot|Player of the Season|Best Goalkeeper|Best Defender|Best Midfielder|Best Forward|Top Scorer|Best Player|Golden Ball|Ballon d'Or|Team of the Season|Young Player of the Season|Playmaker|World Golden Glove|World Defender of the Year)$/, '$1'); lab[k] = (lab[k] ?? 0) + h.count; })); console.log('award labels per career', Object.fromEntries(Object.entries(lab).map(([k, v]) => [k, +(v / N).toFixed(2)]))); }
console.log('youth awards per career', (careers.reduce((a, c) => a + c.honors.individual.filter((h) => /^U\d\d/.test(h.label)).reduce((x, h) => x + h.count, 0), 0) / N).toFixed(2), 'senior MVP', (careers.reduce((a, c) => a + c.honors.individual.filter((h) => !/^U\d\d/.test(h.label) && h.label.endsWith('Player of the Season') && !h.label.startsWith('Young')).reduce((x, h) => x + h.count, 0), 0) / N).toFixed(2));
console.log('promoted ever', Math.round(careers.filter((c) => c.milestones.includes('promo1')).length / N * 100) + '%');
console.log('money at end', dist(careers.map((c) => Math.round(c.player.money / 1e6))), '($M)');
const clubsMax = careers.map((c) => Math.max(...c.history.filter((h) => !h.youth).map((h) => CLUB_MAP[Object.values(CLUB_MAP).find((x) => h.clubs.includes(x.name))?.id ?? '']?.rating ?? 0)));
console.log('best club rating', dist(clubsMax));
const ex = careers.find((c) => c.player.position === 'ST' && c.peakOvr >= 80) ?? careers[0];
console.log(`\nExample: ${ex.player.name} ${ex.player.position} ${ex.player.stars}★`);
for (const h of ex.history) console.log(`  ${h.year} age ${h.age} ${h.clubs.padEnd(28)} ovr ${h.ovrStart}->${h.ovrEnd} apps ${h.apps} (${h.starts} st) g ${h.goals} a ${h.assists} avg ${h.avgRating} pos ${h.leaguePos} ${[...h.honors, ...h.awards].join(', ')}`);

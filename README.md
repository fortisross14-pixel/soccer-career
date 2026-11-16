# The Eleventh ⚽

A football career simulator. Turn pro at 17 and live your career **one month at a
time**: every fixture is simulated and gets its own match report, card packs are your
main way to grow, and transfer windows bring offers, renewals, loans and negotiation.
Built with **Vite + React + TypeScript**, deployed to **GitHub Pages**.

> v2 is a ground-up rebuild of the core loop. v1 saves are not migrated.

## Run it

```bash
npm install
npm run dev        # local dev
npm run build      # typecheck + production build
npm run sim [n]    # headless balance test (auto-plays n careers, default 200)
```

## The loop

Each turn is one month (July → June). Pressing **Play {month}**:

1. Plays every fixture that month in date order (league rounds, domestic cup,
   continental competition, international breaks, summer tournaments). The other
   league games are simulated too, so the table is real.
2. For each of your matches: squad selection (start / bench / dropped) based on your
   role, form, fitness and manager trust; then a match sim with goals, assists, a rating,
   position-specific stats, Man of the Match, injuries and a minute-by-minute timeline.
3. Monthly development: attributes grow toward per-skill ceilings set by Potential,
   scaled by minutes, club coaching, training focus and intensity. After your prime they decline.
4. Rewards: a monthly training pack, plus packs for MOTM, big months, Player of the
   Month, awards, trophies and milestones.
5. Wages, staff costs, reputation, morale and trust update. May closes the league
   season (titles, awards, continental qualification). June hosts the World Cup or
   continental tournament, then the Ballon d'Or and the season rollover.

**Sim to next event** plays months until something needs you: a decision, a transfer
window, the season ending, or a pile of unopened packs.

## Systems

| System | Where | Notes |
|---|---|---|
| Calendar & fixtures | `engines/calendar.ts` | 30-day months, round-robin leagues (~30–34 matchdays), cup and continental knockouts, international breaks |
| Match engine | `engines/match.ts` | Poisson goals from team ratings + your influence; per-position goal/assist shares; ratings, stats, timeline |
| Month orchestration | `engines/month.ts` | `beginMonth` (windows, call-ups, decisions) / `playMonth` / season rollover |
| Growth | `engines/growth.ts` | ~60% of growth is natural; the rest comes from cards |
| Cards & packs | `engines/cards.ts`, `data/cards.ts` | Training (permanent), boosts (N matches), recovery, potential, traits, staff (monthly cost). Skill cards stop at your ceilings and weaken with age |
| Market | `engines/market.ts` | July/January windows, renewals when ≤1 year left, loans for young fringe players, negotiate wage/role/years (clubs may refuse or walk away), promised roles |
| Decisions | `engines/decisions.ts` | Contextual events with trade-offs (bench frustration, press, rehab, sponsors, etc.) and retirement |
| National team | `engines/national.ts` | Call-ups per break; group + knockout summer tournaments |
| Awards & legacy | `engines/awards.ts` | League awards vs scaled thresholds, Ballon d'Or, legacy tiers |

All randomness goes through a seeded RNG (`engines/util.ts`) whose state is stored in
the save, so reloading doesn't re-roll outcomes and `npm run sim` is reproducible.

## Balance: the progression curve

`npm run sim [n] --profile=fresh|run2|run6|run10|run15` auto-plays careers with the upgrades and trinkets a
profile typically owns at that stage. Current medians (160 careers each):

| Profile | Peak OVR | Best club | National team | Grades |
|---|---|---|---|---|
| fresh (run 1) | 61 | 66 (top of a 2nd tier) | 16% | 87% D |
| run 2 (1 common trinket) | 64 | 68 | 21% | mostly D, some C |
| run 6 (3 slots, 1 uncommon) | 78 | 83 (mid-table top league) | 91% | mostly B |
| run 10 (rare + epic) | 87 | 90 (top club) | regular | 71% A |
| run 15 (epic + legendaries) | 96 | 90 | regular | 100% S, ~5 Ballon d'Ors |

### Older v2 numbers (before the three-tier pyramid)

| metric | p25 | median | p75 | p90 |
|---|---|---|---|---|
| peak overall | 70 | 73 | 79 | 86 |
| season apps (age 24–29) | 30 | 37 | 43 | 45 |
| avg rating (age 24–29) | 6.57 | 6.80 | 7.05 | 7.36 |
| best season goals (ST) | 19 | 27 | 43 | 47 |

About half of careers reach the national team, about 1 Ballon d'Or per 7 careers, and
about 20% end as Legend or better.

## Roguelike meta-progression

- **Legacy coins** are a profile currency, separate from career money. They come from once-per-career
  milestones (first pro contract, first goal, first continental match, international debut, promotion,
  first trophy, Ballon d'Or…) plus small repeat rewards for goals, assists, clean sheets, MOTMs, trophies
  and awards, and a payout at retirement based on legacy score (`engines/coins.ts`).
- The main menu has a **Legacy shop** with permanent, levelled upgrades (trinket slots, starting attributes,
  minimum prospect stars, POT, starter packs, injury resistance, bigger hand and more card plays, pack luck,
  agent, reputation, longevity) and **Crates** (Kit Bag, Trophy Case, Legend Chest) that drop **trinkets**.
- **Trinkets** are permanent collectibles in five rarities (common, uncommon, rare, epic, legendary), and
  power scales with rarity. You start with 1 slot and can unlock up to 3. Slotted trinkets carry over
  between careers, and duplicate pulls refund 40% of the crate cost (`data/legacy.ts`, `game/meta.ts`).
- Every retired player gets an **S/A/B/C/D grade** from peak level and legacy.
- Each month has a **Training ground ↔ Match day** slider: growth vs match rating, involvement, scout
  interest, injury load and recovery. You can play 2 cards per month (more with upgrades).
- **Promotion & relegation** run every season across your country's pyramid (`engines/world.ts`). The top-5
  leagues (England, Spain, Italy, Germany, France) have three divisions; every other country has two
  (now including Ecuador and Greece). Every career starts at a club in the bottom division.
- **Golden Boot race:** each league has a live top-scorer table with rival forwards; finish top to win it,
  in any division.
- **Career finale:** retiring shows your totals, best season, season-by-season table and every milestone
  broken, with the ones achieved for the first time on your profile highlighted.
- Visual style: **Terrace** (matchday stickers, scarves, pitch stripes), with ticker-tape, sticker-slap
  goal celebrations, pack tearing and coin toasts (`components/FxLayer.tsx`).

## Known gaps / next steps

- Competition leaderboards (top scorers, Ballon d'Or race, best by year, most titles) are not built yet.
- Teammates and opponents are generated names, not persistent squads.
- Card catalogue and decision pool are a first pass and need more content.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (GitHub Pages, base `/soccer-career/`).

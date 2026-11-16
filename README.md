# The Eleventh ⚽

A football career roguelike. Join an academy at 11, turn pro, and live your career **one month at a
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

## Academy years

Careers start at **11**. Your prospect quality decides which academies want you (better academies coach
better, but you play less if you're not good enough). You play a youth league each season, and
"Sim season" keeps these years quick. You leave the academy when:
- a bigger academy scouts you (before 16, summer window),
- your club promotes you to its first team, or another club offers a pro contract (from 16, July/January), or
- you turn **20**, when you must sign for a professional club.

## Roguelike meta-progression

- **Card quality unlocks by completed careers:** common only on your first run, rare after 1 career,
  epic after 3, legendary after 6. Higher rarities in packs drop to your unlocked cap.

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

## Competitions & award races

The **Competitions** tab has a sub-tab for every competition you're in this season: league (including
youth leagues), domestic cup, continental competition and national team. Each has **award races** with
about 6 rivals and your own row, even when you're outside the top 5:
- league: Golden Boot, Player of the Season (MVP), Best Goalkeeper / Defender / Midfielder / Forward
- cup: top scorer; continental: top scorer and best player; summer tournament: Golden Boot and Golden Ball

Rivals' season totals are fixed in advance and revealed as the season goes. Races can be runaway wins,
normal, or very tight (`engines/races.ts`). Rating awards need a minimum number of rated games.

## Player screen

Player has **Skills**, **Stats** and **Career** sub-tabs. Stats shows matches, minutes, goals, assists
and position stats with totals and per-90 values (season vs career, for all matches, club or national
team). Pick any stat to chart it month by month this season or season by season across the career.

## The football world

About 45 persistent fictional **world stars** age, develop, change clubs, score, win titles and retire
around you (`engines/stars.ts`). Every season they feed:
- the league **Golden Boot race** and the **continental top-scorer race**, both with your rank,
- the **Ballon d'Or vote** (live provisional standings, decided in June), **World Golden Glove** and
  **World Defender of the Year**, where you compete with them on equal terms,
- **awards by year** (winners, your Ballon rank, league and continental champions), and
- **all-time leaders** for titles, goals and Ballon d'Ors, with retired stars kept in the record.

The Career tab also tracks your international career season by season, including how far you went at
each World Cup or continental championship.

## Known gaps / next steps
- Teammates and opponents are generated names, not persistent squads.
- Card catalogue and decision pool are a first pass and need more content.

## Saves & compatibility

Saves live in `localStorage` (`xi2_save_N`, profile in `xi2_meta`). Old saves must keep working after every update:

- `src/game/migrate.ts` fills in any field an old save is missing by comparing it with a freshly generated career,
  so new features don't need a hand-written migration for each field (whole new objects still get a default in `loadSlot`).
- Opening a save copies it to `xi2_backup_N`; a deleted or broken slot can be restored from the home screen.
  Saves can also be downloaded as a file and imported again.
- A crash on any screen shows a "your career is safe" screen instead of a blank page.
- `tests/save-fixtures/` holds saves written by every past release (early and late in a career, four positions).
  `npm run test:saves` loads each with the current code and plays two seasons; `npm run test:saves-ui` opens them in the
  built game, visits every tab and plays a month. Both run in the deploy workflow, so a build that breaks old saves never ships.
- After each release, add its saves: `npm run fixtures -- <short-commit-hash>`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (GitHub Pages, base `/soccer-career/`).

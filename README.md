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

## Balance (200 auto-played careers)

| metric | p25 | median | p75 | p90 |
|---|---|---|---|---|
| peak overall | 70 | 73 | 79 | 86 |
| season apps (age 24–29) | 30 | 37 | 43 | 45 |
| avg rating (age 24–29) | 6.57 | 6.80 | 7.05 | 7.36 |
| best season goals (ST) | 19 | 27 | 43 | 47 |

About half of careers reach the national team, about 1 Ballon d'Or per 7 careers, and
about 20% end as Legend or better.

## Known gaps / next steps

- No promotion or relegation: club divisions are static data.
- Teammates and opponents are generated names, not persistent squads.
- Card catalogue and decision pool are a first pass and need more content.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (GitHub Pages, base `/soccer-career/`).

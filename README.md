# The Eleventh ⚽

A *BitLife-for-football* career simulator. Create a 15-year-old academy prospect
and live one season at a time — train, sign for clubs, chase trophies, break into
the national team, win individual awards, and retire into the Hall of Fame with a
legacy score. Built with **Vite + React + TypeScript**, deployed to **GitHub Pages**.

This is a full rewrite of an earlier single-file HTML prototype (`v6c`), restructured
into a documents + engines architecture and rebalanced.

## Run it

```bash
npm install
npm run dev        # local dev
npm run build      # typecheck + production build
npm run preview    # serve the build
npm run sim        # headless balance test (400 auto-played careers)
npm run inspect    # dump the best career per position
```

## Architecture

The game separates **data documents** (what exists in the world) from **engines**
(the rules that operate on it) from **UI** (React components). Nothing in the UI
computes game logic — it only reads state and calls engine-backed store actions.

```
src/
  data/            # DOCUMENTS — pure data, no logic
    skills.ts        18 attributes, grouped + age-curve tagged
    positions.ts     8 positions: skill weights, key skills, goal/assist expectations
    countries.ts     leagues, reputation, national-team strength, confederation
    clubs.ts         ~110 clubs with rating / tier / prestige / wages / continental spot
    traits.ts        signature traits (position-gated)
    events.ts        age-banded life events
    awards.ts        award catalogue (Ballon d'Or, Golden Boot, TOTY, ...)
    tournaments.ts   continental + international competition cycles

  engines/         # RULES — pure functions, no React
    overall.ts       weighted overall from skills + position + age
    progression.ts   yearly skill growth toward a hidden potential ceiling; peak & decline
    season.ts        squad role, appearances, goals/assists, rating, league finish, trophies
    awards.ts        individual awards vs league-derived thresholds; reputation
    national.ts      call-ups, caps, World Cup / continental cycles
    transfers.ts     market value, offer generation, wages
    legacy.ts        retirement legacy score + tier
    newgame.ts       starting-player generator

  game/            # STATE + ORCHESTRATION
    types.ts         all domain + runtime types
    engine.ts        advanceYear() — runs the whole yearly loop through the engines
    store.tsx        React context; actions persist to localStorage
    save.ts          save slots + Hall of Fame persistence

  components/      # UI — reads state, renders, calls store actions
    Home, Game, YearSummary, ui, tabs/{Summary,Skills,Actions,Career,Honors,Timeline}
```

### The yearly loop (`engine.advanceYear`)
1. random life event -> 2. teenage trait unlock -> 3. club season (`season.ts`) ->
4. individual awards (`awards.ts`) -> 5. national team (`national.ts`) ->
6. record honors -> 7. totals / reputation / money -> 8. skill progression
(`progression.ts`) -> 9. contract & aging -> 10. fresh transfer offers ->
11. retirement checks. Each step returns a recap shown in the season modal.

## What was broken in the prototype (and fixed)

- **`searchClubs`, `getTeamQuality`, `getTeamTier` were called but never defined** —
  club search did nothing and advancing a year with a club threw a `ReferenceError`.
  Replaced with first-class `ClubDef` objects and a real transfer engine.
- **Squad `role` was never assigned** (`"youth"` at birth, never updated), so the
  season sim always fell through to the "few minutes" branch — nobody ever got real
  games. Role is now derived every season from your overall vs the club's rating.
- **Overall multiplied the weighted skill average by hidden `potential` (0.78-1.4)**,
  so potential dominated the rating and double-counted age. Overall is now a clean
  position-weighted skill average with a youth-maturity adjustment; potential is a
  *hidden ceiling on skill growth*, not a score multiplier.
- Hall-of-Fame "trophies" sort and country/league comparisons were stubbed/duplicated;
  `alert()`-driven flow replaced with an in-game recap modal and a career timeline.

## Balance

`npm run sim` auto-plays 400 optimal careers. Current distribution (optimal play):

| metric | p25 | median | p75 | p90 | max |
|---|---|---|---|---|---|
| peak overall | 67 | 72 | 80 | 85 | 95 |
| career goals | 14 | 36 | 78 | 134 | 438 |

Ballon d'Or ~ 1.5% of even optimal careers (generational), Golden Boots occasional,
~55% reach the national team. Goalkeepers score ~0 career goals; deep playmakers post
huge assist totals; center-backs score from set pieces — archetypes hold.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml` (GitHub Pages). Set the repo
name to `soccer-career` or update `base` in `vite.config.ts` to match. Enable Pages ->
Source: GitHub Actions.

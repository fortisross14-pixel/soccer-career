# Notes for working on this repo

- After every change: commit, push the working branch, then fast-forward `main` (`git push origin HEAD:main`) so the
  GitHub Pages build is live before replying.
- Old saves must never break. Before pushing, run `npm run test:saves` and `npm run test:saves-ui`; both must pass.
  After pushing a release, add its fixtures with `npm run fixtures -- <short-commit-hash>` and commit them.
- New fields on `Career` (or anything inside it) are filled automatically for old saves by `src/game/migrate.ts`.
  A new nullable object field (`foo: X | null`) needs an explicit default in `loadSlot` in `src/game/save.ts`.
- Don't change overall balance unless asked; check with `npm run sim [n] --profile=fresh|run10`.
- Storage goes through `src/game/storage.ts` (IndexedDB, localStorage fallback). Never call `localStorage` directly:
  the github.io origin is shared with many other games and its localStorage is usually full.

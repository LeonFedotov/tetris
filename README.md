# tetris

Tetris in the browser, for desktop and mobile. React, TypeScript and Tailwind, built with Vite.

Play it at <https://leonfedotov.github.io/tetris/>.

The rules are ported from the ODROID-SHOW2 firmware (`iot/show2-tetris`): SRS rotation states with simple wall kicks, NES scoring and gravity, and a 7-bag randomizer. The 2014 jQuery version is kept in `old/`.

## Controls

| Keyboard | Touch | Action |
|---|---|---|
| ← → or A D | ◀ ▶ | Move (hold to repeat) |
| ↑ W X | ⟳ | Rotate clockwise |
| Z | | Rotate counter-clockwise |
| ↓ S | ▼ | Soft drop (hold), 1 point per row |
| Space | ⤓ | Hard drop, 2 points per row |
| P Esc | Pause button | Pause / resume |
| Enter | | Start / resume |

The game pauses when the tab or app goes to the background. The best score is kept in `localStorage`.

## Layout

- `src/game/tetris.ts`: the rules. Pure functions over immutable values.
- `src/game/session.ts`: title / playing / paused / over and the best score, as a reducer.
- `src/useTetris.ts`: gravity timer, keyboard, held-key repeat, persistence.
- `src/components/`: board, panels and on-screen touch controls.

## Develop

Needs Node 24 or newer and pnpm.

```sh
pnpm install
pnpm dev         # http://localhost:5173
pnpm typecheck
pnpm lint
pnpm test
pnpm build       # into dist/
```

## Deploy

`.github/workflows/deploy.yml` checks, tests and builds every push and pull request, and deploys `master` to GitHub Pages. Pages must be set to build from GitHub Actions (Settings → Pages → Source).

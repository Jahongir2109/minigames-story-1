# MiniGames — Story 1

Home page and authentication dialog for **MiniGames**, a cozy indie games platform, built
for the [RS School Qualifying Stage — MiniGames, Story 1](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-1.md)
task.

## Live demo

[minigames-story-1.vercel.app](https://minigames-story-1.vercel.app)

## Tech stack

- [Vite](https://vitejs.dev/) — dev server & bundler
- TypeScript (strict mode, no `any`)
- Sass (design tokens, breakpoint mixins, BEM-ish component styles)
- Vanilla DOM — no UI framework, no CSS framework, no third-party carousel/slider library
- ESLint + Prettier + Husky + lint-staged

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
```

## Scripts

| Script                 | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the Vite dev server                 |
| `npm run build`        | Type-check with `tsc` and build with Vite |
| `npm run preview`      | Preview the production build              |
| `npm run lint`         | Run ESLint on the codebase                |
| `npm run lint:fix`     | Run ESLint and auto-fix issues            |
| `npm run format`       | Format the codebase with Prettier         |
| `npm run format:check` | Check formatting without writing changes  |

A pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on staged files
automatically.

## Project structure

```
src/
  app.ts                 # mounts header/footer/dialog and starts the router
  main.ts                # entry point
  router/                # minimal hash-based SPA router
  pages/                  # route-level pages (home, not-found)
  components/             # header, hero, carousel, leaderboard, cta, footer, auth-dialog
  data/                   # static game catalogue used by the hero/carousel
  types/                  # shared TypeScript types
  styles/
    tokens/               # colors, spacing, typography, breakpoints
    base/                 # reset, base element styles, buttons
    utils/                # mixins (breakpoints, container, focus ring)
public/
  assets/games/           # game card/hero artwork
  mock-data/leaderboard.json
```

## Responsive breakpoints

Layouts are verified at the three target breakpoints from the task spec: **375px**,
**768px** and **1920px**, using tokens defined in `src/styles/tokens/_breakpoints.scss`.

## Browser support

Targets the latest version of Google Chrome, per the project requirements. The auth
dialog uses the native `<dialog>` element with `@starting-style` transitions.

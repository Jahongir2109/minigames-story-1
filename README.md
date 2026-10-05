# MiniGames

MiniGames is a single-page web application where players can take a short break and discover a library of casual mini-games.
It is built for the RS School qualifying stage (Stories 1–3) using only TypeScript, HTML and SCSS — no UI frameworks, routers or ready-made component libraries.

## Live demo

- Story 3: https://minigames-story-3.vercel.app
- Story 2: https://minigames-story-2.vercel.app
- Story 1: https://minigames-story-1.vercel.app

## Story 1 scope

- Project setup: Vite, TypeScript, ESLint, Prettier, Husky, Sass tokens
- Adaptive layout of the Home page (375px, 768px, 1920px)
- Auth dialog layout (Login / Registration)

## Story 2 scope

- Library page (`#/library`): title, category chips, sort dropdown, game cards and pagination
- Client-side navigation between Home and Library without a page reload, with the current page marked in the header and the mobile menu
- Game Details dialog: hero, game info with the favorite toggle, top records and comments with an auto-growing input
- Home slider logic: endless loop of the featured games, keyline card sizes, arrows, swipe and autoplay every 4 seconds (paused while held)

## Story 3 scope

- Data from the MiniGames REST API: the Home slider (`GET /api/games?featured=true`), the Top Players table (`GET /api/leaderboard`), the Library categories and games (`GET /api/categories`, `GET /api/games`), Game Details (`GET /api/games/{slug}`) and its latest comments (`GET /api/games/{slug}/comments`)
- Library filtering, sorting and pagination are done by the API (`category`, `sort`, `page`, `limit=6`); the pagination is built from the `page` / `totalPages` metadata
- Every API-driven section shows a skeleton while loading, an error banner with "Try Again" on failure, an empty-state placeholder for an empty result, and a snackbar for errors (no `alert()` / `confirm()`)
- Custom SPA router on the History API: `/` or `/home`, `/library` and a 404 page for every other path
- The URL is the single source of truth for the Library controls and the dialogs, e.g. `/library?category=puzzle&sort=rating-desc&page=2&game=<slug>` or `/?auth=login`; deep links, Back and Forward restore the same state
- Comments are read-only for guests; authentication, favorites and posting comments come with Story 4

## App session

- After a successful sign-in the app keeps its own session in `localStorage` under the key **`minigames:jahongir2109-minigames:app-session`**
- The value is one JSON object: `displayName`, `email`, `authenticatedAt` (milliseconds) and `avatarUrl` when available; passwords and Firebase tokens are never stored
- The session lasts a fixed 5 minutes from the sign-in; reloading or using the app does not extend it
- It is checked on startup, when the page becomes visible again, on every navigation and before protected actions; an expired or broken value is removed, Firebase `signOut()` is called and the app switches to Guest Mode (an expiry shows one Snackbar)

## Tech stack

- TypeScript (strict mode)
- Sass (SCSS) with design tokens
- Vite (development server and production build)
- ESLint (typescript-eslint + Unicorn) and Prettier
- Husky and commitlint (Git hooks)

## Project structure

```text
public/                 static files (favicon, game card images)
src/
  api/                  typed REST API client and endpoint functions
  app/                  application shell, History API router and URL state of the dialogs
  pages/                page compositions (home, library, 404)
  components/           UI components, each with its own markup (ts) and styles (scss)
  shared/               DOM helpers, constants and shared types
  assets/icons/         SVG icons imported as raw markup
  styles/               design tokens, breakpoints, mixins and base styles
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web app config
npm run dev
```

## Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the development server        |
| `npm run build`        | Type-check and build for production |
| `npm run preview`      | Preview the production build        |
| `npm run lint`         | Run ESLint                          |
| `npm run lint:fix`     | Run ESLint and fix what it can      |
| `npm run format`       | Format the codebase with Prettier   |
| `npm run format:check` | Check formatting with Prettier      |

## Design and quality

- Layout follows the Figma design at 375px, 768px and 1920px and resizes fluidly in between; no horizontal scrollbar from 375px to 1920px and wider.
- Every color, size, radius, shadow, font size and weight comes from the design tokens in `src/styles/abstracts/_tokens.scss` (published as CSS custom properties).
- Semantic HTML only; the checked SPA states (Home, Library, open auth dialog, open Game Details dialog, open mobile menu) pass the W3C validator without errors or warnings.
- Git hooks (Husky): `commit-msg` validates the message with commitlint, `pre-push` runs ESLint and Prettier.

## Git conventions

Commit messages follow the [RS School Git convention](https://rs.school/docs/git-convention): `<type>[optional scope]: <description>`.

# MiniGames

MiniGames is a single-page web application where players can take a short break and discover a library of casual mini-games.
It is built for the RS School qualifying stage (Stories 1–4) using only TypeScript, HTML and SCSS — no UI frameworks, routers or ready-made component libraries.

## Live demo

- Story 4: https://minigames-story-4.vercel.app
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

## Story 4 scope

- Login and Registration with Firebase Authentication (email / password and Google), real-time form validation and dialogs that stay locked while a request runs
- The signed-in profile (avatar photo or initials, name, Log Out) in the header and the mobile menu
- A 5-minute app session (below); logout and expiry return to Guest Mode
- Auth never opens for a signed-in user: the `auth` parameter is removed from the URL and a Snackbar explains why
- Favorites (`POST /api/games/{slug}/favorite`), comments (`POST /api/games/{slug}/comments`) and comment likes (`POST /api/comments/{id}/like`) for signed-in users; the UI changes only from the server answer, the control is locked while its request runs and a request with an unknown result is never repeated automatically
- A protected action of a guest (or after expiry) sends nothing and shows Auth over Game Details, which comes back when Auth closes
- Unit tests with Vitest for the application logic

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
- Firebase Authentication (email / password and Google)
- Vitest and happy-dom (unit tests)

## Project structure

```text
public/                 static files (favicon, game card images)
src/
  api/                  typed REST API client and endpoint functions
  app/                  application shell, History API router and URL state of the dialogs
  auth/                 Firebase sign-in, app session, profile helpers and the protected action guard
  pages/                page compositions (home, library, 404)
  components/           UI components, each with its own markup (ts) and styles (scss)
  shared/               DOM helpers, constants and shared types
  assets/icons/         SVG icons imported as raw markup
  styles/               design tokens, breakpoints, mixins and base styles
  test-utils/           test setup and the fake REST API used by the unit tests
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web app config
npm run dev
```

## Scripts

| Script                  | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start the development server        |
| `npm run build`         | Type-check and build for production |
| `npm run preview`       | Preview the production build        |
| `npm run lint`          | Run ESLint                          |
| `npm run lint:fix`      | Run ESLint and fix what it can      |
| `npm run format`        | Format the codebase with Prettier   |
| `npm run format:check`  | Check formatting with Prettier      |
| `npm test`              | Run all unit tests once             |
| `npm run test:watch`    | Run the unit tests in watch mode    |
| `npm run test:coverage` | Run the unit tests with coverage    |

## Unit tests

- [Vitest](https://vitest.dev) with the [happy-dom](https://github.com/capricorn86/happy-dom) browser environment and the V8 coverage provider; the configuration is the `test` section of `vite.config.ts`
- Tests live next to the code as `*.test.ts`; Firebase and the REST API are mocked (`src/test-utils/api.ts`), so no credentials or network are needed
- `npm run test:coverage` prints the coverage table in the terminal and writes an HTML report to `coverage/`
- Every `src/**/*.ts` file is measured, also files that no test imports; the only exclusions (each explained in `vite.config.ts`) are the tests, the test helpers, the `main.ts` bootstrap, type declarations and static constant data
- Current result: 353 tests, 98.13% statements, 92.4% branches

## Design and quality

- Layout follows the Figma design at 375px, 768px and 1920px and resizes fluidly in between; no horizontal scrollbar from 375px to 1920px and wider.
- Every color, size, radius, shadow, font size and weight comes from the design tokens in `src/styles/abstracts/_tokens.scss` (published as CSS custom properties).
- Semantic HTML only; the checked SPA states (Home, Library, open auth dialog, open Game Details dialog, open mobile menu) pass the W3C validator without errors or warnings.
- Git hooks (Husky): `commit-msg` validates the message with commitlint, `pre-push` runs ESLint and Prettier.

## Git conventions

Commit messages follow the [RS School Git convention](https://rs.school/docs/git-convention): `<type>[optional scope]: <description>`.

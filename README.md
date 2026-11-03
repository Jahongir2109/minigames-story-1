# MiniGames

MiniGames is a single-page web application where players can take a short break and discover a library of casual mini-games.
Stories 1–4 of the RS School qualifying stage were built with plain TypeScript, HTML and SCSS (the `story-4` branch). For the **Creative Extension** the whole app was rebuilt with **Angular 22** and got **runtime translations into English, Uzbek and Russian**.

## Live demo

- Creative Extension (Angular + i18n): https://creative-extension-kappa.vercel.app
- Story 4: https://minigames-story-4.vercel.app
- Story 3: https://minigames-story-3.vercel.app
- Story 2: https://minigames-story-2.vercel.app
- Story 1: https://minigames-story-1.vercel.app

## Creative Extension

Task: https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/creative-extension/mini-games.md

Two ideas of the task in one feature: **Migrate the project to a framework** and **Add localization (i18n)**.

### Angular migration

- Every story 1–4 feature works as before with the same design: Home (hero, endless slider, Top Players, Game Developer), Library (filters, sort, pagination in the URL), Game Details, Auth with Firebase, the 5-minute session, favorites, comments and likes, URL driven dialogs, Snackbars and the 404 page
- Standalone components with `OnPush` and zoneless change detection; state lives in signals (`signal`, `computed`, `linkedSignal`, `effect`)
- API sections load through `rxResource` on top of `HttpClient`: a newer request cancels the older one, Retry is `resource.reload()`; mutations are given up after 15 seconds and never repeated
- Angular Router with lazy pages (`/`, `/home`, `/library`, `**`); the open dialogs are query parameters handled by the `DialogUrl` service
- Firebase is downloaded only when somebody signs in, so guests never load the SDK
- The pure story 4 logic (session store, validation, carousel layout, autoplay timer, pagination window, profile helpers) was kept together with its tests

### Translations

- [Transloco](https://jsverse.gitbook.io/transloco) with the ICU message format: plurals with the rules of each language (`1 игра`, `3 игры`, `5 игр`), `select` and placeholders
- Language dropdown in the header and the mobile menu: every language is named in itself and the list works with the keyboard like a native select
- The language comes from the saved choice, then the browser, then English; a switch happens without a reload and also changes `<html lang>` and the page title
- Numbers, ratings, compact counters and relative dates go through cached `Intl` formatters (`54.2K` / `54,2 тыс.`, `2 hours ago` / `2 часа назад`)
- API data (game names, descriptions, comments) stays as the API sends it; category chips are translated by slug with the API label as a fallback; API and Firebase errors are explained in the language of the user
- Translation files are loaded on demand from `public/i18n`; a missing file never blocks the start (the app falls back to English)
- Tests keep the three files in sync, compile every ICU message and check the Russian plural forms

## Tech stack

- Angular 22 (standalone components, signals, zoneless change detection, Router, Reactive Forms, HttpClient)
- Transloco + MessageFormat (ICU) for the translations
- TypeScript (strict mode), Sass (SCSS) with design tokens
- Firebase Authentication (email / password and Google)
- Vitest through the Angular unit-test builder, jsdom
- ESLint (typescript-eslint, angular-eslint, Unicorn), Prettier, Husky and commitlint

## Project structure

```text
public/
  i18n/                 en.json, uz.json, ru.json (loaded on demand)
src/
  app/
    core/               API client, auth and session, dialog URL, i18n, navigation, storage
    layout/             header, mobile menu, footer, brand, language dropdown, user profile
    pages/              home, library and 404 pages with their sections
    dialogs/            Game Details and Auth dialogs, driven by the URL
    shared/             UI kit (button, icon, text field, snackbar, ...), pipes and formatting
  assets/icons/         SVG icons bundled as text
  styles/               design tokens, breakpoints, mixins, base and design-system styles
  testing/              test helpers (translations, fake API data)
scripts/
  write-environment.mjs writes the Firebase config from the env variables
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the Firebase web app config
npm start                    # http://localhost:4200
```

## Scripts

| Script                  | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `npm start`             | Start the development server                    |
| `npm run build`         | Build for production (`dist/minigames/browser`) |
| `npm run lint`          | Run ESLint                                      |
| `npm run lint:fix`      | Run ESLint and fix what it can                  |
| `npm run format`        | Format the codebase with Prettier               |
| `npm run format:check`  | Check formatting with Prettier                  |
| `npm test`              | Run all unit tests once                         |
| `npm run test:watch`    | Run the unit tests in watch mode                |
| `npm run test:coverage` | Run the unit tests with coverage                |

## Unit tests

- Vitest through the Angular unit-test builder (jsdom); tests live next to the code as `*.spec.ts`
- The REST API is answered by `HttpTestingController` and Firebase is replaced by a fake, so no credentials or network are needed
- Components are tested with the real English, Uzbek and Russian texts
- Current result: 166 tests, 86.76% statements, 82.29% branches

## App session

- After a successful sign-in the app keeps its own session in `localStorage` under the key **`minigames:jahongir2109-minigames:app-session`**; the chosen language is saved under `minigames:jahongir2109-minigames:language`
- The session value is one JSON object: `displayName`, `email`, `authenticatedAt` (milliseconds) and `avatarUrl` when available; passwords and Firebase tokens are never stored
- The session lasts a fixed 5 minutes from the sign-in; reloading or using the app does not extend it
- It is checked on startup, when the page becomes visible again, on every navigation and before protected actions; an expired value is removed, Firebase `signOut()` is called and the app switches to Guest Mode with one Snackbar

## Deploy (Vercel)

1. Import the repository in Vercel as a new project with the `creative-extension` production branch; `vercel.json` sets the build command, the `dist/minigames/browser` output and the SPA rewrite
2. Add the `FIREBASE_*` variables of `.env.example` in the project settings
3. Add the Vercel domain to Firebase Console -> Authentication -> Settings -> Authorized domains

## Design and quality

- Layout follows the Figma design at 375px, 768px and 1920px and resizes fluidly in between; no horizontal scrollbar from 375px to 1920px and wider
- Every color, size, radius, shadow, font size and weight comes from the design tokens in `src/styles/abstracts/_tokens.scss` (published as CSS custom properties)
- Accessible controls: dialogs on `<dialog>`, keyboard support in the dropdowns and the auth tabs, `aria-current`, `aria-pressed`, `aria-busy` and live regions
- Git hooks (Husky): `commit-msg` validates the message with commitlint, `pre-push` runs ESLint and Prettier

## Stories 1–4

### Story 1 scope

- Project setup: Vite, TypeScript, ESLint, Prettier, Husky, Sass tokens
- Adaptive layout of the Home page (375px, 768px, 1920px)
- Auth dialog layout (Login / Registration)

### Story 2 scope

- Library page (`#/library`): title, category chips, sort dropdown, game cards and pagination
- Client-side navigation between Home and Library without a page reload, with the current page marked in the header and the mobile menu
- Game Details dialog: hero, game info with the favorite toggle, top records and comments with an auto-growing input
- Home slider logic: endless loop of the featured games, keyline card sizes, arrows, swipe and autoplay every 4 seconds (paused while held)

### Story 3 scope

- Data from the MiniGames REST API: the Home slider (`GET /api/games?featured=true`), the Top Players table (`GET /api/leaderboard`), the Library categories and games (`GET /api/categories`, `GET /api/games`), Game Details (`GET /api/games/{slug}`) and its latest comments (`GET /api/games/{slug}/comments`)
- Library filtering, sorting and pagination are done by the API (`category`, `sort`, `page`, `limit=6`); the pagination is built from the `page` / `totalPages` metadata
- Every API-driven section shows a skeleton while loading, an error banner with "Try Again" on failure, an empty-state placeholder for an empty result, and a snackbar for errors (no `alert()` / `confirm()`)
- Custom SPA router on the History API: `/` or `/home`, `/library` and a 404 page for every other path
- The URL is the single source of truth for the Library controls and the dialogs, e.g. `/library?category=puzzle&sort=rating-desc&page=2&game=<slug>` or `/?auth=login`; deep links, Back and Forward restore the same state
- Comments are read-only for guests; authentication, favorites and posting comments come with Story 4

### Story 4 scope

- Login and Registration with Firebase Authentication (email / password and Google), real-time form validation and dialogs that stay locked while a request runs
- The signed-in profile (avatar photo or initials, name, Log Out) in the header and the mobile menu
- A 5-minute app session (below); logout and expiry return to Guest Mode
- Auth never opens for a signed-in user: the `auth` parameter is removed from the URL and a Snackbar explains why
- Favorites (`POST /api/games/{slug}/favorite`), comments (`POST /api/games/{slug}/comments`) and comment likes (`POST /api/comments/{id}/like`) for signed-in users; the UI changes only from the server answer, the control is locked while its request runs and a request with an unknown result is never repeated automatically
- A protected action of a guest (or after expiry) sends nothing and shows Auth over Game Details, which comes back when Auth closes
- Unit tests with Vitest for the application logic

## Git conventions

Commit messages follow the [RS School Git convention](https://rs.school/docs/git-convention): `<type>[optional scope]: <description>`.

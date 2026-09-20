# MiniGames

MiniGames is a single-page web application where players can take a short break and discover a library of casual mini-games.
It is built for the RS School qualifying stage (Story 1) using only TypeScript, HTML and SCSS — no UI frameworks or ready-made component libraries.

## Live demo

https://minigames-story-1.vercel.app

## Story 1 scope

- Project setup: Vite, TypeScript, ESLint, Prettier, Husky, Sass tokens
- Adaptive layout of the Home page (375px, 768px, 1920px)
- Auth dialog layout (Login / Registration)

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
  app/                  application shell (mounts pages and global widgets)
  pages/                page compositions (home)
  components/           UI components, each with its own markup (ts) and styles (scss)
  shared/               DOM helpers, constants and shared types
  data/                 mock data used until the API is connected
  assets/icons/         SVG icons imported as raw markup
  styles/               design tokens, breakpoints, mixins and base styles
```

## Getting started

```bash
npm install
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
- Semantic HTML only; the three states of the SPA (Home, open auth dialog, open mobile menu) pass the W3C validator without errors or warnings.
- Git hooks (Husky): `commit-msg` validates the message with commitlint, `pre-push` runs ESLint and Prettier.

## Git conventions

Commit messages follow the [RS School Git convention](https://rs.school/docs/git-convention): `<type>[optional scope]: <description>`.

# MiniGames

MiniGames is a single-page web application where players can take a short break and discover a library of casual mini-games.
It is built for the RS School qualifying stage (Story 1) using only TypeScript, HTML and SCSS — no UI frameworks or ready-made component libraries.

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

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script                 | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the development server      |
| `npm run build`        | Type-check and build for production |
| `npm run preview`      | Preview the production build      |
| `npm run lint`         | Run ESLint                        |
| `npm run lint:fix`     | Run ESLint and fix what it can    |
| `npm run format`       | Format the codebase with Prettier |
| `npm run format:check` | Check formatting with Prettier    |

## Git conventions

Commit messages follow the [RS School Git convention](https://rs.school/docs/git-convention): `<type>[optional scope]: <description>`.

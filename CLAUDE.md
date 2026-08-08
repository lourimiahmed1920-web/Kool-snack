# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

Kool.Snack is a restaurant management application, not just a customer-facing menu/ordering site. It is meant to cover multiple roles: customer menu/ordering, kitchen operations, and employee/staff management. The codebase is currently a fresh `create-vite` React + TypeScript scaffold with no routing, state management, or role-specific structure yet — treat any multi-role/admin/kitchen features as not-yet-built rather than assuming a simple single-page menu app.

## Commands

- `npm run dev` — start the Vite dev server with HMR.
- `npm run build` — type-check via `tsc -b` then produce a production build with `vite build`.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run Oxlint (`oxlint`, configured in `.oxlintrc.json`).

There is no test runner configured in this project yet.

On this machine, `node`/`npm` require `C:\Program Files\nodejs` on PATH; this has been added to the user PATH, but if a shell doesn't see it, invoke `npm` via the full path `C:\Program Files\nodejs\npm.cmd`.

## Architecture

- Single-page React 19 app bootstrapped by Vite. Entry point is `src/main.tsx`, which mounts `<App />` (`src/App.tsx`) into `#root` in `index.html` inside `React.StrictMode`.
- No router or global state management is installed yet — `App.tsx` currently still holds the default Vite/React starter markup and a `useState` counter, to be replaced with real UI.
- TypeScript project uses project references: `tsconfig.json` points to `tsconfig.app.json` (app source, `src/`) and `tsconfig.node.json` (Vite config). Module resolution is `bundler` mode with `verbatimModuleSyntax` and `noUnusedLocals`/`noUnusedParameters` enabled — unused imports/vars fail the build.
- Linting is Oxlint, not ESLint. Rules live in `.oxlintrc.json` (`react`, `typescript`, `oxc` plugins). Type-aware linting is not enabled by default (would require `oxlint-tsgolint` and `"options": { "typeAware": true }`).
- Static assets referenced by icon `<use>` elements (e.g. `#documentation-icon`, `#social-icon`, `#github-icon`) live in `public/icons.svg` as an SVG sprite; `public/favicon.svg` is the favicon.

## What This Is

Hike (`@code-hike/hike`) is a skill that generates rich, visual explanations of coding sessions. It's packaged as an npx-runnable CLI that launches a Next.js web app to render interactive narratives written in MDX.

Three facets: a **skill** (installed via `npx skills add code-hike/hike`), an **npm package** (CLI in `bin/hike.js`), and a **Next.js app** (UI in `app/`).

## Commands

- `npm run dev` — Next.js dev server
- `npm run build` — production build (runs `postbuild` to clean `.next/dev` and `.next/cache`)
- `npm start` — run CLI (`node bin/hike.js`), launches prod server on port 8849
- `npm run clean` — remove `.next/`

## Project Structure

- `bin/hike.js` — CLI entry point. Handles port detection, process management (PID file at `.hike/.pid`), browser auto-open, and spawns Next.js dev/prod server. CommonJS.
- `app/` — Next.js App Router. React 19 server components by default.
- `skills/hike/SKILL.md` — Skill definition with the 6-phase narrative generation process and `<Walk>` annotation syntax (`!callout`, `!mark`, `!tooltip`, `!diff`).

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS 4 via `@tailwindcss/postcss`
- Use **Tailwind** for all styling, **Lucide** for icons, **shadcn/ui** for components

## Publishing

Published to npm as `@code-hike/hike`. The `files` field ships only `bin/` and `.next/`. `prepack` runs the build automatically.

When I tell you to `release` do this:

- commit
- update package json and skill versions (patch unless I say otherwise)
- run `npm publish:npm`
- commit
- tag
- push

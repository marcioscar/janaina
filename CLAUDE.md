# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server with HMR (http://localhost:5173)
- `npm run build` — `prisma generate` + production build to `build/client` and `build/server`
- `npm run start` — serve the production build
- `npm run typecheck` — generate route types (`react-router typegen`) and run `tsc`. Run this after adding or renaming routes so the `./+types/*` imports resolve.
- `npx shadcn@latest add <component>` — add a shadcn/ui component into `app/components/ui/`
- `npx prisma generate` — regenerate the client after editing `prisma/schema.prisma` (also runs on `postinstall` and `build`)
- `npx prisma db push` — sync indexes to MongoDB (there are no migrations with the MongoDB provider)

No test runner or linter is configured yet.

## Architecture

- **React Router v8, Framework Mode**, SSR enabled (`react-router.config.ts`). Before changing routing, loaders, actions or forms, read `.agents/skills/react-router/SKILL.md` and `references/framework-mode.md`.
- Routes are declared explicitly in `app/routes.ts` (not file-based). Route modules live in `app/routes/` and import their types from `./+types/<route>`.
- `app/root.tsx` holds the HTML `Layout`, the root `App` and the global `ErrorBoundary`.
- Path alias `~/*` → `app/*`.
- `app/welcome/` is leftover template scaffolding and can be removed once real pages exist.

## Database

- **MongoDB Atlas via Prisma 6** (`provider = "mongodb"`), schema in `prisma/schema.prisma`.
- `DATABASE_URL` in `.env` (gitignored) points to the `janaina` database on the same Atlas cluster used by the `marcioscar` project.
- `app/db.server.ts` exports a singleton `db` (PrismaClient). Only import it from `*.server.ts` files, loaders and actions — never from client code.
- Collection `despesas`: nome, categoria, valor, data, comprovante, conta, fatura?, obs, createdAt, updatedAt; indexed on `data` and `categoria`.

## UI / theme

- **shadcn/ui** configured in `components.json`: style `base-luma` (Base UI primitives, not Radix), base color `mauve`, icons from `lucide-react`.
- Components go in `~/components/ui`, the `cn()` helper is in `~/lib/utils`.
- **Tailwind CSS v4** via `@tailwindcss/vite` — there is no `tailwind.config`; all theme tokens (CSS variables in oklch) live in `app/app.css` under `:root` and `.dark`.
- Dark mode is class-based (`@custom-variant dark (&:is(.dark *))`): add the `dark` class to `<html>` to enable it. It no longer follows `prefers-color-scheme` automatically.
- Font: Inter Variable from `@fontsource-variable/inter` (bundled, no Google Fonts request).
- Use semantic token classes (`bg-background`, `text-muted-foreground`, `bg-primary`…) instead of raw colors like `bg-white` / `gray-*`.

## Deployment

`Dockerfile` builds with a placeholder `DATABASE_URL` (the build never touches the DB) and runs `react-router-serve`. The real `DATABASE_URL` must be provided at runtime.

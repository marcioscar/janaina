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
- Layout: `app/root.tsx` wraps every page in a collapsible shadcn sidebar (`app/components/app-sidebar.tsx`). To add a page, add the route in `app/routes.ts` and an entry to `navGroups` in the sidebar.
- `/` redirects to `/despesas`. The despesas page was ported from the `marcioscar` project's `/contas` page, without the Brassaco feature.

## Despesas feature

- `app/routes/despesas.tsx`: the loader filters by date range (`?dataInicio=&dataFim=`, defaults to the current month). A single action dispatches on the `intent` form field: `criar` (the default), `editar`, `excluir` or `importar-pdf`.
- `app/models/despesas.server.ts`: queries. Date-filtered reads go through `db.$runCommandRaw` with `montarFiltroData`, because Prisma's MongoDB driver doesn't support every query operator. Follow that pattern for new date filters.
- `app/models/pocketbase.server.ts` uploads receipts (comprovantes) to PocketBase and stores the public URL in `comprovante`.
- `app/models/importar-pdf.server.ts` sends a bank statement or card-bill PDF to the Claude API (`claude-sonnet-4-6`) and gets transactions back as JSON. `importar-pdf-dialog.tsx` then walks the user through them one by one and keeps progress in `localStorage`.
- Categories (`/categorias`) and accounts (`/contas`) are single-field lookups stored in the database. Despesas store their *name* (`despesas.categoria` / `despesas.conta`), not an id.
- Both lookups share `app/models/cadastro-simples.server.ts`: `criarCadastroSimples()` handles list, create, rename and delete, and `executarAcaoCadastro()` is the route action. The screen is the shared `app/components/cadastro-simples-page.tsx`. The rules: names are unique ignoring case and accents, renaming also updates the despesas, and an entry still used by despesas can't be deleted. To add another lookup of this kind, create a Prisma model with the same shape and reuse these pieces.
- The table uses `@tanstack/react-table` **v8**. Keep it on v8, because v9 changed the API.

## Database

- **MongoDB Atlas via Prisma 6** (`provider = "mongodb"`), schema in `prisma/schema.prisma`.
- `DATABASE_URL` in `.env` (gitignored) points to the `janaina` database on the same Atlas cluster used by the `marcioscar` project.
- `app/db.server.ts` exports a singleton `db` (PrismaClient). Only import it from `*.server.ts` files, loaders and actions — never from client code.
- Other env vars: `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `POCKETBASE_COLLECTION` and `POCKETBASE_FIELD` (receipt upload), plus `ANTHROPIC_API_KEY` (PDF import). All of them are copied from `marcioscar`.
- Collections `categorias` and `contas`: nome (unique), createdAt, updatedAt.
- Collection `despesas`: nome, categoria, valor, data, comprovante, conta, fatura?, obs, createdAt, updatedAt; indexed on `data` and `categoria`.

## UI / theme

- **shadcn/ui** configured in `components.json`: style `base-luma` (Base UI primitives, not Radix), base color `mauve`, icons from `lucide-react`.
- Components go in `~/components/ui`, the `cn()` helper is in `~/lib/utils`.
- **Tailwind CSS v4** via `@tailwindcss/vite` — there is no `tailwind.config`; all theme tokens (CSS variables in oklch) live in `app/app.css` under `:root` and `.dark`.
- Dark mode is class-based (`@custom-variant dark (&:is(.dark *))`): add the `dark` class to `<html>` to enable it. It no longer follows `prefers-color-scheme` automatically.
- Font: Inter Variable from `@fontsource-variable/inter` (bundled, no Google Fonts request).
- Accent palette `--paleta-1` … `--paleta-6`, plus `--sucesso` and `--alerta`, in `app/app.css`. Its hues are tuned to the mauve theme. Tinted action buttons use the shared classes in `app/lib/botoes.ts`.
- Use semantic token classes (`bg-background`, `text-muted-foreground`, `bg-primary`…) instead of raw colors like `bg-white` / `gray-*`.

## Deployment

`Dockerfile` builds with a placeholder `DATABASE_URL` (the build never touches the DB) and runs `react-router-serve`. The real `DATABASE_URL` must be provided at runtime.

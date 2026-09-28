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
- `app/root.tsx` holds the HTML `Layout`, a bare root `App` (`Outlet` plus `Toaster`) and the global `ErrorBoundary`. The sidebar layout lives in `app/routes/protegido.tsx`.
- Path alias `~/*` → `app/*`.
- Layout: `app/root.tsx` wraps every page in a collapsible shadcn sidebar (`app/components/app-sidebar.tsx`). To add a page, add the route in `app/routes.ts` and an entry to `navGroups` in the sidebar.
- `/` is the dashboard (`app/routes/home.tsx`). The despesas page was ported from the `marcioscar` project's `/contas` page, without the Brassaco feature.

## Dashboard

- `app/models/dashboard.server.ts` aggregates in JS over `listarDespesas`. It returns the period total, the total for the previous period of the same length (used for the delta), totals per category, and the last 6 months ending at the period's end month.
- Charts use the shadcn `chart` component (Recharts) with the theme's `--chart-*` tokens, set per mode through `ChartConfig.theme`. Colors were checked with the dataviz palette validator:
  - by category: each bar takes its category's own color (see below). The chart is capped at 8 bars, with the rest folded into "Outras" in a neutral color;
  - by month: columns stacked by category (`escolherSeries` in `dashboard.server.ts`):
    - at most 7 categories get their own layer (the biggest spenders in the 6-month window) and the rest go into "Outras";
    - a category whose color slot is already taken by a bigger one also goes into "Outras", so no two layers share a color;
    - layers stack in palette order, which is the order the validator checked for neighboring colors;
    - there is a 2px card-colored gap between layers, the total sits above each column, and the period's month is bold.
- Period helpers (`lerPeriodoDaUrl`, presets, previous period) live in `app/lib/periodo.ts` and currency/percent formatting in `app/lib/formato.ts`. Both the dashboard and despesas use them. All dates are UTC.
- `app/components/ui/*` import `cn` from the `cn` package, which is this preset's convention (`app/lib/utils.ts` re-exports it). Keep that.

## Despesas feature

- `app/routes/despesas.tsx`: the loader filters by date range (`?dataInicio=&dataFim=`, defaults to the current month). A single action dispatches on the `intent` form field: `criar` (the default), `editar`, `excluir` or `importar-pdf`.
- `app/models/despesas.server.ts`: queries. Date-filtered reads go through `db.$runCommandRaw` with `montarFiltroData`, because Prisma's MongoDB driver doesn't support every query operator. Follow that pattern for new date filters.
- `app/models/pocketbase.server.ts` uploads receipts (comprovantes) to PocketBase and stores the public URL in `comprovante`.
- `app/models/importar-pdf.server.ts` sends a bank statement or card-bill PDF to the Claude API (`claude-sonnet-4-6`) and gets transactions back as JSON. `importar-pdf-dialog.tsx` then walks the user through them one by one and keeps progress in `localStorage`.
- Categories (`/categorias`) and accounts (`/contas`) are single-field lookups stored in the database. Despesas store their *name* (`despesas.categoria` / `despesas.conta`), not an id.
- Both lookups share `app/models/cadastro-simples.server.ts`: `criarCadastroSimples()` handles list, create, rename and delete, and `executarAcaoCadastro()` is the route action. The screen is the shared `app/components/cadastro-simples-page.tsx`. The rules: names are unique ignoring case and accents, renaming also updates the despesas, and an entry still used by despesas can't be deleted. To add another lookup of this kind, create a Prisma model with the same shape and reuse these pieces.
- The table uses `@tanstack/react-table` **v8**. Keep it on v8, because v9 changed the API.

## Access (password only)

- Everything except `/login` and `/logout` requires a single password in `APP_SENHA`, with no user accounts.
  - The protected pages are nested under the layout route `app/routes/protegido.tsx`, see `app/routes.ts`. That layout holds the server `middleware` and renders the sidebar.
  - Because the middleware sits on a layout, it covers actions and the browser's `/page.data` requests too.
  - Don't switch to checking paths in root middleware: client-side submissions hit `/login.data`, not `/login`.
  - The layout also renders the sidebar, so `/login` shows without it.
- A new page that needs the password goes inside that `layout(...)` in `app/routes.ts`.
- `app/sessao.server.ts`:
  - The session is a signed `httpOnly` cookie (`janaina_sessao`) valid for 7 days.
  - The signing secret is derived from `APP_SENHA`, so changing the password logs everyone out.
  - The password is compared in constant time, and a wrong attempt waits 1 second.
  - The `voltar` redirect only accepts internal paths.
  - If `APP_SENHA` is not set, nobody can log in (fail closed).
- Logout is a POST to `/logout` (the "Sair" button in the sidebar footer).
- `react-router.config.ts` sets `allowedActionOrigins: ["janaina.marcioscar.com.br"]`.
  - Why: Traefik terminates HTTPS and forwards over http, so the page origin (`https://`) doesn't match the request URL the server sees (`http://`). Without this setting every action, login included, fails with `400 Bad Request` (React Router's CSRF check).
  - If the domain changes, update this list.
- Read env vars with `variavelAmbiente()` (`app/lib/env.server.ts`), which strips surrounding quotes because Portainer may keep the quotes from `.env`.

## Database

- **MongoDB Atlas via Prisma 6** (`provider = "mongodb"`), schema in `prisma/schema.prisma`.
- `DATABASE_URL` in `.env` (gitignored) points to the `janaina` database on the same Atlas cluster used by the `marcioscar` project.
- `app/db.server.ts` exports a singleton `db` (PrismaClient). Only import it from `*.server.ts` files, loaders and actions — never from client code.
- Other env vars: `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `POCKETBASE_COLLECTION` and `POCKETBASE_FIELD` (receipt upload), plus `ANTHROPIC_API_KEY` (PDF import). All of them are copied from `marcioscar`.
- Collections `categorias` and `contas`: nome (unique), createdAt, updatedAt. `categorias` also has `cor` (Int 1–8).
- **Category colors** belong to the category, not to a bar's position, so a category keeps the same color in every period and on every screen:
  - `categorias.cor` is a slot that points to `--categoria-N` in `app/app.css`, with separate values for light and dark;
  - use `corDaCategoria()` from `app/lib/cores-categoria.ts` to turn a slot into a color;
  - the 8 hues and their fixed order passed the dataviz palette validator in both modes;
  - a new category gets the least-used slot, and the color can be changed in `/categorias`;
  - the colors appear in the dashboard chart, its table view and the despesas table.
  - Only categorias use colors (`comCor: true` in `criarCadastroSimples`). The contas collection has no `cor` field.
- Collection `despesas`: nome, categoria, valor, data, comprovante, conta, fatura?, obs, createdAt, updatedAt; indexed on `data` and `categoria`.

## UI / theme

- **shadcn/ui** configured in `components.json`: style `base-luma` (Base UI primitives, not Radix), icons from `lucide-react`. The preset's base color was mauve, but the tokens in `app/app.css` have been retuned to the brand: primary bordô `#561530` (rosa `#F3CFCB` in dark mode), slightly rosy neutrals, charts on a bordô→rosa ramp, and the brand green for `--sucesso`.
- **Brand** (source files in `assets/jana/`):
  - `app/components/marca.tsx` holds the logo, colored through the `--marca-*` tokens so it flips to a pink tile in dark mode. The coin uses the light green on bordô, because the dark green disappears there.
  - `public/favicon.svg` is a simplified mark for 16–32 px, with its own dark-mode media query.
  - The wordmark uses Bricolage Grotesque (`font-brand`).
- **Icons**: `app/components/icones.tsx` holds the brand icon set (24px grid, 1.75 stroke), used in the sidebar. The lucide icons are forced to the same 1.75 stroke in `app/app.css`.
- Components go in `~/components/ui`, the `cn()` helper is in `~/lib/utils`.
- **Tailwind CSS v4** via `@tailwindcss/vite` — there is no `tailwind.config`; all theme tokens (CSS variables in oklch) live in `app/app.css` under `:root` and `.dark`.
- Dark mode is class-based (`@custom-variant dark (&:is(.dark *))`): add the `dark` class to `<html>` to enable it. It no longer follows `prefers-color-scheme` automatically.
- Font: Inter Variable from `@fontsource-variable/inter` (bundled, no Google Fonts request).
- Accent palette `--paleta-1` … `--paleta-6`, plus `--sucesso` and `--alerta`, in `app/app.css`. Its hues are tuned to the mauve theme. Tinted action buttons use the shared classes in `app/lib/botoes.ts`.
- Use semantic token classes (`bg-background`, `text-muted-foreground`, `bg-primary`…) instead of raw colors like `bg-white` / `gray-*`.

## Deployment

- `Dockerfile` builds with a placeholder `DATABASE_URL` (the build never touches the DB) and runs `react-router-serve` on port 3000. `.dockerignore` keeps `.env` out of the image, and the secrets are supplied at runtime.
- The app is deployed through Portainer (Docker Swarm) at `https://janaina.marcioscar.com.br`. The stack file is `deploy/portainer-stack.yml`. It follows the same pattern as the other apps: no published port, the Traefik labels route to container port 3000, it joins the external `Quattornet` network, and it references env vars as `${VAR}`. The values are filled in Portainer, without quotes.
- Release steps:
  1. `docker build --platform linux/amd64 -t marcioscar/janaina-financeiro:latest .`
  2. `docker push marcioscar/janaina-financeiro:latest`
  3. In Portainer, update the stack and turn on "Re-pull image".

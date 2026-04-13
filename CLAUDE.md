# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Dev Commands

- `npm run dev` — Start development server (Next.js Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint check

## Architecture

This is a Next.js 16 (App Router) weather-and-wardrobe app using React 19, TypeScript 5 (strict), and Tailwind CSS v4.

### Routes

- `/` — Landing page with sign-in/sign-up CTA. Signed-in users are redirected to `/dashboard`.
- `/dashboard` — Saved-cities view with per-card weather + AI outfit suggestion.
- `/closet` — Checklist of clothing items grouped by category; auto-saves on toggle; supports add/remove of custom items.
- `/settings` — Style preference + temperature sensitivity, auto-saved.
- `/sign-in`, `/sign-up` — Clerk auth pages.

### API routes (`src/app/api/`)

- `/api/geocode?q={query}` — City search via Open-Meteo geocoding API.
- `/api/weather?lat={lat}&lon={lon}` — Weather data via Open-Meteo forecast API (°F, mph).
- `/api/outfit` — POST `{ city, temperature, conditions, style, tempSensitivity, ownedItems }`. Calls Google Gemini (`gemini-flash-latest`) via the REST API with a personal-stylist prompt and returns `{ suggestion }`. Requires `GEMINI_API_KEY`.

### Components / hooks

- `src/components/WeatherCard.tsx` — Fetches weather, then calls `/api/outfit` with the user's owned items + preferences. Card background tint is driven by weather code (sunny/cloudy/rainy/snowy/stormy/foggy).
- `src/components/CitySearch.tsx` — Debounced (300ms) autocomplete against `/api/geocode`.
- `src/components/Nav.tsx` — Top-nav links (Dashboard/Closet/Settings), only rendered when signed in.
- `src/lib/useSupabase.ts` — Builds a Supabase client that forwards the Clerk session token as `accessToken`.
- `src/lib/useEnsureUserInitialized.ts` — On first signed-in mount, seeds the default closet catalog and ensures a `user_preferences` row exists. Call this from any authed page.
- `src/lib/closet-seed.ts` — Default catalog + category labels/order.
- `src/lib/preferences.ts` — Style + sensitivity option lists and defaults.
- `src/lib/weather-utils.ts` — WMO code → label/icon map (`getWeatherDescription`).

### Shared types (`src/types.ts`)

`City`, `SavedCity` (= `City & { id }`), `WeatherData`, `ClothingCategory`, `ClosetItem`, `StylePreference`, `TempSensitivity`, `UserPreferences`.

## Auth & Data

**Auth** is Clerk (`@clerk/nextjs`). `ClerkProvider` wraps the app in `src/app/layout.tsx`; middleware at `src/proxy.ts` runs `clerkMiddleware()`.

**Database** is Supabase (project `xrtwrxpyjcpcpadulxsc`). Clerk is wired up as a Supabase third-party auth provider — Clerk session tokens are forwarded to Supabase, and RLS policies match `auth.jwt() ->> 'sub'` against the `user_id` column.

**Supabase client:** `src/lib/useSupabase.ts` exports `useSupabase()`, a hook that builds a `SupabaseClient` whose `accessToken` callback pulls the current Clerk session token via `useSession()`. Always use this hook from client components; do not construct Supabase clients directly.

**Env vars** (in `.env.local` locally, and Vercel project settings for deploys):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `GEMINI_API_KEY` — server-only; used by `/api/outfit` to call Google Gemini

### Data model

**`public.saved_cities`** — one row per user's saved city.

| column      | type               | notes                                            |
|-------------|--------------------|--------------------------------------------------|
| `id`        | `uuid` PK          | `default gen_random_uuid()`                      |
| `user_id`   | `text` not null    | Clerk user ID (JWT `sub` claim)                  |
| `name`      | `text` not null    |                                                  |
| `country`   | `text` not null    |                                                  |
| `admin1`    | `text` nullable    | state/region                                     |
| `latitude`  | `double precision` |                                                  |
| `longitude` | `double precision` |                                                  |
| `created_at`| `timestamptz`      | `default now()`                                  |

- Unique constraint `(user_id, latitude, longitude)` — enforces no-duplicate-location-per-user.
- Index on `(user_id, created_at desc)` for the default list query.
- **RLS enabled.** Four policies (select/insert/update/delete) all use `(select auth.jwt() ->> 'sub') = user_id` so the Clerk user sees only their own rows.

**`public.closet_items`** — one row per (user, clothing item).

| column     | type        | notes                                                          |
|------------|-------------|----------------------------------------------------------------|
| `id`       | `uuid` PK   | `default gen_random_uuid()`                                    |
| `user_id`  | `text`      | Clerk user ID                                                  |
| `category` | `text`      | check: one of `tops`/`bottoms`/`outerwear`/`footwear`/`accessories` |
| `name`     | `text`      | item name, e.g. `"jeans"`                                       |
| `owned`    | `boolean`   | `default true`; unchecked items are excluded from suggestions   |
| `created_at` | `timestamptz` | `default now()`                                             |

Unique `(user_id, category, name)`. Index on `(user_id, category)`. RLS scoped to the Clerk `sub` claim.

**`public.user_preferences`** — one row per user.

| column             | type        | notes                                                                    |
|--------------------|-------------|--------------------------------------------------------------------------|
| `user_id`          | `text` PK   | Clerk user ID                                                            |
| `style`            | `text`      | check: `casual`/`business_casual`/`streetwear`/`athletic`/`formal`; default `casual` |
| `temp_sensitivity` | `text`      | check: `runs_cold`/`normal`/`runs_warm`; default `normal`                |
| `updated_at`       | `timestamptz` | trigger-maintained on update                                          |

RLS with select/insert/update policies keyed on the Clerk `sub` claim.

Schema changes: use the Supabase MCP server (`apply_migration` for DDL) rather than editing the database out-of-band. Weather data is fetched live from Open-Meteo and is not persisted.

## Conventions

- All interactive components use `"use client"` directive
- Path alias: `@/*` maps to `src/*`
- Dark mode via `prefers-color-scheme` media query with paired `dark:` Tailwind classes
- API error responses use `{ error: string }` format; 400 for bad params, 502 for upstream failures

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Dev Commands

- `npm run dev` — Start development server (Next.js Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint check

## Architecture

This is a Next.js 16 (App Router) weather app using React 19, TypeScript 5 (strict), and Tailwind CSS v4.

**API routes** in `src/app/api/` proxy external APIs to avoid CORS and keep logic server-side:
- `/api/geocode?q={query}` — City search via Open-Meteo geocoding API
- `/api/weather?lat={lat}&lon={lon}` — Weather data via Open-Meteo forecast API (°F, mph)

**Client components** manage their own data fetching and state:
- `page.tsx` — Manages the city list in React state, synced to localStorage (`weather-app-cities` key). Uses a `mounted` flag to avoid hydration mismatch with localStorage.
- `CitySearch` — Debounced (300ms) autocomplete against `/api/geocode`
- `WeatherCard` — Fetches weather on mount per city, shows loading/error/success states

**Shared types** live in `src/types.ts` (`City`, `WeatherData`).

**Weather utilities** in `src/lib/weather-utils.ts` map WMO weather codes to labels/icons and generate clothing advice based on temperature + conditions.

## Conventions

- All interactive components use `"use client"` directive
- Path alias: `@/*` maps to `src/*`
- Dark mode via `prefers-color-scheme` media query with paired `dark:` Tailwind classes
- API error responses use `{ error: string }` format; 400 for bad params, 502 for upstream failures

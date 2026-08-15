# pokedex-web Implementation Plan (Phase 4 — Frontend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React frontend for the Pokedex ecosystem: browse/detail/collection pages against any of the three contract-identical backends, JWT auth with silent refresh, English/Spanish i18n, four Pokemon-game themes, customizable pagination.

**Architecture (per the approved spec §8):** simple presentation-component split — `src/pages` (containers wired to the store), `src/components` (presentational), `src/store` (RTK Query API + slices), `src/i18n`, `src/themes`, `src/hooks`. No over-abstraction. Backend contract (verified by the phase gates): all responses `{ data, error, msg, meta }`; errors carry `error` name + `msg`; paged endpoints put the array in `data` and `{ page, pageSize, totalCount, totalPages }` in `meta`; DELETE returns bodyless 204; unknown routes return the envelope; auth per spec §4 (15-min access token, rotating 24h refresh token).

**Tech Stack:** Vite 7 + React 19 + TypeScript (strict), Redux Toolkit + RTK Query, react-router 7, react-i18next, Tailwind CSS v4 (via `@tailwindcss/vite`) + shadcn/ui-style components (copied in, Radix primitives), lucide-react icons. ALL dependency versions exact-pinned (`npm install --save-exact`, resolve latest stable at install time). Node 22 (`.nvmrc`). Dev port 5173.

**Conventions (jericho + owner):** PascalCase component files, kebab-case non-component dirs, labeled import groups, max-len 180, TS strict + explicit return types on exported functions, no barrel files, npm only. Husky hooks mirroring the sibling repos: pre-commit `npm run lint`, commit-msg capitalized-infinitive-verb regex (copy `.husky/` from `pokedex-api-express-ts` and the verb regex verbatim). Commits on `main`, NO co-author trailers. ESLint: `eslint` + `typescript-eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` (Vite template's flat config extended to jericho rules: max-len 180, prefer-const, eqeqeq, explicit return types for exported APIs).

**No FE test suite this phase (owner's decision).** Verification = lint + `tsc --noEmit` + `vite build` + live smoke against the TS backend.

---

## Theme design (binding — the four palettes)

Themes are CSS custom-property sets on `:root[data-theme="..."]`, consumed by Tailwind v4 `@theme inline` tokens (`--color-background`, `--color-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-accent`, `--color-muted`, `--color-card`, `--color-border`, `--color-destructive`, plus `--radius`). Every themed surface uses tokens — NEVER raw colors in components. Default theme `emerald`; persisted in localStorage (`pokedex.theme`); applied via a tiny inline script in `index.html` before paint (no flash).

- **`emerald`** (Pokemon Emerald, the owner's favorite — default): warm parchment background `#F4F1E0`, deep rainforest surfaces `#1E5B4A`, primary emerald `#0FA36B`, accent Rayquaza gold `#D9A441`, foreground near-black `#17241F`, cards `#FFFDF2`, border `#C9C3A6`. Feel: GBA menu warmth — cream panels framed in green with gold highlights.
- **`firered`** (FireRed remaster): background soft cream `#FFF6EC`, primary flame `#E3350D`, secondary ember orange `#F57C00`, accent Charizard gold `#FFC107`, foreground charcoal `#2B211C`, cards `#FFFFFF`, border `#E8D5C4`. Feel: warm, energetic, red-dominant.
- **`bw-light`** (Pokemon Black & White — the light half): stark white `#FFFFFF` background, near-black `#111111` foreground, grayscale surfaces (`#F5F5F5` cards, `#E0E0E0` borders), single accent Reshiram blue-white `#3B82F6` used sparingly. Feel: clinical, minimal, high-contrast.
- **`bw-dark`** (the black half): near-black `#0C0C0E` background, off-white `#F2F2F2` foreground, `#18181B` cards, `#2A2A2E` borders, single accent Zekrom electric cyan `#22D3EE`. Feel: OLED-dark mirror of bw-light.

Theme switcher cycles/selects all four; `bw-light`/`bw-dark` double as the app's light/dark modes per the spec.

## Store design (binding)

- `apiSlice` (RTK Query): `baseQuery` = fetchBaseQuery with a DYNAMIC baseUrl read from the `apiTarget` slice (`http://localhost:5257` .NET default | `http://localhost:3000` JS | `http://localhost:3001` TS; default from `VITE_API_BASE_URL`, overridable at runtime via the header switcher, persisted `pokedex.apiTarget`). Wrapped in `baseQueryWithReauth`: on 401 → POST `/api/auth/refresh` with the stored refresh token → on success store new tokens and retry ONCE → on failure dispatch logout. Endpoints: `browsePokemons(page, pageSize)`, `getPokemonById(id)`, `getPokemonByName(name)`, `getLocal(page, pageSize)`, `syncById(id)`, `updateLocal(id, payload)`, `deleteLocal(id)`, `register`, `login`, `logout`. Responses unwrapped from the envelope (`transformResponse` pulls `data` + `meta`; errors surface `msg`). Tag invalidation: `Local` list invalidated by sync/update/delete.
- `authSlice`: `{ user, accessToken }` in memory + refresh token in localStorage (`pokedex.refreshToken`) — accepted tradeoff per spec. Login/register/refresh fulfilled matchers update it; logout clears + calls the API.
- `uiSlice`: `theme`, `language`, `pageSize` (10/20/50, default 20, persisted `pokedex.pageSize`).
- Switching apiTarget resets the api state (`api.util.resetApiState`) and clears auth (tokens are per-secret; services share secrets so tokens WOULD work cross-service — keep the session, just reset cached queries. Decision: keep auth session on switch, reset query cache only).

## Task list (each task: implement → verify (lint + tsc + build) → commit; two-stage review per task)

### Task 1 — Scaffold + tooling
Vite react-ts template into the repo root (files already present: docs/, .git). Exact-pin ALL deps. `.nvmrc` 22. ESLint flat config per conventions; husky + commit-msg hook copied from the TS sibling; `.env.example` (`VITE_API_BASE_URL=http://localhost:5257`); `index.html` title "Pokedex"; remove template boilerplate (logos, counter). Placeholder `src/App.tsx` rendering an empty shell. README stub (one paragraph — docs pass later). Verify `npm run lint`, `tsc --noEmit`, `npm run build`, `npm run dev` boots. Commit: `Create pokedex web scaffolding with vite react and typescript`

### Task 2 — Tailwind v4 + themes + core UI kit
`@tailwindcss/vite` + `src/themes/themes.css` implementing the four palettes above + `@theme inline` token mapping; no-flash inline script; `ThemeProvider`/`useTheme` hook; shadcn-style primitives copied into `src/components/ui/` (Button, Card, Input, Select, Dialog, Badge, Skeleton — hand-rolled on Radix + cva, token-driven); header shell with the theme switcher (Select cycling 4 themes, labels via i18n keys later). Verify each theme visually via dev server (screenshot or DOM assertion of computed styles). Commit: `Add tailwind theme system with four game palettes`

### Task 3 — i18n
react-i18next; `src/i18n/{en,es}.json` resource files covering ALL UI strings (nav, auth forms, browse, detail, collection, errors, switchers); `LanguageProvider` init (default browser-detect en/es, persisted `pokedex.language`); header language switcher. NO hardcoded user-facing strings anywhere after this task — enforce via review. Commit: `Add internationalization with english and spanish locales`

### Task 4 — Store + API layer
Per the Store design above: apiTarget slice + dynamic baseQuery + reauth wrapper + endpoints + envelope transforms + tags; authSlice; uiSlice; typed hooks (`useAppDispatch/useAppSelector`); store provider wired in main.tsx. Types mirroring the backend DTOs (PokemonListItem, PokemonDetail, LocalPokemon, PagedMeta, AuthSession). Commit: `Add redux store with api layer and token refresh`

### Task 5 — Routing + auth pages
react-router 7: routes `/` (browse), `/pokemon/:idOrName` (detail — accepts either, links pass id), `/collection` (protected), `/login`, `/register`. `RequireAuth` wrapper redirecting to /login preserving return path. Login/Register pages: shadcn forms, validation messages via i18n, error display from API `msg`, loading states; on success → redirect. Header: auth state (login link vs user email + logout). Commit: `Add routing with authentication pages`

### Task 6 — Browse + detail pages
Browse: responsive card grid (sprite, name, types-as-badges? list item has abilities not types — use category + abilities badges), pagination controls (prev/next + numbered around current + page-size Select 10/20/50 persisted), loading skeletons, error state with retry. Detail: large artwork, stats bars, types, abilities, description, evolution chain (clickable names → detail by name), sync button (auth-gated: hidden or prompting login), back nav. Commit: `Add pokedex browse and detail pages`

### Task 7 — Collection page
Protected page listing local records (paginated, same page-size control): table/cards with localizedName/region/classificationTag/description edit dialog (whitelisted fields only, ≤500 chars client-side mirroring the backend), delete with confirm dialog, empty state pointing at sync. Commit: `Add local collection management page`

### Task 8 — Backend switcher + polish + sweep
Header backend switcher (three targets with service labels + health indicator: ping `/api/pokemons?page=1&pageSize=1` on switch — noting it just resets query cache, keeps session); graceful global error toast for 5xx (`msg` passthrough); document title per page; favicon (pokeball svg); final sweep: lint + tsc + build clean, then LIVE smoke: boot the TS backend (3001) with a dev secret, `npm run dev`, walk browse → detail → theme cycling → language toggle → pagination sizes → backend switch to a DOWN target (graceful error state) and back. Screenshot evidence. Commit: `Add backend switcher with error handling polish`

### Phase gate — full-flow live review
Reviewer boots the TS backend + the frontend, walks every page/flow (auth flows will 500 without a live DB — verify the UI surfaces the error gracefully and the rest of the app is unaffected), verifies: all four themes render token-complete (no unthemed surfaces), both languages cover every visible string, pagination + page-size persistence, backend switcher against two live backends (.NET too), refresh-on-401 wiring (inspectable via devtools network log — may require a live DB to fully exercise; verify the code path via a crafted 401 if not), build output clean. Verdict + evidence.

# NoteVault

Personal knowledge vault built with **Next.js 16**, **Clerk**, **Convex**, and **Tailwind CSS v4**.

## Features

- Vault home with stats, templates, open tasks, and recent entries
- Collections and rich block editor (`/` commands)
- Custom + built-in templates
- Share links (viewer / editor roles)
- Bin, favorites, tags, daily notes, PWA shell

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Backend / DB | Convex |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |

## Quick start

### 1. Install

```bash
npm install
cp env.example .env.local
```

### 2. Convex

```bash
npx convex dev
```

Writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local` and syncs functions.

### 3. Clerk

1. Create a Clerk application and copy keys into `.env.local` (see `env.example`).
2. In Clerk → **Integrations**, enable **Convex** (JWT template named `convex`).
3. Copy the **Frontend API URL** (e.g. `https://verb-noun-00.clerk.accounts.dev`).
4. In the [Convex dashboard](https://dashboard.convex.dev) → your **dev** deployment → Settings → Environment Variables, set:

```
CLERK_JWT_ISSUER_DOMAIN=https://your-frontend-api.clerk.accounts.dev
```

5. Re-run `npx convex dev` so `auth.config.ts` picks it up.

### 4. Run

```bash
npm run dev
# or both: npm run dev:all
```

Open http://localhost:3000

## Deploy to Vercel

### A. Convex production

```bash
npx convex deploy
```

In the Convex dashboard → **Production** deployment:

1. Set `CLERK_JWT_ISSUER_DOMAIN` to your **production** Clerk Frontend API URL (or keep the same Clerk app for staging).
2. Create a **Deploy key** (Settings → Deploy keys).

### B. Clerk production

1. Switch to Clerk **production** instance (or use live keys).
2. Allowed origins / redirect URLs: `https://your-app.vercel.app`, `/sign-in`, `/sign-up`, `/`.
3. Ensure the Convex JWT template remains enabled.

### C. Vercel project

1. Import the Git repo in Vercel (Framework: Next.js).
2. Set environment variables (Production + Preview as needed):

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL (also set automatically by `build:vercel` when using a deploy key) |
| `CONVEX_DEPLOY_KEY` | Convex production deploy key (required for `npm run build:vercel`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` for production |
| `CLERK_SECRET_KEY` | `sk_live_…` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |

3. Build command is already in `vercel.json`: `npm run build:vercel` (deploys Convex, then builds Next).
4. Deploy.

Local production build without deploying Convex:

```bash
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js (Turbopack) |
| `npm run dev:all` | Convex + Next |
| `npm run build` | Next production build |
| `npm run build:vercel` | `convex deploy` + Next build (Vercel) |
| `npm run deploy:convex` | Deploy Convex only |
| `npm test` / `npm run test:e2e` | Playwright e2e (chromium) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:storybook` | Storybook smoke (opt-in) |
| `npm run playwright:install` | Install Chromium for Playwright |

## Environment

See [`env.example`](./env.example). Do not commit `.env.local`.

**Note:** Vault data is keyed by Clerk `userId`. Local anonymous UUIDs are no longer used — after signing in, each Clerk user has their own vault.

## License

MIT

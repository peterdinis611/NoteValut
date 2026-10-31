# NoteValut

Note vault scaffold built with:

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** v4
- **shadcn/ui**
- **Effect.ts** for domain validation and typed errors
- **Appwrite** (`@appwrite.io/react`) for auth/backend (SSR-ready)

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Appwrite setup

1. Create a project in the [Appwrite Console](https://cloud.appwrite.io/console).
2. Under **Add a platform**, add a **Web app** with hostname `localhost`.
3. Create an API key with scopes `users.read`, `users.write`, and `sessions.write`.
4. Fill `.env.local` with your endpoint, project ID, and API key.

Wiring already in place:

- `src/lib/appwrite/` — env helpers, Effect `Appwrite` service, server helpers
- `src/lib/effect-server.ts` — `runServer()` for RSC / server actions
- `src/domain/account.ts` — `getSessionAccount` Effect use-case
- `src/app/providers.tsx` — `AppwriteProvider` (SSR session)
- `src/app/api/appwrite/[...appwrite]/route.ts` — SSR auth handlers

Example in a server component:

```ts
import { getSessionAccount } from "@/domain/account";
import { runServer } from "@/lib/effect-server";

const account = await runServer(getSessionAccount());
```

## Project layout

```
src/
  app/                 # Next.js routes + Appwrite providers/handlers
  components/ui/       # shadcn primitives
  components/notes/    # note vault UI
  domain/              # Effect schemas & use-cases
  lib/                 # shared helpers (cn, Effect, Appwrite)
```

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start Turbopack dev server          |
| `npm run build`      | Production build (webpack — Appwrite Sites) |
| `npm run build:turbo`| Production build with Turbopack     |
| `npm run typecheck`  | `tsc --noEmit` (run before deploy)  |
| `npm run start`      | Start production server             |
| `npm run lint`       | Run ESLint                          |

### Appwrite Sites

Console → **Sites** → your site → **Settings → Build settings**:

- Framework: **Next.js**
- Rendering: **Server-side rendering (SSR)** (required — Static returns Appwrite `router_path_not_found`)
- Install: `npm install`
- Build: `npm run build` (webpack; Turbopack builds currently 404 on Sites)
- Output directory: `./.next`

Also raise **build** memory if the job is killed during TypeScript / compile, and redeploy after changing settings.

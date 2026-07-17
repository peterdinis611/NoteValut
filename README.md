# NoteVault 📓

A modern note-taking app built with **Next.js**, **TypeScript**, **Convex**, **Fluent UI**, and **Tailwind CSS**.

## Features

## Features

- **Vault home** — dashboard with stats, templates, open tasks, and recent entries
- **Collections** — folders to organize entries (with labels, descriptions, grid view)
- **Entries** — rich block editor with `/` commands (callouts, vault links, tasks…)
- **Templates** — meeting notes, journal, project brief, checklist
- **Quick capture** — floating button saves to Inbox instantly
- **Bin** — soft-delete with restore and empty bin
- **Favorites, search, color labels**, duplicate entry, real-time Convex sync

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Backend / DB | Convex |
| UI | Fluent UI v9 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |

## Quick start

### 1. Install dependencies

```bash
cd notevault
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will:
- Create/link a Convex project
- Write `NEXT_PUBLIC_CONVEX_URL` to `.env.local`
- Push your schema and functions
- Regenerate `convex/_generated/`

### 3. Run the app

In a second terminal:

```bash
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

Open **http://localhost:3000**

## Project structure

```
notevault/
├── convex/
│   ├── schema.ts       # Notes table schema
│   └── notes.ts        # Queries & mutations
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Sidebar, editor, providers
│   ├── hooks/          # useOwnerId
│   └── lib/            # Helpers
└── .env.local          # Convex URL (auto-created)
```

## Convex functions

| Function | Type | Description |
|----------|------|-------------|
| `notes.list` | query | List notes with search |
| `notes.get` | query | Get single note |
| `notes.create` | mutation | Create note |
| `notes.update` | mutation | Update note fields |
| `notes.remove` | mutation | Delete note + children |
| `notes.seedDemo` | mutation | Seed welcome notes |

## Environment

Copy `.env.local.example`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run dev:all` | Convex + Next.js together |
| `npm run build` | Production build |
| `npx convex dev` | Convex dev + schema push |

## License

MIT

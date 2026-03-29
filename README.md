# Setter 🏐

> *Like a volleyball setter who reads the game and sets up every play — Setter reads where Roma is and sets up her next move toward college.*

A personal AI-powered companion for Roma, built to guide her from high school through college admission.

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm
- Supabase account
- Anthropic API key
- Vercel account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/setter-app.git
cd setter-app
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Go to Storage and create a bucket called `uploads` (private)
4. Copy your project URL and anon key

### 3. Environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Run locally

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
setter-app/
├── CLAUDE.md              ← AI coding context (read this first in Claude Code)
├── apps/
│   ├── web/               ← Next.js web app
│   └── mobile/            ← Expo React Native (Phase 2)
├── packages/
│   ├── shared/            ← Types, utils, Supabase clients
│   └── ui/                ← Shared components
└── supabase/
    └── migrations/        ← Database migrations
```

## Build Phases

| Phase | Status | Features |
|---|---|---|
| 1 | 🔨 In Progress | Foundation — Tasks, Journal, Auth |
| 2 | ⏳ Planned | AI Chat, Mobile (Expo) |
| 3 | ⏳ Planned | Achievements, Dashboard |
| 4 | ⏳ Planned | Portfolio, Teen UX Polish |

## Tech Stack

- **Web**: Next.js 14 (App Router) on Vercel
- **Mobile**: React Native with Expo
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: Anthropic Claude API
- **Styling**: Tailwind CSS + shadcn/ui

---

*Built by Sri, for Roma.* 🏐

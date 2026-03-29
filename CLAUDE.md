# Setter — Claude Code Context

## What is Setter?
Setter is a personal AI-powered companion app for Roma, a high school student and volleyball setter,
designed to guide her from 9th grade through college admission. The name "Setter" is intentional —
like a volleyball setter who reads the game and sets up every play, this app reads where Roma is
and sets up her next move toward her goals.

## Who uses it?
- **Roma** — the primary user. Teenager, volleyball player (setter position), loves football and basketball.
  The app must feel like hers — personal, not generic.
- **Dad (Sri)** — builds and maintains the app. Data engineer. Wants clean, maintainable code.

## Core Roles of the App
1. **Planner** — daily task execution
2. **Memory** — journal, context, history
3. **Advisor** — AI chatbot with Roma's full context injected

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web | Next.js 14 (App Router) on Vercel |
| Mobile | React Native with Expo (iOS first) |
| Backend/DB | Supabase (Postgres + Auth + Storage + Realtime) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Styling | Tailwind CSS + shadcn/ui |
| Monorepo | Turborepo (apps/web, apps/mobile, packages/shared) |

---

## Monorepo Structure

```
setter-app/
├── CLAUDE.md                  ← you are here
├── turbo.json
├── package.json
├── apps/
│   ├── web/                   ← Next.js web app (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/        ← login, signup
│   │   │   ├── (dashboard)/   ← main app shell
│   │   │   │   ├── tasks/
│   │   │   │   ├── journal/
│   │   │   │   ├── chat/
│   │   │   │   ├── achievements/
│   │   │   │   └── portfolio/
│   │   │   └── api/
│   │   │       ├── chat/      ← Claude API route
│   │   │       └── achievements/ ← auto-achievement generation
│   │   └── components/
│   └── mobile/                ← Expo React Native (iOS)
│       ├── app/               ← Expo Router
│       └── components/
└── packages/
    ├── shared/                ← types, utils, Supabase client
    │   ├── types/             ← TypeScript types for all entities
    │   └── supabase/          ← shared Supabase client config
    └── ui/                    ← shared UI components (web + mobile)
```

---

## Supabase Database Schema

All tables live in the `public` schema. Row Level Security (RLS) is enabled on all tables.
Users can only access their own rows.

### Tables
- `users` — extends Supabase auth.users with profile, grade, goals summary
- `tasks` — title, category, priority, status, due_date
- `journal_entries` — content, mood, prompt_used, has_attachment
- `achievements` — title, description, source (auto|manual), category, date
- `goals` — title, description, target_date, status, linked_to (college|personal|athletic)
- `uploads` — file_path (Supabase Storage), linked_entity_type, linked_entity_id
- `chat_sessions` — session messages stored as JSONB array

### Key design principle
Every table has `user_id uuid references auth.users(id)` and `created_at timestamptz`.
This timeline is what makes AI context rich over time — never skip timestamps.

---

## AI Design — Context Injection

This is the most important part of the app. Never simplify it.

### Context pipeline (every chat message):
```
1. Pull last 7 days of tasks (completed + pending)
2. Pull last 3 journal entries (content summary)
3. Pull top 5 active goals
4. Pull achievements from last 30 days
5. Build system prompt with all of the above
6. Send to Claude API with streaming
7. Store assistant response in chat_sessions
```

### System prompt structure:
```
You are Setter, a supportive college companion for Roma, a [grade] student and volleyball setter.

About Roma:
[grade, current goals, sport]

Recent activity:
- Tasks completed this week: [list]
- Tasks pending: [list]
- Recent journal themes: [summary]
- Recent achievements: [list]
- Active goals: [list]

Your role:
- Guide and encourage, never do the work for her
- Ask questions that make her think
- Reference her actual context (tasks, goals, achievements) when relevant
- Keep responses warm but concise — she's a teenager, not a corporate client
- Celebrate wins genuinely, not generically
```

### Claude API call:
- Model: `claude-sonnet-4-20250514`
- Max tokens: 1024
- Stream: true
- Temperature: default

---

## Design Principles

- **Mobile-first** — Roma will use this on iPhone. Web is secondary.
- **Friction-free** — open app, see what to do, do it. No onboarding maze.
- **Personal, not generic** — references volleyball, her goals, her name. Never feels like a school tool.
- **Private by default** — journal has optional PIN lock separate from app auth.
- **Achievement-forward** — wins should feel good. Animations on achievement unlock.

---

## Environment Variables

### Web app (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### Mobile app (.env)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=        ← points to web app API routes
```

---

## Development Rules (follow always)

1. **TypeScript everywhere** — no `any` types, define all entities in `packages/shared/types`
2. **Supabase RLS** — never query without user context. Always filter by `user_id`
3. **API routes for AI** — never call Claude API from client. Always go through `/api/chat`
4. **Streaming responses** — use `StreamingTextResponse` for chat. Never wait for full response.
5. **Error boundaries** — every page needs one. Roma should never see a raw error.
6. **Optimistic UI** — task completion, journal save should feel instant. Sync in background.
7. **Mobile parity** — every feature built on web must be tracked for mobile implementation

---

## Current Build Phase

**Phase 1 (now):** Foundation
- [ ] Supabase schema migration
- [ ] Next.js scaffold with Supabase auth
- [ ] Tasks CRUD (web)
- [ ] Journal entries (web)

**Phase 2:** AI + Mobile
- [ ] Claude API chat route with context injection
- [ ] Expo app scaffold
- [ ] Tasks + Journal on mobile

**Phase 3:** Achievements + Polish
- [ ] Auto-achievement generation
- [ ] Dashboard with timeline
- [ ] Push notifications (Expo)

**Phase 4:** Portfolio + Teen UX
- [ ] Public portfolio page (no auth required)
- [ ] Roma UX review session
- [ ] Theming and personalization

---

## Key Files to Know

| File | Purpose |
|---|---|
| `packages/shared/types/index.ts` | All TypeScript entity types |
| `packages/shared/supabase/client.ts` | Supabase client (browser) |
| `packages/shared/supabase/server.ts` | Supabase client (server/RSC) |
| `apps/web/app/api/chat/route.ts` | Claude API integration |
| `apps/web/app/api/achievements/route.ts` | Auto-achievement logic |
| `supabase/migrations/` | All DB migrations in order |

---

## Notes for Claude Code Sessions

- Always check `packages/shared/types/index.ts` before creating new data structures
- Always use the server Supabase client in API routes and Server Components
- Always use the browser Supabase client in Client Components
- The chat API route is the most sensitive — test context injection carefully
- Roma is the end user — if a UI decision feels like it's for a developer, reconsider it

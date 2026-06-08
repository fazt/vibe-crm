# Vibe CRM

Modern CRM for small agencies, freelancers, and service businesses. Multi-tenant workspaces, pipeline Kanban, tasks, notes, activities, and more.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15, TypeScript, Tailwind, shadcn/ui, React Hook Form, Zod, Zustand |
| Backend | NestJS REST API |
| Database | PostgreSQL + Prisma ORM |
| Files | DigitalOcean Spaces (S3-compatible) |
| Email | Resend |

## Project structure

```
apps/
  web/     → Next.js frontend (port 3000)
  api/     → NestJS backend (port 4000)
packages/
  database/    → Prisma schema, migrations, seed
  validators/  → Shared Zod schemas
  shared/      → Types, enums, constants
  emails/      → Resend email templates
  config/      → Shared TS configs
```

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` with your secrets. Defaults work for local dev with Docker Postgres on port **5457** (change in `docker-compose.yml` if the port is taken).

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Database setup

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Run dev servers

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api

### Demo credentials

After seeding:

- **Email:** `demo@vibecrm.com`
- **Password:** `password123`

## Features

- **Auth** — Register, login, JWT refresh, forgot/reset password
- **Workspaces** — Multi-tenant with roles (Owner, Admin, Member)
- **CRM** — Clients, companies, contacts with search, filters, pagination
- **Pipeline** — Kanban drag & drop for opportunities
- **Productivity** — Tasks, notes, activities, reminders
- **Documents** — Upload to DigitalOcean Spaces via presigned URLs
- **Search** — Global search with `Cmd+K` / `Ctrl+K`
- **Dashboard** — KPIs: pipeline value, overdue tasks, win rate
- **Notifications** — In-app + email via Resend
- **Cron jobs** — Due reminders, overdue tasks digest, stale opportunity alerts

## API overview

All workspace-scoped endpoints require:

```
Authorization: Bearer <accessToken>
X-Workspace-Id: <workspaceId>
```

Key routes:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account + workspace |
| POST | `/api/auth/login` | Login |
| GET | `/api/clients` | List clients (paginated) |
| GET | `/api/opportunities/kanban` | Kanban board data |
| PATCH | `/api/opportunities/:id/stage` | Move opportunity |
| GET | `/api/search?q=` | Global search |
| GET | `/api/dashboard/metrics` | Dashboard KPIs |
| POST | `/api/documents/presign` | Get upload URL |

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `SPACES_KEY` / `SPACES_SECRET` | DigitalOcean Spaces credentials |
| `SPACES_BUCKET` / `SPACES_ENDPOINT` | Spaces bucket and endpoint |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Sender address |
| `NEXT_PUBLIC_API_URL` | API URL for frontend |

## Future integrations

Stub interfaces in `packages/shared/src/integrations.ts`:

- `EmailSyncProvider` — Inbox sync
- `WhatsAppProvider` — Messaging
- `ConversationSummaryProvider` — AI note summaries

Webhook stub: `POST /api/webhooks/inbound` (disabled, returns 503).

## Scripts

```bash
pnpm dev          # Start web + api
pnpm build        # Production build
pnpm lint         # Type-check all packages
pnpm db:migrate   # Run Prisma migrations
pnpm db:seed      # Seed demo data
pnpm db:studio    # Open Prisma Studio
```

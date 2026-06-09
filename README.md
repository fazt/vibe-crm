# Vibe CRM

Modern CRM for small agencies, freelancers, and service businesses. Multi-tenant workspaces, pipeline Kanban with live updates, RBAC, Stripe billing, and a full marketing site.

**Version:** `0.3.2`

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15, TypeScript, Tailwind, shadcn/ui, React Hook Form, Zod, Zustand, Socket.IO client |
| Backend | NestJS REST API + Socket.IO gateway |
| Database | PostgreSQL + Prisma ORM |
| Files | DigitalOcean Spaces (S3-compatible, presigned uploads) |
| Email | Resend |
| Billing | Stripe (checkout, portal, webhooks) |
| Deploy | Railway (`railway.toml` per service) |

## Project structure

```
apps/
  web/     → Next.js frontend (port 3000)
  api/     → NestJS backend (port 4000)
packages/
  database/    → Prisma schema, migrations, seed
  validators/  → Shared Zod schemas
  shared/      → Types, enums, permissions, plan limits
  emails/      → Resend email templates
  config/      → Shared TS configs
scripts/       → Railway env sync, Cloudflare tunnel, role tests
docs/changelog/ → Release history
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

Edit `.env` with your secrets. Defaults work for local dev with Docker Postgres on port **5457**.

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

- **Web:** http://localhost:3000
- **API:** http://localhost:4000/api

### Stripe webhooks (local)

Expose the API for Stripe webhooks:

```bash
pnpm tunnel:api
```

Register the tunnel URL in Stripe Dashboard → `POST /api/webhooks/stripe`.

## Demo credentials

After `pnpm db:seed`, all accounts use password **`password123`**:

| Email | Platform role | Workspace role | Workspace |
|-------|---------------|----------------|-----------|
| `demo@vibecrm.com` | Subscriber | Owner | Demo Agency |
| `admin@vibecrm.com` | Superadmin | — | — |
| `tset@test.com` | User (free) | Owner | mytestcompany |
| `wsadmin@vibecrm.com` | User | Admin | Demo Agency |
| `member@vibecrm.com` | User | Member | Demo Agency |

## Features

### Core CRM
- **Auth** — Register, login, JWT refresh, forgot/reset password, GitHub OAuth
- **Workspaces** — Multi-tenant with roles (Owner, Admin, Member)
- **CRM** — Clients, companies, contacts with search, filters, pagination, CRUD dialogs
- **Pipeline** — Kanban drag & drop, realtime updates via Socket.IO
- **Productivity** — Tasks, notes, activities, reminders, tags
- **Documents** — Upload to DigitalOcean Spaces via presigned URLs
- **Search** — Global search with `Cmd+K` / `Ctrl+K`
- **Dashboard** — KPIs: pipeline value, overdue tasks, win rate
- **Notifications** — In-app inbox + email via Resend
- **Cron jobs** — Due reminders, overdue tasks digest, stale opportunity alerts

### Platform & billing
- **RBAC** — Platform roles (`user`, `subscriber`, `superadmin`) + workspace roles with granular permissions
- **Plan limits** — Solo / Studio / Agency caps enforced on create endpoints
- **Stripe** — Checkout, customer portal, webhooks, 14-day Studio trial
- **Admin panel** — Superadmin user/role management at `/settings/admin`

### UI
- Light / dark / system theme
- Profile avatar upload (Spaces, public-read ACL)
- Marketing site: landing, pricing (live plans from API), contact form
- Billing page with plan usage meters

## API overview

Workspace-scoped endpoints require:

```
Authorization: Bearer <accessToken>
X-Workspace-Id: <workspaceId>
```

Platform routes (billing, admin, profile) skip the workspace header.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account + workspace |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/me` | Profile, permissions, plan, usage |
| GET | `/api/clients` | List clients (paginated) |
| GET | `/api/opportunities/kanban` | Kanban board data |
| PATCH | `/api/opportunities/:id/stage` | Move opportunity |
| GET | `/api/search?q=` | Global search |
| GET | `/api/dashboard/metrics` | Dashboard KPIs |
| POST | `/api/documents/presign` | Get upload URL |
| POST | `/api/billing/checkout` | Stripe checkout session |
| POST | `/api/webhooks/stripe` | Stripe subscription webhooks |
| POST | `/api/contact` | Public contact form (no auth) |

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `API_PORT` / `PORT` | API port (`PORT` on Railway) |
| `WEB_URL` | Frontend origin (CORS, Stripe redirects, OAuth) |
| `JWT_ACCESS_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | Token lifetimes |
| `SPACES_*` | DigitalOcean Spaces credentials + `SPACES_PUBLIC_URL` for avatars |
| `RESEND_API_KEY` / `EMAIL_FROM` / `CONTACT_EMAIL` | Transactional email |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` | GitHub OAuth |
| `STRIPE_*` | Stripe keys, price IDs, webhook secret, trial days |
| `SUPERADMIN_EMAIL` | Superadmin seed email |
| `NEXT_PUBLIC_API_URL` | API URL for the frontend |

See `.env.example` for the full list.

## Scripts

```bash
pnpm dev            # Start web + api (turbo)
pnpm build          # Production build
pnpm lint           # Type-check all packages
pnpm db:generate    # Prisma client generate
pnpm db:migrate     # Run migrations (dev)
pnpm db:seed        # Seed demo + RBAC data
pnpm db:studio      # Open Prisma Studio
pnpm tunnel:api     # Cloudflare quick tunnel → localhost:4000
```

Production migrations: `pnpm --filter @vibe-crm/database migrate:deploy`

## Deploy (Railway)

- `apps/api/railway.toml` and `apps/web/railway.toml` per service
- `scripts/railway-sync-env.cjs` — sync env vars to Railway
- `scripts/railway-seed.cjs` — run seed on production DB

Set `PORT`, `DATABASE_URL`, `WEB_URL`, `NEXT_PUBLIC_API_URL`, and Stripe/Spaces/Resend secrets in Railway.

## Future integrations

Stub interfaces in `packages/shared/src/integrations.ts`:

- `EmailSyncProvider` — Inbox sync
- `WhatsAppProvider` — Messaging
- `ConversationSummaryProvider` — AI note summaries

Webhook stub: `POST /api/webhooks/inbound` (disabled, returns 503).

## Links

- **Repository:** https://github.com/fazt/vibe-crm
- **Changelog:** [docs/changelog/CHANGELOG.md](docs/changelog/CHANGELOG.md)

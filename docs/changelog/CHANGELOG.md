# Changelog

All notable changes to Vibe CRM are documented here.  
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] — 2026-06-09

Fix workspace header race causing "Workspace header required" on app load.

### Fixed

- App layout waits for workspace fetch and `currentWorkspaceId` before rendering
- `X-Workspace-Id` header reads from Zustand store via `workspace-id` helper (not stale localStorage)
- Topbar notifications and `useWorkspaceMembers` skip API calls until workspace is ready

## [0.3.0] — 2026-06-09

Full CRM CRUD UI for opportunities, tasks, activities, and core entities.

### Added

- Task, activity, and note dialogs with create/edit/delete and permission gates
- `CreateOpportunityDialog` and expanded opportunity detail (all fields + delete)
- Edit/delete dialogs for clients, companies, and contacts
- Contact detail page at `/contacts/[id]`
- Satellite UI: reminders, notifications inbox, tags management, pipeline stages view
- `useWorkspaceMembers` hook for assignee selectors
- Quick-add actions on client detail tabs (tasks, notes, activities, opportunities)
- Global search: companies and activities; fixed task/contact deep-links

### Changed

- Tasks and activities pages use Suspense + `?id=` dialog deep-links
- Sidebar: reminders, notifications, tags, and pipeline settings links
- Topbar bell links to notifications inbox
- Companies create button gated by `COMPANIES_CREATE` permission

## [0.2.1] — 2026-06-09

Railway production deploy fixes and GitHub OAuth schema alignment.

### Added

- Prisma migration `20260609020000_add_user_github_id` for `User.githubId` (GitHub OAuth)
- `migrate:deploy` script in `@vibe-crm/database` for production migrations
- Railway config: `railway.toml` for api and web, service config JSON, env sync and seed scripts

### Fixed

- API listens on `PORT` (Railway) with fallback to `API_PORT` — fixes healthcheck failures on deploy

## [0.2.0] — 2026-06-09

RBAC, Stripe billing, avatar uploads, and realtime Kanban updates.

### Added

#### Platform & RBAC
- Granular permission system (`packages/shared/src/permissions.ts`) with platform and workspace scopes
- Prisma migration `rbac_and_subscriptions`: roles, permissions, plan subscriptions, usage tracking
- `seed-rbac.ts` and expanded demo seed with role assignments
- Permission guards on API controllers; `@RequirePermissions` / `@SkipWorkspace` decorators

#### Billing (Stripe)
- Checkout sessions, customer portal, plan catalog, and webhook handling
- Plan limits enforcement (workspaces, clients, contacts, members, etc.)
- Billing settings page and dynamic marketing pricing from `GET /billing/plans`
- `PlanUsageMeter` on workspace and contacts settings

#### Admin
- Superadmin routes: user CRUD, role management, permission assignment
- Admin UI under `/settings/admin/users` and `/settings/admin/roles`

#### Avatars & storage
- Profile avatar upload flow: presign → PUT to Spaces → confirm
- Public-read ACL on avatar uploads so images render in UI
- `AvatarUpload` component; avatar shown in profile and topbar
- Spaces CORS / `SPACES_PUBLIC_URL` documented in `.env.example`

#### Realtime
- Socket.IO gateway for workspace-scoped events (Kanban live updates)
- `useWorkspaceSocket` hook and opportunity board integration

#### Frontend
- Light / dark / system theme (`ThemeProvider`, `ThemeToggle`)
- Opportunities page split into server shell + `page-client` with Kanban and detail dialog
- Auth token helpers (`lib/auth-tokens.ts`) and improved API refresh handling
- Cloudflare tunnel script and `.cloudflared/config.example.yml`

#### Tooling
- Agent skills: `my-commit`, `my-review`
- `scripts/test-roles.mjs` and `scripts/test-all-roles.ps1`

### Changed
- `/users/me` returns permissions, plan, limits, and usage alongside profile
- Profile name updates no longer accept `avatarUrl` via PATCH (dedicated avatar endpoints only)
- Marketing pricing page fetches plans from API instead of hardcoded tiers
- README environment variable table aligned with `.env.example`
- `.gitignore`: `*.tsbuildinfo`, Playwright artifacts

### Fixed
- Avatar images not displaying after upload (Spaces returned 403 without `public-read` ACL)

## [0.1.0] — 2026-06-08

First public release (`vibe-crm@0.1.0`): full CRM core, marketing site, and transactional email for contact.

### Added

#### Platform
- Turborepo monorepo with `apps/web`, `apps/api`, and shared packages (`database`, `validators`, `shared`, `emails`, `config`)
- PostgreSQL + Prisma schema, migrations, and demo seed (`demo@vibecrm.com` / `password123`)
- Docker Compose for local Postgres (port 5457)
- Environment template (`.env.example`) with JWT, Spaces, and Resend variables

#### Backend (NestJS)
- JWT auth: register, login, refresh, forgot/reset password, GitHub OAuth routes
- Multi-tenant workspaces with role-based access (Owner, Admin, Member)
- CRM modules: clients, companies, contacts, opportunities (list + Kanban stage moves), pipeline stages, tasks, notes, activities, reminders, tags, documents (presigned uploads)
- Global search, in-app notifications, dashboard metrics
- Scheduled jobs: due reminders, overdue task digests, stale opportunity alerts (email via Resend)
- Public contact endpoint `POST /api/contact` with Zod validation and Resend delivery
- Webhook stub `POST /api/webhooks/inbound` (disabled)

#### Frontend — App (Next.js 15)
- Authenticated app shell: sidebar, topbar, workspace switcher, command palette (`Cmd+K`)
- **Studio Warm** design system: copper rail surfaces, shared primitives (`Surface`, `StatTile`, `AuthShell`, `DetailHeader`, `FormSection`)
- Pages: dashboard (KPIs, pipeline strip, win rate), clients, companies, contacts, opportunities (Kanban + list), tasks, activities, settings (profile, workspace)
- Auth flows: login, register, forgot/reset password, GitHub callback

#### Frontend — Marketing
- Landing page (`/`) with **Pipeline Pulse** editorial aesthetic (Fraunces + Sora)
- Pricing page (`/pricing`) with Solo, Studio, and Agency tiers + FAQ
- Contact page (`/contact`) wired to backend `POST /api/contact`
- Shared marketing nav and footer

#### Email (Resend)
- Templates: welcome, password reset, reminders, overdue tasks, stale opportunities, contact form, contact confirmation
- Config: `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`

### Changed
- Root route `/` serves marketing landing for guests; authenticated users redirect to `/dashboard`
- Contact form logic lives in the API (not Next.js route handlers); web calls `NEXT_PUBLIC_API_URL/contact`

### Security
- Workspace-scoped routes require `Authorization` + `X-Workspace-Id`
- `.env` and `.env.local` excluded from version control

### Known limitations
- Inbound webhooks and several integration stubs return 503
- DigitalOcean Spaces upload requires credentials; works without them only where uploads are skipped
- GitHub OAuth requires `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` to be configured

[0.2.0]: https://github.com/fazt/vibe-crm/releases/tag/v0.2.0
[0.1.0]: https://github.com/fazt/vibe-crm/releases/tag/v0.1.0

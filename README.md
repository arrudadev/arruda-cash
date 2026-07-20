# naja-cash

naja-cash is a **personal finance management** app — a place to track money, budgets, and spending. It's invite-only: there's no public signup, access is granted by whoever runs the app.

This repo currently holds the foundation the product is built on (auth/invites, base UI kit, dev tooling); finance-specific features (accounts, transactions, budgets, ...) are still to come.

Full-stack, built with **AdonisJS 7** + **Inertia.js** + **React 19**, using **Lucid/SQLite** locally (with a **Turso** production path already wired), **Tailwind CSS v4 + shadcn/ui** for the UI, and **Biome** for linting/formatting.

## Stack

| Layer | Choice |
|---|---|
| Backend framework | [AdonisJS 7](https://adonisjs.com) |
| Frontend | [Inertia.js](https://inertiajs.com) + [React 19](https://react.dev) (no SSR) |
| Database / ORM | [Lucid](https://lucid.adonisjs.com) — SQLite locally, [Turso](https://turso.tech) (libSQL) in production |
| Auth | Session-based, invite-only (see [Authentication](#authentication) below) |
| Email | [Mailpit](https://mailpit.axllent.org) locally, [Resend](https://resend.com) in production |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Lint / format | [Biome](https://biomejs.dev) |
| Package manager | [pnpm](https://pnpm.io) |
| Tests | [Japa](https://japa.dev) |

See [`CLAUDE.md`](./CLAUDE.md) for the deeper architectural notes (code-generation layer, import aliases, conventions) aimed at anyone — human or AI agent — working in this codebase.

## Prerequisites

- Node.js ≥ 24
- pnpm (`corepack enable` or `npm i -g pnpm`)
- Docker, if you want the one-command dev setup (recommended)

## Getting started

### Option A — Docker Compose (recommended)

Boots the app and a local Mailpit inbox together, with hot-reload.

```sh
cp .env.example .env
docker compose run --rm app node ace generate:key   # writes APP_KEY into .env
make up                                              # builds + starts the stack in the background
make migrate                                         # first run only, if the DB doesn't exist yet
```

- App: http://localhost:3333
- Mailpit (catches invite emails): http://localhost:8025

Run `make help` for the full list of shortcuts (`invite`, `logs`, `shell`, `test`, `lint`, `typecheck`, `down`, ...).

### Option B — Native

```sh
cp .env.example .env
pnpm install
node ace generate:key      # writes APP_KEY into .env
node ace migration:run
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
pnpm dev
```

## Environment variables

Copy `.env.example` to `.env` and fill it in — every variable is documented there. The essentials:

| Variable | Purpose |
|---|---|
| `APP_KEY` | Required, used for encryption/signing. Generate one and never commit it. |
| `SESSION_DRIVER`, `DB_CONNECTION` | Default to `cookie` / SQLite — no setup needed for local dev. |
| `MAIL_MAILER`, `SMTP_*` | Default to Mailpit locally. Switch to `MAIL_MAILER=resend` + `RESEND_API_KEY` in production. |
| `DB_CONNECTION=turso` + `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Opt into Turso instead of local SQLite (typically production). |

## Authentication

There is **no public signup**. Accounts are created only through an invite:

```sh
make invite EMAIL=someone@example.com NAME="Someone"   # Docker Compose
# or, natively:
node ace invite:create someone@example.com "Someone"
```

This emails a link (Mailpit locally) to `/invite/accept?token=...`. The invitee sets a password there, and the account is created and logged in — a login page and a protected `/dashboard` are the only other auth-related routes. Invite tokens expire after 72h and are single-use.

## Available commands

**pnpm scripts** (run natively or via `make shell`):

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server with HMR |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm test` | Run the Japa test suites |
| `pnpm lint` | Biome check |
| `pnpm format` | Biome check --write |
| `pnpm typecheck` | TypeScript, server + frontend |

**Makefile** (Docker Compose shortcuts) — `make help` for the full, current list.

## Project structure

```
app/
  controllers/    # HTTP controllers
  models/         # Lucid models (compose generated schema classes)
  validators/     # VineJS validators
  middleware/     # auth, guest, inertia, ...
config/           # framework/package config (auth, database, mail, ...)
commands/         # custom ace commands (e.g. invite:create)
database/
  migrations/     # source of truth for table shape
  schema.ts       # GENERATED — do not edit
inertia/
  pages/          # one component per Inertia page
  layouts/        # shared layout(s)
  components/ui/  # shadcn/ui components
start/
  routes.ts       # HTTP routes
  env.ts          # env var validation
tests/            # unit / functional / browser Japa suites
```

Full conventions (generated files, import aliases, when to regenerate registries) are in [`CLAUDE.md`](./CLAUDE.md).

## Testing & quality

```sh
pnpm test         # Japa suites (unit/functional/browser)
pnpm lint         # Biome
pnpm typecheck    # tsc, server + inertia
```

## Deployment notes

- Set `NODE_ENV=production`, a strong `APP_KEY`, and `MAIL_MAILER=resend` + `RESEND_API_KEY`.
- Point `DB_CONNECTION=turso` with `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` for a hosted database, or keep SQLite if a single persistent volume is enough for your deployment target.
- `Dockerfile.dev` / `docker-compose.yml` are dev-only (hot-reload, bind mounts); there's no production Dockerfile yet.

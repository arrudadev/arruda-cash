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
- Docker, only if you want the one-command dev setup, or to run Mailpit (see below) without installing it yourself

## Getting started

Either option gets you the app at http://localhost:3333, with hot-reload, running against a local SQLite database — no external services required to boot.

### Option A — Native (no Docker)

```sh
cp .env.example .env
pnpm install
node ace generate:key      # writes APP_KEY into .env
node ace migration:run
pnpm dev
```

### Option B — Docker Compose

Same thing, containerized (`Dockerfile.dev`, hot-reload via bind mount):

```sh
cp .env.example .env
docker compose run --rm app node ace generate:key   # writes APP_KEY into .env
make up                                              # builds + starts app (+ Mailpit) in the background
make migrate                                         # first run only, if the DB doesn't exist yet
```

Run `make help` for the full list of shortcuts.

### Test data (optional)

Either option, once migrated:

```sh
make seed   # or: node ace db:seed
```

Truncates and re-seeds `users`/`categories`/`transactions` with one login-ready user (`dev@najacash.test` / `password123`) plus sample categories and transactions. Only runs against the local SQLite database — refuses to run if `DB_CONNECTION` isn't `sqlite`.

### Testing the invite flow (optional)

The app itself never needs Mailpit — it's only touched when an invite email is actually sent.

```sh
make invite EMAIL=someone@example.com NAME="Someone"
```

This boots the full stack (app + Mailpit, if not already running) and creates the invite — no separate step needed. Then open http://localhost:8025, find the email, and follow its link to `/invite/accept?token=...`. Mailpit data isn't persisted (`make down` clears it).

Running natively (Option A) and just want Mailpit on its own? `docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit`, then `node ace invite:create someone@example.com "Someone"`.

## Environment variables

Copy `.env.example` to `.env` and fill it in — every variable is documented there. The essentials:

| Variable | Purpose |
|---|---|
| `APP_KEY` | Required, used for encryption/signing. Generate one and never commit it. |
| `SESSION_DRIVER`, `DB_CONNECTION` | Default to `cookie` / SQLite — no setup needed for local dev. |
| `MAIL_MAILER`, `SMTP_*` | Default to Mailpit locally. Switch to `MAIL_MAILER=resend` + `RESEND_API_KEY` in production. |
| `DB_CONNECTION=turso` + `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Opt into Turso instead of local SQLite (typically production). |

## Authentication

There is **no public signup**. Accounts are created only through an invite, emailed as a link to `/invite/accept?token=...` — see [Testing the invite flow](#testing-the-invite-flow-optional) above to try it locally. The invitee sets a password there, and the account is created and logged in — a login page and a protected `/dashboard` are the only other auth-related routes. Invite tokens expire after 72h and are single-use.

## Available commands

**pnpm scripts:**

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server with HMR |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm test` | Run the Japa test suites (unit/functional/browser) |
| `pnpm test:frontend` | Run the Vitest frontend component suite |
| `pnpm lint` | Biome check |
| `pnpm format` | Biome check --write |
| `pnpm typecheck` | TypeScript, server + frontend |

**Makefile** — intentionally minimal, `make help` for the full, current list. Only `up`/`down`/`logs` and the `docker compose up` inside `invite` touch Docker; `migrate`/`migrate-fresh`/`seed`/`test` run natively either way, since they only touch local files and the bind-mounted SQLite db:

| Command | What it does |
|---|---|
| `make up` / `make down` | Start/stop the dev stack (app + Mailpit) |
| `make logs` | Follow the app container logs |
| `make migrate` / `make migrate-fresh` | Run pending migrations / reset the database |
| `make seed` | Load local test data (see [Test data](#test-data-optional)) |
| `make invite EMAIL=... [NAME=...]` | Boot the stack and create an invite |
| `make test` | Run **every** test type that exists in the app — all Japa suites plus the Vitest frontend suite |

No `lint`/`typecheck`/`shell`/`build`/`repl` wrappers — use the `pnpm` scripts or `docker compose`/`node ace` directly for those.

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
  factories/      # Lucid model factories, used by tests
  seeders/        # `make seed` — local dev/demo data
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
pnpm test           # Japa suites (unit/functional/browser)
pnpm test:frontend  # Vitest (frontend components)
pnpm lint           # Biome
pnpm typecheck      # tsc, server + inertia
```

Or `make test` to run both the Japa suites and the Vitest suite in one shot — see [Available commands](#available-commands).

## Deployment notes

- Set `NODE_ENV=production`, a strong `APP_KEY`, and `MAIL_MAILER=resend` + `RESEND_API_KEY`.
- Point `DB_CONNECTION=turso` with `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` for a hosted database, or keep SQLite if a single persistent volume is enough for your deployment target.
- `Dockerfile.dev` / `docker-compose.yml` are dev-only (hot-reload, bind mounts); there's no production Dockerfile yet.

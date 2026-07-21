# Architecture

Naja Cash is a personal finance tracker: categories, transactions, and a dashboard that summarizes them. This document covers *why* the system is put together the way it is. For *what* commands to run and *where* files live, see `CLAUDE.md` at the repo root.

## Overall shape

Server-routed SPA: AdonisJS renders the app shell and each page's initial props through Inertia; React takes over client-side navigation from there. There is no separate REST/GraphQL API for the frontend to poll — pages get their data as props on render, and mutations go through Inertia's `<Form>`/`<Link>` components, which POST/PUT/DELETE to the same AdonisJS routes and get redirected back with a fresh set of props. The one exception is the dashboard's category drilldown (see [Category drilldown](features.md#category-drilldown)), which is a genuine small JSON API endpoint fetched client-side — a full Inertia page visit would be too heavy for "open a side panel with this category's transactions."

Primary keys are UUID strings everywhere, not auto-increment integers, so IDs stay opaque and safe to expose in URLs without leaking row counts.

## The generated layer

Three things get regenerated from source on every boot: `database/schema.ts` (Lucid model columns, from migrations), the controllers/routes registry (from `start/routes.ts`), and the Tuyau typed API client (from the registry + validators). Models compose the generated schema rather than declaring columns themselves; controllers are referenced through the generated registry rather than imported directly. The practical effect: the migration is the single source of truth for a table's shape, and the frontend's route/response types can never drift from what the backend actually accepts, because they're derived from it mechanically rather than hand-kept-in-sync.

## Service layer

Controllers validate the request, delegate to a service, and shape the response — they don't contain business logic themselves. Each service is a plain object of exported functions (`export const XService = { ... }`), not a class, per Biome's `noStaticOnlyClass` rule and because there's no per-instance state to justify a class.

This split exists so that:
- Business rules (user scoping, soft-delete semantics, "an archived category can't receive new transactions", "a category's type locks once it has transactions") live in one place regardless of which controller or future entry point (a queued job, a CLI command) needs to trigger them.
- Unit tests can exercise that logic directly, without going through HTTP, auth middleware, or CSRF.

## Data model

**Category** — `name`, `color`, `type` (`income` | `expense`), `archivedAt`. Categories are soft-deleted: "deleting" one sets `archivedAt` instead of removing the row, because transactions keep pointing at it. An archived category disappears from the pickers used to create new categorized things, but keeps showing up — clearly marked — anywhere its historical transactions are summarized, so past totals stay honest (see [Categories](features.md#categories)).

**Transaction** — `categoryId`, `type`, `amount` (integer cents), `date`, `description`. `type` is stored on the transaction itself, copied from its category at creation time, rather than derived via a join every time. This was a deliberate denormalization: the dashboard's headline numbers ("total income", "total expense" for the period) are a straight `SUM(amount) WHERE type = ...` with no join, and the value is fixed at the moment of entry, which matches how a transaction's nature doesn't retroactively change even if you later edit the category's own type. A category's `type` locks once it has any transactions, precisely so this copy can never end up telling a different story than the category it points to.

`amount` is an integer number of cents, not a float, to avoid floating-point rounding creeping into money totals. The UI accepts and displays reais; the conversion (`amountInReais * 100`, rounded) happens once, in `TransactionService`.

## Testing strategy

Four layers, each catching a different class of bug — see `CLAUDE.md`'s Testing section for the tool/location table. The short version of *why* four and not fewer:

- **Unit** (services, validators) catches business-rule regressions fast, without needing the HTTP stack to be correct too.
- **Functional** (HTTP round-trip via `@japa/api-client`) is what actually proves a route does what it claims — status codes, redirects, scoping, validation errors.
- **Frontend component** (Vitest + Testing Library) catches UI logic bugs — a filter that stops filtering, a form that stops disabling on submit — much faster than a browser test would, since there's no real browser or backend involved.
- **Browser** (Playwright via `@japa/browser-client`) exists for the one thing the other three can't prove: that the pieces actually work together end to end in a real browser. Kept to one critical path per feature deliberately — it's the slowest and most expensive layer, and functional/component tests already cover the edge cases.

Tests run against a separate SQLite file (`tmp/test.sqlite3`) from the one `node ace serve` uses (`tmp/db.sqlite3`), selected via `app.inTest` in `config/database.ts`. This was a deliberate isolation choice: before it, `node ace test` and a running dev server both hit the same file, which meant test runs could contend with (or be polluted by) whatever was in the developer's local dev data.

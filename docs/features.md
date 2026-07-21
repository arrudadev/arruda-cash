# Features

## Invite-only authentication

There is no self-service signup. An operator runs `node ace invite:create <email> [fullName]`, which emails the invitee a link carrying a token (hashed at rest, 72h expiry). Opening that link lets them set a password, which creates their account and logs them in — the account's name/email come from the invite, not from anything the invitee types. An invalid, expired, or already-used token renders the same page with an "invalid" state rather than a separate error page.

This exists because the product is meant to be used by people who were specifically given access (e.g. a household or a small team managing shared finances), not opened to the public.

## Categories

A category is a named, colored bucket transactions get sorted into, and every category is either an **income** category or an **expense** category — never both. Users create, rename, recolor, and archive their own categories from the Categories screen.

Archiving is the only way to remove a category (there is no hard delete): an archived category stops appearing in the picker used when creating or editing a transaction, but a transaction that already points to it keeps working, and the category keeps showing up (marked "Archived") anywhere those transactions are summarized — the dashboard breakdown, the transactions list. The goal is that archiving a category you no longer use never changes a number in your financial history.

A category's type is editable right up until it has any transactions attached — after that, the type locks. This exists to guarantee that a transaction's own (denormalized) type can never end up disagreeing with the category it points to.

## Transactions

A transaction is a single dated money movement: an amount, a category, an optional description. Creating one is type-first by design — you pick **Expense** or **Income** before you see the category dropdown, and the dropdown only offers categories of that type (archived categories never appear). This ordering was chosen deliberately: choosing the category first and then having to guess which of its possibly-mismatched type it belongs to was considered worse UX than committing to the type up front and getting a short, relevant category list.

The transactions list supports filtering by category, type, description search, and a date range, with pagination.

## Dashboard

The dashboard summarizes a user's finances for a selected period (default: the current calendar month). It shows three headline numbers — income, expense, balance — and a breakdown of total spend/income per category for that period, ordered largest first. The period can be changed via three one-click presets (this month, last month, this year) or a custom from/to range.

An archived category with transactions inside the selected period still appears in the breakdown, marked as archived — the same "don't let archiving rewrite history" rule that applies everywhere else archived categories show up.

## Category drilldown

Clicking a category in the dashboard breakdown opens a side panel listing that category's individual transactions for the currently selected period, fetched without leaving the dashboard or reloading the page. This exists so a user can go from "I spent a surprising amount on X this month" straight to "which specific transactions" without navigating away and re-filtering the full transactions list by hand.

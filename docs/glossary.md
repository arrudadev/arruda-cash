# Glossary

| Term | Meaning | Code |
|---|---|---|
| Category | A named, colored bucket for transactions; always either income or expense, never both. | `Category` model, `categories` table |
| Transaction | A single dated money movement — an amount, a category, an optional description. | `Transaction` model, `transactions` table |
| Type | Whether a category (or a transaction) represents money coming in or going out. Fixed set: `income`, `expense`. | `Category.type` / `Transaction.type`, `CategoryType` |
| Amount | A transaction's value, stored as an integer number of cents to avoid float rounding; displayed to users in reais. | `Transaction.amount`, `formatBRL()` |
| Archived | A category that's been "deleted" — hidden from pickers used to create/edit things, but still shown (marked) anywhere its historical transactions are summarized. Never a hard delete. | `Category.archivedAt`, `Category.isArchived` |
| Invite | A one-time, expiring, emailed token that lets exactly one person create an account. The only way into the app — there's no public signup. | `Invite` model, `invite:create` command |
| Period | The date range (`from`/`to`) a dashboard view or a category drilldown is scoped to. Defaults to the current calendar month. | `DashboardService`'s `PeriodFilters` |
| Breakdown | The dashboard's per-category totals for the selected period, sorted largest first. | `DashboardService.getSummary().breakdown` |
| Drilldown | The side panel of a category's individual transactions for the selected period, opened by clicking that category in the dashboard breakdown. | `DashboardController.categoryTransactions`, `CategoryDrilldown` component |

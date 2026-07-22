/**
 * Money is stored as an integer number of cents everywhere (see `Transaction.amount`,
 * `RecurringRule.amount`) to avoid floating-point rounding creeping into totals. The UI
 * accepts and displays reais; this is the one place that conversion happens.
 */
export function toCents(amountInReais: number) {
  return Math.round(amountInReais * 100)
}

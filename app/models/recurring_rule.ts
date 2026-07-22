import { randomUUID } from 'node:crypto'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { RecurringRuleSchema } from '#database/schema'
import Category, { type CategoryType } from '#models/category'

/**
 * `fixed` — the same amount every month (subscription, rent). `variable`
 * carries the last confirmed amount forward as the estimate for future
 * months (utility bills).
 */
export const RECURRING_KINDS = ['fixed', 'variable'] as const
export type RecurringKind = (typeof RECURRING_KINDS)[number]

export default class RecurringRule extends RecurringRuleSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(rule: RecurringRule) {
    rule.id = rule.id ?? randomUUID()
  }

  declare type: CategoryType
  declare kind: RecurringKind

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  get isArchived() {
    return this.archivedAt !== null
  }

  get isIndefinite() {
    return this.installmentsTotal === null
  }

  get installmentsRemaining() {
    return this.installmentProgress().remaining
  }

  /**
   * Whether this rule is still active for `month` (defaults to the current
   * month), and — for a parcelled rule — which installment that is.
   *
   * `index` is 1-based (the rule's own `startMonth` is installment #1).
   * `remaining` counts the current installment plus every one still ahead,
   * so "faltam 9 de 12" reads as installment 4 of 12 with `remaining: 9`.
   * Both are `null` for an indefinite (non-parcelled) rule.
   */
  installmentProgress(month: DateTime = DateTime.now()) {
    const targetMonth = month.startOf('month')
    const monthsElapsed =
      (targetMonth.year - this.startMonth.year) * 12 + (targetMonth.month - this.startMonth.month)

    if (monthsElapsed < 0) {
      return { applies: false, index: null, remaining: null }
    }

    if (this.installmentsTotal === null) {
      return { applies: true, index: null, remaining: null }
    }

    const index = monthsElapsed + 1
    if (index > this.installmentsTotal) {
      return { applies: false, index, remaining: 0 }
    }

    return { applies: true, index, remaining: this.installmentsTotal - index + 1 }
  }

  /**
   * The actual date a confirmed instance for `month` should land on —
   * `dayOfMonth` clamped to that month's last day (e.g. day 31 in a 30-day
   * month becomes the 30th).
   */
  anchorDateFor(month: DateTime) {
    const targetMonth = month.startOf('month')
    return targetMonth.set({ day: Math.min(this.dayOfMonth, targetMonth.daysInMonth ?? 28) })
  }
}

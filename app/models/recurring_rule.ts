import { randomUUID } from 'node:crypto'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
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
}

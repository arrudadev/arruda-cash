import { randomUUID } from 'node:crypto'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { RecurringInstanceSchema } from '#database/schema'
import RecurringRule from '#models/recurring_rule'
import Transaction from '#models/transaction'

export default class RecurringInstance extends RecurringInstanceSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(instance: RecurringInstance) {
    instance.id = instance.id ?? randomUUID()
  }

  @belongsTo(() => RecurringRule)
  declare rule: BelongsTo<typeof RecurringRule>

  @belongsTo(() => Transaction)
  declare transaction: BelongsTo<typeof Transaction>
}

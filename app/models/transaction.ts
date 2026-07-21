import { randomUUID } from 'node:crypto'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { TransactionSchema } from '#database/schema'
import Category, { type CategoryType } from '#models/category'

export default class Transaction extends TransactionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(transaction: Transaction) {
    transaction.id = transaction.id ?? randomUUID()
  }

  declare type: CategoryType

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>
}

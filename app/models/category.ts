import { randomUUID } from 'node:crypto'
import { beforeCreate } from '@adonisjs/lucid/orm'
import { CategorySchema } from '#database/schema'

/**
 * The two kinds of money movement a category (and, in turn, every
 * transaction attached to it) can represent.
 */
export const CATEGORY_TYPES = ['income', 'expense'] as const
export type CategoryType = (typeof CATEGORY_TYPES)[number]

export default class Category extends CategorySchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(category: Category) {
    category.id = category.id ?? randomUUID()
  }

  declare type: CategoryType

  get isArchived() {
    return this.archivedAt !== null
  }
}

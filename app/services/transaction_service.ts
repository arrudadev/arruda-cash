import { inject } from '@adonisjs/core'
import type { DateTime } from 'luxon'
import ArchivedCategoryException from '#exceptions/archived_category_exception'
import Transaction from '#models/transaction'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { CategoryService } from '#services/category_service'
import { toCents } from '#services/money'

const PER_PAGE = 20

type TransactionFilters = {
  categoryId?: string
  type?: string
  from?: string
  to?: string
  search?: string
  page?: number
}

type TransactionInput = {
  categoryId: string
  amount: number
  date: DateTime
  description?: string
}

@inject()
export class TransactionService {
  constructor(protected categoryService: CategoryService) {}

  private async resolveActiveCategory(userId: string, categoryId: string) {
    const category = await this.categoryService.findForUser(userId, categoryId)
    if (category.archivedAt) {
      throw new ArchivedCategoryException()
    }
    return category
  }

  async listForUser(userId: string, filters: TransactionFilters = {}) {
    const query = Transaction.query()
      .where('userId', userId)
      .preload('category')
      .orderBy('date', 'desc')
      .orderBy('createdAt', 'desc')

    if (filters.categoryId) {
      query.where('categoryId', filters.categoryId)
    }
    if (filters.type) {
      query.where('type', filters.type)
    }
    if (filters.from) {
      query.where('date', '>=', filters.from)
    }
    if (filters.to) {
      query.where('date', '<=', filters.to)
    }
    if (filters.search) {
      query.whereLike('description', `%${filters.search}%`)
    }

    return query.paginate(filters.page ?? 1, PER_PAGE)
  }

  async findForUser(userId: string, id: string) {
    return Transaction.query()
      .where('id', id)
      .where('userId', userId)
      .preload('category')
      .firstOrFail()
  }

  async create(userId: string, data: TransactionInput) {
    const category = await this.resolveActiveCategory(userId, data.categoryId)

    const transaction = await Transaction.create({
      userId,
      categoryId: category.id,
      type: category.type,
      amount: toCents(data.amount),
      description: data.description ?? null,
      date: data.date,
    })
    await transaction.load('category')
    return transaction
  }

  async update(transaction: Transaction, data: TransactionInput) {
    const category = await this.resolveActiveCategory(transaction.userId, data.categoryId)

    transaction.categoryId = category.id
    transaction.type = category.type
    transaction.amount = toCents(data.amount)
    transaction.description = data.description ?? null
    transaction.date = data.date
    await transaction.save()
    await transaction.load('category')
    return transaction
  }

  async destroy(transaction: Transaction) {
    await transaction.delete()
  }
}

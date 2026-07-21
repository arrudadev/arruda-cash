import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'

type PeriodFilters = {
  from?: string
  to?: string
}

function resolvePeriod(filters: PeriodFilters) {
  if (filters.from && filters.to) {
    return { from: filters.from, to: filters.to }
  }

  const now = DateTime.now()
  return {
    from: now.startOf('month').toISODate() as string,
    to: now.endOf('month').toISODate() as string,
  }
}

async function getSummary(userId: string, filters: PeriodFilters) {
  const { from, to } = resolvePeriod(filters)

  const totals = await Transaction.query()
    .where('userId', userId)
    .where('date', '>=', from)
    .where('date', '<=', to)
    .groupBy('type')
    .select('type')
    .sum('amount as total')

  const income = Number(totals.find((row) => row.type === 'income')?.$extras.total ?? 0)
  const expense = Number(totals.find((row) => row.type === 'expense')?.$extras.total ?? 0)

  const breakdownRows = await db
    .from('transactions')
    .join('categories', 'categories.id', 'transactions.category_id')
    .where('transactions.user_id', userId)
    .where('categories.user_id', userId)
    .where('transactions.date', '>=', from)
    .where('transactions.date', '<=', to)
    .groupBy('categories.id')
    .select(
      'categories.id as categoryId',
      'categories.name as name',
      'categories.color as color',
      'categories.type as type',
      'categories.archived_at as archivedAt'
    )
    .sum('transactions.amount as total')
    .orderBy('total', 'desc')

  return {
    from,
    to,
    income,
    expense,
    balance: income - expense,
    breakdown: breakdownRows.map((row) => ({
      categoryId: row.categoryId as string,
      name: row.name as string,
      color: row.color as string,
      type: row.type as 'income' | 'expense',
      archived: row.archivedAt !== null,
      total: Number(row.total),
    })),
  }
}

export const DashboardService = {
  getSummary,
}

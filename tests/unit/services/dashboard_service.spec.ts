import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import { CategoryService } from '#services/category_service'
import { DashboardService } from '#services/dashboard_service'
import { TransactionService } from '#services/transaction_service'

test.group('DashboardService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sums income and expense within the given period, scoped to the user', async ({
    assert,
  }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const other = await User.create({ email: 'other@example.com', password: 'password123' })
    const groceries = await CategoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const salary = await CategoryService.create(user.id, {
      name: 'Salary',
      color: '#eab308',
      type: 'income',
    })
    const otherCategory = await CategoryService.create(other.id, {
      name: 'Other',
      color: '#000000',
      type: 'expense',
    })

    await TransactionService.create(user.id, {
      categoryId: groceries.id,
      amount: 100,
      date: DateTime.fromISO('2026-07-10'),
    })
    await TransactionService.create(user.id, {
      categoryId: salary.id,
      amount: 1000,
      date: DateTime.fromISO('2026-07-15'),
    })
    // Outside the period — must not count.
    await TransactionService.create(user.id, {
      categoryId: groceries.id,
      amount: 500,
      date: DateTime.fromISO('2026-06-15'),
    })
    // Another user's data — must not count.
    await TransactionService.create(other.id, {
      categoryId: otherCategory.id,
      amount: 999,
      date: DateTime.fromISO('2026-07-10'),
    })

    const summary = await DashboardService.getSummary(user.id, {
      from: '2026-07-01',
      to: '2026-07-31',
    })

    assert.equal(summary.income, 100000)
    assert.equal(summary.expense, 10000)
    assert.equal(summary.balance, 90000)
  })

  test('defaults to the current month when no period is given', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })

    const summary = await DashboardService.getSummary(user.id, {})

    const now = DateTime.now()
    assert.equal(summary.from, now.startOf('month').toISODate())
    assert.equal(summary.to, now.endOf('month').toISODate())
  })

  test('breakdown includes archived categories that have transactions in the period', async ({
    assert,
  }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await CategoryService.create(user.id, {
      name: 'Old subscription',
      color: '#ef4444',
      type: 'expense',
    })
    await TransactionService.create(user.id, {
      categoryId: category.id,
      amount: 20,
      date: DateTime.fromISO('2026-07-10'),
    })
    await CategoryService.archive(category)

    const summary = await DashboardService.getSummary(user.id, {
      from: '2026-07-01',
      to: '2026-07-31',
    })

    assert.lengthOf(summary.breakdown, 1)
    assert.isTrue(summary.breakdown[0].archived)
    assert.equal(summary.breakdown[0].total, 2000)
  })
})

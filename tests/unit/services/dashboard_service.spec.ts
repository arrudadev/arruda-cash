import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { UserFactory } from '#database/factories/user_factory'
import { CategoryService } from '#services/category_service'
import { DashboardService } from '#services/dashboard_service'

test.group('DashboardService', (group) => {
  const categoryService = new CategoryService()
  const dashboardService = new DashboardService(categoryService)

  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sums income and expense within the given period, scoped to the user', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const other = await UserFactory.create()
    const groceries = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const salary = await CategoryFactory.merge({ userId: user.id, type: 'income' }).create()
    const otherCategory = await CategoryFactory.merge({
      userId: other.id,
      type: 'expense',
    }).create()

    await TransactionFactory.merge({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      amount: 10000,
      date: DateTime.fromISO('2026-07-10'),
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: salary.id,
      type: 'income',
      amount: 100000,
      date: DateTime.fromISO('2026-07-15'),
    }).create()
    // Outside the period — must not count.
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      amount: 50000,
      date: DateTime.fromISO('2026-06-15'),
    }).create()
    // Another user's data — must not count.
    await TransactionFactory.merge({
      userId: other.id,
      categoryId: otherCategory.id,
      type: 'expense',
      amount: 99900,
      date: DateTime.fromISO('2026-07-10'),
    }).create()

    const summary = await dashboardService.getSummary(user.id, {
      from: '2026-07-01',
      to: '2026-07-31',
    })

    assert.equal(summary.income, 100000)
    assert.equal(summary.expense, 10000)
    assert.equal(summary.balance, 90000)
  })

  test('defaults to the current month when no period is given', async ({ assert }) => {
    const user = await UserFactory.create()

    const summary = await dashboardService.getSummary(user.id, {})

    const now = DateTime.now()
    assert.equal(summary.from, now.startOf('month').toISODate())
    assert.equal(summary.to, now.endOf('month').toISODate())
  })

  test('breakdown includes archived categories that have transactions in the period', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 2000,
      date: DateTime.fromISO('2026-07-10'),
    }).create()
    await categoryService.archive(category)

    const summary = await dashboardService.getSummary(user.id, {
      from: '2026-07-01',
      to: '2026-07-31',
    })

    assert.lengthOf(summary.breakdown, 1)
    assert.isTrue(summary.breakdown[0].archived)
    assert.equal(summary.breakdown[0].total, 2000)
  })
})

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Dashboard (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows totals and category breakdown for the current month', async ({
    browserContext,
    visit,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({
      userId: user.id,
      name: 'Groceries',
      type: 'expense',
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 4250,
      date: DateTime.now(),
    }).create()
    await browserContext.loginAs(user)

    const page = await visit('/dashboard')

    await page.assertTextContains('body', 'Groceries')
    await page.assertTextContains('body', '42,50')
  })

  test('clicking a category opens its transactions in a side panel', async ({
    browserContext,
    visit,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({
      userId: user.id,
      name: 'Groceries',
      type: 'expense',
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 4250,
      description: 'Weekly shop',
      date: DateTime.now(),
    }).create()
    await browserContext.loginAs(user)

    const page = await visit('/dashboard')

    await page.getByRole('button', { name: /Groceries/ }).click()

    await page.assertVisible(page.getByRole('dialog', { name: 'Groceries' }))
    await page.assertTextContains('[role=dialog]', 'Weekly shop')
  })
})

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Category from '#models/category'
import Transaction from '#models/transaction'
import User from '#models/user'

test.group('Dashboard (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows totals and category breakdown for the current month', async ({
    browserContext,
    visit,
  }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    await Transaction.create({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 4250,
      date: DateTime.now(),
    })
    await browserContext.loginAs(user)

    const page = await visit('/dashboard')

    await page.assertTextContains('body', 'Groceries')
    await page.assertTextContains('body', '42,50')
  })

  test('clicking a category opens its transactions in a side panel', async ({
    browserContext,
    visit,
  }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    await Transaction.create({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 4250,
      description: 'Weekly shop',
      date: DateTime.now(),
    })
    await browserContext.loginAs(user)

    const page = await visit('/dashboard')

    await page.getByRole('button', { name: /Groceries/ }).click()

    await page.assertVisible(page.getByRole('dialog', { name: 'Groceries' }))
    await page.assertTextContains('[role=dialog]', 'Weekly shop')
  })
})

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Category from '#models/category'
import User from '#models/user'

test.group('Transactions (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user creates a transaction from the UI', async ({ browserContext, visit, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    await browserContext.loginAs(user)

    const page = await visit('/transactions')

    await page.getByRole('button', { name: 'New transaction' }).click()
    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Groceries' }).click()
    await page.locator('#amount').fill('42.50')
    await page.locator('#date').fill('2026-07-01')
    await page.getByRole('button', { name: 'Create transaction' }).click()

    await page.assertUrlContains('/transactions')
    await page.assertTextContains('body', 'Groceries')

    assert.equal(await page.locator('td', { hasText: 'Groceries' }).count(), 1)
  })
})

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { CategoryFactory } from '#database/factories/category_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Transactions (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user creates a transaction from the UI', async ({ browserContext, visit }) => {
    const user = await UserFactory.create()
    await CategoryFactory.merge({ userId: user.id, name: 'Groceries', type: 'expense' }).create()
    await browserContext.loginAs(user)

    const page = await visit('/transactions')

    await page.getByRole('button', { name: 'New transaction' }).click()
    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Groceries' }).click()
    await page.locator('#amount').fill('42.50')
    await page.locator('#date').fill('2026-07-01')
    await page.getByRole('button', { name: 'Create transaction' }).click()

    await page.assertUrlContains('/transactions')
    await page.assertElementsCount(page.locator('td', { hasText: 'Groceries' }), 1)
  })
})

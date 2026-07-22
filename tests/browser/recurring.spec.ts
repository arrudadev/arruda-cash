import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { CategoryFactory } from '#database/factories/category_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Recurring rules (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user creates a rule, confirms this month, and sees the transaction', async ({
    browserContext,
    visit,
  }) => {
    const user = await UserFactory.create()
    await CategoryFactory.merge({ userId: user.id, name: 'Bills', type: 'expense' }).create()
    await browserContext.loginAs(user)

    const page = await visit('/recurring')

    await page.getByRole('button', { name: 'New recurring rule' }).click()
    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Bills' }).click()
    await page.getByLabel('Name').fill('Netflix')
    await page.locator('#amount').fill('39.90')
    await page.locator('#startMonth').fill(new Date().toISOString().slice(0, 10))
    await page.getByRole('button', { name: 'Create rule' }).click()

    await page.assertUrlContains('/recurring')
    await page.assertElementsCount(page.locator('td', { hasText: 'Netflix' }), 2)

    await page.getByRole('button', { name: 'Confirm' }).click()

    await page.assertTextContains('body', 'Confirmed')

    const transactionsPage = await visit('/transactions')
    await transactionsPage.assertElementsCount(
      transactionsPage.locator('td', { hasText: 'Netflix' }),
      1
    )
  })
})

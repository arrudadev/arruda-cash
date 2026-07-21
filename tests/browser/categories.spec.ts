import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import User from '#models/user'

test.group('Categories (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user creates a category from the UI', async ({ browserContext, visit, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    await browserContext.loginAs(user)

    const page = await visit('/categories')

    await page.getByRole('button', { name: 'New category' }).click()
    await page.getByLabel('Name').fill('Groceries')
    await page.locator('#color').fill('#3b82f6')
    await page.getByRole('button', { name: 'Create category' }).click()

    await page.assertUrlContains('/categories')
    await page.assertTextContains('body', 'Groceries')

    assert.equal(await page.locator('td', { hasText: 'Groceries' }).count(), 1)
  })
})

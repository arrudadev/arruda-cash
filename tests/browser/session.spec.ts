import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'

test.group('Session (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user logs in from the UI and reaches the dashboard', async ({ visit }) => {
    const user = await UserFactory.create()

    const page = await visit('/login')

    await page.locator('#email').fill(user.email)
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.assertPath('/dashboard')
  })
})

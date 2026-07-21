import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import User from '#models/user'

test.group('Session (browser)', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user logs in from the UI and reaches the dashboard', async ({ visit }) => {
    await User.create({ email: 'owner@example.com', password: 'password123' })

    const page = await visit('/login')

    await page.locator('#email').fill('owner@example.com')
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.assertPath('/dashboard')
  })
})

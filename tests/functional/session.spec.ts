import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import User from '#models/user'

test.group('Session', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('logs in with valid credentials and reaches the dashboard', async ({ client }) => {
    await User.create({ email: 'owner@example.com', password: 'password123' })

    const response = await client
      .post('/login')
      .redirects(0)
      .form({ email: 'owner@example.com', password: 'password123' })

    response.assertFound()
    response.assertHeader('location', '/dashboard')
  })

  test('rejects invalid credentials and flashes an error', async ({ client }) => {
    await User.create({ email: 'owner@example.com', password: 'password123' })

    const response = await client
      .post('/login')
      .redirects(0)
      .form({ email: 'owner@example.com', password: 'wrong-password' })

    response.assertFound()
    response.assertFlashMessage('error')
  })

  test('logout redirects to the login page', async ({ client }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })

    const response = await client.post('/logout').loginAs(user).redirects(0)

    response.assertFound()
    response.assertHeader('location', '/login')
  })
})

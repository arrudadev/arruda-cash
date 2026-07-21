import type { HttpContext } from '@adonisjs/core/http'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import User from '#models/user'
import { AuthService } from '#services/auth_service'

function fakeAuth(onLogin: (user: User) => void) {
  return {
    use: () => ({
      login: async (user: User) => onLogin(user),
    }),
  } as unknown as HttpContext['auth']
}

test.group('AuthService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('attempt logs the user in when credentials are valid', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    let loggedInUserId: string | undefined
    const auth = fakeAuth((loggedIn) => {
      loggedInUserId = loggedIn.id
    })

    const result = await AuthService.attempt(auth, 'owner@example.com', 'password123')

    assert.equal(result.id, user.id)
    assert.equal(loggedInUserId, user.id)
  })

  test('attempt rejects invalid credentials without logging in', async ({ assert }) => {
    await User.create({ email: 'owner@example.com', password: 'password123' })
    let called = false
    const auth = fakeAuth(() => {
      called = true
    })

    await assert.rejects(() => AuthService.attempt(auth, 'owner@example.com', 'wrong-password'))
    assert.isFalse(called)
  })
})

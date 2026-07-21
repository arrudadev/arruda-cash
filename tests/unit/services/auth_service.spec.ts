import type { HttpContext } from '@adonisjs/core/http'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import type User from '#models/user'
import { AuthService } from '#services/auth_service'

function fakeAuth(onLogin: (user: User) => void) {
  return {
    use: () => ({
      login: async (user: User) => onLogin(user),
    }),
  } as unknown as HttpContext['auth']
}

test.group('AuthService', (group) => {
  const authService = new AuthService()

  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('attempt logs the user in when credentials are valid', async ({ assert }) => {
    const user = await UserFactory.create()
    let loggedInUserId: string | undefined
    const auth = fakeAuth((loggedIn) => {
      loggedInUserId = loggedIn.id
    })

    const result = await authService.attempt(auth, user.email, 'password123')

    assert.equal(result.id, user.id)
    assert.equal(loggedInUserId, user.id)
  })

  test('attempt rejects invalid credentials without logging in', async ({ assert }) => {
    const user = await UserFactory.create()
    let called = false
    const auth = fakeAuth(() => {
      called = true
    })

    await assert.rejects(() => authService.attempt(auth, user.email, 'wrong-password'))
    assert.isFalse(called)
  })
})

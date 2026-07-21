import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Invite from '#models/invite'
import User from '#models/user'

test.group('Invite', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('renders the accept form for a valid token', async ({ client, assert }) => {
    const { token } = await Invite.issue('newuser@example.com', 'New User')

    const response = await client.get('/invite/accept').qs({ token }).withInertia()

    response.assertInertiaComponent('auth/accept_invite')
    assert.isFalse(response.inertiaProps.invalid)
    assert.equal(response.inertiaProps.email, 'newuser@example.com')
  })

  test('shows invalid for an unknown token', async ({ client, assert }) => {
    const response = await client.get('/invite/accept').qs({ token: 'bogus-token' }).withInertia()

    response.assertInertiaComponent('auth/accept_invite')
    assert.isTrue(response.inertiaProps.invalid)
  })

  test('shows invalid for an expired token', async ({ client, assert }) => {
    const { invite, token } = await Invite.issue('newuser@example.com')
    invite.expiresAt = DateTime.now().minus({ hours: 1 })
    await invite.save()

    const response = await client.get('/invite/accept').qs({ token }).withInertia()

    assert.isTrue(response.inertiaProps.invalid)
  })

  test('accepting a valid invite creates the account and logs in', async ({ client, assert }) => {
    const { token } = await Invite.issue('newuser@example.com', 'New User')

    const response = await client.post('/invite/accept').redirects(0).form({
      token,
      password: 'password123',
      passwordConfirmation: 'password123',
    })

    response.assertFound()

    const user = await User.query().where('email', 'newuser@example.com').firstOrFail()
    assert.equal(user.fullName, 'New User')

    const invite = await Invite.query().where('email', 'newuser@example.com').firstOrFail()
    assert.isNotNull(invite.acceptedAt)
  })

  test('rejects mismatched password confirmation', async ({ client, assert }) => {
    const { token } = await Invite.issue('newuser@example.com')

    await client.post('/invite/accept').form({
      token,
      password: 'password123',
      passwordConfirmation: 'does-not-match',
    })

    const user = await User.query().where('email', 'newuser@example.com').first()
    assert.isNull(user)
  })

  test('rejects accepting an already-used invite', async ({ client, assert }) => {
    const { token } = await Invite.issue('newuser@example.com')
    await client.post('/invite/accept').form({
      token,
      password: 'password123',
      passwordConfirmation: 'password123',
    })

    const secondResponse = await client.post('/invite/accept').redirects(0).form({
      token,
      password: 'password456',
      passwordConfirmation: 'password456',
    })

    secondResponse.assertFound()
    const usersCount = await User.query().where('email', 'newuser@example.com').count('* as total')
    assert.equal(usersCount[0].$extras.total, 1)
  })
})

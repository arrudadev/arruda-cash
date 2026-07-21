import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Invite from '#models/invite'
import { InviteService } from '#services/invite_service'

test.group('InviteService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('acceptInvite creates a user from the invite and marks it accepted', async ({ assert }) => {
    const { invite, token } = await Invite.issue('newuser@example.com', 'New User')

    const user = await InviteService.acceptInvite(token, 'password123')

    assert.isNotNull(user)
    assert.equal(user?.email, 'newuser@example.com')
    assert.equal(user?.fullName, 'New User')
    await invite.refresh()
    assert.isNotNull(invite.acceptedAt)
  })

  test('acceptInvite returns null for an unknown token', async ({ assert }) => {
    const user = await InviteService.acceptInvite('bogus-token', 'password123')

    assert.isNull(user)
  })

  test('acceptInvite returns null for an already accepted invite', async ({ assert }) => {
    const { token } = await Invite.issue('newuser@example.com')
    await InviteService.acceptInvite(token, 'password123')

    const secondAttempt = await InviteService.acceptInvite(token, 'password456')

    assert.isNull(secondAttempt)
  })
})

import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import Invite from '#models/invite'
import User from '#models/user'

@inject()
export class InviteService {
  /**
   * Resolves a still-valid invite to a newly created user account, marking
   * the invite as accepted. Returns null when the token doesn't resolve to
   * a valid invite (unknown, expired, or already accepted).
   */
  async acceptInvite(token: string, password: string) {
    const invite = await Invite.verify(token)
    if (!invite) {
      return null
    }

    const user = await User.create({
      email: invite.email,
      fullName: invite.fullName,
      password,
    })

    invite.acceptedAt = DateTime.now()
    await invite.save()

    return user
  }
}

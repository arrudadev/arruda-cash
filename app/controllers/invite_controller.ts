import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Invite from '#models/invite'
import User from '#models/user'
import { acceptInviteValidator } from '#validators/user'

export default class InviteController {
  async create({ request, inertia }: HttpContext) {
    const token = request.qs().token as string | undefined
    const invite = token ? await Invite.verify(token) : null

    if (!invite) {
      return inertia.render('auth/accept_invite', { invalid: true })
    }

    return inertia.render('auth/accept_invite', {
      invalid: false,
      token,
      email: invite.email,
    })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { token, password } = await request.validateUsing(acceptInviteValidator)

    const invite = await Invite.verify(token)
    if (!invite) {
      session.flash('error', 'This invite link is invalid or has expired.')
      return response.redirect().back()
    }

    const user = await User.create({
      email: invite.email,
      fullName: invite.fullName,
      password,
    })

    invite.acceptedAt = DateTime.now()
    await invite.save()

    await auth.use('web').login(user)
    response.redirect().toRoute('dashboard')
  }
}

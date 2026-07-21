import type { HttpContext } from '@adonisjs/core/http'
import Invite from '#models/invite'
import { AuthService } from '#services/auth_service'
import { InviteService } from '#services/invite_service'
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

    const user = await InviteService.acceptInvite(token, password)
    if (!user) {
      session.flash('error', 'This invite link is invalid or has expired.')
      return response.redirect().back()
    }

    await AuthService.login(auth, user)
    response.redirect().toRoute('dashboard')
  }
}

import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import Invite from '#models/invite'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { AuthService } from '#services/auth_service'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { InviteService } from '#services/invite_service'
import { acceptInviteValidator } from '#validators/user'

@inject()
export default class InviteController {
  constructor(
    protected authService: AuthService,
    protected inviteService: InviteService
  ) {}

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

    const user = await this.inviteService.acceptInvite(token, password)
    if (!user) {
      session.flash('error', 'This invite link is invalid or has expired.')
      return response.redirect().back()
    }

    await this.authService.login(auth, user)
    response.redirect().toRoute('dashboard')
  }
}

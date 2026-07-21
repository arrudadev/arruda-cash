import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { AuthService } from '#services/auth_service'

@inject()
export default class SessionController {
  constructor(protected authService: AuthService) {}

  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.all()
    await this.authService.attempt(auth, email, password)

    response.redirect().toRoute('dashboard')
  }

  async destroy({ auth, response }: HttpContext) {
    await this.authService.logout(auth)
    response.redirect().toRoute('session.create')
  }
}

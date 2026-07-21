import type { HttpContext } from '@adonisjs/core/http'
import { AuthService } from '#services/auth_service'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password } = request.all()
    await AuthService.attempt(auth, email, password)

    response.redirect().toRoute('dashboard')
  }

  async destroy({ auth, response }: HttpContext) {
    await AuthService.logout(auth)
    response.redirect().toRoute('session.create')
  }
}

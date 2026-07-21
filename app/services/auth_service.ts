import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

@inject()
export class AuthService {
  async login(auth: HttpContext['auth'], user: User) {
    await auth.use('web').login(user)
  }

  async attempt(auth: HttpContext['auth'], email: string, password: string) {
    const user = await User.verifyCredentials(email, password)
    await this.login(auth, user)
    return user
  }

  async logout(auth: HttpContext['auth']) {
    await auth.use('web').logout()
  }
}

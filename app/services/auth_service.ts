import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

async function login(auth: HttpContext['auth'], user: User) {
  await auth.use('web').login(user)
}

async function attempt(auth: HttpContext['auth'], email: string, password: string) {
  const user = await User.verifyCredentials(email, password)
  await login(auth, user)
  return user
}

async function logout(auth: HttpContext['auth']) {
  await auth.use('web').logout()
}

export const AuthService = {
  login,
  attempt,
  logout,
}

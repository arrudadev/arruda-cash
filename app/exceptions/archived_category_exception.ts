import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class ArchivedCategoryException extends Exception {
  static status = 422
  static code = 'E_ARCHIVED_CATEGORY'

  constructor() {
    super('Cannot assign a transaction to an archived category.')
  }

  async handle(error: this, { session, response }: HttpContext) {
    session.flash('error', error.message)
    response.redirect().back()
  }
}

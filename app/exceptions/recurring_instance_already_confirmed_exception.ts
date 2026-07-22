import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class RecurringInstanceAlreadyConfirmedException extends Exception {
  static status = 422
  static code = 'E_RECURRING_INSTANCE_ALREADY_CONFIRMED'

  constructor() {
    super('This month has already been confirmed for this recurring rule.')
  }

  async handle(error: this, { session, response }: HttpContext) {
    session.flash('error', error.message)
    response.redirect().back()
  }
}

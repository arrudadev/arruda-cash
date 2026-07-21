import { Exception } from '@adonisjs/core/exceptions'

export default class ArchivedCategoryException extends Exception {
  static status = 422
  static code = 'E_ARCHIVED_CATEGORY'

  constructor() {
    super('Cannot assign a transaction to an archived category.')
  }
}

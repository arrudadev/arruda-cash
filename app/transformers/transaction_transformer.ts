import { BaseTransformer } from '@adonisjs/core/transformers'
import type Transaction from '#models/transaction'
import CategoryTransformer from '#transformers/category_transformer'

export default class TransactionTransformer extends BaseTransformer<Transaction> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'type', 'amount', 'description', 'date', 'createdAt']),
      category: this.resource.category
        ? CategoryTransformer.transform(this.resource.category)
        : null,
    }
  }
}

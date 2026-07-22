import { BaseTransformer } from '@adonisjs/core/transformers'
import type RecurringRule from '#models/recurring_rule'
import CategoryTransformer from '#transformers/category_transformer'

export default class RecurringRuleTransformer extends BaseTransformer<RecurringRule> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'type',
        'name',
        'amount',
        'kind',
        'dayOfMonth',
        'startMonth',
        'installmentsTotal',
        'archivedAt',
        'createdAt',
      ]),
      installmentsRemaining: this.resource.installmentsRemaining,
      category: this.resource.category
        ? CategoryTransformer.transform(this.resource.category)
        : null,
    }
  }
}

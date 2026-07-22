import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { CATEGORY_TYPES } from '#models/category'
import RecurringRule, { RECURRING_KINDS } from '#models/recurring_rule'

/**
 * `userId` and `categoryId` have no sensible default — always
 * `.merge({ userId, categoryId })` at the call site. Prefer also merging
 * `type` to match the category's own type, since nothing here enforces
 * that invariant for you.
 */
export const RecurringRuleFactory = factory
  .define(RecurringRule, async ({ faker }) => {
    return {
      type: faker.helpers.arrayElement(CATEGORY_TYPES),
      name: faker.commerce.productName(),
      amount: faker.number.int({ min: 1000, max: 50000 }),
      kind: faker.helpers.arrayElement(RECURRING_KINDS),
      dayOfMonth: faker.number.int({ min: 1, max: 28 }),
      startMonth: DateTime.now().startOf('month'),
      installmentsTotal: null,
    }
  })
  .build()

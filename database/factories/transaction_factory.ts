import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { CATEGORY_TYPES } from '#models/category'
import Transaction from '#models/transaction'

/**
 * `userId` and `categoryId` have no sensible default — always
 * `.merge({ userId, categoryId })` at the call site. Prefer also merging
 * `type` to match the category's own type, since nothing here enforces
 * that invariant for you.
 */
export const TransactionFactory = factory
  .define(Transaction, async ({ faker }) => {
    return {
      type: faker.helpers.arrayElement(CATEGORY_TYPES),
      amount: faker.number.int({ min: 100, max: 10000 }),
      description: faker.lorem.words(3),
      date: DateTime.fromJSDate(faker.date.recent()),
    }
  })
  .build()

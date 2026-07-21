import factory from '@adonisjs/lucid/factories'
import Category, { CATEGORY_TYPES } from '#models/category'

/**
 * `userId` has no sensible default — always `.merge({ userId })` at the
 * call site.
 */
export const CategoryFactory = factory
  .define(Category, async ({ faker }) => {
    return {
      name: faker.commerce.department(),
      color: faker.color.rgb(),
      type: faker.helpers.arrayElement(CATEGORY_TYPES),
    }
  })
  .build()

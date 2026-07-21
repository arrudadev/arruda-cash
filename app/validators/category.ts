import vine from '@vinejs/vine'
import { CATEGORY_TYPES } from '#models/category'

const name = () => vine.string().trim().minLength(1).maxLength(60)
const color = () => vine.string().regex(/^#[0-9a-fA-F]{6}$/)
const type = () => vine.enum(CATEGORY_TYPES)

/**
 * Validator used when creating a category.
 */
export const createCategoryValidator = vine.create({
  name: name(),
  color: color(),
  type: type(),
})

/**
 * Validator used when updating a category. The controller ignores a
 * `type` change once the category has transactions attached, to keep
 * past transactions' recorded type meaningful.
 */
export const updateCategoryValidator = vine.create({
  name: name(),
  color: color(),
  type: type(),
})

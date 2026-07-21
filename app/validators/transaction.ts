import vine from '@vinejs/vine'

const amount = () => vine.number().positive()
const description = () => vine.string().trim().maxLength(255).optional()

/**
 * Validator used when creating or updating a transaction. `categoryId`
 * existing, belonging to the current user, and not being archived is
 * checked in the service — a plain format check isn't enough there since
 * it needs a DB lookup.
 */
export const transactionValidator = vine.create({
  categoryId: vine.string(),
  amount: amount(),
  date: vine.date(),
  description: description(),
})

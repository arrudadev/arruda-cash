import vine from '@vinejs/vine'

/**
 * Validator for the optional `month` query param accepted by the recurring
 * index page. Omitting it falls back to the current month.
 */
export const recurringMonthValidator = vine.create({
  month: vine.string().optional(),
})

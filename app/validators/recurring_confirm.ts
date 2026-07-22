import vine from '@vinejs/vine'

/**
 * Validator for confirming a recurring instance. `month` pins down which
 * month is being confirmed (the toggle between "this" and "next" on the
 * page); `amount` is always sent — pre-filled and read-only in the UI for a
 * fixed rule, editable for a variable one.
 */
export const confirmRecurringInstanceValidator = vine.create({
  month: vine.string(),
  amount: vine.number().positive(),
})

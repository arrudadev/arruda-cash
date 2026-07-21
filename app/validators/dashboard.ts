import vine from '@vinejs/vine'

/**
 * Validator for the optional period query params accepted by the
 * dashboard summary and category drilldown endpoints. Both are
 * optional — omitting them falls back to the current month.
 */
export const periodValidator = vine.create({
  from: vine.string().optional(),
  to: vine.string().optional(),
})

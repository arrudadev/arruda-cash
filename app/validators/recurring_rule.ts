import vine from '@vinejs/vine'
import { RECURRING_KINDS } from '#models/recurring_rule'

const name = () => vine.string().trim().minLength(1).maxLength(60)
const amount = () => vine.number().positive()
const kind = () => vine.enum(RECURRING_KINDS)
const dayOfMonth = () => vine.number().min(1).max(31)
const startMonth = () => vine.date()
const installmentsTotal = () => vine.number().positive().optional()

/**
 * Single validator for both create and update, mirroring `transactionValidator`
 * — there is no `type` field, it's derived from the chosen category.
 */
export const recurringRuleValidator = vine.create({
  categoryId: vine.string(),
  name: name(),
  amount: amount(),
  kind: kind(),
  dayOfMonth: dayOfMonth(),
  startMonth: startMonth(),
  installmentsTotal: installmentsTotal(),
})

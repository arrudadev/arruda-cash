import { test } from '@japa/runner'
import { recurringRuleValidator } from '#validators/recurring_rule'

const validPayload = {
  categoryId: 'cat-1',
  name: 'Netflix',
  amount: 39.9,
  kind: 'fixed',
  dayOfMonth: 10,
  startMonth: '2026-07-01',
}

test.group('recurringRuleValidator', () => {
  test('accepts a valid ongoing payload', async ({ assert }) => {
    const data = await recurringRuleValidator.validate(validPayload)

    assert.equal(data.name, 'Netflix')
    assert.equal(data.amount, 39.9)
    assert.equal(data.kind, 'fixed')
    assert.equal(data.dayOfMonth, 10)
    assert.isUndefined(data.installmentsTotal)
  })

  test('accepts an installments count', async ({ assert }) => {
    const data = await recurringRuleValidator.validate({ ...validPayload, installmentsTotal: 12 })

    assert.equal(data.installmentsTotal, 12)
  })

  test('rejects a kind outside fixed/variable', async ({ assert }) => {
    await assert.rejects(() => recurringRuleValidator.validate({ ...validPayload, kind: 'weekly' }))
  })

  test('rejects a day of month outside 1-31', async ({ assert }) => {
    await assert.rejects(() => recurringRuleValidator.validate({ ...validPayload, dayOfMonth: 0 }))
    await assert.rejects(() => recurringRuleValidator.validate({ ...validPayload, dayOfMonth: 32 }))
  })

  test('rejects a non-positive amount', async ({ assert }) => {
    await assert.rejects(() => recurringRuleValidator.validate({ ...validPayload, amount: 0 }))
  })

  test('rejects an empty name', async ({ assert }) => {
    await assert.rejects(() => recurringRuleValidator.validate({ ...validPayload, name: '' }))
  })
})

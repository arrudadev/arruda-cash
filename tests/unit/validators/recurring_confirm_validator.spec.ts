import { test } from '@japa/runner'
import {
  confirmRecurringInstanceValidator,
  unconfirmRecurringInstanceValidator,
} from '#validators/recurring_confirm'

test.group('confirmRecurringInstanceValidator', () => {
  test('accepts a valid payload', async ({ assert }) => {
    const data = await confirmRecurringInstanceValidator.validate({
      month: '2026-07-01',
      amount: 39.9,
    })

    assert.equal(data.month, '2026-07-01')
    assert.equal(data.amount, 39.9)
  })

  test('rejects a non-positive amount', async ({ assert }) => {
    await assert.rejects(() =>
      confirmRecurringInstanceValidator.validate({ month: '2026-07-01', amount: 0 })
    )
  })

  test('rejects a missing month', async ({ assert }) => {
    await assert.rejects(() => confirmRecurringInstanceValidator.validate({ amount: 39.9 }))
  })
})

test.group('unconfirmRecurringInstanceValidator', () => {
  test('accepts a valid payload', async ({ assert }) => {
    const data = await unconfirmRecurringInstanceValidator.validate({ month: '2026-07-01' })

    assert.equal(data.month, '2026-07-01')
  })

  test('rejects a missing month', async ({ assert }) => {
    await assert.rejects(() => unconfirmRecurringInstanceValidator.validate({}))
  })
})

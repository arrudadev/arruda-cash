import { test } from '@japa/runner'
import { transactionValidator } from '#validators/transaction'

test.group('transactionValidator', () => {
  test('accepts a valid payload', async ({ assert }) => {
    const data = await transactionValidator.validate({
      categoryId: 'cat-1',
      amount: 42.5,
      date: '2026-07-01',
      description: 'Weekly shop',
    })

    assert.equal(data.categoryId, 'cat-1')
    assert.equal(data.amount, 42.5)
    assert.equal(data.description, 'Weekly shop')
  })

  test('accepts a payload without a description', async ({ assert }) => {
    const data = await transactionValidator.validate({
      categoryId: 'cat-1',
      amount: 42.5,
      date: '2026-07-01',
    })

    assert.isUndefined(data.description)
  })

  test('rejects a zero or negative amount', async ({ assert }) => {
    await assert.rejects(() =>
      transactionValidator.validate({
        categoryId: 'cat-1',
        amount: 0,
        date: '2026-07-01',
      })
    )

    await assert.rejects(() =>
      transactionValidator.validate({
        categoryId: 'cat-1',
        amount: -5,
        date: '2026-07-01',
      })
    )
  })

  test('rejects an invalid date', async ({ assert }) => {
    await assert.rejects(() =>
      transactionValidator.validate({
        categoryId: 'cat-1',
        amount: 10,
        date: 'not-a-date',
      })
    )
  })

  test('rejects a missing categoryId', async ({ assert }) => {
    await assert.rejects(() =>
      transactionValidator.validate({
        amount: 10,
        date: '2026-07-01',
      })
    )
  })
})

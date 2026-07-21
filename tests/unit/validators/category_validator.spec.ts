import { test } from '@japa/runner'
import { createCategoryValidator } from '#validators/category'

test.group('createCategoryValidator', () => {
  test('accepts a valid payload', async ({ assert }) => {
    const data = await createCategoryValidator.validate({
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    assert.deepEqual(data, { name: 'Groceries', color: '#22c55e', type: 'expense' })
  })

  test('rejects a color that is not a hex code', async ({ assert }) => {
    await assert.rejects(() =>
      createCategoryValidator.validate({
        name: 'Groceries',
        color: 'green',
        type: 'expense',
      })
    )
  })

  test('rejects a type outside income/expense', async ({ assert }) => {
    await assert.rejects(() =>
      createCategoryValidator.validate({
        name: 'Groceries',
        color: '#22c55e',
        type: 'savings',
      })
    )
  })

  test('rejects an empty name', async ({ assert }) => {
    await assert.rejects(() =>
      createCategoryValidator.validate({
        name: '',
        color: '#22c55e',
        type: 'expense',
      })
    )
  })
})

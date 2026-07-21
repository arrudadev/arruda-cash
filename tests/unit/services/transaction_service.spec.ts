import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import ArchivedCategoryException from '#exceptions/archived_category_exception'
import Transaction from '#models/transaction'
import User from '#models/user'
import { CategoryService } from '#services/category_service'
import { TransactionService } from '#services/transaction_service'

test.group('TransactionService', (group) => {
  const categoryService = new CategoryService()
  const transactionService = new TransactionService(categoryService)

  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('create derives the type from the category and stores the amount in cents', async ({
    assert,
  }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    const transaction = await transactionService.create(user.id, {
      categoryId: category.id,
      amount: 42.5,
      date: DateTime.fromISO('2026-07-01'),
      description: 'Weekly shop',
    })

    assert.equal(transaction.type, 'expense')
    assert.equal(transaction.amount, 4250)
    assert.equal(transaction.userId, user.id)
    assert.equal(transaction.category.id, category.id)
  })

  test('create rejects an archived category', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    await categoryService.archive(category)

    await assert.rejects(
      () =>
        transactionService.create(user.id, {
          categoryId: category.id,
          amount: 10,
          date: DateTime.now(),
        }),
      ArchivedCategoryException
    )
  })

  test('create rejects a category owned by someone else', async ({ assert }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const attacker = await User.create({ email: 'attacker@example.com', password: 'password123' })
    const category = await categoryService.create(owner.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    await assert.rejects(() =>
      transactionService.create(attacker.id, {
        categoryId: category.id,
        amount: 10,
        date: DateTime.now(),
      })
    )
  })

  test('update re-derives the type when the category changes', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const groceries = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const salary = await categoryService.create(user.id, {
      name: 'Salary',
      color: '#eab308',
      type: 'income',
    })
    const transaction = await transactionService.create(user.id, {
      categoryId: groceries.id,
      amount: 10,
      date: DateTime.now(),
    })

    const updated = await transactionService.update(transaction, {
      categoryId: salary.id,
      amount: 100,
      date: DateTime.now(),
    })

    assert.equal(updated.categoryId, salary.id)
    assert.equal(updated.type, 'income')
    assert.equal(updated.amount, 10000)
  })

  test('destroy removes the row', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const transaction = await transactionService.create(user.id, {
      categoryId: category.id,
      amount: 10,
      date: DateTime.now(),
    })

    await transactionService.destroy(transaction)

    const found = await Transaction.find(transaction.id)
    assert.isNull(found)
  })

  test('listForUser filters by category, type and date range, scoped to the user', async ({
    assert,
  }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const other = await User.create({ email: 'other@example.com', password: 'password123' })
    const groceries = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const salary = await categoryService.create(user.id, {
      name: 'Salary',
      color: '#eab308',
      type: 'income',
    })
    const otherCategory = await categoryService.create(other.id, {
      name: 'Other',
      color: '#000000',
      type: 'expense',
    })

    await transactionService.create(user.id, {
      categoryId: groceries.id,
      amount: 10,
      date: DateTime.fromISO('2026-07-01'),
    })
    await transactionService.create(user.id, {
      categoryId: salary.id,
      amount: 1000,
      date: DateTime.fromISO('2026-06-01'),
    })
    await transactionService.create(other.id, {
      categoryId: otherCategory.id,
      amount: 10,
      date: DateTime.fromISO('2026-07-01'),
    })

    const julyOnly = await transactionService.listForUser(user.id, {
      from: '2026-07-01',
      to: '2026-07-31',
    })
    assert.equal(julyOnly.all().length, 1)
    assert.equal(julyOnly.all()[0].categoryId, groceries.id)

    const incomeOnly = await transactionService.listForUser(user.id, { type: 'income' })
    assert.equal(incomeOnly.all().length, 1)
    assert.equal(incomeOnly.all()[0].categoryId, salary.id)
  })
})

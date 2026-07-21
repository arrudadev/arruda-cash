import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { UserFactory } from '#database/factories/user_factory'
import Transaction from '#models/transaction'

test.group('Transactions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('authenticated user can create a transaction', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()

    const response = await client
      .post('/transactions')
      .loginAs(user)
      .redirects(0)
      .form({ categoryId: category.id, amount: '42.50', date: '2026-07-01', description: 'Shop' })

    response.assertFound()

    const transaction = await Transaction.query().where('userId', user.id).firstOrFail()
    assert.equal(transaction.amount, 4250)
    assert.equal(transaction.type, 'expense')
    assert.equal(transaction.categoryId, category.id)
  })

  test('rejects a transaction against an archived category', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({
      userId: user.id,
      type: 'expense',
      archivedAt: DateTime.now(),
    }).create()

    await client
      .post('/transactions')
      .loginAs(user)
      .form({ categoryId: category.id, amount: '10', date: '2026-07-01' })

    const count = await Transaction.query().where('userId', user.id).count('* as total')
    assert.equal(count[0].$extras.total, 0)
  })

  test('a user cannot attach a transaction to someone else category', async ({ client }) => {
    const owner = await UserFactory.create()
    const attacker = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()

    const response = await client
      .post('/transactions')
      .loginAs(attacker)
      .redirects(0)
      .form({ categoryId: category.id, amount: '10', date: '2026-07-01' })

    response.assertStatus(404)
  })

  test('index lists only the authenticated user transactions', async ({ client, assert }) => {
    const owner = await UserFactory.create()
    const other = await UserFactory.create()
    const ownerCategory = await CategoryFactory.merge({
      userId: owner.id,
      type: 'expense',
    }).create()
    const otherCategory = await CategoryFactory.merge({
      userId: other.id,
      type: 'expense',
    }).create()
    await TransactionFactory.merge({
      userId: owner.id,
      categoryId: ownerCategory.id,
      type: 'expense',
      date: DateTime.fromISO('2026-07-01'),
    }).create()
    await TransactionFactory.merge({
      userId: other.id,
      categoryId: otherCategory.id,
      type: 'expense',
      date: DateTime.fromISO('2026-07-01'),
    }).create()

    const response = await client.get('/transactions').loginAs(owner).withInertia()

    response.assertInertiaComponent('transactions/index')
    assert.lengthOf(response.inertiaProps.transactions, 1)
    assert.equal(response.inertiaProps.transactions[0].category.id, ownerCategory.id)
  })

  test('index filters by category', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const groceries = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const salary = await CategoryFactory.merge({ userId: user.id, type: 'income' }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      date: DateTime.fromISO('2026-07-01'),
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: salary.id,
      type: 'income',
      date: DateTime.fromISO('2026-07-01'),
    }).create()

    const response = await client
      .get('/transactions')
      .qs({ categoryId: groceries.id })
      .loginAs(user)
      .withInertia()

    assert.lengthOf(response.inertiaProps.transactions, 1)
    assert.equal(response.inertiaProps.transactions[0].category.id, groceries.id)
  })

  test('owner can update their transaction', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const transaction = await TransactionFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      date: DateTime.fromISO('2026-07-01'),
    }).create()

    const response = await client
      .put(`/transactions/${transaction.id}`)
      .loginAs(user)
      .redirects(0)
      .form({
        categoryId: category.id,
        amount: '99.99',
        date: '2026-07-02',
        description: 'Updated',
      })

    response.assertFound()

    await transaction.refresh()
    assert.equal(transaction.amount, 9999)
    assert.equal(transaction.description, 'Updated')
  })

  test('owner can delete their transaction', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const transaction = await TransactionFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      date: DateTime.fromISO('2026-07-01'),
    }).create()

    const response = await client
      .delete(`/transactions/${transaction.id}`)
      .loginAs(user)
      .redirects(0)

    response.assertFound()

    const found = await Transaction.find(transaction.id)
    assert.isNull(found)
  })
})

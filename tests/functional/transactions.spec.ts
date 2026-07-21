import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Category from '#models/category'
import Transaction from '#models/transaction'
import User from '#models/user'

test.group('Transactions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('authenticated user can create a transaction', async ({ client, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

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
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
      archivedAt: DateTime.now(),
    })

    await client
      .post('/transactions')
      .loginAs(user)
      .form({ categoryId: category.id, amount: '10', date: '2026-07-01' })

    const count = await Transaction.query().where('userId', user.id).count('* as total')
    assert.equal(count[0].$extras.total, 0)
  })

  test('a user cannot attach a transaction to someone else category', async ({ client }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const attacker = await User.create({ email: 'attacker@example.com', password: 'password123' })
    const category = await Category.create({
      userId: owner.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    const response = await client
      .post('/transactions')
      .loginAs(attacker)
      .redirects(0)
      .form({ categoryId: category.id, amount: '10', date: '2026-07-01' })

    response.assertStatus(404)
  })

  test('index lists only the authenticated user transactions', async ({ client, assert }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const other = await User.create({ email: 'other@example.com', password: 'password123' })
    const ownerCategory = await Category.create({
      userId: owner.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const otherCategory = await Category.create({
      userId: other.id,
      name: 'Other',
      color: '#000000',
      type: 'expense',
    })
    await Transaction.create({
      userId: owner.id,
      categoryId: ownerCategory.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-01'),
    })
    await Transaction.create({
      userId: other.id,
      categoryId: otherCategory.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-01'),
    })

    const response = await client.get('/transactions').loginAs(owner).withInertia()

    response.assertInertiaComponent('transactions/index')
    assert.lengthOf(response.inertiaProps.transactions, 1)
    assert.equal(response.inertiaProps.transactions[0].category.id, ownerCategory.id)
  })

  test('index filters by category', async ({ client, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const groceries = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const salary = await Category.create({
      userId: user.id,
      name: 'Salary',
      color: '#eab308',
      type: 'income',
    })
    await Transaction.create({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-01'),
    })
    await Transaction.create({
      userId: user.id,
      categoryId: salary.id,
      type: 'income',
      amount: 5000,
      date: DateTime.fromISO('2026-07-01'),
    })

    const response = await client
      .get('/transactions')
      .qs({ categoryId: groceries.id })
      .loginAs(user)
      .withInertia()

    assert.lengthOf(response.inertiaProps.transactions, 1)
    assert.equal(response.inertiaProps.transactions[0].category.id, groceries.id)
  })

  test('owner can update their transaction', async ({ client, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const transaction = await Transaction.create({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-01'),
    })

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
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    const transaction = await Transaction.create({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-01'),
    })

    const response = await client
      .delete(`/transactions/${transaction.id}`)
      .loginAs(user)
      .redirects(0)

    response.assertFound()

    const found = await Transaction.find(transaction.id)
    assert.isNull(found)
  })
})

import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Category from '#models/category'
import Transaction from '#models/transaction'
import User from '#models/user'

test.group('Dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows totals and breakdown scoped to the user and period', async ({ client, assert }) => {
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
      date: DateTime.fromISO('2026-07-10'),
    })
    await Transaction.create({
      userId: user.id,
      categoryId: salary.id,
      type: 'income',
      amount: 5000,
      date: DateTime.fromISO('2026-07-15'),
    })

    const response = await client
      .get('/dashboard')
      .qs({ from: '2026-07-01', to: '2026-07-31' })
      .loginAs(user)
      .withInertia()

    response.assertInertiaComponent('dashboard')
    assert.equal(response.inertiaProps.income, 5000)
    assert.equal(response.inertiaProps.expense, 1000)
    assert.equal(response.inertiaProps.balance, 4000)
    assert.lengthOf(response.inertiaProps.breakdown, 2)
  })

  test('unauthenticated visitor is redirected away from the dashboard', async ({ client }) => {
    const response = await client.get('/dashboard')

    response.assertRedirectsTo('/login')
  })
})

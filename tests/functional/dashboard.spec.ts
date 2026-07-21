import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shows totals and breakdown scoped to the user and period', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const groceries = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const salary = await CategoryFactory.merge({ userId: user.id, type: 'income' }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-10'),
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: salary.id,
      type: 'income',
      amount: 5000,
      date: DateTime.fromISO('2026-07-15'),
    }).create()

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

  test('category drilldown returns that category transactions in the period', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const groceries = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const salary = await CategoryFactory.merge({ userId: user.id, type: 'income' }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      amount: 1000,
      date: DateTime.fromISO('2026-07-10'),
    }).create()
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: salary.id,
      type: 'income',
      amount: 5000,
      date: DateTime.fromISO('2026-07-15'),
    }).create()
    // Outside the period — must not be returned.
    await TransactionFactory.merge({
      userId: user.id,
      categoryId: groceries.id,
      type: 'expense',
      amount: 999,
      date: DateTime.fromISO('2026-06-01'),
    }).create()

    const response = await client
      .get(`/dashboard/categories/${groceries.id}/transactions`)
      .qs({ from: '2026-07-01', to: '2026-07-31' })
      .loginAs(user)

    response.assertOk()
    assert.lengthOf(response.body().data, 1)
    assert.equal(response.body().data[0].amount, 1000)
  })

  test('category drilldown 404s for a category owned by someone else', async ({ client }) => {
    const owner = await UserFactory.create()
    const attacker = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()

    const response = await client
      .get(`/dashboard/categories/${category.id}/transactions`)
      .loginAs(attacker)

    response.assertStatus(404)
  })
})

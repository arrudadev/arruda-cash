import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { RecurringRuleFactory } from '#database/factories/recurring_rule_factory'
import { UserFactory } from '#database/factories/user_factory'
import RecurringInstance from '#models/recurring_instance'
import RecurringRule from '#models/recurring_rule'
import Transaction from '#models/transaction'

test.group('Recurring rules', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('authenticated user can create a recurring rule', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()

    const response = await client.post('/recurring').loginAs(user).redirects(0).form({
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: '2026-07-01',
    })

    response.assertFound()

    const rule = await RecurringRule.query().where('userId', user.id).firstOrFail()
    assert.equal(rule.name, 'Netflix')
    assert.equal(rule.type, 'expense')
    assert.equal(rule.amount, 3990)
    assert.equal(rule.kind, 'fixed')
    assert.isNull(rule.installmentsTotal)
    assert.isNull(rule.archivedAt)
  })

  test('rejects creating a rule against an archived category', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({
      userId: user.id,
      type: 'expense',
      archivedAt: DateTime.now(),
    }).create()

    const response = await client.post('/recurring').loginAs(user).redirects(0).form({
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: '2026-07-01',
    })

    response.assertFound()
    const count = await RecurringRule.query().where('userId', user.id).count('* as total')
    assert.equal(count[0].$extras.total, 0)
  })

  test('index only lists the authenticated user rules', async ({ client, assert }) => {
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

    await RecurringRuleFactory.merge({
      userId: owner.id,
      categoryId: ownerCategory.id,
      type: 'expense',
      name: 'Owner rule',
    }).create()
    await RecurringRuleFactory.merge({
      userId: other.id,
      categoryId: otherCategory.id,
      type: 'expense',
      name: 'Other rule',
    }).create()

    const response = await client.get('/recurring').loginAs(owner).withInertia()

    response.assertInertiaComponent('recurring/index')
    const names = response.inertiaProps.rules.map((rule: { name: string }) => rule.name)
    assert.deepEqual(names, ['Owner rule'])
  })

  test('index returns committed instances and summary for the requested month', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      name: 'Netflix',
      amount: 3990,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: null,
    }).create()

    const july = await client
      .get('/recurring')
      .qs({ month: '2026-07-01' })
      .loginAs(user)
      .withInertia()
    const names = july.inertiaProps.instances.map((instance: { name: string }) => instance.name)
    assert.deepEqual(names, ['Netflix'])
    assert.equal(july.inertiaProps.summary.expense, 3990)
    assert.equal(july.inertiaProps.month, '2026-07-01')

    const beforeStart = await client
      .get('/recurring')
      .qs({ month: '2025-12-01' })
      .loginAs(user)
      .withInertia()
    assert.deepEqual(beforeStart.inertiaProps.instances, [])
    assert.equal(beforeStart.inertiaProps.summary.expense, 0)
  })

  test('index defaults to the current month when none is given', async ({ client, assert }) => {
    const user = await UserFactory.create()

    const response = await client.get('/recurring').loginAs(user).withInertia()

    assert.equal(response.inertiaProps.month, DateTime.now().startOf('month').toISODate())
  })

  test('owner can update their rule', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
    }).create()

    const response = await client.put(`/recurring/${rule.id}`).loginAs(user).redirects(0).form({
      categoryId: category.id,
      name: 'Renamed',
      amount: 55,
      kind: 'variable',
      dayOfMonth: 20,
      startMonth: '2026-08-01',
    })

    response.assertFound()

    await rule.refresh()
    assert.equal(rule.name, 'Renamed')
    assert.equal(rule.amount, 5500)
    assert.equal(rule.kind, 'variable')
    assert.equal(rule.dayOfMonth, 20)
  })

  test('a user cannot update another user rule', async ({ client }) => {
    const owner = await UserFactory.create()
    const attacker = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: owner.id,
      categoryId: category.id,
      type: 'expense',
    }).create()

    const response = await client.put(`/recurring/${rule.id}`).loginAs(attacker).form({
      categoryId: category.id,
      name: 'Hijacked',
      amount: 10,
      kind: 'fixed',
      dayOfMonth: 1,
      startMonth: '2026-08-01',
    })

    response.assertStatus(404)
  })

  test('destroy archives the rule instead of deleting it', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
    }).create()

    const response = await client.delete(`/recurring/${rule.id}`).loginAs(user).redirects(0)

    response.assertFound()

    await rule.refresh()
    assert.isNotNull(rule.archivedAt)
    const stillExists = await RecurringRule.find(rule.id)
    assert.isNotNull(stillExists)
  })

  test('confirming an instance creates a transaction visible in Transactions', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      name: 'Netflix',
      dayOfMonth: 10,
      startMonth: DateTime.fromISO('2026-07-01'),
      installmentsTotal: null,
    }).create()

    const response = await client
      .post(`/recurring/${rule.id}/confirm`)
      .loginAs(user)
      .redirects(0)
      .form({ month: '2026-07-01', amount: 39.9 })

    response.assertFound()

    const instance = await RecurringInstance.query().where('recurringRuleId', rule.id).firstOrFail()
    assert.equal(instance.amount, 3990)
    assert.isNotNull(instance.transactionId)

    const transaction = await Transaction.query().where('userId', user.id).firstOrFail()
    assert.equal(transaction.description, 'Netflix')
    assert.equal(transaction.amount, 3990)
  })

  test('rejects confirming the same rule and month twice', async ({ client, assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      startMonth: DateTime.fromISO('2026-07-01'),
      installmentsTotal: null,
    }).create()
    await client
      .post(`/recurring/${rule.id}/confirm`)
      .loginAs(user)
      .form({ month: '2026-07-01', amount: 39.9 })

    const response = await client
      .post(`/recurring/${rule.id}/confirm`)
      .loginAs(user)
      .redirects(0)
      .form({ month: '2026-07-01', amount: 39.9 })

    response.assertFound()
    const count = await RecurringInstance.query()
      .where('recurringRuleId', rule.id)
      .count('* as total')
    assert.equal(count[0].$extras.total, 1)
  })

  test('a user cannot confirm another user rule', async ({ client }) => {
    const owner = await UserFactory.create()
    const attacker = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: owner.id,
      categoryId: category.id,
      type: 'expense',
    }).create()

    const response = await client
      .post(`/recurring/${rule.id}/confirm`)
      .loginAs(attacker)
      .form({ month: '2026-07-01', amount: 10 })

    response.assertStatus(404)
  })

  test('unconfirming an instance deletes the transaction and the instance', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
      startMonth: DateTime.fromISO('2026-07-01'),
      installmentsTotal: null,
    }).create()
    await client
      .post(`/recurring/${rule.id}/confirm`)
      .loginAs(user)
      .form({ month: '2026-07-01', amount: 39.9 })

    const response = await client
      .delete(`/recurring/${rule.id}/confirm`)
      .loginAs(user)
      .redirects(0)
      .form({ month: '2026-07-01' })

    response.assertFound()
    const instanceCount = await RecurringInstance.query()
      .where('recurringRuleId', rule.id)
      .count('* as total')
    assert.equal(instanceCount[0].$extras.total, 0)
    const transactionCount = await Transaction.query().where('userId', user.id).count('* as total')
    assert.equal(transactionCount[0].$extras.total, 0)
  })

  test('unconfirming a month that was never confirmed 404s', async ({ client }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await RecurringRuleFactory.merge({
      userId: user.id,
      categoryId: category.id,
      type: 'expense',
    }).create()

    const response = await client
      .delete(`/recurring/${rule.id}/confirm`)
      .loginAs(user)
      .form({ month: '2026-07-01' })

    response.assertStatus(404)
  })

  test('unauthenticated visitor is redirected away from recurring rules', async ({ client }) => {
    const response = await client.get('/recurring')

    response.assertRedirectsTo('/login')
  })
})

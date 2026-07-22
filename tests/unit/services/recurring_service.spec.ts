import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { UserFactory } from '#database/factories/user_factory'
import ArchivedCategoryException from '#exceptions/archived_category_exception'
import RecurringRule from '#models/recurring_rule'
import { CategoryService } from '#services/category_service'
import { RecurringService } from '#services/recurring_service'

test.group('RecurringService', (group) => {
  const categoryService = new CategoryService()
  const recurringService = new RecurringService(categoryService)

  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('create derives the type from the category and stores the amount in cents', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()

    const rule = await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: DateTime.fromISO('2026-07-15'),
      installmentsTotal: null,
    })

    assert.equal(rule.type, 'expense')
    assert.equal(rule.amount, 3990)
    assert.equal(rule.userId, user.id)
    assert.equal(rule.category.id, category.id)
    // startMonth normalizes to the first of the month regardless of the day given
    assert.equal(rule.startMonth.toISODate(), '2026-07-01')
    assert.isNull(rule.installmentsTotal)
    await rule.refresh()
    assert.isNull(rule.archivedAt)
  })

  test('create rejects an archived category', async ({ assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    await categoryService.archive(category)

    await assert.rejects(
      () =>
        recurringService.create(user.id, {
          categoryId: category.id,
          name: 'Netflix',
          amount: 10,
          kind: 'fixed',
          dayOfMonth: 10,
          startMonth: DateTime.now(),
          installmentsTotal: null,
        }),
      ArchivedCategoryException
    )
  })

  test('create rejects a category owned by someone else', async ({ assert }) => {
    const owner = await UserFactory.create()
    const attacker = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()

    await assert.rejects(() =>
      recurringService.create(attacker.id, {
        categoryId: category.id,
        name: 'Netflix',
        amount: 10,
        kind: 'fixed',
        dayOfMonth: 10,
        startMonth: DateTime.now(),
        installmentsTotal: null,
      })
    )
  })

  test('create stores an installment count for a parcelled rule', async ({ assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()

    const rule = await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Fridge, 12x',
      amount: 250,
      kind: 'fixed',
      dayOfMonth: 5,
      startMonth: DateTime.now(),
      installmentsTotal: 12,
    })

    assert.equal(rule.installmentsTotal, 12)
  })

  test('update re-derives the type when the category changes', async ({ assert }) => {
    const user = await UserFactory.create()
    const bills = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const salary = await CategoryFactory.merge({ userId: user.id, type: 'income' }).create()
    const rule = await recurringService.create(user.id, {
      categoryId: bills.id,
      name: 'Electricity',
      amount: 200,
      kind: 'variable',
      dayOfMonth: 15,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })

    const updated = await recurringService.update(rule, {
      categoryId: salary.id,
      name: 'Salary',
      amount: 5000,
      kind: 'fixed',
      dayOfMonth: 1,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })

    assert.equal(updated.categoryId, salary.id)
    assert.equal(updated.type, 'income')
    assert.equal(updated.amount, 500000)
    assert.equal(updated.kind, 'fixed')
  })

  test('archive sets archivedAt without deleting the row', async ({ assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })

    await recurringService.archive(rule)

    assert.isNotNull(rule.archivedAt)
    const stillExists = await RecurringRule.find(rule.id)
    assert.isNotNull(stillExists)
  })

  test('listForUser only returns rules owned by that user, sorted by name', async ({ assert }) => {
    const owner = await UserFactory.create()
    const other = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()
    const otherCategory = await CategoryFactory.merge({
      userId: other.id,
      type: 'expense',
    }).create()

    await recurringService.create(owner.id, {
      categoryId: category.id,
      name: 'Water',
      amount: 50,
      kind: 'variable',
      dayOfMonth: 5,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })
    await recurringService.create(owner.id, {
      categoryId: category.id,
      name: 'Internet',
      amount: 100,
      kind: 'fixed',
      dayOfMonth: 5,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })
    await recurringService.create(other.id, {
      categoryId: otherCategory.id,
      name: 'Someone else',
      amount: 10,
      kind: 'fixed',
      dayOfMonth: 5,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })

    const rules = await recurringService.listForUser(owner.id)

    assert.deepEqual(
      rules.map((rule) => rule.name),
      ['Internet', 'Water']
    )
  })

  test('findForUser raises when the rule belongs to someone else', async ({ assert }) => {
    const owner = await UserFactory.create()
    const attacker = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: owner.id, type: 'expense' }).create()
    const rule = await recurringService.create(owner.id, {
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: DateTime.now(),
      installmentsTotal: null,
    })

    await assert.rejects(() => recurringService.findForUser(attacker.id, rule.id))
  })

  test('getMonthInstances only includes rules that apply to the given month', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()

    await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: null,
    })
    // Starts after July, shouldn't show up for July.
    await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Future gym',
      amount: 100,
      kind: 'fixed',
      dayOfMonth: 1,
      startMonth: DateTime.fromISO('2026-09-01'),
      installmentsTotal: null,
    })
    // A 3-installment purchase that finished before July.
    await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Old headphones',
      amount: 50,
      kind: 'fixed',
      dayOfMonth: 1,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: 3,
    })

    const instances = await recurringService.getMonthInstances(
      user.id,
      DateTime.fromISO('2026-07-01')
    )

    assert.deepEqual(
      instances.map((instance) => instance.name),
      ['Netflix']
    )
  })

  test('getMonthInstances excludes archived rules', async ({ assert }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const rule = await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: null,
    })
    await recurringService.archive(rule)

    const instances = await recurringService.getMonthInstances(
      user.id,
      DateTime.fromISO('2026-07-01')
    )

    assert.deepEqual(instances, [])
  })

  test('getMonthInstances reports the installment index for a parcelled rule', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const category = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    await recurringService.create(user.id, {
      categoryId: category.id,
      name: 'Fridge, 12x',
      amount: 250,
      kind: 'fixed',
      dayOfMonth: 5,
      startMonth: DateTime.fromISO('2026-07-01'),
      installmentsTotal: 12,
    })

    const [instance] = await recurringService.getMonthInstances(
      user.id,
      DateTime.fromISO('2026-10-01')
    )

    assert.equal(instance.installmentIndex, 4)
    assert.equal(instance.installmentsTotal, 12)
  })

  test('getCommittedSummary sums committed instances by type', async ({ assert }) => {
    const user = await UserFactory.create()
    const bills = await CategoryFactory.merge({ userId: user.id, type: 'expense' }).create()
    const salary = await CategoryFactory.merge({ userId: user.id, type: 'income' }).create()

    await recurringService.create(user.id, {
      categoryId: bills.id,
      name: 'Netflix',
      amount: 39.9,
      kind: 'fixed',
      dayOfMonth: 10,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: null,
    })
    await recurringService.create(user.id, {
      categoryId: bills.id,
      name: 'Electricity',
      amount: 200,
      kind: 'variable',
      dayOfMonth: 15,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: null,
    })
    await recurringService.create(user.id, {
      categoryId: salary.id,
      name: 'Salary',
      amount: 5000,
      kind: 'fixed',
      dayOfMonth: 1,
      startMonth: DateTime.fromISO('2026-01-01'),
      installmentsTotal: null,
    })

    const summary = await recurringService.getCommittedSummary(
      user.id,
      DateTime.fromISO('2026-07-01')
    )

    assert.equal(summary.month, '2026-07-01')
    assert.equal(summary.expense, 23990)
    assert.equal(summary.income, 500000)
    assert.equal(summary.balance, 500000 - 23990)
  })
})

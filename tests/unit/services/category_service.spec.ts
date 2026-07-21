import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Category from '#models/category'
import User from '#models/user'
import { CategoryService } from '#services/category_service'

test.group('CategoryService', (group) => {
  const categoryService = new CategoryService()

  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('create scopes the category to the given user', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })

    const category = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    assert.equal(category.userId, user.id)
    await category.refresh()
    assert.isNull(category.archivedAt)
  })

  test('listForUser only returns categories owned by that user, sorted by name', async ({
    assert,
  }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const other = await User.create({ email: 'other@example.com', password: 'password123' })

    await categoryService.create(owner.id, {
      name: 'Transport',
      color: '#3b82f6',
      type: 'expense',
    })
    await categoryService.create(owner.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })
    await categoryService.create(other.id, { name: 'Salary', color: '#eab308', type: 'income' })

    const categories = await categoryService.listForUser(owner.id)

    assert.deepEqual(
      categories.map((category) => category.name),
      ['Groceries', 'Transport']
    )
  })

  test('findForUser raises when the category belongs to someone else', async ({ assert }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const attacker = await User.create({ email: 'attacker@example.com', password: 'password123' })
    const category = await categoryService.create(owner.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    await assert.rejects(() => categoryService.findForUser(attacker.id, category.id))
  })

  test('update changes name, color and type', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    const updated = await categoryService.update(category, {
      name: 'Food',
      color: '#3b82f6',
      type: 'income',
    })

    assert.equal(updated.name, 'Food')
    assert.equal(updated.color, '#3b82f6')
    assert.equal(updated.type, 'income')
  })

  test('archive sets archivedAt without deleting the row', async ({ assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await categoryService.create(user.id, {
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    await categoryService.archive(category)

    assert.isNotNull(category.archivedAt)
    const stillExists = await Category.find(category.id)
    assert.isNotNull(stillExists)
  })
})

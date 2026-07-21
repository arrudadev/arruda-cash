import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Category from '#models/category'
import User from '#models/user'

test.group('Categories', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('authenticated user can create a category', async ({ client, assert }) => {
    const user = await User.create({
      email: 'owner@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/categories')
      .loginAs(user)
      .redirects(0)
      .form({ name: 'Groceries', color: '#22c55e', type: 'expense' })

    response.assertFound()

    const category = await Category.query().where('userId', user.id).firstOrFail()
    assert.equal(category.name, 'Groceries')
    assert.equal(category.color, '#22c55e')
    assert.equal(category.type, 'expense')
    assert.isNull(category.archivedAt)
  })

  test('rejects an invalid color', async ({ client, assert }) => {
    const user = await User.create({
      email: 'owner@example.com',
      password: 'password123',
    })

    await client
      .post('/categories')
      .loginAs(user)
      .form({ name: 'Groceries', color: 'not-a-color', type: 'expense' })

    const count = await Category.query().where('userId', user.id).count('* as total')
    assert.equal(count[0].$extras.total, 0)
  })

  test('index only lists the authenticated user categories', async ({ client, assert }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const other = await User.create({ email: 'other@example.com', password: 'password123' })

    await Category.create({
      userId: owner.id,
      name: 'Owner category',
      color: '#22c55e',
      type: 'expense',
    })
    await Category.create({
      userId: other.id,
      name: 'Other category',
      color: '#ef4444',
      type: 'income',
    })

    const response = await client.get('/categories').loginAs(owner).withInertia()

    response.assertInertiaComponent('categories/index')
    const names = response.inertiaProps.categories.map(
      (category: { name: string }) => category.name
    )
    assert.deepEqual(names, ['Owner category'])
  })

  test('owner can update their category', async ({ client, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    const response = await client
      .put(`/categories/${category.id}`)
      .loginAs(user)
      .redirects(0)
      .form({ name: 'Food', color: '#3b82f6', type: 'expense' })

    response.assertFound()

    await category.refresh()
    assert.equal(category.name, 'Food')
    assert.equal(category.color, '#3b82f6')
  })

  test('a user cannot update another user category', async ({ client }) => {
    const owner = await User.create({ email: 'owner@example.com', password: 'password123' })
    const attacker = await User.create({ email: 'attacker@example.com', password: 'password123' })
    const category = await Category.create({
      userId: owner.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    const response = await client
      .put(`/categories/${category.id}`)
      .loginAs(attacker)
      .form({ name: 'Hijacked', color: '#000000', type: 'expense' })

    response.assertStatus(404)
  })

  test('destroy archives the category instead of deleting it', async ({ client, assert }) => {
    const user = await User.create({ email: 'owner@example.com', password: 'password123' })
    const category = await Category.create({
      userId: user.id,
      name: 'Groceries',
      color: '#22c55e',
      type: 'expense',
    })

    const response = await client.delete(`/categories/${category.id}`).loginAs(user).redirects(0)

    response.assertFound()

    await category.refresh()
    assert.isNotNull(category.archivedAt)
  })

  test('unauthenticated visitor is redirected away from categories', async ({ client }) => {
    const response = await client.get('/categories')

    response.assertRedirectsTo('/login')
  })
})

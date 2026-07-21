import { DateTime } from 'luxon'
import Category, { type CategoryType } from '#models/category'

type CategoryInput = {
  name: string
  color: string
  type: CategoryType
}

async function listForUser(userId: string) {
  return Category.query().where('userId', userId).orderBy('name', 'asc')
}

async function findForUser(userId: string, id: string) {
  return Category.query().where('id', id).where('userId', userId).firstOrFail()
}

async function create(userId: string, data: CategoryInput) {
  return Category.create({ userId, ...data })
}

async function update(category: Category, data: CategoryInput) {
  category.name = data.name
  category.color = data.color

  // Once a category has transactions, its type stays locked — changing it
  // would make past transactions' recorded type stop matching the category
  // they point to.
  const hasTransactions = await category.related('transactions').query().first()
  if (!hasTransactions) {
    category.type = data.type
  }

  await category.save()
  return category
}

async function archive(category: Category) {
  category.archivedAt = DateTime.now()
  await category.save()
  return category
}

export const CategoryService = {
  listForUser,
  findForUser,
  create,
  update,
  archive,
}

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { UserFactory } from '#database/factories/user_factory'
import Category from '#models/category'
import Transaction from '#models/transaction'
import User from '#models/user'
import env from '#start/env'

const CATEGORIES = [
  { name: 'Salário', type: 'income', color: '#22c55e' },
  { name: 'Freelance', type: 'income', color: '#84cc16' },
  { name: 'Alimentação', type: 'expense', color: '#ef4444' },
  { name: 'Transporte', type: 'expense', color: '#f97316' },
  { name: 'Moradia', type: 'expense', color: '#eab308' },
  { name: 'Lazer', type: 'expense', color: '#8b5cf6' },
  { name: 'Saúde', type: 'expense', color: '#06b6d4' },
  { name: 'Educação', type: 'expense', color: '#ec4899' },
] as const

const TRANSACTIONS_PER_CATEGORY = 8

function randomDateWithinLastMonths(months: number) {
  const daysAgo = Math.floor(Math.random() * months * 30)
  return DateTime.now().minus({ days: daysAgo })
}

export default class extends BaseSeeder {
  async run() {
    const connection = env.get('DB_CONNECTION', 'sqlite')
    if (connection !== 'sqlite') {
      throw new Error(
        `Refusing to seed: DB_CONNECTION is "${connection}". Seeding is only allowed against the local SQLite database.`
      )
    }

    await Transaction.query().delete()
    await Category.query().delete()
    await User.query().delete()

    const user = await UserFactory.merge({
      email: 'dev@najacash.test',
      fullName: 'Dev Naja',
    }).create()

    const categories = await CategoryFactory.merge(
      CATEGORIES.map((category) => ({ ...category, userId: user.id }))
    ).createMany(CATEGORIES.length)

    for (const category of categories) {
      await TransactionFactory.merge(
        Array.from({ length: TRANSACTIONS_PER_CATEGORY }, () => ({
          userId: user.id,
          categoryId: category.id,
          type: category.type,
          date: randomDateWithinLastMonths(6),
        }))
      ).createMany(TRANSACTIONS_PER_CATEGORY)
    }
  }
}

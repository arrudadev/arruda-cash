import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import { CategoryFactory } from '#database/factories/category_factory'
import { TransactionFactory } from '#database/factories/transaction_factory'
import { UserFactory } from '#database/factories/user_factory'
import Category from '#models/category'
import RecurringInstance from '#models/recurring_instance'
import type { RecurringKind } from '#models/recurring_rule'
import RecurringRule from '#models/recurring_rule'
import Transaction from '#models/transaction'
import User from '#models/user'
import { CategoryService } from '#services/category_service'
import { RecurringService } from '#services/recurring_service'
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

/**
 * Realistic description/amount pools per category — picked from, not
 * randomly generated, so seeded data reads like an actual person's history
 * instead of lorem-ipsum placeholders.
 */
const TRANSACTION_TEMPLATES: Record<
  string,
  Array<{ description: string; min: number; max: number }>
> = {
  Salário: [
    { description: 'Salário mensal', min: 4500, max: 5500 },
    { description: 'Bônus de desempenho', min: 500, max: 1500 },
  ],
  Freelance: [
    { description: 'Projeto de website - Cliente A', min: 800, max: 2500 },
    { description: 'Consultoria de TI', min: 300, max: 1200 },
    { description: 'Design de identidade visual', min: 200, max: 600 },
  ],
  Alimentação: [
    { description: 'Supermercado Pão de Açúcar', min: 180, max: 450 },
    { description: 'Feira livre', min: 40, max: 90 },
    { description: 'iFood - almoço', min: 35, max: 70 },
    { description: 'Padaria Santa Clara', min: 15, max: 35 },
    { description: 'Restaurante - jantar', min: 60, max: 150 },
  ],
  Transporte: [
    { description: 'Uber', min: 15, max: 45 },
    { description: 'Combustível - Posto Ipiranga', min: 150, max: 300 },
    { description: 'Estacionamento', min: 10, max: 25 },
    { description: 'Bilhete único', min: 20, max: 50 },
  ],
  Moradia: [
    { description: 'Condomínio', min: 400, max: 600 },
    { description: 'Material de construção', min: 80, max: 300 },
    { description: 'Reparo elétrico', min: 100, max: 400 },
    { description: 'Móveis e decoração', min: 150, max: 500 },
  ],
  Lazer: [
    { description: 'Cinema', min: 30, max: 80 },
    { description: 'Show - ingresso', min: 100, max: 300 },
    { description: 'Bar com amigos', min: 50, max: 150 },
    { description: 'Viagem de fim de semana', min: 300, max: 800 },
  ],
  Saúde: [
    { description: 'Farmácia', min: 30, max: 120 },
    { description: 'Consulta médica', min: 150, max: 400 },
    { description: 'Plano de saúde - coparticipação', min: 50, max: 200 },
  ],
  Educação: [
    { description: 'Curso online', min: 50, max: 300 },
    { description: 'Livros técnicos', min: 40, max: 150 },
    { description: 'Material escolar', min: 30, max: 100 },
  ],
}

/**
 * A handful of real-world recurring rules covering both kinds and a
 * parcelled purchase, so the Recurring tab and dashboard card have
 * something meaningful to show out of the box.
 */
const RECURRING_RULES: Array<{
  categoryName: string
  name: string
  amount: number
  kind: RecurringKind
  dayOfMonth: number
  monthsAgoStart: number
  installmentsTotal: number | null
  confirmThisMonth?: number
}> = [
  {
    categoryName: 'Lazer',
    name: 'Netflix',
    amount: 39.9,
    kind: 'fixed',
    dayOfMonth: 10,
    monthsAgoStart: 8,
    installmentsTotal: null,
    confirmThisMonth: 39.9,
  },
  {
    categoryName: 'Lazer',
    name: 'Internet fibra',
    amount: 99.9,
    kind: 'fixed',
    dayOfMonth: 8,
    monthsAgoStart: 6,
    installmentsTotal: null,
  },
  {
    categoryName: 'Moradia',
    name: 'Aluguel',
    amount: 1800,
    kind: 'fixed',
    dayOfMonth: 5,
    monthsAgoStart: 10,
    installmentsTotal: null,
  },
  {
    categoryName: 'Moradia',
    name: 'Conta de luz',
    amount: 220,
    kind: 'variable',
    dayOfMonth: 15,
    monthsAgoStart: 8,
    installmentsTotal: null,
    confirmThisMonth: 245.7,
  },
  {
    categoryName: 'Moradia',
    name: 'Conta de água',
    amount: 85,
    kind: 'variable',
    dayOfMonth: 20,
    monthsAgoStart: 8,
    installmentsTotal: null,
  },
  {
    categoryName: 'Saúde',
    name: 'Academia',
    amount: 129.9,
    kind: 'fixed',
    dayOfMonth: 5,
    monthsAgoStart: 5,
    installmentsTotal: null,
  },
  {
    categoryName: 'Salário',
    name: 'Salário CLT',
    amount: 5000,
    kind: 'fixed',
    dayOfMonth: 1,
    monthsAgoStart: 12,
    installmentsTotal: null,
  },
  {
    categoryName: 'Educação',
    name: 'Notebook parcelado',
    amount: 249.9,
    kind: 'fixed',
    dayOfMonth: 12,
    monthsAgoStart: 4,
    installmentsTotal: 10,
  },
]

function randomDateWithinLastMonths(months: number) {
  const daysAgo = Math.floor(Math.random() * months * 30)
  return DateTime.now().minus({ days: daysAgo })
}

function randomAmountCents(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100)
}

export default class extends BaseSeeder {
  async run() {
    const connection = env.get('DB_CONNECTION', 'sqlite')
    if (connection !== 'sqlite') {
      throw new Error(
        `Refusing to seed: DB_CONNECTION is "${connection}". Seeding is only allowed against the local SQLite database.`
      )
    }

    await RecurringInstance.query().delete()
    await Transaction.query().delete()
    await RecurringRule.query().delete()
    await Category.query().delete()
    await User.query().delete()

    const user = await UserFactory.merge({
      email: 'dev@najacash.test',
      fullName: 'Dev Naja',
    }).create()

    const categories = await CategoryFactory.merge(
      CATEGORIES.map((category) => ({ ...category, userId: user.id }))
    ).createMany(CATEGORIES.length)
    const categoriesByName = new Map(categories.map((category) => [category.name, category]))

    for (const category of categories) {
      const templates = TRANSACTION_TEMPLATES[category.name] ?? []
      await TransactionFactory.merge(
        Array.from({ length: TRANSACTIONS_PER_CATEGORY }, () => {
          const template = templates[Math.floor(Math.random() * templates.length)]
          return {
            userId: user.id,
            categoryId: category.id,
            type: category.type,
            description: template.description,
            amount: randomAmountCents(template.min, template.max),
            date: randomDateWithinLastMonths(6),
          }
        })
      ).createMany(TRANSACTIONS_PER_CATEGORY)
    }

    const categoryService = new CategoryService()
    const recurringService = new RecurringService(categoryService)

    for (const spec of RECURRING_RULES) {
      const category = categoriesByName.get(spec.categoryName)
      if (!category) continue

      const rule = await recurringService.create(user.id, {
        categoryId: category.id,
        name: spec.name,
        amount: spec.amount,
        kind: spec.kind,
        dayOfMonth: spec.dayOfMonth,
        startMonth: DateTime.now().minus({ months: spec.monthsAgoStart }),
        installmentsTotal: spec.installmentsTotal,
      })

      if (spec.confirmThisMonth !== undefined) {
        await recurringService.confirm(user.id, rule.id, DateTime.now(), spec.confirmThisMonth)
      }
    }
  }
}

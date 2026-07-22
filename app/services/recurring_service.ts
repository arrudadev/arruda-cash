import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import ArchivedCategoryException from '#exceptions/archived_category_exception'
import type { CategoryType } from '#models/category'
import RecurringRule, { type RecurringKind } from '#models/recurring_rule'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { CategoryService } from '#services/category_service'
import { toCents } from '#services/money'

type RecurringRuleInput = {
  categoryId: string
  name: string
  amount: number
  kind: RecurringKind
  dayOfMonth: number
  startMonth: DateTime
  installmentsTotal?: number | null
}

type MonthInstance = {
  ruleId: string
  name: string
  type: CategoryType
  kind: RecurringKind
  amount: number
  dayOfMonth: number
  categoryId: string
  categoryName: string
  categoryColor: string
  installmentIndex: number | null
  installmentsTotal: number | null
}

@inject()
export class RecurringService {
  constructor(protected categoryService: CategoryService) {}

  private async resolveActiveCategory(userId: string, categoryId: string) {
    const category = await this.categoryService.findForUser(userId, categoryId)
    if (category.archivedAt) {
      throw new ArchivedCategoryException()
    }
    return category
  }

  async listForUser(userId: string) {
    return RecurringRule.query().where('userId', userId).preload('category').orderBy('name', 'asc')
  }

  async findForUser(userId: string, id: string) {
    return RecurringRule.query()
      .where('id', id)
      .where('userId', userId)
      .preload('category')
      .firstOrFail()
  }

  async create(userId: string, data: RecurringRuleInput) {
    const category = await this.resolveActiveCategory(userId, data.categoryId)

    const rule = await RecurringRule.create({
      userId,
      categoryId: category.id,
      type: category.type,
      name: data.name,
      amount: toCents(data.amount),
      kind: data.kind,
      dayOfMonth: data.dayOfMonth,
      startMonth: data.startMonth.startOf('month'),
      installmentsTotal: data.installmentsTotal ?? null,
    })
    await rule.load('category')
    return rule
  }

  async update(rule: RecurringRule, data: RecurringRuleInput) {
    const category = await this.resolveActiveCategory(rule.userId, data.categoryId)

    rule.categoryId = category.id
    rule.type = category.type
    rule.name = data.name
    rule.amount = toCents(data.amount)
    rule.kind = data.kind
    rule.dayOfMonth = data.dayOfMonth
    rule.startMonth = data.startMonth.startOf('month')
    rule.installmentsTotal = data.installmentsTotal ?? null
    await rule.save()
    await rule.load('category')
    return rule
  }

  async archive(rule: RecurringRule) {
    rule.archivedAt = DateTime.now()
    await rule.save()
    return rule
  }

  /**
   * Every active rule that applies to `month` — i.e. what's committed, still
   * "to confirm" (there's no notion of confirmed yet; that arrives once
   * recurring instances start getting persisted).
   */
  async getMonthInstances(userId: string, month: DateTime): Promise<MonthInstance[]> {
    const targetMonth = month.startOf('month')
    const rules = await RecurringRule.query()
      .where('userId', userId)
      .whereNull('archivedAt')
      .preload('category')

    const instances: MonthInstance[] = []
    for (const rule of rules) {
      const progress = rule.installmentProgress(targetMonth)
      if (!progress.applies) {
        continue
      }

      instances.push({
        ruleId: rule.id,
        name: rule.name,
        type: rule.type,
        kind: rule.kind,
        amount: rule.amount,
        dayOfMonth: rule.dayOfMonth,
        categoryId: rule.category.id,
        categoryName: rule.category.name,
        categoryColor: rule.category.color,
        installmentIndex: progress.index,
        installmentsTotal: rule.installmentsTotal,
      })
    }

    return instances.sort((a, b) => a.dayOfMonth - b.dayOfMonth)
  }

  async getCommittedSummary(userId: string, month: DateTime) {
    const instances = await this.getMonthInstances(userId, month)
    const income = instances
      .filter((instance) => instance.type === 'income')
      .reduce((sum, instance) => sum + instance.amount, 0)
    const expense = instances
      .filter((instance) => instance.type === 'expense')
      .reduce((sum, instance) => sum + instance.amount, 0)

    return {
      month: month.startOf('month').toISODate() as string,
      income,
      expense,
      balance: income - expense,
    }
  }
}

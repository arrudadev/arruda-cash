import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import ArchivedCategoryException from '#exceptions/archived_category_exception'
import RecurringInstanceAlreadyConfirmedException from '#exceptions/recurring_instance_already_confirmed_exception'
import type { CategoryType } from '#models/category'
import RecurringInstance from '#models/recurring_instance'
import RecurringRule, { type RecurringKind } from '#models/recurring_rule'
import Transaction from '#models/transaction'
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
  confirmed: boolean
  transactionId: string | null
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
   * Every active rule that applies to `month`, overlaid with whether that
   * month has already been confirmed (and, if so, the real confirmed
   * amount rather than the rule's own projected one).
   */
  async getMonthInstances(userId: string, month: DateTime): Promise<MonthInstance[]> {
    const targetMonth = month.startOf('month')
    const monthIso = targetMonth.toISODate() as string

    const [rules, confirmedInstances] = await Promise.all([
      RecurringRule.query().where('userId', userId).whereNull('archivedAt').preload('category'),
      RecurringInstance.query().where('userId', userId).where('periodMonth', monthIso),
    ])

    const confirmedByRuleId = new Map(
      confirmedInstances.map((instance) => [instance.recurringRuleId, instance])
    )

    const instances: MonthInstance[] = []
    for (const rule of rules) {
      const progress = rule.installmentProgress(targetMonth)
      if (!progress.applies) {
        continue
      }

      const confirmedInstance = confirmedByRuleId.get(rule.id)
      instances.push({
        ruleId: rule.id,
        name: rule.name,
        type: rule.type,
        kind: rule.kind,
        amount: confirmedInstance?.amount ?? rule.amount,
        dayOfMonth: rule.dayOfMonth,
        categoryId: rule.category.id,
        categoryName: rule.category.name,
        categoryColor: rule.category.color,
        installmentIndex: progress.index,
        installmentsTotal: rule.installmentsTotal,
        confirmed: confirmedInstance !== undefined,
        transactionId: confirmedInstance?.transactionId ?? null,
      })
    }

    return instances.sort((a, b) => a.dayOfMonth - b.dayOfMonth)
  }

  async getCommittedSummary(userId: string, month: DateTime) {
    const instances = await this.getMonthInstances(userId, month)

    let income = 0
    let expense = 0
    let confirmedIncome = 0
    let confirmedExpense = 0

    for (const instance of instances) {
      if (instance.type === 'income') {
        income += instance.amount
        if (instance.confirmed) {
          confirmedIncome += instance.amount
        }
      } else {
        expense += instance.amount
        if (instance.confirmed) {
          confirmedExpense += instance.amount
        }
      }
    }

    return {
      month: month.startOf('month').toISODate() as string,
      income,
      expense,
      balance: income - expense,
      confirmedIncome,
      confirmedExpense,
      pendingIncome: income - confirmedIncome,
      pendingExpense: expense - confirmedExpense,
    }
  }

  /**
   * Confirms `month` for a rule: creates the real Transaction, records the
   * instance (so it can't be double-confirmed), and — for a variable rule —
   * carries the confirmed amount forward as the new estimate. Deliberately
   * skips the archived-category guard: a rule keeps pointing at the
   * category/type it was created with regardless of what happens to that
   * category later.
   */
  async confirm(userId: string, ruleId: string, month: DateTime, amountInReais: number) {
    const rule = await this.findForUser(userId, ruleId)
    const targetMonth = month.startOf('month')
    const monthIso = targetMonth.toISODate() as string

    const existing = await RecurringInstance.query()
      .where('recurringRuleId', rule.id)
      .where('periodMonth', monthIso)
      .first()
    if (existing) {
      throw new RecurringInstanceAlreadyConfirmedException()
    }

    const amount = toCents(amountInReais)

    const transaction = await Transaction.create({
      userId,
      categoryId: rule.categoryId,
      type: rule.type,
      amount,
      description: rule.name,
      date: rule.anchorDateFor(targetMonth),
    })

    const instance = await RecurringInstance.create({
      userId,
      recurringRuleId: rule.id,
      periodMonth: targetMonth,
      amount,
      transactionId: transaction.id,
      confirmedAt: DateTime.now(),
    })

    if (rule.kind === 'variable') {
      rule.amount = amount
      await rule.save()
    }

    return instance
  }

  /**
   * Undoes a confirmation: deletes the real transaction it created and the
   * instance record, so the month goes back to "to confirm". Doesn't try to
   * roll back a variable rule's carried-forward amount — there's no history
   * of what it was before, and re-confirming will simply set it again.
   */
  async unconfirm(userId: string, ruleId: string, month: DateTime) {
    const targetMonth = month.startOf('month')
    const monthIso = targetMonth.toISODate() as string

    const instance = await RecurringInstance.query()
      .where('userId', userId)
      .where('recurringRuleId', ruleId)
      .where('periodMonth', monthIso)
      .firstOrFail()

    if (instance.transactionId) {
      const transaction = await Transaction.find(instance.transactionId)
      await transaction?.delete()
    }

    await instance.delete()
  }
}

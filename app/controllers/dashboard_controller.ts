import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { DashboardService } from '#services/dashboard_service'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { RecurringService } from '#services/recurring_service'
import TransactionTransformer from '#transformers/transaction_transformer'
import { periodValidator } from '#validators/dashboard'

@inject()
export default class DashboardController {
  constructor(
    protected dashboardService: DashboardService,
    protected recurringService: RecurringService
  ) {}

  async index({ inertia, auth, request }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const { from, to } = await request.validateUsing(periodValidator)

    const [summary, committed] = await Promise.all([
      this.dashboardService.getSummary(userId, { from, to }),
      this.recurringService.getCommittedSummary(userId, DateTime.now()),
    ])

    return inertia.render('dashboard', {
      period: { from: summary.from, to: summary.to },
      income: summary.income,
      expense: summary.expense,
      balance: summary.balance,
      breakdown: summary.breakdown,
      committed,
    })
  }

  async categoryTransactions({ auth, params, request, serialize }: HttpContext) {
    const { from, to } = await request.validateUsing(periodValidator)
    const transactions = await this.dashboardService.getCategoryTransactions(
      auth.getUserOrFail().id,
      params.categoryId,
      { from, to }
    )

    return serialize(TransactionTransformer.transform(transactions))
  }
}

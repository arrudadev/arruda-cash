import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { DashboardService } from '#services/dashboard_service'
import TransactionTransformer from '#transformers/transaction_transformer'
import { periodValidator } from '#validators/dashboard'

@inject()
export default class DashboardController {
  constructor(protected dashboardService: DashboardService) {}

  async index({ inertia, auth, request }: HttpContext) {
    const { from, to } = await request.validateUsing(periodValidator)
    const summary = await this.dashboardService.getSummary(auth.getUserOrFail().id, { from, to })

    return inertia.render('dashboard', {
      period: { from: summary.from, to: summary.to },
      income: summary.income,
      expense: summary.expense,
      balance: summary.balance,
      breakdown: summary.breakdown,
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

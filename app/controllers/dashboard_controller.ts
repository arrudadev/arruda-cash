import type { HttpContext } from '@adonisjs/core/http'
import { DashboardService } from '#services/dashboard_service'
import TransactionTransformer from '#transformers/transaction_transformer'
import { periodValidator } from '#validators/dashboard'

export default class DashboardController {
  async index({ inertia, auth, request }: HttpContext) {
    const { from, to } = await request.validateUsing(periodValidator)
    const summary = await DashboardService.getSummary(auth.getUserOrFail().id, { from, to })

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
    const transactions = await DashboardService.getCategoryTransactions(
      auth.getUserOrFail().id,
      params.categoryId,
      { from, to }
    )

    return serialize(TransactionTransformer.transform(transactions))
  }
}

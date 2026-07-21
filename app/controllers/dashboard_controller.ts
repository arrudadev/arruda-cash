import type { HttpContext } from '@adonisjs/core/http'
import { DashboardService } from '#services/dashboard_service'

export default class DashboardController {
  async index({ inertia, auth, request }: HttpContext) {
    const qs = request.qs()
    const summary = await DashboardService.getSummary(auth.getUserOrFail().id, {
      from: qs.from as string | undefined,
      to: qs.to as string | undefined,
    })

    return inertia.render('dashboard', {
      period: { from: summary.from, to: summary.to },
      income: summary.income,
      expense: summary.expense,
      balance: summary.balance,
      breakdown: summary.breakdown,
    })
  }
}

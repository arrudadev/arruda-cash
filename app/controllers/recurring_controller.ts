import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { CategoryService } from '#services/category_service'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { RecurringService } from '#services/recurring_service'
import CategoryTransformer from '#transformers/category_transformer'
import RecurringRuleTransformer from '#transformers/recurring_rule_transformer'
import { confirmRecurringInstanceValidator } from '#validators/recurring_confirm'
import { recurringMonthValidator } from '#validators/recurring_month'
import { recurringRuleValidator } from '#validators/recurring_rule'

@inject()
export default class RecurringController {
  constructor(
    protected recurringService: RecurringService,
    protected categoryService: CategoryService
  ) {}

  async index({ inertia, auth, request }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const { month: monthParam } = await request.validateUsing(recurringMonthValidator)
    const month = monthParam ? DateTime.fromISO(monthParam) : DateTime.now()

    const [rules, categories, instances, summary] = await Promise.all([
      this.recurringService.listForUser(userId),
      this.categoryService.listForUser(userId),
      this.recurringService.getMonthInstances(userId, month),
      this.recurringService.getCommittedSummary(userId, month),
    ])

    return inertia.render('recurring/index', {
      rules: RecurringRuleTransformer.transform(rules),
      categories: CategoryTransformer.transform(categories),
      month: month.startOf('month').toISODate() as string,
      instances,
      summary,
    })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const data = await request.validateUsing(recurringRuleValidator)

    // ArchivedCategoryException self-handles (flashes the error and
    // redirects back) if the chosen category turns out to be archived.
    await this.recurringService.create(auth.getUserOrFail().id, data)

    session.flash('success', 'Recurring rule created.')
    response.redirect().back()
  }

  async update({ request, auth, params, response, session }: HttpContext) {
    const rule = await this.recurringService.findForUser(auth.getUserOrFail().id, params.id)
    const data = await request.validateUsing(recurringRuleValidator)

    await this.recurringService.update(rule, data)

    session.flash('success', 'Recurring rule updated.')
    response.redirect().back()
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const rule = await this.recurringService.findForUser(auth.getUserOrFail().id, params.id)

    await this.recurringService.archive(rule)

    session.flash('success', 'Recurring rule archived.')
    response.redirect().back()
  }

  async confirm({ request, auth, params, response, session }: HttpContext) {
    const { month, amount } = await request.validateUsing(confirmRecurringInstanceValidator)

    // RecurringInstanceAlreadyConfirmedException self-handles (flashes the
    // error and redirects back) if this month was already confirmed.
    await this.recurringService.confirm(
      auth.getUserOrFail().id,
      params.id,
      DateTime.fromISO(month),
      amount
    )

    session.flash('success', 'Recurring instance confirmed.')
    response.redirect().back()
  }
}

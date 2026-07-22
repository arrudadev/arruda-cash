import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { CategoryService } from '#services/category_service'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { RecurringService } from '#services/recurring_service'
import CategoryTransformer from '#transformers/category_transformer'
import RecurringRuleTransformer from '#transformers/recurring_rule_transformer'
import { recurringRuleValidator } from '#validators/recurring_rule'

@inject()
export default class RecurringController {
  constructor(
    protected recurringService: RecurringService,
    protected categoryService: CategoryService
  ) {}

  async index({ inertia, auth }: HttpContext) {
    const userId = auth.getUserOrFail().id

    const [rules, categories] = await Promise.all([
      this.recurringService.listForUser(userId),
      this.categoryService.listForUser(userId),
    ])

    return inertia.render('recurring/index', {
      rules: RecurringRuleTransformer.transform(rules),
      categories: CategoryTransformer.transform(categories),
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
}

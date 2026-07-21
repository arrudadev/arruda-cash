import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { CategoryService } from '#services/category_service'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { TransactionService } from '#services/transaction_service'
import CategoryTransformer from '#transformers/category_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import { transactionValidator } from '#validators/transaction'

@inject()
export default class TransactionsController {
  constructor(
    protected transactionService: TransactionService,
    protected categoryService: CategoryService
  ) {}

  async index({ inertia, auth, request }: HttpContext) {
    const userId = auth.getUserOrFail().id
    const qs = request.qs()
    const filters = {
      categoryId: qs.categoryId as string | undefined,
      type: qs.type as string | undefined,
      from: qs.from as string | undefined,
      to: qs.to as string | undefined,
      search: qs.search as string | undefined,
      page: qs.page ? Number(qs.page) : undefined,
    }

    const [transactions, categories] = await Promise.all([
      this.transactionService.listForUser(userId, filters),
      this.categoryService.listForUser(userId),
    ])

    return inertia.render('transactions/index', {
      transactions: TransactionTransformer.transform(transactions.all()),
      pagination: {
        currentPage: transactions.currentPage,
        lastPage: transactions.lastPage,
        total: transactions.total,
      },
      categories: CategoryTransformer.transform(categories),
      filters: {
        categoryId: filters.categoryId ?? null,
        type: filters.type ?? null,
        from: filters.from ?? null,
        to: filters.to ?? null,
        search: filters.search ?? null,
      },
    })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const data = await request.validateUsing(transactionValidator)

    // ArchivedCategoryException self-handles (flashes the error and
    // redirects back) if the chosen category turns out to be archived.
    await this.transactionService.create(auth.getUserOrFail().id, data)

    session.flash('success', 'Transaction created.')
    response.redirect().back()
  }

  async update({ request, auth, params, response, session }: HttpContext) {
    const transaction = await this.transactionService.findForUser(
      auth.getUserOrFail().id,
      params.id
    )
    const data = await request.validateUsing(transactionValidator)

    await this.transactionService.update(transaction, data)

    session.flash('success', 'Transaction updated.')
    response.redirect().back()
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const transaction = await this.transactionService.findForUser(
      auth.getUserOrFail().id,
      params.id
    )
    await this.transactionService.destroy(transaction)

    session.flash('success', 'Transaction deleted.')
    response.redirect().back()
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import ArchivedCategoryException from '#exceptions/archived_category_exception'
import { CategoryService } from '#services/category_service'
import { TransactionService } from '#services/transaction_service'
import CategoryTransformer from '#transformers/category_transformer'
import TransactionTransformer from '#transformers/transaction_transformer'
import { transactionValidator } from '#validators/transaction'

export default class TransactionsController {
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
      TransactionService.listForUser(userId, filters),
      CategoryService.listForUser(userId),
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

    try {
      await TransactionService.create(auth.getUserOrFail().id, data)
    } catch (error) {
      if (error instanceof ArchivedCategoryException) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      throw error
    }

    session.flash('success', 'Transaction created.')
    response.redirect().back()
  }

  async update({ request, auth, params, response, session }: HttpContext) {
    const transaction = await TransactionService.findForUser(auth.getUserOrFail().id, params.id)
    const data = await request.validateUsing(transactionValidator)

    try {
      await TransactionService.update(transaction, data)
    } catch (error) {
      if (error instanceof ArchivedCategoryException) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      throw error
    }

    session.flash('success', 'Transaction updated.')
    response.redirect().back()
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const transaction = await TransactionService.findForUser(auth.getUserOrFail().id, params.id)
    await TransactionService.destroy(transaction)

    session.flash('success', 'Transaction deleted.')
    response.redirect().back()
  }
}

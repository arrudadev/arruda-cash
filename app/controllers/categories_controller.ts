import type { HttpContext } from '@adonisjs/core/http'
import { CategoryService } from '#services/category_service'
import CategoryTransformer from '#transformers/category_transformer'
import { createCategoryValidator, updateCategoryValidator } from '#validators/category'

export default class CategoriesController {
  async index({ inertia, auth }: HttpContext) {
    const categories = await CategoryService.listForUser(auth.getUserOrFail().id)

    return inertia.render('categories/index', {
      categories: CategoryTransformer.transform(categories),
    })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const data = await request.validateUsing(createCategoryValidator)

    await CategoryService.create(auth.getUserOrFail().id, data)

    session.flash('success', 'Category created.')
    response.redirect().back()
  }

  async update({ request, auth, params, response, session }: HttpContext) {
    const category = await CategoryService.findForUser(auth.getUserOrFail().id, params.id)
    const data = await request.validateUsing(updateCategoryValidator)

    await CategoryService.update(category, data)

    session.flash('success', 'Category updated.')
    response.redirect().back()
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const category = await CategoryService.findForUser(auth.getUserOrFail().id, params.id)

    await CategoryService.archive(category)

    session.flash('success', 'Category archived.')
    response.redirect().back()
  }
}

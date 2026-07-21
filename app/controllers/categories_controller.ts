import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
// biome-ignore lint/style/useImportType: needed at runtime for @inject()'s reflection metadata
import { CategoryService } from '#services/category_service'
import CategoryTransformer from '#transformers/category_transformer'
import { createCategoryValidator, updateCategoryValidator } from '#validators/category'

@inject()
export default class CategoriesController {
  constructor(protected categoryService: CategoryService) {}

  async index({ inertia, auth }: HttpContext) {
    const categories = await this.categoryService.listForUser(auth.getUserOrFail().id)

    return inertia.render('categories/index', {
      categories: CategoryTransformer.transform(categories),
    })
  }

  async store({ request, auth, response, session }: HttpContext) {
    const data = await request.validateUsing(createCategoryValidator)

    await this.categoryService.create(auth.getUserOrFail().id, data)

    session.flash('success', 'Category created.')
    response.redirect().back()
  }

  async update({ request, auth, params, response, session }: HttpContext) {
    const category = await this.categoryService.findForUser(auth.getUserOrFail().id, params.id)
    const data = await request.validateUsing(updateCategoryValidator)

    await this.categoryService.update(category, data)

    session.flash('success', 'Category updated.')
    response.redirect().back()
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const category = await this.categoryService.findForUser(auth.getUserOrFail().id, params.id)

    await this.categoryService.archive(category)

    session.flash('success', 'Category archived.')
    response.redirect().back()
  }
}

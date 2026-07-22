/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router.on('/').renderInertia('home', {}).as('home')

router
  .group(() => {
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])

    router.get('invite/accept', [controllers.Invite, 'create'])
    router.post('invite/accept', [controllers.Invite, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('dashboard', [controllers.Dashboard, 'index']).as('dashboard')
    router.get('dashboard/categories/:categoryId/transactions', [
      controllers.Dashboard,
      'categoryTransactions',
    ])
    router.post('logout', [controllers.Session, 'destroy'])

    router.get('categories', [controllers.Categories, 'index'])
    router.post('categories', [controllers.Categories, 'store'])
    router.put('categories/:id', [controllers.Categories, 'update'])
    router.delete('categories/:id', [controllers.Categories, 'destroy'])

    router.get('transactions', [controllers.Transactions, 'index'])
    router.post('transactions', [controllers.Transactions, 'store'])
    router.put('transactions/:id', [controllers.Transactions, 'update'])
    router.delete('transactions/:id', [controllers.Transactions, 'destroy'])

    router.get('recurring', [controllers.Recurring, 'index'])
    router.post('recurring', [controllers.Recurring, 'store'])
    router.put('recurring/:id', [controllers.Recurring, 'update'])
    router.delete('recurring/:id', [controllers.Recurring, 'destroy'])
    router.post('recurring/:id/confirm', [controllers.Recurring, 'confirm'])
  })
  .use(middleware.auth())

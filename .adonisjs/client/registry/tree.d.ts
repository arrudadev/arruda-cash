/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  invite: {
    create: typeof routes['invite.create']
    store: typeof routes['invite.store']
  }
  dashboard: typeof routes['dashboard'] & {
    categoryTransactions: typeof routes['dashboard.category_transactions']
  }
  categories: {
    index: typeof routes['categories.index']
    store: typeof routes['categories.store']
    update: typeof routes['categories.update']
    destroy: typeof routes['categories.destroy']
  }
  transactions: {
    index: typeof routes['transactions.index']
    store: typeof routes['transactions.store']
    update: typeof routes['transactions.update']
    destroy: typeof routes['transactions.destroy']
  }
}

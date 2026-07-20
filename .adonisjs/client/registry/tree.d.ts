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
  dashboard: typeof routes['dashboard']
}

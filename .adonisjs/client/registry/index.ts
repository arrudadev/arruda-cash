/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'invite.create': {
    methods: ["GET","HEAD"],
    pattern: '/invite/accept',
    tokens: [{"old":"/invite/accept","type":0,"val":"invite","end":""},{"old":"/invite/accept","type":0,"val":"accept","end":""}],
    types: placeholder as Registry['invite.create']['types'],
  },
  'invite.store': {
    methods: ["POST"],
    pattern: '/invite/accept',
    tokens: [{"old":"/invite/accept","type":0,"val":"invite","end":""},{"old":"/invite/accept","type":0,"val":"accept","end":""}],
    types: placeholder as Registry['invite.store']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [{"old":"/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['dashboard']['types'],
  },
  'dashboard.category_transactions': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard/categories/:categoryId/transactions',
    tokens: [{"old":"/dashboard/categories/:categoryId/transactions","type":0,"val":"dashboard","end":""},{"old":"/dashboard/categories/:categoryId/transactions","type":0,"val":"categories","end":""},{"old":"/dashboard/categories/:categoryId/transactions","type":1,"val":"categoryId","end":""},{"old":"/dashboard/categories/:categoryId/transactions","type":0,"val":"transactions","end":""}],
    types: placeholder as Registry['dashboard.category_transactions']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/categories',
    tokens: [{"old":"/categories","type":0,"val":"categories","end":""}],
    types: placeholder as Registry['categories.index']['types'],
  },
  'categories.store': {
    methods: ["POST"],
    pattern: '/categories',
    tokens: [{"old":"/categories","type":0,"val":"categories","end":""}],
    types: placeholder as Registry['categories.store']['types'],
  },
  'categories.update': {
    methods: ["PUT"],
    pattern: '/categories/:id',
    tokens: [{"old":"/categories/:id","type":0,"val":"categories","end":""},{"old":"/categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categories.update']['types'],
  },
  'categories.destroy': {
    methods: ["DELETE"],
    pattern: '/categories/:id',
    tokens: [{"old":"/categories/:id","type":0,"val":"categories","end":""},{"old":"/categories/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['categories.destroy']['types'],
  },
  'transactions.index': {
    methods: ["GET","HEAD"],
    pattern: '/transactions',
    tokens: [{"old":"/transactions","type":0,"val":"transactions","end":""}],
    types: placeholder as Registry['transactions.index']['types'],
  },
  'transactions.store': {
    methods: ["POST"],
    pattern: '/transactions',
    tokens: [{"old":"/transactions","type":0,"val":"transactions","end":""}],
    types: placeholder as Registry['transactions.store']['types'],
  },
  'transactions.update': {
    methods: ["PUT"],
    pattern: '/transactions/:id',
    tokens: [{"old":"/transactions/:id","type":0,"val":"transactions","end":""},{"old":"/transactions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['transactions.update']['types'],
  },
  'transactions.destroy': {
    methods: ["DELETE"],
    pattern: '/transactions/:id',
    tokens: [{"old":"/transactions/:id","type":0,"val":"transactions","end":""},{"old":"/transactions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['transactions.destroy']['types'],
  },
  'recurring.index': {
    methods: ["GET","HEAD"],
    pattern: '/recurring',
    tokens: [{"old":"/recurring","type":0,"val":"recurring","end":""}],
    types: placeholder as Registry['recurring.index']['types'],
  },
  'recurring.store': {
    methods: ["POST"],
    pattern: '/recurring',
    tokens: [{"old":"/recurring","type":0,"val":"recurring","end":""}],
    types: placeholder as Registry['recurring.store']['types'],
  },
  'recurring.update': {
    methods: ["PUT"],
    pattern: '/recurring/:id',
    tokens: [{"old":"/recurring/:id","type":0,"val":"recurring","end":""},{"old":"/recurring/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['recurring.update']['types'],
  },
  'recurring.destroy': {
    methods: ["DELETE"],
    pattern: '/recurring/:id',
    tokens: [{"old":"/recurring/:id","type":0,"val":"recurring","end":""},{"old":"/recurring/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['recurring.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}

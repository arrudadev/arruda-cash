import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'invite.create': { paramsTuple?: []; params?: {} }
    'invite.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.category_transactions': { paramsTuple: [ParamValue]; params: {'categoryId': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'transactions.index': { paramsTuple?: []; params?: {} }
    'transactions.store': { paramsTuple?: []; params?: {} }
    'transactions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'transactions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring.index': { paramsTuple?: []; params?: {} }
    'recurring.store': { paramsTuple?: []; params?: {} }
    'recurring.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring.confirm': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'invite.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.category_transactions': { paramsTuple: [ParamValue]; params: {'categoryId': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'transactions.index': { paramsTuple?: []; params?: {} }
    'recurring.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'invite.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.category_transactions': { paramsTuple: [ParamValue]; params: {'categoryId': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'transactions.index': { paramsTuple?: []; params?: {} }
    'recurring.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.store': { paramsTuple?: []; params?: {} }
    'invite.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'transactions.store': { paramsTuple?: []; params?: {} }
    'recurring.store': { paramsTuple?: []; params?: {} }
    'recurring.confirm': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'transactions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'transactions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'recurring.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
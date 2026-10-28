import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'verification.notice': { paramsTuple?: []; params?: {} }
    'verification.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'verification.resend': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.email': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.update': { paramsTuple?: []; params?: {} }
    'conversations.index': { paramsTuple?: []; params?: {} }
    'users.search': { paramsTuple?: []; params?: {} }
    'conversations.store': { paramsTuple?: []; params?: {} }
    'conversations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'verification.notice': { paramsTuple?: []; params?: {} }
    'verification.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'conversations.index': { paramsTuple?: []; params?: {} }
    'users.search': { paramsTuple?: []; params?: {} }
    'conversations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'verification.notice': { paramsTuple?: []; params?: {} }
    'verification.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'conversations.index': { paramsTuple?: []; params?: {} }
    'users.search': { paramsTuple?: []; params?: {} }
    'conversations.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'verification.resend': { paramsTuple?: []; params?: {} }
    'password.email': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple?: []; params?: {} }
    'conversations.store': { paramsTuple?: []; params?: {} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
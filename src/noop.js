/* @flow */
/* eslint-disable no-unused-vars */

export function markReloadable(module: typeof module) {
}

export function defonce<T>(module: typeof module, fn: ()=>T, key?:string): T {
  return fn();
}

export function defobj<T: Object>(module: typeof module, object: T, key?:string): T {
  return object;
}

export function defn<T: Function>(module: typeof module, fn: T, key?:string): T {
  return fn;
}
